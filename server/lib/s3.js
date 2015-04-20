var config = require('./config.js');
var knox = require('knox');
var path = require('path');
var logger  = require('./logging.js').winstonLogger;
var sprintf = require('sprintf-js').sprintf;
var Promise = require('bluebird');

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
				var e = new Error('Unable to upload results to s3');
				logger.error(sprintf('S3 returned: %s, unable to upload results',
					res.statusCode));
				reject(e);
			}
			else {
				logger.debug(sprintf('Uploaded results to: %s', req.url));
				testInfo.s3 = {
					location: req.url
				};
				resolve(testInfo);
			}
		});
		req.end(stringResults);
	});
};