class NotificationController {
  constructor({ notificationService, dueReminderJob }) {
    this.notificationService = notificationService;
    this.dueReminderJob = dueReminderJob;
  }

  list = async (req, res) => {
    const { items, meta } = await this.notificationService.list(req.user, req.valid.query);
    res.json({ data: items, meta });
  };

  unreadCount = async (req, res) => {
    res.json({ data: { count: await this.notificationService.unreadCount(req.user) } });
  };

  markRead = async (req, res) => {
    const { ids, all } = req.valid.body;
    const updated = await this.notificationService.markRead(req.user, all ? undefined : ids);
    res.json({ data: { updated } });
  };

  /** Quản trị viên chạy nhắc hạn thủ công (kiểm tra cấu hình email, chạy bù). */
  runDueReminders = async (_req, res) => {
    res.json({ data: await this.dueReminderJob.run() });
  };
}

module.exports = NotificationController;
