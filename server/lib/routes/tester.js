/**
 * Provides the route for running new tests
 */

var tester  = require('../controllers/tester/tester.js');
var express = require('express');
var config  = require('../config.js');

var router  = module.exports = express.Router();

router.route('/run')
	.post(
		test.validateUser, //Need to add
		tester.processRequest,
		tester.getApps,
		tester.getTests,
		tester.runTests,
		tester.gatherResults,
		tester.storeResults,
		tester.postResults
	);
