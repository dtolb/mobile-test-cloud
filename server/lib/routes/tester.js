/**
 * Provides the route for running new tests
 */

var tester  = require('../controllers/tester.js');
var express = require('express');
var config  = require('../config.js');

var router  = module.exports = express.Router();

/*router.route('/run')
	.post(
		tester.validateUser, //Need to add
		tester.validateRequest,
		tester.processRequest,
		tester.getApps,
		tester.getTests,
		tester.runTests,
		tester.gatherResults,
		tester.storeResults,
		tester.postResults
	);*/

router.route('/github')
	.post(
		tester.startTest
		/*github.setInitialStatusToYellow,
		github.cloneRepo,
		tester.processRequest,
		tester.checkAppAvailability,
		tester.runTests*/
	);
