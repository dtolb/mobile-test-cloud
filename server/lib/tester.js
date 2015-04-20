var Promise = require('bluebird');
var child_process = Promise.promisifyAll(require('child_process'));
var logger  = require('./logging.js').winstonLogger;

/**
 * Installs the tests based on the requirements
 * @param  {[type]} testInfo [Our test Config]
 * @return {[Promise]}          [Will fullfill with testInfo]
 */
module.exports.installTests = function (testInfo) {
	logger.debug('Installing tests');
	var options = {
		cwd: testInfo.local.tests
	};
	return child_process.execAsync(testInfo.testConfig.installCommand, options)
		.spread(function (stdout, stderr) {
			testInfo.results = {
				install: stdout
			};
			return testInfo;
		})
		.catch(function (error) {
			var e;
			logger.error(error);
			if (error.code !== 0) {
				e = new Error('Unable to install tests');
				logger.error(e);
				throw e;
			}
			else {
				e = new Error('Unknown error installing tests');
				logger.log(e);
				throw e;
			}
		});
};

/**
 * Runs the tests based on the requirements
 * @param  {[type]} testInfo [Our test Config]
 * @return {[Promise]}          [Will fullfill with testInfo]
 */
module.exports.runTest = function (testInfo) {
	logger.info('Running a test!!');
	var options = {
		cwd: testInfo.local.tests
	};
	return child_process.execAsync(testInfo.testConfig.testCommand, options)
		.spread(function (stdout, stderr) {
			testInfo.results.testResults =  stdout;
			return testInfo;
		})
		.catch(function (error) {
			var e;
			logger.error(error);
			if (error.code !== 0) {
				e = new Error('Tests Failed!');
				logger.error(e);
				throw e;
			}
			else {
				e = new Error('Unknown error running tests');
				logger.log(e);
				throw e;
			}
		});
};