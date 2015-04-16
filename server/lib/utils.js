var config = require('./config.js');
var clone   = require('clone');
var Joi = require('joi');
var Promise = require('bluebird');
var glob = Promise.promisifyAll(require('glob'));
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var logger  = require('./logging.js').winstonLogger;

//Promise.promisify(Joi.validate);

/*module.exports.launchiOSEmulator = function (osVersion, device) {};
module.exports.launchAndroidEmulator = function (osVersion, device) {};
*/
/**
 * Checks the discovered test config against schema
 * @param  {[JSON]} testConfig [out test config]
 * @return {[Boolean]}            [true if matches, false if not]
 */
module.exports.validateTestConfig = function (testConfig) {
	var reqSchema = Joi.object().keys({
		os: Joi.string().regex(/(android)|(ios)|(Android)|(iOS)/),
		devices: Joi.array(),
		emulators: Joi.array(),
		testDirectory: Joi.string(),
		testCommand: Joi.string()
	});
	var result = Joi.validate(testConfig, reqSchema);
	if (result.error === null) {
		return true;
	}
	else {
		return false;
	}
};

/**
 * Digs through the repo and finds the mobile test cloud config
 * @param  {[JSON]} testInfo [Our Test Config]
 * @return {[Promise]}          [description]
 */
module.exports.locateTestConfig = function (testInfo) {
	logger.debug('Searching repo for mobile test cloud config');
	var options = {
		cwd: testInfo.local.repo
	};
	var match = '**/' + config.testConfigFileName;
	return glob.globAsync(match, options)
		.then(function (resultsArray) {
			if (resultsArray.length !== 1) {
				logger.error('Test Config not found, or too many configs found!');
				throw new Error('Test config not valid, or too many configs found!');
			}
			var file = path.join(testInfo.local.repo, resultsArray[0]);
			return fs.readFileAsync(file, 'utf8');
		})
		.then(JSON.parse)
		.then(function (testConfig) {
			if (!module.exports.validateTestConfig(testConfig)){
				logger.error('Test Config not valid!');
				throw new Error('Test Config not valid!');
			}
			testInfo.testConfig = clone(testConfig);
			return testInfo;
		});
};