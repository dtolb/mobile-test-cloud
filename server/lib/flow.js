//var s3 = require('./s3.js');
var github = require('./github.js');
var utils = require('./utils.js');
var tester = require('./tester.js');
var logger  = require('./logging.js').winstonLogger;
var Promise = require('bluebird');

module.exports.start = function (webhook) {
	var testInfo = github.processWebhook(webhook);
	if (!testInfo) {
		logger.debug('Unable to process Webhook');
		return false;
	}
	github.setInitialStatus(testInfo)
		.then(github.cloneRepo)
		.then(utils.locateTestConfig)
		.then(utils.installTests)
		.then(utils.runTest)
		.then(github.setSuccessStatus)
		.catch(github.GithubStatusError, function () {
			logger.error('Unable to communicate with Github, failing');
		})
		.catch(function (e) {
			github.setErrorStatus(testInfo, e.message);
		})
		.finally(utils.cleanup)
		.then(function () {
			logger.info('All cleaned up, ready for next test!');
		});
};
