var GitHubApi = require('github');
var logger  = require('../logging.js').winstonLogger;
var config = require('./config.js');
var Promise = require('bluebird');
var NodeGit = require("nodegit");
var shelljs = require('shelljs');

var github = new GitHubApi({version: "3.0.0"});
Promise.promisifyAll(github.statuses);

// Create a new object, that prototypally inherits from the Error constructor.
function githubStatusError(message) {
	this.name = 'StatusUpdateError';
	this.message = message || 'Failed to update status';
}
githubStatusError.prototype = Object.create(Error.prototype);
githubStatusError.prototype.constructor = githubStatusError;

github.authenticate({
	type: "basic",
	username: config.github.username,
	password: config.github.password
});

/**
 * Takes the pull request webhook and gets relevant information
 * @param  {[JSON]} webhook [GitHub PR Webhook]
 * @return {[JSON]}         [Relevant information from webhook]
 */
module.exports.processWebhook = function(webhook) {
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
};

/**
 * Sets the status of the Head commit from PR
 * @param  {[JSON]} testInfo [Our test tracker]
 * @param  {[JSON]} status   [Json object with status and description]
 * @return {promise}
 */
var setCommitStatus = function(testInfo, status) {
	if (typeof status.description === 'undefined') {
		status.description = status.status;
	}

	var gitMessage = {
		user: testInfo.github.user,
		repo: testInfo.github.repo,
		sha: testInfo.github.sha,
		state: status,
		target_url: testInfo.s3.location,
		description: description,
		context: 'Mobile Test Cloud'
	};

 return github.statuses.createAsync(gitMessage)
	.return(testInfo)
	.catch(function (e) {
		throw new Error();
	});

		)

	github.statuses.createAsync(gitMessage)
		.then(function () {
			logger.debug(sprintf('Updated commit: %s to status %s'), gitMessage.sha, gitMessage.state);
			resolve(testInfo);
		})
		.catch(function (e) {
			logger.error(
				sprintf('Failed to update commit: %s to status %s'), gitMessage.sha, gitMessage.state);
			logger.error(e);
			var error = new Error('Failed to update github status');
			reject(error);
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
	return setCommitStatus(testInfo, status);
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
	return setCommitStatus(testInfo, status);
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
		shelljs.exec(bash, function (code, output) {
			if (code !== 0) {
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
	});
};