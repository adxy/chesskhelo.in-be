require('dotenv-safe').config();
const clsHooked = require('cls-hooked');
const config = require('config');

const ns = clsHooked.createNamespace(config.get('serviceName'));

const cls = {
  middleware: (req, res, next) => {
    ns.bindEmitter(req);
    ns.bindEmitter(res);

    ns.run(() => next());
  },

  get: ({ key }) => {
    if (ns && ns.active) {
      return ns.get(key);
    }
    return null;
  },

  set: ({ key, value }) => {
    if (ns && ns.active) {
      return ns.set(key, value);
    }
    return null;
  },
};

module.exports = cls;
