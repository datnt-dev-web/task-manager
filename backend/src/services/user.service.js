const AppError = require('../utils/AppError');

class UserService {
  constructor({ userRepository, tokenService, notificationService }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.notifications = notificationService;
  }

  /** Hồ sơ, giao diện, cài đặt email (gộp với cài đặt hiện có — chỉ gửi khóa cần đổi). */
  updateProfile(user, { emailSettings, ...data }) {
    return user.update({
      ...data,
      ...(emailSettings && { emailSettings: { ...user.emailSettings, ...emailSettings } }),
    });
  }

  /** Danh bạ nhân viên. Người dùng thường chỉ thấy tài khoản chưa bị khóa. */
  async list(currentUser, { q, status, page, pageSize }) {
    const effectiveStatus = currentUser.isAdmin ? status : undefined;
    const { rows, count } = await this.userRepository.search({
      q,
      status: effectiveStatus,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    const items = currentUser.isAdmin ? rows : rows.filter((u) => u.status !== 'disabled');
    return { items, meta: { page, pageSize, total: count } };
  }

  /** ADM-02: thêm nhân viên bằng email Google. Email đã tồn tại thì bỏ qua. */
  async invite(inviter, emails) {
    const normalized = [...new Set(emails.map((e) => e.trim().toLowerCase()))];
    const existing = await this.userRepository.findByEmails(normalized);
    const existingEmails = new Set(existing.map((u) => u.email));
    const toCreate = normalized.filter((e) => !existingEmails.has(e));
    const created = await this.userRepository.bulkCreate(toCreate.map((email) => ({ email, status: 'invited' })));
    created.forEach((u) => this.notifications.sendInvite(u.email, inviter));
    return { created, skipped: [...existingEmails] };
  }

  /** ADM-03/04: khóa/mở tài khoản, cấp/bỏ quyền Quản trị viên. */
  async updateByAdmin(actor, userId, { status, isAdmin }) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw AppError.notFound('Không tìm thấy người dùng');
    if (user.id === actor.id && (status === 'disabled' || isAdmin === false)) {
      throw AppError.badRequest('Bạn không thể tự khóa hoặc tự bỏ quyền quản trị của mình');
    }

    const changes = {};
    if (isAdmin !== undefined) changes.isAdmin = isAdmin;
    if (status === 'disabled') changes.status = 'disabled';
    if (status === 'active') changes.status = user.lastLoginAt ? 'active' : 'invited';
    await user.update(changes);

    if (status === 'disabled') await this.tokenService.revokeAllForUser(user.id);
    return user;
  }
}

module.exports = UserService;
