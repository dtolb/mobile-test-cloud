var express = require('express');
var app = module.exports = express();
var path = require('path');
var bodyParser = require('body-parser');
var config = require('./lib/config.js');
var logging = require('./lib/logging.js');
var sprintf = require('sprintf-js').sprintf;
var logger = logging.winstonLogger;

app.use(logging.requestLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.raw({limit: catapult.maxMediumSize}));

/******************************************************************************
 * Set up routes
 *****************************************************************************/
app.use('/', require('./lib/routes/index.js'));
app.use('/tester/', require('./lib/routes/tester.js'));
/******************************************************************************
 * Set up error handlers
 *****************************************************************************/
// oauth error handler

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('not found');
	err.status = 404;
	next(err);
});

// production error handler, no stacktraces leaked to user
app.use(function (err, req, res, next) {
	logger.error(sprintf(
		'error status=%s message=%s',
		err.status, err.message
	));
	logger.error(err.stack);
	res.status(err.status || 500);

	if (typeof(err.status) === 'undefined') {
		res.send({
			status: 'error',
			error: 'service error'
		});
	} else {
		res.send({
			status: 'error',
			error: err.message
		});
	}
});

/******************************************************************************
 * Set up server on configured port
 *****************************************************************************/
app.listen(config.server.port, function () {
	logger.info('mobile-test-cloud listening on port ' + config.server.port);
});
module.exports = app;