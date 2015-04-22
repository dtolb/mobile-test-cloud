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

module.exports.getAndroidDeviceInfo = function (id) {
	logger.debug('Gathering Device information');
	var cmd = sprintf('adb -s %s shell getprop ro.product.model', id);
	return child_process.execAsync(cmd)
		.spread(function (stdout, stderr) {
			logger.silly(sprintf('ID: %s is a %s', id, stdout));
			return stdout.replace(/\n$/, '');
		})
		.catch(function (error) {
			var e;
			logger.error(error);
			if (error.code !== 0) {
				e = new Error('Unable to gather device information');
				logger.error(e);
				throw e;
			}
			else {
				e = new Error('Unknown error gathering device information');
				logger.log(e);
				throw e;
			}
		});
};

module.exports.detectiOSDevices = function (testInfo) {
	//Get UUID for connected iOS devices
	var cmd = 'system_profiler SPUSBDataType | sed -n -e \'/iPad/,/Serial/p\' -e \'/iPhone/,/Serial/p\'' +
		' | grep "Serial Number:" | awk -F ": " \'{print $2}\'';
	return child_process.execAsync(cmd)
		.spread(function (stdout, stderr) {
			var devices = stdout.split('\n').filter(function (line) {
				return line.match(/(.+)/);
			})
			.map(function (line) {
				return line;
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
				e = new Error('Unable to detect android devices');
				logger.error(e);
				throw e;
			}
			else {
				e = new Error('Unknown error detecting android devices');
				logger.log(e);
				throw e;
			}
		});
};

module.exports.detectAndroidDevices = function (testInfo) {
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
				e = new Error('Unable to detect android devices');
				logger.error(e);
				throw e;
			}
			else {
				e = new Error('Unknown error detecting android devices');
				logger.log(e);
				throw e;
			}
		});
};

module.exports.detectDevices = function (testInfo) {
	logger.debug('Detecting Devices');
	if (testInfo.testConfig.os === 'ios') {
		logger.silly('Detecting iOS Devices');
		return module.exports.detectiOSDevices(testInfo);

	}
	else if (testInfo.testConfig.os === 'android') {
		logger.silly('Detecting Android Devices');
		return module.exports.detectAndroidDevices(testInfo);
	}
	else {
		return Promise.reject(new Error('Unknown testConfig OS'));
	}
};

/**
 * Runs the tests based on the requirements
 * @param  {[type]} testInfo [Our test Config]
 * @return {[Promise]}          [Will fullfill with testInfo]
 */
module.exports.runAndroidTest = function (testInfo, id) {
	logger.info('Running a test!!');
	var options = {
		cwd: testInfo.local.tests
	};
	var deviceName;
	return module.exports.getAndroidDeviceInfo(id)
		.then(function (deviceInfo) {
			deviceName = deviceInfo;
			return child_process.execAsync(testInfo.testConfig.testCommand, options);
		})
		.spread(function (stdout, stderr) {
			//testInfo.results.testResults = stdout;
			testInfo.results.testResults[deviceName] = stdout;
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

/**
 * Runs the tests based on the requirements
 * @param  {[type]} testInfo [Our test Config]
 * @return {[Promise]}          [Will fullfill with testInfo]
 */
module.exports.runiOSTest = function (testInfo, id) {
	logger.info('Running a test!!');
	var options = {
		cwd: testInfo.local.tests
	};
	return child_process.execAsync(testInfo.testConfig.testCommand, options)
		.spread(function (stdout, stderr) {
			//testInfo.results.testResults = stdout;
			testInfo.results.testResults[id] = stdout;
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

module.exports.killAppium = function (testInfo) {
	logger.debug('Killing appium server');
	testInfo.appiumServer.kill();
	delete testInfo.appiumServer;
	return testInfo;
};

module.exports.runTests = function (testInfo) {
	return new Promise(function (resolve, reject) {
		var count = 0;
		testInfo.results.testResults = {};
		var a = Promise.resolve();
		testInfo.local.devices.forEach(function (id) {
			a = a.then(function () {
					logger.silly('Calling Spawning Appium');
					return module.exports.spawnAppium(testInfo, id);
				})
				//.then(module.exports.runTest)
				.then(function (res) {
					if (res.testConfig.os === 'android') {
						return module.exports.runAndroidTest(res, id);
					}
					else if (testInfo.testConfig.os === 'ios') {
						return module.exports.runiOSTest(testInfo, id);
					}
					else {
						return Promise.reject(new Error('Unknown testConfig OS'));
					}
					//return module.exports.runiOSTest(res, id);
				})
				.then(function (res) {
					//console.log(res);
					count += 1;
					if (count === testInfo.local.devices.length) { // check if all done
						logger.info('Finished Running Tests!');
						resolve(res);
					}
					return res;
				})
				.then(module.exports.killAppium)
				.catch(function (e) {
					console.log(e);
					reject(e);
				});
		});

	});
};

module.exports.spawnAppium = function (testInfo, id) {
	logger.info('Spawning appium');
	return new Promise(function (resolve, reject) {
		var appium_port = config.startingAppiumPort;
		var started = false;
		testInfo.appiumServer = child_process.spawn('appium',
			['-U', id, '-p', config.startingAppiumPort, '--app', testInfo.local.app]);
		testInfo.appiumServer.stderr.on('data', function (data) {
			console.error(data.toString());
			reject(data.toString());
		});
		testInfo.appiumServer.stdout.on('data', function (data) {
			if (!started && data.toString().indexOf('Appium REST http interface listener started') > -1) {
				started = true;
				//console.log('Server Started!');
				//console.log(server);
				resolve(testInfo);
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