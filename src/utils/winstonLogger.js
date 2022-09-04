const winston = require('winston');
const WinstonDailyRotateFile = require('winston-daily-rotate-file');
const moment = require('moment-timezone');
const config = require('config');

const cls = require('utils/cls');

const serviceName = config.get('serviceName');
const correlationIdHeader = config.get('headers.correlationId');

const winstonTransportConfig = {
  consoleConfig: {
    level: 'debug',
    handleExceptions: true,
  },
  fileRotateConfig: {
    level: 'info',
    filename: `${serviceName}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    dirname: `${config.get('logDir')}/${process.env.NODE_ENV}/${serviceName}`,
    maxSize: '20m',
    maxFiles: 14,
    handleExceptions: true,
  },
};

const timestampFormat = winston.format((info, opts) => {
  if (opts.tz) {
    // eslint-disable-next-line no-param-reassign
    info.timestamp = moment().tz(opts.tz).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  }
  return info;
});

const logLineFormat = winston.format.printf(
  (info) => `${info.timestamp} \
[${cls.get({ key: correlationIdHeader }) || '-'}] \
[${info.label.service}] \
${info.level.toUpperCase()}: ${info.message}`
);

const format = winston.format.combine(
  winston.format.label({ label: { service: serviceName } }),
  timestampFormat({ tz: config.get('timezone') }),
  logLineFormat
);
const winstonTransports = [];
if (['stage', 'beta', 'production'].includes(process.env.NODE_ENV)) {
  winstonTransports.push(new WinstonDailyRotateFile(winstonTransportConfig.fileRotateConfig));
} else {
  winstonTransports.push(new winston.transports.Console(winstonTransportConfig.consoleConfig));
}

const winstonLogger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: winstonTransports,
  format,
  exitOnError: false,
});

module.exports = winstonLogger;
