var Promise = require('bluebird');
var child_process = Promise.promisifyAll(require('child_process'));
var sprintf = require('sprintf-js').sprintf;
var logger  = require('./logging.js').winstonLogger;
var config = require('./config.js');
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

module.exports.detectDevices = function (testInfo) {
	logger.debug('Detecting Devices');
	if (testInfo.testConfig.os.toLowerCase() === 'ios') {
		return;
	}
	var cmd = 'adb devices';
	return child_process.execAsync(cmd)
		.spread(function (stdout, stderr) {
			var devices = stdout.split('\n').filter(function (line) {
				return line.match(/device$/i);
			}).map(function (line) {
				return line.split('\t')[0];
			});
			logger.silly(sprintf('Detected %s devices', devices.length));
			logger.silly(devices);
			testInfo.local.devices = devices;
			return testInfo;
		})
		.catch(function (error) {
			var e;
			logger.error(error);
			if (error.code !== 0) {
				e = new Error('Unable to detect android tests');
				logger.error(e);
				throw e;
			}
			else {
				e = new Error('Unknown error detecting android tests');
				logger.log(e);
				throw e;
			}
		});
};

module.exports.spawnAppium = function (testInfo) {
	logger.info('Spawning appium');
	var servers = {};
	testInfo.local.devices.forEach(function (id) {
		//var appium_port = config.startingAppiumPort += 1;
		var started = false;
		servers[id] = child_process.spawn('appium',
			['-U', id, '-p', config.startingAppiumPort, '-app', testInfo.local.app]);
		servers[id].stderr.on('data', function (data) { console.error(data.toString()); });
		servers[id].stdout.on('data', function (data) {
			if (!started && data.toString().indexOf('Appium REST http interface listener started') > -1) {
				started = true;
				var options = {
					cwd: '/Users/dtolbert/code/mtc-demos/appium-java/junit'
				};
				var res = child_process.execSync('mvn -Dtest=com.saucelabs.appium.AndroidTest test', options);
			}
		});
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