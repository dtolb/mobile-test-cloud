var github = require('./../../lib/github.js');
var expect = require('chai').expect;
var fx     = require('node-fixtures');
var nock   = require('nock');
var Promise = require('bluebird');
var path = require('path');
var sinon   = require('sinon');
var shelljs = require('shelljs');
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

	describe('processWebhook', function () {

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
			var webhook = fx.pr_webhook;
			before(function () {
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

	describe('setCommitStatus', function () {
		var statusStub;
		describe('When status is sent', function () {
			beforeEach(function (){
				statusStub = sinon.stub(github.githubapi.statuses, 'createAsync', function () {
					return Promise.resolve();
				});
			});
			afterEach(function () {
				statusStub.restore();
			});
			it('should fulfill the promise with the testInfo object', function (done) {
				var testInfo = fx.starting_info;
				github.setCommitStatus(testInfo, {status: 'success'})
				.then(function(res){
					expect(res).to.deep.equal(testInfo);
					done();
				})
				.catch(function(e) {
					done(e);
				});
			});
		});
		describe('When status fails to send', function () {
			beforeEach(function (){
				statusStub = sinon.stub(github.githubapi.statuses, 'createAsync', function () {
					return Promise.reject(new Error('Error'));
				});
			});
			afterEach(function () {
				statusStub.restore();
			});
			it('should throw a StatusUpdateError error', function (done) {
				var testInfo = fx.starting_info;
				github.setCommitStatus(testInfo, {status: 'success'})
				.then()
				.catch(github.GithubStatusError, function (e){
					expect(e.name).to.equal('GithubStatusError');
					done();
				})
				.catch(function(e) {
					done(e);
				});
			});
		});
	});
	describe('setInitialStatus', function () {
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

			it('set the status correctly', function (done) {
				github.setInitialStatus(fx.starting_info)
				.then(function (res) {
					expect(res).to.equal('pending');
					done();
				})
				.catch(function(e) {
					done(e);
				});
			});
		});

		describe('When it finishes', function() {

			beforeEach(function () {
				setCommitStatusStub = sinon.stub(github, 'setCommitStatus', function (testInfo, status) {
					return Promise.resolve(testInfo);
				});
			});
			afterEach(function () {
				setCommitStatusStub.restore();
			});

			it('should fulfill the promise with the testInfo', function (done) {
				github.setInitialStatus(fx.starting_info)
				.then(function(res) {
					expect(res).to.deep.equal(fx.starting_info);
					done();
				})
				.catch(function(e) {
					done(e);
				});
			});
		});
	});
	describe('setErrorStatus', function () {
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

			it('set the status correctly', function (done) {
				github.setErrorStatus(fx.starting_info, fail)
				.then(function(res) {
					expect(res.status).to.equal('error');
					done();
				})
				.catch(function(e) {
					done(e);
				});
			});

			it('passed the description', function (done) {
				github.setErrorStatus(fx.starting_info, fail)
				.then(function(res) {
					expect(res.description).to.equal(fail);
					done();
				})
				.catch(function(e) {
					done(e);
				});
			});
		});

		describe('When it finishes', function() {

			beforeEach(function () {
				setCommitStatusStub = sinon.stub(github, 'setCommitStatus', function (testInfo, status) {
					return Promise.resolve(testInfo);
				});
			});

			afterEach(function () {
				setCommitStatusStub.restore();
			});

			it('should fulfill the promise with the testInfo', function (done) {
				github.setErrorStatus(fx.starting_info, fail)
				.then(function(res) {
					expect(res).to.deep.equal(fx.starting_info);
					done();
				})
				.catch(function(e) {
					done(e);
				});
			});
		});
	});

	describe('cloneRepo', function () {
		var shellExecStub;
		describe('When setting up the commands', function () {

			afterEach(function() {
				shellExecStub.restore();
			});

			it('should build the git command to clone new branch', function (done) {
				shellExecStub = sinon.stub(shelljs, 'exec', function (command) {
					//command = 'a';
					try {
						expect(command).to.match(/^git clone -b changes git@github.com:baxterthehacker\/public-repo.git .+/);
						done();
					}
					catch (e) {
						done(e);
					}
					return {code: 0};
				});
				github.cloneRepo(fx.starting_info);
			});
		});
		describe('When it fails to clone the repo', function () {
			beforeEach(function () {
				shellExecStub = sinon.stub(shelljs, 'exec', function () {
					return {code: -1};
				});
			});
			afterEach(function() {
				shellExecStub.restore();
			});
			it('should throw an error', function (done) {
				github.cloneRepo(fx.starting_info)
				.catch(function (e) {
					expect(e.message).to.equal('Failed to clone repo');
					done();
				})
				.catch(function(e) {
					done(e);
				});
			});

		});

		describe('When it clones the repo', function () {
			beforeEach(function () {
				shellExecStub = sinon.stub(shelljs, 'exec', function () {
					return {code: 0};
				});
			});
			afterEach(function() {
				shellExecStub.restore();
			});

			it('should add the path to our repository to testInfo info', function (done) {
				var repoPath = path.join(config.directories.repos, fx.starting_info.github.repo);
				github.cloneRepo(fx.starting_info)
				.then(function(res) {
					expect(res.local.repo).to.equal(repoPath);
					done();
				})
				.catch(function(e) {
					done(e);
				});
			});
		});
	});
});