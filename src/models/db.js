require('dotenv-safe').config();
const mongoose = require('mongoose');
const config = require('config');
const logger = require('utils/logger');

mongoose
  .connect(config.get('mongoUrl'), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
  })
  .then(() => {
    logger.info('Mongo Connected');
  })
  .catch((err) => {
    logger.error(err);
    process.exit(-1);
  });
