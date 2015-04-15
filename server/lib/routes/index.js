/**
* Provides routes for the root of this express application.
*/

var express = require('express');
var router = module.exports = express.Router();

router.route('/')
	.get(function (req, res) {
	res.send(200, {response: 'ring.to api'});
});