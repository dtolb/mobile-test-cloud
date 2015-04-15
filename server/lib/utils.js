var config = require('./config.js');
var dir = require('node-dir');
var clone   = require('clone');
var Joi = require('joi');
var Promise = require('bluebird');

//Promise.promisify(Joi.validate);

module.exports.launchiOSEmulator = function (osVersion, device) {};
module.exports.launchAndroidEmulator = function (osVersion, device) {};

/**
 * Checks the discovered test config against schema
 * @param  {[JSON]} testConfig [out test config]
 * @return {[Boolean]}            [true if matches, false if not]
 */
var validateTestConfig = function (testConfig) {
  var reqSchema = Joi.object.keys({
    os: Joi.string().regex(/(android)|(ios)|(Android)|(iOS)/),
    devices: Joi.array(),
    emulators: Joi.any(),
    testDirectory: Joi.sting.any()
  });
  Joi.validate(testConfig, reqSchema, function (err, value) {
    if (err) {
      return false;
    }
    else {return true;}
  });

};

/**
 * Digs through the repo and finds the mobile test cloud config
 * @param  {[JSON]} testInfo [Our Test Config]
 * @return {[Promise]}          [description]
 */
module.exports.locateTestConfig = function (testInfo) {
  return new Promise(function (resolve, reject) {
    var error;
    logger.debug('Searching repo for mobile test cloud config');
    dir.readfiles(testInfo.local.repos, {
      match: config.testFileRegex
    },
      function(err, content) {
        if(err) {
          logger.error('Failed searching for test cloud config');
          error = new Error('Searching repo for test cloud config failed');
          reject(error);
        }
        else {
          logger.silly('Found test config!');
          var testConfig = JSON.parse(content);
          if (validateTestConfig(testConfig)) {
            testInfo.testConfig = testConfig;
            resolve(testInfo);
          }
          else {
            error = new Error('Test config not valid!');
            logger.log('Test config not correct');
            reject(error);
          }
        }
      });
  });
};
