var s3 = require('./s3.js');
var github = require('./github.js');
var Promise = require('bluebird');

module.exports.start = function(webhook) {
	var testInfo = github.processWebhook(webhook);
	if (!testInfo) {
		return false;
	}
	github.setInitialStatus(testInfo)
		.then(github.cloneRepo)
		.then(utils.locateTestConfig)
		.then(utils.runTest)
		.catch(githubStatusError, function (){

		})
		.catch(everythingelse, function (){
			github.setErrorStatus(testInfo, 'badness');
		})

};