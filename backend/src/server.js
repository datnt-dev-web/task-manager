const env = require('./config/env');
const logger = require('./utils/logger');
const { buildContainer } = require('./container');
const { createApp } = require('./app');

async function main() {
  const container = buildContainer();
  await container.db.sequelize.authenticate();
  logger.info('Đã kết nối PostgreSQL');

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
