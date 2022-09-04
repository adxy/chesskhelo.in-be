require('dotenv-safe').config();
const config = require('config');

module.exports = {
  authenticate: async (req, res, next) => {
    if (req.header('Authorization') === config.get('accessToken')) {
      next();
      return;
    }
    res.unauthorized({});
  },
};
