const cron = require('node-cron');
const logger = require('../utils/logger');

/** Ngày "YYYY-MM-DD" theo múi giờ nghiệp vụ (BR-10). */
const isoDateIn = (date, timeZone) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
const shiftIso = (iso, days) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * NTF: 8:00 sáng mỗi ngày (giờ Việt Nam)
 * - "Sắp đến hạn": việc đến hạn ngày mai;
 * - "Quá hạn": việc hết hạn hôm qua (báo một lần, tránh spam mỗi ngày).
 * Có chống trùng nên chạy lại trong ngày cũng không gửi lặp.
 */
class DueReminderJob {
  constructor({ taskRepository, notificationRepository, notificationService, config }) {
    this.taskRepository = taskRepository;
    this.notificationRepository = notificationRepository;
    this.notifications = notificationService;
    this.config = config;
    this.scheduled = null;
  }

  start() {
    if (!this.config.ENABLE_JOBS || this.config.NODE_ENV === 'test') return;
    this.scheduled = cron.schedule('0 8 * * *', () => this.run().catch((err) => logger.error('Nhắc hạn lỗi:', err)), {
      timezone: this.config.TZ_BUSINESS,
    });
    logger.info(`Đã bật nhắc hạn lúc 08:00 (${this.config.TZ_BUSINESS})`);
  }

  stop() {
    this.scheduled?.stop();
  }

  async run(now = new Date()) {
    const today = isoDateIn(now, this.config.TZ_BUSINESS);
    const since = new Date(now.getTime() - 20 * 60 * 60 * 1000);
    const sent = { dueSoon: 0, overdue: 0 };

    const remind = async (type, tasks, counterKey) => {
      for (const task of tasks) {
        if (await this.notificationRepository.existsSince({ type, taskId: task.id, userId: task.assigneeId, since })) continue;
        await this.notifications.notify({ type, recipientIds: [task.assigneeId], task, project: task.project });
        sent[counterKey] += 1;
      }
    };

    await remind('due_soon', await this.taskRepository.findOpenDueOn(shiftIso(today, 1)), 'dueSoon');
    await remind('overdue', await this.taskRepository.findOpenDueOn(shiftIso(today, -1)), 'overdue');
    logger.info(`Nhắc hạn ${today}: ${sent.dueSoon} sắp đến hạn, ${sent.overdue} quá hạn`);
    return sent;
  }
}

module.exports = DueReminderJob;
