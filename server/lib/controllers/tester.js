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
	//console.log('here we are');
	logger.debug('New Pull Request Webook Received!');
	logger.silly('Cloning webhook body');
	var webhook = clone(req.body);
	logger.silly('Starting test flow! Prepare for awesomeness');
	flow.start(webhook);
	res.sendStatus(200);
};