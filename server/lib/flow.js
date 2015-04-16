//var s3 = require('./s3.js');
var github = require('./github.js');
var utils = require('./utils.js');
var Promise = require('bluebird');

module.exports.start = function (webhook) {
	var testInfo = github.processWebhook(webhook);
	if (!testInfo) {
		return false;
	}
	github.setInitialStatus(testInfo)
		.then(github.cloneRepo)
		.then(utils.locateTestConfig)
		//.then(utils.runTest)
		.catch(github.GithubStatusError, function () {})
		.catch(function (e) {
			github.setErrorStatus(testInfo, e.message);
		});

};
