const config = require('config');
const logger = require('utils/logger');

module.exports = (socket, next) => {
  try {
    const { token } = socket.handshake.auth;
    if (token && token === config.get('accessToken')) {
      next();
    } else {
      const err = new Error('Not Authorized');
      err.data = { content: 'Wrong Auth Token' };
      next(err);
    }
  } catch (e) {
    logger.error(e);
  }
};
