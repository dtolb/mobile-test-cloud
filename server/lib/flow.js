var github = require('./github.js');
var utils = require('./utils.js');
var s3 = require('./s3.js');
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
		.then(s3.waitUntilAppExists)
		.then(s3.downloadApp)
		.then(tester.installTests)
		.then(tester.detectDevices)
		.then(tester.runTests)
		.then(s3.uploadResults)
		.then(github.setSuccessStatus)
		.catch(github.GithubStatusError, function () {
			logger.error('Unable to communicate with Github, failing');
		})
		.catch(function (e) {
			return s3.uploadResults(testInfo)
				.then(function (res) {
					tester.killAppium(res);
					github.setErrorStatus(res, e.message);
				})
				.catch(function (error) {
					github.setErrorStatus(testInfo, error.message);
				});
		})
		.finally(utils.cleanup)
		.then(function () {
			logger.info('All cleaned up, ready for next test!');
		});
};
