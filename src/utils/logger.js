const VError = require('verror');

const winstonLogger = require('utils/winstonLogger');

// eslint-disable-next-line no-underscore-dangle
const _log = ({ logObject, logLevel = 'info' }) => {
  if (!logObject) {
    return;
  }

  if (typeof logObject !== 'object') {
    winstonLogger[logLevel](logObject);
    return;
  }

  // If errorObject is not an instance of Error, log the object at given log level.
  if (!(logObject instanceof Error)) {
    winstonLogger[logLevel](logObject);
    return;
  }

  const { vErrorLogLevel } = VError.info(logObject);
  if (vErrorLogLevel && Object.prototype.hasOwnProperty.call(winstonLogger.levels, logLevel)) {
    if (winstonLogger.levels[vErrorLogLevel] <= winstonLogger.levels.warning) {
      winstonLogger[vErrorLogLevel](VError.fullStack(logObject));
    } else {
      winstonLogger[vErrorLogLevel](logObject.message);
    }
    return;
  }

  // errorObject is an instance of Error but has no vErrorLogLevel specified.
  if (winstonLogger.levels[logLevel] <= winstonLogger.levels.warning) {
    winstonLogger[logLevel](VError.fullStack(logObject));
    return;
  }
  winstonLogger.error(VError.fullStack(logObject));
};

const logger = {
  log: (logObject) => {
    _log({ logObject });
  },

  debug: (logObject) => {
    _log({ logObject, logLevel: 'debug' });
  },

  info: (logObject) => {
    _log({ logObject, logLevel: 'info' });
  },

  notice: (logObject) => {
    _log({ logObject, logLevel: 'notice' });
  },

  warning: (logObject) => {
    _log({ logObject, logLevel: 'warning' });
  },

  error: (logObject) => {
    _log({ logObject, logLevel: 'error' });
  },

  crit: (logObject) => {
    _log({ logObject, logLevel: 'crit' });
  },

  alert: (logObject) => {
    _log({ logObject, logLevel: 'alert' });
  },

  emerg: (logObject) => {
    _log({ logObject, logLevel: 'emerg' });
  },
};

module.exports = logger;
