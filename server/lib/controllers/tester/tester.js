var express     = require('express');
var logger      = require('../../logging.js').winstonLogger;
var sprintf     = require('sprintf-js').sprintf;
var fs          = require('fs');
var config      = require('../../config.js');
var url         = require('url');

/**
 * Validates user has permission to run tests
 * @param  {[type]}   req  [request object]
 * @param  {[type]}   res  [response object]
 * @param  {Function} next [function pointer to next middleware]
 */
module.exports.validateUser = function (req, res, next) {};

/**
 * Process the JSON request and put information in the req object
 * @param  {[type]}   req  [request object]
 * @param  {[type]}   res  [response object]
 * @param  {Function} next [function pointer to next middleware]
 */
module.exports.processRequest = function (req, res, next) {};

/**
 * Downloads the apps under test
 * @param  {[type]}   req  [request object]
 * @param  {[type]}   res  [response object]
 * @param  {Function} next [function pointer to next middleware]
 */
module.exports.getApps = function (req, res, next) {};

/**
 * Downloads the Appium test files
 * @param  {[type]}   req  [request object]
 * @param  {[type]}   res  [response object]
 * @param  {Function} next [function pointer to next middleware]
 */
module.exports.getTests = function (req, res, next) {};

/**
 * Runs the Appium Tests based on the configuration
 * @param  {[type]}   req  [request object]
 * @param  {[type]}   res  [response object]
 * @param  {Function} next [function pointer to next middleware]
 */
module.exports.runTests = function (req, res, next) {};

/**
 * Gathers results from the Appium Tests
 * @param  {[type]}   req  [request object]
 * @param  {[type]}   res  [response object]
 * @param  {Function} next [function pointer to next middleware]
 */
module.exports.gatherResults = function (req, res, next) {};

/**
 * Stores the results in S3
 * @param  {[type]}   req  [request object]
 * @param  {[type]}   res  [response object]
 * @param  {Function} next [function pointer to next middleware]
 */
module.exports.storeResults = function (req, res, next) {};

/**
 * Posts back to GitHub with the results and a link to results in S3
 * @param  {[type]}   req  [request object]
 * @param  {[type]}   res  [response object]
 * @param  {Function} next [function pointer to next middleware]
 */
module.exports.postResults = function (req, res, next) {};