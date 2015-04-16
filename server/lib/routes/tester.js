/**
 * Provides the route for running new tests
 */

var tester  = require('../controllers/tester.js');
var express = require('express');
var config  = require('../config.js');

var router  = module.exports = express.Router();

router.route('/github')
	.post(tester.startTest);
