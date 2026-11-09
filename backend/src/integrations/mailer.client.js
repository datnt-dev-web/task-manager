const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Gửi email qua SMTP. Chưa cấu hình SMTP_HOST thì chỉ ghi log (tiện khi phát triển).
 */
class MailerClient {
  constructor(config) {
    this.from = config.MAIL_FROM;
    this.transport = config.SMTP_HOST
      ? nodemailer.createTransport({
          host: config.SMTP_HOST,
          port: config.SMTP_PORT,
          secure: config.SMTP_PORT === 465,
          auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
        })
      : null;
  }

  async send({ to, subject, html, text }) {
    if (!this.transport) {
      logger.info(`[mail:dev] Tới ${to} — ${subject}`);
      return;
    }
    await this.transport.sendMail({ from: this.from, to, subject, html, text });
  }
}

module.exports = MailerClient;
