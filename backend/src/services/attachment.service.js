const AppError = require('../utils/AppError');
const { detectAllowedType, isInlineViewable, FILE_KINDS } = require('../utils/fileType');

/** ATT-01..03: tải lên, xem trước, tải xuống, xóa tệp đính kèm. */
class AttachmentService {
  constructor({
    attachmentRepository,
    taskRepository,
    taskService,
    storageClient,
    activityService,
    projectAccessService,
    projectMemberRepository,
  }) {
    this.projectMemberRepository = projectMemberRepository;
    this.activity = activityService;
    this.attachmentRepository = attachmentRepository;
    this.taskRepository = taskRepository;
    this.taskService = taskService;
    this.storage = storageClient;
    this.access = projectAccessService;
  }

  /**
   * Kho tệp tập trung: mọi tệp trong các dự án người dùng được xem (Người xem cũng xem được).
   * Lọc theo dự án, tên tệp, loại tệp, "tệp tôi tải lên".
   */
  async search(user, { projectId, q, kind, mine, sort, page, pageSize }) {
    let projectIds;
    if (projectId) {
      await this.access.assert(user, projectId, 'viewer');
      projectIds = [projectId];
    } else if (!user.isAdmin) {
      projectIds = await this.projectMemberRepository.listProjectIds(user.id);
      if (projectIds.length === 0) return { items: [], meta: { page, pageSize, total: 0 } };
    } else {
      projectIds = null;
    }

    const { rows, count } = await this.attachmentRepository.search({
      projectIds,
      q: q?.trim() || undefined,
      mimeTypes: kind ? FILE_KINDS[kind] : undefined,
      uploaderId: mine ? user.id : undefined,
      sort,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return { items: rows, meta: { page, pageSize, total: count } };
  }

  async list(user, taskKey) {
    const { task } = await this.taskService.loadForAccess(user, taskKey, 'viewer');
    return this.attachmentRepository.listByTask(task.id);
  }

  /** Kiểm tra TẤT CẢ tệp trước khi lưu tệp nào — một tệp sai thì từ chối cả lượt. */
  async upload(user, taskKey, files) {
    if (!files?.length) throw AppError.badRequest('Chưa chọn tệp nào');
    const { task } = await this.taskService.loadForAccess(user, taskKey, 'member');

    const checked = files.map((file) => {
      const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8'); // multer đọc tên theo latin1
      const type = detectAllowedType(fileName, file.buffer);
      if (!type) throw AppError.badRequest(`Tệp "${fileName}" không thuộc định dạng được phép hoặc bị hỏng`);
      return { file, fileName, type };
    });

    const saved = [];
    try {
      for (const { file, fileName, type } of checked) {
        const storageKey = await this.storage.save(file.buffer, type.extension);
        saved.push(storageKey);
        await this.attachmentRepository.create({
          taskId: task.id,
          uploadedById: user.id,
          fileName: fileName.slice(0, 255),
          mimeType: type.mime,
          size: file.size,
          storageKey,
        });
      }
    } catch (err) {
      await Promise.all(saved.map((key) => this.storage.remove(key).catch(() => undefined)));
      throw err;
    }
    await this.activity.record(user, task, checked.map(({ fileName }) => ({ action: 'attachment_added', to: fileName })));
    const rows = await this.attachmentRepository.findAll({ storageKey: saved }, { attributes: ['id'] });
    return this.attachmentRepository.findManyWithUploader(rows.map((r) => r.id));
  }

  /** Trả thông tin để controller stream tệp. Người xem cũng được tải xuống (BR-02a). */
  async openForDownload(user, attachmentId, { inline }) {
    const { attachment } = await this.#load(user, attachmentId, 'viewer');
    return {
      stream: this.storage.createReadStream(attachment.storageKey),
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      inline: inline && isInlineViewable(attachment.mimeType),
    };
  }

  async remove(user, attachmentId) {
    const { attachment, role, task } = await this.#load(user, attachmentId, 'member');
    if (attachment.uploadedById !== user.id && role !== 'manager') {
      throw AppError.forbidden('Chỉ người tải lên hoặc Quản lý dự án được xóa tệp');
    }
    await attachment.destroy();
    await this.storage.remove(attachment.storageKey);
    await this.activity.record(user, task, [{ action: 'attachment_removed', from: attachment.fileName }]);
  }

  async #load(user, attachmentId, minRole) {
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment) throw AppError.notFound('Không tìm thấy tệp');
    const task = await this.taskRepository.findById(attachment.taskId);
    if (!task) throw AppError.notFound('Không tìm thấy tệp');
    const { role } = await this.access.assert(user, task.projectId, minRole);
    return { attachment, role, task };
  }
}

module.exports = AttachmentService;
