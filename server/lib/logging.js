var winston = require('winston');
var config = require('./config.js');
var requestLogger = require('morgan');

module.exports.createWinstonLogger = function (loggingConfig) {
	var winstonLogger = new (winston.Logger)({
		transports: [
			new (winston.transports.Console)({
			level: loggingConfig.app.level,
			timestamp: true
		})
	]
});

return winstonLogger;
};

module.exports.winstonLogger = module.exports.createWinstonLogger(config.logging);
module.exports.requestLogger = requestLogger(config.logging.request.level);
