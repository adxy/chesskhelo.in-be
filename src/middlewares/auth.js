require('dotenv-safe').config();
const config = require('config');
const jwt = require('jsonwebtoken');

const { parseCookie } = require('utils/commonFunctions');

module.exports = {
  authenticate: async (req, res, next) => {
    const accessToken = req.header(config.get('headers.authorization'));
    if (!accessToken) {
      return res.unauthorized({});
    }
    try {
      const data = jwt.verify(accessToken, config.get('accessJwtSecret'));
      req.userId = data.userId;
      return next();
    } catch (e) {
      return res.unauthorized({});
    }
  },

  authenticateByCookie: async (req, res, next) => {
    try {
      const cookieString = req.headers.cookie;
      if (!cookieString) {
        return res.unauthorized({});
      }

      const { ck_refresh_token: refreshToken } = parseCookie({ cookieString });

      if (!refreshToken) {
        return res.unauthorized({});
      }
      const data = jwt.verify(refreshToken, config.get('refreshJwtSecret'));
      req.userId = data.userId;
      req.refreshToken = refreshToken;
      return next();
    } catch (e) {
      return res.unauthorized({});
    }
  },

  // eslint-disable-next-line no-undef
  socketsAuthorization: (async = (socket, next) => {
    const accessToken = socket.handshake.query.token;
    if (!accessToken) {
      return next(new Error('AccessToken Missing'));
    }
    try {
      jwt.verify(accessToken, config.get('accessJwtSecret'));
      return next();
    } catch (e) {
      return next(e);
    }
  }),
};
