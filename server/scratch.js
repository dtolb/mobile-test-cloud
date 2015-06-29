/*var Joi = require('joi');
var reqSchema = Joi.object().keys({
	os: Joi.string().regex(/^(android)|(ios)|(Android)|(iOS)/),
	devices: Joi.array(),
	emulators: Joi.array(),
	testDirectory: Joi.string(),
	testCommand: Joi.string()
});

var testConfig = require('./../sample-ios-req.json');
//console.log(test);

var result = Joi.validate(testConfig, reqSchema);
console.log(result);
var path = require('path');
var Promise = require('bluebird');
var glob = Promise.promisifyAll(require('glob'));
var fs = Promise.promisifyAll(require('fs'));
var options = {
	cwd: '/Users/dtolbert/code/mobile-test-cloud'
};

var fs = require('fs');
var a = '/Users/dtolbert/code/mobile-test-cloud/mtc_conig.json';
//var obj = JSON.parse(fs.readFileSync(a, 'utf8'));
//console.log(obj);
glob.globAsync('mtc_config.json', options)

.then(function (res) {
	console.log(res);
	var opener = path.join(options.cwd, res[0]);
	console.log(opener);
	return JSON.parse(fs.readFileSync(opener, 'utf8'));
	//console.log(b.testCommand);

}); 
var exe = 'cd /Users/dtolbert/bandwidth/sample-code/sample-code/examples/node'+
'npm install' +
'mocha ios-simple.js';

var exec = require('exec');
function processResults(err, out, code) {
	if (err instanceof Error) {
		throw err;
	}
	process.stderr.write(err);
	process.stdout.write(out);
	process.exit(code);
}

exec('exe', processResults);*/

var knox = require('knox');
var path = require('path');
var logger  = require('./lib/logging.js').winstonLogger;
var sprintf = require('sprintf-js').sprintf;
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs-extra'));
var child_process = Promise.promisifyAll(require('child_process'));

var config = {};
config.s3 = {
	key: process.env.AMAZON_ACCESS_KEY_ID,
	secret: process.env.AMAZON_SECRET_ACCESS_KEY,
	bucket: 'ringto-apps',
	appTimeout: 1
};
config.directories = {
	apps:path.join(__dirname,'./../tmp/apps')
};
config.startingAppiumPort = 4723;

var client = knox.createClient({
	key: config.s3.key,
	secret: config.s3.secret,
	bucket: config.s3.bucket
});

module.exports.uploadResults = function (testInfo) {
	return new Promise(function (resolve, reject) {
		var s3FileLoaction = sprintf('/repo/%s/branch/%s/pr-number/%s/%s.json',
								testInfo.github.repo,
								testInfo.github.branch,
								testInfo.github.PRnumber,
								testInfo.github.sha);
		var stringResults = JSON.stringify(testInfo.results);
		var req = client.put(s3FileLoaction, {
			'Content-Length': Buffer.byteLength(stringResults),
			'Content-Type': 'application/json'
		});
		req.on('response', function (res) {
			if (res.statusCode !== 200) {
				var e = new Error('Unable to upload results');
				logger.error(sprintf('S3 returned: %s, unable to upload results',
					res.statusCode));
				reject(e);
			}
			else {
				logger.debug(sprintf('Uploaded results to: %s', req.url));
				testInfo.s3.testResultLocation = req.url;
				resolve(testInfo);
			}
		});
		req.end(stringResults);
	});
};

var sti = {};
sti.github = {
	repo: 'public-repo',
	sha: '05c588ba8cd510ecbe112d020f215facb17817a6',
	PRnumber:50,
	user:'baxterthehacker',
	gitURL:'git@github.com:baxterthehacker/public-repo.git',
	branch:'changes'
};
sti.s3 = {
	appLocation: 'repo/jailbreak-android/RingTo.apk'
};
sti.results = {
	install: 'here would be install results',
	testResults: 'here would be test results'
};
sti.testConfig = {
	appName: 'RingTo.apk',
	os: 'android',
	testCommand: 'mvn -Dtest=com.saucelabs.appium.AndroidTest test'
};
sti.local = {
	app: '/Users/dtolbert/code/mtc-demos/apps/ApiDemos/bin/ApiDemos-debug.apk',
	tests: '/Users/dtolbert/code/mtc-demos/appium-java/junit'
};

var ste = {};
ste.github = {
	repo: 'public-repo',
	sha: '05c588ba8cd510ecbe112d020f215facb17817a6',
	PRnumber:50,
	user:'baxterthehacker',
	gitURL:'git@github.com:baxterthehacker/public-repo.git',
	branch:'changes'
};
ste.s3 = {
	appLocation: 'repo/jailbreak-android/RingTo.apk'
};
ste.results = {
	install: 'here would be install results',
	testResults: 'here would be test results'
};
ste.testConfig = {
	appName: 'RingTo.apk',
	os: 'ios',
	testCommand: 'mocha ios-simple.js'
};
ste.local = {
	app: '/Users/dtolbert/code/mtc-demos/apps/TestApp.app',
	tests: '/Users/dtolbert/code/mtc-demos/appium-node'
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

/*module.exports.detectDevices(ste)
	.then(module.exports.runTests)
	.then(function (res) {
		console.log(res);
	});*/


module.exports.detectDevices(sti)
	.then(module.exports.runTests)
	.then(function (res) {
		console.log('here i am ??');
		console.log(res.results.testResults);
		//console.log(res.local.devices.length);
	})
	.catch(function (e) {
		console.log('FAILURE');
		console.log(e);
	});

/*module.exports.spawnAppium = function (testInfo, id) {
	logger.info('Spawning appium');
	return new Promise(function (resolve, reject) {
		var appium_port = config.startingAppiumPort;
		var started = false;
		var server = child_process.spawn('appium',
			['-U', id, '-p', config.startingAppiumPort, '--app', testInfo.local.app]);
		server.stderr.on('data', function (data) {
			console.error(data.toString());
			reject(data.toString());
		});
		server.stdout.on('data', function (data) {
			if (!started && data.toString().indexOf('Appium REST http interface listener started') > -1) {
				started = true;
				logger.info('Running a test!!');
				var options = {
					cwd: testInfo.local.tests
				};
				child_process.execAsync(testInfo.testConfig.testCommand, options)
					.spread(function (stdout, stderr) {
						console.log(stderr);
						console.log(stdout);
						testInfo.results.testResults = stdout;
						return testInfo;
					})
					.then(function (res) {
						resolve(res);
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
			}
		});
	});
};*/

/*Promise.promisifyAll(client);
module.exports.checkIfAppExists = function (testInfo) {
	return client.listAsync({prefix: testInfo.s3.appLocation})
		.then(function (res) {
			if (res.Contents.length !== 1) {
				return false;
			}
			else {
				return true;
			}
		});
};

module.exports.waitUntilAppExists = function (testInfo) {
	return new Promise(function (resolve, reject) {
		var currTime = Date.now();
		(function tick () {
			if ((Date.now() - currTime) > (config.s3.appTimeout * 60 * 1000)) {
				reject(new Error('Timeout waiting on app to appear'));
				return;
			}
			module.exports.checkIfAppExists(testInfo)
				.then(function (exists) {
					if (exists) {
						resolve(testInfo);
						return;
					}
					else {
						console.log('checking again');
						setTimeout(tick, 1000);
					}
				});
		})();
	});
};

module.exports.downloadApp = function (testInfo) {
	return client.getFileAsync(testInfo.s3.appLocation)
		.then(function (res) {
			return new Promise(function (resolve, reject) {
				var err = fs.mkdirsSync(config.directories.apps);
				if (err) {
					reject(new Error('Unable to create folder for downloaded app'));
					return;
				}
				testInfo.local.app = path.join(config.directories.apps, testInfo.testConfig.appName);
				var localApp = fs.createWriteStream(testInfo.local.app);
				res.pipe(localApp)
					.on('finish', resolve)
					.on('error', reject);
			});
		})
		.return(testInfo);
};

module.exports.waitUntilAppExists(sti)
.then(module.exports.downloadApp)
.then(function (res) {
	console.log('here i am');
	console.log(res);
})
.catch(function (e) {
	console.log(e);
});
*/

/*var list = Promise.promisify(client.list);

module.exports.uploadResults(sti)
.then(function (testInfo) {
	var prefix = sprintf('repo/%s/branch/%s/pr-number/49',
						testInfo.github.repo,
						testInfo.github.branch,
						testInfo.github.PRnumber);
	return list({prefix: prefix})
		.then(function (res) {
			if (res.contents.length !== 1) {
				return false;
			}
			else {
				testInfo.s3.appKey = res.contents[0].Key;
				return testInfo;
			}
		})
		.then(function(res) {
			console.log(res);
		});
})
.catch(function (e) {
	console.log(e);
});*/



