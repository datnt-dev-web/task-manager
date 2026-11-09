const env = require('./config/env');
const logger = require('./utils/logger');
const { buildContainer } = require('./container');
const { createApp } = require('./app');

/** Thử kết nối lại vài lần: Postgres (docker) có thể khởi động chậm hơn API. */
async function connectDatabase(sequelize, attempts = 10, delayMs = 3000) {
  for (let i = 1; ; i += 1) {
    try {
      await sequelize.authenticate();
      return;
    } catch (err) {
      if (i >= attempts) throw err;
      logger.warn(`Chưa kết nối được PostgreSQL (${err.parent?.code ?? err.message}), thử lại sau ${delayMs / 1000}s... (${i}/${attempts})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  const container = buildContainer();
  await connectDatabase(container.db.sequelize);
  logger.info('Đã kết nối PostgreSQL');
  await container.services.authService.ensureBootstrapAdmin();

  container.jobs.dueReminder.start();

  const server = createApp(container).listen(env.PORT, () => {
    logger.info(`API đang chạy tại http://localhost:${env.PORT}/api/v1 (${env.NODE_ENV})`);
  });

  const shutdown = (signal) => {
    logger.info(`Nhận ${signal}, đang tắt...`);
    container.jobs.dueReminder.stop();
    server.close(async () => {
      await container.db.sequelize.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.error('Không khởi động được API:', err);
  process.exit(1);
});
