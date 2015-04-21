var expect = require('chai').expect;
var fx     = require('node-fixtures');
var nock = require('nock');
var Promise = require('bluebird');
var sinon   = require('sinon');
var config = require('./../../lib/config.js');
var s3 = require('./../../lib/s3.js');
var sprintf = require('sprintf-js').sprintf;

//nock.recorder.rec();
describe('lib.s3', function () {
	beforeEach(function () {
		fx.reset();
	});
	describe('::uploadResults', function () {
		var testInfo;
		var s3Url;
		var s3FileLocation;
		var putLocation;
		beforeEach(function () {
			testInfo = fx.starting_info;
			testInfo.results = {
				install: 'here would be install results',
				testResults: 'here would be test results'
			};
			s3FileLocation = sprintf('/repo/%s/branch/%s/pr-number/%s/%s.json',
						testInfo.github.repo,
						testInfo.github.branch,
						testInfo.github.PRnumber,
						testInfo.github.sha);
			//s3Url = sprintf('https://%s.s3.amazonaws.com',config.s3.testBucket);
			s3Url = 'https://s3.amazonaws.com:443';
			putLocation = sprintf('/%s%s', config.s3.testBucket, s3FileLocation);
		});
		describe('When s3 upload is successful', function () {
			var s3Nock;
			beforeEach(function () {
				s3Nock = nock(s3Url)
					.put(putLocation, JSON.stringify(testInfo.results))
					.reply(200);
			});
			it('should attach the location to testInfo.s3.testResultLocation', function () {
				var resURL = sprintf('https://s3.amazonaws.com%s',putLocation);
				return s3.uploadResults(testInfo)
					.then(function (res) {
						expect(res.s3.testResultLocation).to.equal(resURL);
					});
			});

		});
		describe('When s3 upload is unsuccessful', function () {
			var s3Nock;
			beforeEach(function () {
				s3Nock = nock(s3Url)
					.put(putLocation, JSON.stringify(testInfo.results))
					.reply(400);
			});
			it('should throw an error with message "Unable to upload results to s3"', function () {
				return s3.uploadResults(testInfo)
					.then(function (res) {
						expect(res).to.be.undefined;
					})
					.catch(function (e) {
						expect(e.message).to.equal('Unable to upload results to s3');
					});
			});
		});
	});
});
