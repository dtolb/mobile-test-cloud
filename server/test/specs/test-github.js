var github = require('./../../lib/github.js');
var expect = require('chai').expect;
var fx     = require('node-fixtures');
var nock   = require('nock');
var Promise = require('bluebird');
var path = require('path');
var sinon   = require('sinon');
var shelljs = require('shelljs');
var clone = require('clone');
var config = require('./../../lib/config.js');

describe('lib.github', function () {
	var githubNock = nock('https://api.github.com')
					.get()
					.reply(200)
					.post()
					.reply(201)
					.persist();

	beforeEach(function () {
		fx.reset();
	});

	describe('::processWebhook', function () {

		describe('When webhook action is not expected', function () {
			var webhook = fx.pr_webhook;
			before(function () {
				webhook.action = 'closed';
			});
			it('should return false', function () {
				var testInfo = github.processWebhook(webhook);
				expect(testInfo).to.be.false;
			});
		});

		describe('When an expected value is not defined', function () {
			var webhook;
			before(function () {
				webhook = clone(fx.pr_webhook);
				delete webhook.pull_request;
			});
			it('should return false', function () {
				var testInfo = github.processWebhook(webhook);
				expect(testInfo).to.be.false;
			});
		});

		describe('When webhook action is expected', function () {
			it('should return the testInfo object', function () {
				var webhook = fx.pr_webhook;
				var testInfo = github.processWebhook(webhook);
				expect(testInfo).to.deep.equal(fx.starting_info);
			});
		});
	});

	describe('::setCommitStatus', function () {
		var statusStub;
		describe('When status is sent', function () {
			beforeEach(function () {
				statusStub = sinon.stub(github.githubapi.statuses, 'createAsync', function () {
					return Promise.resolve();
				});
			});
			afterEach(function () {
				statusStub.restore();
			});
			it('should fulfill the promise with the testInfo object', function () {
				var testInfo = fx.starting_info;
				return github.setCommitStatus(testInfo, {status: 'success'})
				.then(function (res) {
					expect(res).to.deep.equal(testInfo);
				});
			});
		});
		describe('When status fails to send', function () {
			beforeEach(function () {
				statusStub = sinon.stub(github.githubapi.statuses, 'createAsync', function () {
					return Promise.reject(new Error('Error'));
				});
			});
			afterEach(function () {
				statusStub.restore();
			});
			it('should throw a StatusUpdateError error', function () {
				var testInfo = fx.starting_info;
				return github.setCommitStatus(testInfo, {status: 'success'})
				.then()
				.catch(github.GithubStatusError, function (e) {
					expect(e.name).to.equal('GithubStatusError');
				});
			});
		});

		describe('Description may or may not be provided', function () {
			afterEach(function () {
				statusStub.restore();
			});
			describe('When only status is sent', function () {
				it('should use the status as the description', function () {
					var status = 'status';
					statusStub = sinon.stub(github.githubapi.statuses, 'createAsync', function (gitMessage) {
						expect(gitMessage.description).to.equal(status);
						return Promise.resolve();
					});
					var testInfo = fx.starting_info;
					return github.setCommitStatus(testInfo, {status: status});
				});
			});
			describe('When description is sent', function () {
				it('should use the description as the description', function () {
					var description = 'description';
					var statusJSON = {
						status: 'success',
						description: description
					};
					statusStub = sinon.stub(github.githubapi.statuses, 'createAsync', function (gitMessage) {
						expect(gitMessage.description).to.equal(description);
						return Promise.resolve();
					});
					var testInfo = fx.starting_info;
					return github.setCommitStatus(testInfo, statusJSON);
				});
			});
		});

		describe('S3 location may or maynot be provided', function () {

			afterEach(function () {
				statusStub.restore();
			});
			describe('When s3 location is provided', function () {
				it('should use that location for the target_url', function () {
					statusStub = sinon.stub(github.githubapi.statuses, 'createAsync', function (gitMessage) {
						expect(gitMessage.target_url).to.equal(location);
						return Promise.resolve();
					});
					var testInfo = fx.starting_info;
					var location = 's3-location';
					testInfo.s3 = {
						location: location
					};
					return github.setCommitStatus(testInfo, {status: 'success'});
				});
			});

			describe('When s3 information is not provided', function () {
				it('should use a blank target_url', function () {
					statusStub = sinon.stub(github.githubapi.statuses, 'createAsync', function (gitMessage) {
						expect(gitMessage.target_url).to.equal('');
						return Promise.resolve();
					});
					var testInfo = fx.starting_info;
					return github.setCommitStatus(testInfo, {status: 'success'});
				});
			});

			describe('When s3 information is provided but location is not', function () {
				it('should use a blank target_url', function () {
					statusStub = sinon.stub(github.githubapi.statuses, 'createAsync', function (gitMessage) {
						expect(gitMessage.target_url).to.equal('');
						return Promise.resolve();
					});
					var testInfo = fx.starting_info;
					var location = 's3-location';
					testInfo.s3 = {};
					return github.setCommitStatus(testInfo, {status: 'success'});
				});
			});
		});
	});
	describe('::setInitialStatus', function () {
		var setCommitStatusStub;

		describe('it sets the status to \'pending\'', function () {

			beforeEach(function () {
				setCommitStatusStub = sinon.stub(github, 'setCommitStatus', function (testInfo, status) {
					return Promise.resolve(status.status);
				});
			});

			afterEach(function () {
				setCommitStatusStub.restore();
			});

			it('set the status correctly', function () {
				return github.setInitialStatus(fx.starting_info)
				.then(function (res) {
					expect(res).to.equal('pending');
				});
			});
		});

		describe('::When it finishes', function () {

			beforeEach(function () {
				setCommitStatusStub = sinon.stub(github, 'setCommitStatus', function (testInfo, status) {
					return Promise.resolve(testInfo);
				});
			});
			afterEach(function () {
				setCommitStatusStub.restore();
			});

			it('should fulfill the promise with the testInfo', function () {
				return github.setInitialStatus(fx.starting_info)
				.then(function (res) {
					expect(res).to.deep.equal(fx.starting_info);
				});
			});
		});
	});
	describe('::setErrorStatus', function () {
		var setCommitStatusStub;
		var fail = 'Could not clone repo';

		describe('should set the status to \'error\' and pass the description', function () {

			beforeEach(function () {
				setCommitStatusStub = sinon.stub(github, 'setCommitStatus', function (testInfo, status) {
					return Promise.resolve(status);
				});
			});

			afterEach(function () {
				setCommitStatusStub.restore();
			});

			it('set the status correctly', function () {
				return github.setErrorStatus(fx.starting_info, fail)
				.then(function (res) {
					expect(res.status).to.equal('error');
				});
			});

			it('passed the description', function () {
				return github.setErrorStatus(fx.starting_info, fail)
				.then(function (res) {
					expect(res.description).to.equal(fail);
				});
			});
		});

		describe('When it finishes', function () {

			beforeEach(function () {
				setCommitStatusStub = sinon.stub(github, 'setCommitStatus', function (testInfo, status) {
					return Promise.resolve(testInfo);
				});
			});

			afterEach(function () {
				setCommitStatusStub.restore();
			});

			it('should fulfill the promise with the testInfo', function () {
				return github.setErrorStatus(fx.starting_info, fail)
				.then(function (res) {
					expect(res).to.deep.equal(fx.starting_info);
				});
			});
		});
	});

	describe('::cloneRepo', function () {
		var shellExecStub;
		describe('When setting up the commands', function () {

			afterEach(function () {
				shellExecStub.restore();
			});

			it('should build the git command to clone new branch', function () {
				shellExecStub = sinon.stub(shelljs, 'exec', function (command) {
					expect(command).to
						.match(/^git clone -b changes git@github.com:baxterthehacker\/public-repo.git .+/);
					return {code: 0};
				});
				return github.cloneRepo(fx.starting_info);
			});
		});
		describe('When it fails to clone the repo', function () {
			beforeEach(function () {
				shellExecStub = sinon.stub(shelljs, 'exec', function () {
					return {code: -1};
				});
			});
			afterEach(function () {
				shellExecStub.restore();
			});
			it('should throw an error', function () {
				return github.cloneRepo(fx.starting_info)
				.catch(function (e) {
					expect(e.message).to.equal('Failed to clone repo');
				});
			});

		});

		describe('When it clones the repo', function () {
			beforeEach(function () {
				shellExecStub = sinon.stub(shelljs, 'exec', function () {
					return {code: 0};
				});
			});
			afterEach(function () {
				shellExecStub.restore();
			});

			it('should add the path to our repository to testInfo object', function () {
				var repoPath = path.join(config.directories.repos, fx.starting_info.github.repo);
				return github.cloneRepo(fx.starting_info)
				.then(function (res) {
					expect(res.local.repo).to.equal(repoPath);
				});
			});
		});
	});
});