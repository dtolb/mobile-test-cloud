var Promise = require('bluebird');
var config = require('./config.js');
var knox = require('knox');
var path = require('path');
var fs = Promise.promisifyAll(require('fs-extra'));
var logger  = require('./logging.js').winstonLogger;
var sprintf = require('sprintf-js').sprintf;

/**
 * Points to the bucket to store the results
 */
var TestResultsClient = knox.createClient({
	key: config.s3.key,
	secret: config.s3.secret,
	bucket: config.s3.testBucket
});

/**
 * Points to the bucket for the app
 */
var AppDownloaderClient = knox.createClient({
	key: config.s3.key,
	secret: config.s3.secret,
	bucket: config.s3.appBucket
});

Promise.promisifyAll(AppDownloaderClient);

/**
 * Uploads the results to s3 and attaches information to testInfo
 * @param  {[type]} testInfo [Our test object]
 * @return {[Promise]}          [Eventually resolved with testInfo]
 */
module.exports.uploadResults = function (testInfo) {
	return new Promise(function (resolve, reject) {
		var s3FileLocation = sprintf('/repo/%s/branch/%s/pr-number/%s/%s.json',
								testInfo.github.repo,
								testInfo.github.branch,
								testInfo.github.PRnumber,
								testInfo.github.sha);
		var stringResults = JSON.stringify(testInfo.results);
		var req = TestResultsClient.put(s3FileLocation, {
			'Content-Length': Buffer.byteLength(stringResults),
			'Content-Type': 'application/json'
		});
		req.on('response', function (res) {
			if (res.statusCode !== 200) {
				console.log(res);
				var e = new Error('Unable to upload results to s3');
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

/**
 * Checks the specified s3 bucket for the location app
 * @param  {[type]} testInfo [Our test object]
 * @return {[Promise]}          [Eventually resolved with true or false]
 */
module.exports.checkIfAppExists = function (testInfo) {
	return AppDownloaderClient.listAsync({prefix: testInfo.s3.appLocation})
		.then(function (res) {
			if (res.Contents.length !== 1) {
				logger.silly(sprintf('App still not available at: %s', testInfo.s3.appLocation));
				return false;
			}
			else {
				logger.debug(sprintf('App found at location: %s', testInfo.s3.appLocation));
				return true;
			}
		});
};

/**
 * Waits for the specified time for the app to appear in s3
 * @param  {[type]} testInfo [Our test object]
 * @return {[Promise]}          [Eventually resolved with testInfo]
 */
module.exports.waitUntilAppExists = function (testInfo) {
	return new Promise(function (resolve, reject) {
		logger.silly('Waiting on app to exist');
		var currTime = Date.now();
		(function tick () {
			if ((Date.now() - currTime) > (config.s3.appTimeout * 60 * 1000)) {
				logger.error(sprintf('%s minute timeout hit waiting on app to appear'),config.s3.appTimeout);
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
						setTimeout(tick, 1000);
					}
				});
		})();
	});
};

/**
 * Downloads the app and attaches the location to the testInfo object
 * @param  {[type]} testInfo [Our test object]
 * @return {[Promise]}          [Eventually resolved with testInfo]
 */
module.exports.downloadApp = function (testInfo) {
	logger.debug(sprintf('Downloading app from: %s', testInfo.s3.appLocation));
	return AppDownloaderClient.getFileAsync(testInfo.s3.appLocation)
		.then(function (res) {
			return new Promise(function (resolve, reject) {
				var err = fs.mkdirsSync(config.directories.apps);
				if (err) {
					reject(new Error('Unable to create folder for downloaded app'));
					return;
				}
				testInfo.local.app = path.join(config.directories.apps, testInfo.testConfig.appName);
				var localApp = fs.createWriteStream(testInfo.local.app);
				logger.info(sprintf('Downloading app to: %s', testInfo.local.app));
				res.pipe(localApp)
					.on('finish', resolve)
					.on('error', reject);
			});
		})
		.return(testInfo);
};