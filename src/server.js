require('app-module-path').addPath(require('path').resolve(__dirname));
require('dotenv-safe').config();
require('express-async-errors');
require('models/db');

const config = require('config');
const boolParser = require('express-query-boolean');
const express = require('express');
const gracefulShutdown = require('http-graceful-shutdown');
const socketio = require('socket.io');

const logger = require('utils/logger');
const winstonLogger = require('utils/winstonLogger');
const { handleSocketEvents } = require('services/socketEvents');
const clsify = require('middlewares/clsify');
const correlationIdBinder = require('middlewares/correlationIdBinder');
const responseHandlers = require('middlewares/response');
const { socketsAuthorization } = require('middlewares/auth.js');
const routes = require('routes');

const app = express();

if (process.env.NODE_ENV === 'development') {
  const cors = require('utils/cors');
  app.use(cors);
}

app.set('port', config.get('port'));

// disable x-powered-by header
app.disable('x-powered-by');

// Middlewares defined below. Order matters.
// CLSify the Express request.
app.use(clsify());
app.use(correlationIdBinder);

// Request Body Parsing
app.use(express.text({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

// Request query parameter - boolean parsing
app.use(boolParser());

// Custom Response Handlers
app.use(responseHandlers);

app.use(routes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err);
  res.failure({});
});

const server = app.listen(app.get('port'), () =>
  logger.info(`Server started. Listening on port ${app.get('port')}`)
);

const io = socketio(server, {
  path: '/v1/sockets',
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization'],
    credentials: true,
  },
});

io.use(socketsAuthorization);

io.on('connection', (socket) => {
  handleSocketEvents({ socket });
});

const shutdownCleanup = async (signal) => {
  logger.info(`Received ${signal}, shutting down...`);
  const loggerDone = new Promise((resolve) => winstonLogger.on('finish', resolve));
  winstonLogger.end();

  return loggerDone;
};

gracefulShutdown(server, { onShutdown: shutdownCleanup, timeout: 5000 });

process.on('unhandledRejection', (err) => {
  logger.error(err);
  process.exit(1);
});
