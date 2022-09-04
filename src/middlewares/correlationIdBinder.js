const cuid = require('cuid');
const config = require('config');

const cls = require('utils/cls');

module.exports = (_req, _res, next) => {
  cls.set({ key: config.get('headers.correlationId'), value: cuid() });
  next();
};
