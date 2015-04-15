var github = require('./../../lib/github.js');
var expect = require('chai').expect;
var fx     = require('node-fixtures');

describe('lib.github', function () {
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
});