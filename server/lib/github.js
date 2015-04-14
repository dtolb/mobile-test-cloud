var GitHubApi = require('github');
var logger  = require('../logging.js').winstonLogger;
var config = require('./config.js');
var Promise = require('bluebird');
var NodeGit = require("nodegit");

var github = new GitHubApi({version: "3.0.0"});
Promise.promisifyAll(github.statuses);

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
      gitURL: webhook.pull_request.head.repo.ssh_url
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
  return new Promise(function (resolve, reject) {
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

module.exports.cloneRepo = function (testInfo) {
  
}