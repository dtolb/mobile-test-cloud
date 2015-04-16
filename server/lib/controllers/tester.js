var express = require('express');
var logger  = require('../logging.js').winstonLogger;
var clone   = require('clone');
var flow    = require('../flow.js');

/**
 * Just sends a 201 and starts the test flow
 * @param  {[type]}   req  [request object]
 * @param  {[type]}   res  [response object]
 * @param  {Function} next [function pointer to next middleware]
 */
module.exports.startTest = function (req, res, next) {
	logger.Debug('New Pull Request Opened!');
	logger.silly('Cloning webhook body');
	var webhook = clone(req.body);
	logger.silly('Starting test flow! Prepare for awesomeness');
	flow.start(webhook);
	res.send(200);
};