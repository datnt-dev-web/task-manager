const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const buildRoutes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

function createApp(container) {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY); // chạy sau Nginx
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL.split(','), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api/v1', buildRoutes(container));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
