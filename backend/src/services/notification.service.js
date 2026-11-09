const logger = require('../utils/logger');

// Loại sự kiện có gửi email + khóa cài đặt tương ứng (NTF-03). Loại khác chỉ báo trong ứng dụng.
const EMAIL_SETTING_BY_TYPE = {
  task_assigned: 'taskAssigned',
  task_returned: 'taskAssigned',
  mentioned: 'mentioned',
  due_soon: 'dueSoon',
  overdue: 'overdue',
  added_to_project: 'addedToProject',
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const nameOf = (user) => user?.fullName || user?.email?.split('@')[0] || 'Ai đó';

/**
 * NTF-01/02: tạo thông báo trong ứng dụng và gửi email.
 * Lỗi gửi thông báo KHÔNG được làm hỏng thao tác chính → mọi lỗi chỉ ghi log.
 * Không gửi cho chính người thực hiện hành động.
 */
class NotificationService {
  constructor({ notificationRepository, userRepository, mailerClient, config }) {
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.mailer = mailerClient;
    this.config = config;
  }

  /**
   * @param {{ type: string, recipientIds: string[], actor?: object|null, task?: object|null,
   *           project?: object|null, data?: object }} event
   */
  async notify({ type, recipientIds, actor = null, task = null, project = null, data = {} }) {
    try {
      const ids = [...new Set(recipientIds.filter(Boolean))].filter((id) => id !== actor?.id);
      if (ids.length === 0) return;

      const users = (await this.userRepository.findAll({ id: ids })).filter((u) => u.status !== 'disabled');
      if (users.length === 0) return;

      const payload = {
        ...data,
        ...(task && { taskKey: task.key, taskTitle: task.title }),
        ...(project && { projectName: project.name }),
      };
      await this.notificationRepository.bulkCreate(
        users.map((u) => ({
          userId: u.id,
          type,
          actorId: actor?.id ?? null,
          projectId: project?.id ?? task?.projectId ?? null,
          taskId: task?.id ?? null,
          data: payload,
        })),
      );

      const settingKey = EMAIL_SETTING_BY_TYPE[type];
      if (!settingKey) return;
      for (const user of users) {
        if (user.emailSettings?.[settingKey] === false) continue;
        this.#sendEmail(user, { type, actor, task, project: project ?? task?.project, data: payload }).catch((err) =>
          logger.warn(`Không gửi được email ${type} tới ${user.email}:`, err.message),
        );
      }
    } catch (err) {
      logger.error(`Không tạo được thông báo ${type}:`, err);
    }
  }

  async list(user, { unreadOnly, page, pageSize }) {
    const { rows, count } = await this.notificationRepository.listForUser(user.id, {
      unreadOnly,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return { items: rows, meta: { page, pageSize, total: count } };
  }

  unreadCount(user) {
    return this.notificationRepository.countUnread(user.id);
  }

  markRead(user, ids) {
    return this.notificationRepository.markRead(user.id, ids);
  }

  /** Email mời dùng hệ thống (ADM-02). */
  sendInvite(email, inviter) {
    const url = `${this.config.APP_URL}/login`;
    return this.mailer
      .send({
        to: email,
        subject: 'Bạn được mời dùng Task Manager',
        text: `${nameOf(inviter)} đã mời bạn dùng hệ thống giao việc. Đăng nhập bằng tài khoản Google ${email} tại ${url}`,
        html: this.#layout(
          `<p><strong>${escapeHtml(nameOf(inviter))}</strong> đã mời bạn dùng hệ thống giao việc nội bộ.</p>
           <p>Đăng nhập bằng tài khoản Google <strong>${escapeHtml(email)}</strong>.</p>`,
          url,
          'Đăng nhập',
        ),
      })
      .catch((err) => logger.warn(`Không gửi được email mời tới ${email}:`, err.message));
  }

  #sendEmail(user, { type, actor, task, project, data }) {
    const taskRef = task ? `${task.key}: ${task.title}` : '';
    const url = task
      ? `${this.config.APP_URL}/projects/${task.projectId}?task=${encodeURIComponent(task.key)}`
      : `${this.config.APP_URL}/projects/${project?.id ?? ''}`;

    const messages = {
      task_assigned: [`${nameOf(actor)} đã giao việc cho bạn: ${taskRef}`, 'Xem công việc'],
      mentioned: [`${nameOf(actor)} đã nhắc đến bạn trong ${taskRef}`, 'Xem công việc'],
      due_soon: [`Công việc sắp đến hạn ngày mai: ${taskRef}`, 'Xem công việc'],
      overdue: [`Công việc đã quá hạn: ${taskRef}`, 'Xem công việc'],
      task_returned: [`${nameOf(actor)} đã trả lại ${taskRef} — lý do: ${data.reason ?? ''}`, 'Xem công việc'],
      added_to_project: [`${nameOf(actor)} đã thêm bạn vào dự án ${data.projectName ?? project?.name ?? ''}`, 'Mở dự án'],
    };
    const [subject, cta] = messages[type];
    return this.mailer.send({
      to: user.email,
      subject,
      text: `${subject}\n${url}`,
      html: this.#layout(`<p>${escapeHtml(subject)}</p>`, url, cta),
    });
  }

  #layout(body, url, cta) {
    return `<div style="font-family:'Be Vietnam Pro',Arial,sans-serif;font-size:14px;color:#111;max-width:520px">
      ${body}
      <p><a href="${escapeHtml(url)}" style="display:inline-block;background:#2563eb;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">${escapeHtml(cta)}</a></p>
      <p style="color:#666;font-size:12px">Bạn có thể tắt email thông báo trong phần Cài đặt cá nhân.</p>
    </div>`;
  }
}

module.exports = NotificationService;
