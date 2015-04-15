var GitHubApi = require('github');
var logger  = require('./logging.js').winstonLogger;
var config = require('./config.js');
var Promise = require('bluebird');
var shelljs = require('shelljs');
var sprintf = require('sprintf-js').sprintf;
var path = require('path');


// Create a new object, that prototypally inherits from the Error constructor.
module.exports.GithubStatusError = function(message) {
	this.name = 'GithubStatusError';
	this.message = message || 'Failed to update GitHub status';
};
module.exports.GithubStatusError.prototype = Object.create(Error.prototype);
module.exports.GithubStatusError.prototype.constructor = module.exports.GithubStatusError;

/**
 * Establishes the github API connection
 */
/*module.exports.connectToGithub = function (){
	github = new GitHubApi({version: "3.0.0"});
	github.authenticate({
		type: "basic",
		username: config.github.username,
		password: config.github.password
	});
	Promise.promisifyAll(github.statuses);
};
*/
module.exports.githubapi = new GitHubApi({version: "3.0.0"});
module.exports.githubapi.authenticate({
	type: "basic",
	username: config.github.username,
	password: config.github.password
});
Promise.promisifyAll(module.exports.githubapi.statuses);


/**
 * Takes the pull request webhook and gets relevant information
 * @param  {[JSON]} webhook [GitHub PR Webhook]
 * @return {[JSON]}         [Relevant information from webhook]
 */
module.exports.processWebhook = function(webhook) {
	//Only run cloud on specified events
	try {
		if (config.github.pullRequest.runOn.indexOf(webhook.action) >= 0){
			logger.debug('Webhook received! gathering relevant information');
			return {
				github: {
					repo: webhook.pull_request.head.repo.name,
					sha: webhook.pull_request.head.sha,
					PRnumber: webhook.number,
					user: webhook.pull_request.head.user.login,
					gitURL: webhook.pull_request.head.repo.ssh_url,
					branch: webhook.pull_request.head.ref
				}
			};
		}
		logger.debug('Nothing to do here');
		return false;
	} catch (e) {
		logger.error('Invalid webhook');
		logger.error(e);
		return false;
	}
};

/**
 * Sets the status of the Head commit from PR
 * @param  {[JSON]} testInfo [Our test tracker]
 * @param  {[JSON]} status   [Json object with status and description<optional>]
 *         {status: 'status', description:'describe'}
 * @return {promise}
 */
module.exports.setCommitStatus = function(testInfo, status) {
	if (typeof status.description === 'undefined') {
		status.description = status.status;
	}

	var targetUrl;

	if(typeof testInfo.s3 === 'undefined' || typeof testInfo.s3.location === 'undefined') {
		targetUrl = '';
	}
	else {
		targetUrl = testInfo.s3.location;
	}

	var gitMessage = {
		user: testInfo.github.user,
		repo: testInfo.github.repo,
		sha: testInfo.github.sha,
		state: status.status,
		target_url: targetUrl,
		description: status.description,
		context: 'Mobile Test Cloud'
	};

 return module.exports.githubapi.statuses.createAsync(gitMessage)
	.return(testInfo)
	.catch(function (e) {
		logger.error('failed to update commit status');
		throw new module.exports.GithubStatusError();
	});
};

/**
 * Sets the commit status ASAP to pending
 * @param  {[JSON]} testInfo [Our test tracker]
 */
module.exports.setInitialStatus = function (testInfo) {
	var status = {
		status: 'pending',
		description: 'Starting Mobile Test Cloud!'
	};
	return module.exports.setCommitStatus(testInfo, status);
};

/**
 * Sets the commit status to 'error' and provided description
 * @param {[JSON]} testInfo    [our test tracker]
 * @param {[string]} description [describe the fail, most likely error]
 */
module.exports.setErrorStatus = function (testInfo, description) {
	var status = {
		status: 'error',
		description: description
	};
	return module.exports.setCommitStatus(testInfo, status);
};

/**
 * Clones the repository and branch from the pull request
 * @param  {[type]} testInfo [description]
 * @return {[type]}          [description]
 */
module.exports.cloneRepo = function (testInfo) {
	return new Promise(function(resolve, reject) {
		logger.debug('Starting repository clone!');
		var repoPath = path.join(config.directories.repos, testInfo.github.repo);
		var bash = sprintf('git clone -b %s %s %s',
			testInfo.github.branch, testInfo.github.gitURL, repoPath);
		var cloneResult = shelljs.exec(bash).code;
		if (cloneResult !== 0) {
			logger.error('Cloning Repo Failed!!');
			var error = new Error('Failed to clone repo');
			reject(error);
		}
		else {
			logger.debug('Cloned Repo!');
			testInfo.local = {
				repo: repoPath
			};
			resolve(testInfo);
		}
	});
};