const AppError = require('../utils/AppError');
const { toPlainText, sanitizeDoc } = require('../utils/richText');

const excerpt = (text) => (text && text.length > 140 ? `${text.slice(0, 140)}…` : text);

class CommentService {
  constructor({ commentRepository, taskRepository, taskService, taskWatcherRepository, notificationService, projectAccessService }) {
    this.commentRepository = commentRepository;
    this.taskRepository = taskRepository;
    this.taskService = taskService;
    this.watchers = taskWatcherRepository;
    this.notifications = notificationService;
    this.access = projectAccessService;
  }

  async list(user, taskKey, { order }) {
    const { task } = await this.taskService.loadForAccess(user, taskKey, 'viewer');
    return this.commentRepository.listByTask(task.id, { order });
  }

  /** CMT-01: Quản lý dự án bình luận mọi việc; Thành viên chỉ bình luận việc được giao cho mình. */
  async create(user, taskKey, rawBody) {
    const { task } = await this.taskService.loadForParticipation(user, taskKey);
    const body = sanitizeDoc(rawBody);
    const bodyText = toPlainText(body);
    const comment = await this.commentRepository.create({ taskId: task.id, authorId: user.id, body, bodyText });

    await this.watchers.addMany(task.id, [user.id]);
    const data = { context: 'comment', excerpt: excerpt(bodyText) };
    const mentioned = await this.taskService.notifyNewMentions(user, task, body, null, data);
    // Người đã nhận thông báo @nhắc thì không nhận thêm "bình luận mới".
    const watcherIds = (await this.watchers.listUserIds(task.id)).filter((id) => !mentioned.includes(id));
    await this.notifications.notify({ type: 'comment_added', recipientIds: watcherIds, actor: user, task, data });

    return this.commentRepository.findWithAuthor(comment.id);
  }

  /** CMT-02: chỉ tác giả được sửa; người mới được @nhắc khi sửa cũng nhận thông báo. */
  async update(user, commentId, rawBody) {
    const { comment, task } = await this.#load(user, commentId, 'member');
    if (comment.authorId !== user.id) throw AppError.forbidden('Bạn chỉ có thể sửa bình luận của mình');
    const body = sanitizeDoc(rawBody);
    const previous = comment.body;
    await comment.update({ body, bodyText: toPlainText(body), editedAt: new Date() });
    await this.taskService.notifyNewMentions(user, task, body, previous, { context: 'comment', excerpt: excerpt(comment.bodyText) });
    return this.commentRepository.findWithAuthor(comment.id);
  }

  /** CMT-02: tác giả hoặc Quản lý dự án được xóa. */
  async remove(user, commentId) {
    const { comment, role } = await this.#load(user, commentId, 'member');
    if (comment.authorId !== user.id && role !== 'manager') {
      throw AppError.forbidden('Bạn chỉ có thể xóa bình luận của mình');
    }
    await comment.destroy();
  }

  async #load(user, commentId, minRole) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw AppError.notFound('Không tìm thấy bình luận');
    const task = await this.taskRepository.findById(comment.taskId);
    if (!task) throw AppError.notFound('Không tìm thấy công việc');
    const { role } = await this.access.assert(user, task.projectId, minRole);
    return { comment, role, task };
  }
}

module.exports = CommentService;
