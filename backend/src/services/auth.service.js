const crypto = require('node:crypto');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { hashPassword, verifyPassword, DUMMY_HASH } = require('../utils/password');

const NOT_ALLOWED = 'Tài khoản của bạn chưa được cấp quyền truy cập, vui lòng liên hệ quản trị viên';

const RESET_TTL_MINUTES = 30;
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

class AuthService {
  constructor({
    unitOfWork,
    userRepository,
    refreshTokenRepository,
    passwordResetTokenRepository,
    tokenService,
    googleIdentityClient,
    mailerClient,
    config,
  }) {
    this.unitOfWork = unitOfWork;
    this.refreshTokens = refreshTokenRepository;
    this.resetTokens = passwordResetTokenRepository;
    this.mailer = mailerClient;
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.googleIdentityClient = googleIdentityClient;
    this.config = config;
  }

  /**
   * Đăng nhập nhanh bằng Google: email đã có thì đăng nhập (và liên kết Google), chưa có thì tự tạo
   * tài khoản nhân viên thường. Google đã xác minh email nên không cần bước xác minh riêng.
   */
  async loginWithGoogle(credential) {
    const profile = await this.googleIdentityClient.verify(credential);

    const user =
      (await this.userRepository.findByGoogleId(profile.googleId)) ||
      (await this.userRepository.findByEmail(profile.email)) ||
      (await this.userRepository.create({
        email: profile.email,
        googleId: profile.googleId,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        status: 'active',
      }));

    return this.#signIn(user, profile);
  }

  /** Đăng ký bằng email + mật khẩu. Tài khoản mới là nhân viên thường, chưa thuộc dự án nào. */
  async register({ fullName, email, password }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      // Không cho "nhận" tài khoản đã có (kể cả tài khoản được mời) khi chưa xác minh email.
      throw AppError.conflict('Email này đã có tài khoản. Hãy đăng nhập hoặc dùng nút Google.');
    }
    const user = await this.userRepository.create({
      email,
      fullName,
      passwordHash: await hashPassword(password),
      status: 'active',
    });
    return this.#signIn(user, {});
  }

  async loginWithPassword({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.passwordHash || !ok) throw AppError.unauthorized('Email hoặc mật khẩu không đúng');
    return this.#signIn(user, {});
  }

  /**
   * Quên mật khẩu: luôn trả về thành công (không cho biết email có tồn tại hay không).
   * Token ngẫu nhiên gửi qua email, DB chỉ lưu SHA-256, dùng 1 lần, hết hạn sau 30 phút.
   */
  async requestPasswordReset(email) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.status === 'disabled') return;

    const token = crypto.randomBytes(32).toString('base64url');
    await this.unitOfWork.run(async (transaction) => {
      await this.resetTokens.invalidateForUser(user.id, { transaction });
      await this.resetTokens.create(
        { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000) },
        { transaction },
      );
    });

    const url = `${this.config.APP_URL}/reset-password?token=${token}`;
    await this.mailer
      .send({
        to: user.email,
        subject: 'Đặt lại mật khẩu Task Manager',
        text: `Bấm vào liên kết sau để đặt lại mật khẩu (hết hạn sau ${RESET_TTL_MINUTES} phút): ${url}\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
        html: `<p>Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>${escapeHtml(user.email)}</strong>.</p>
               <p><a href="${url}">Đặt lại mật khẩu</a> — liên kết hết hạn sau ${RESET_TTL_MINUTES} phút.</p>
               <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
      })
      .catch((err) => logger.warn(`Không gửi được email đặt lại mật khẩu tới ${user.email}:`, err.message));
    // Máy dev chưa cấu hình SMTP: in liên kết ra log để thử được luồng.
    if (!this.config.SMTP_HOST && !this.config.isProduction) logger.info(`[mail:dev] Link đặt lại mật khẩu: ${url}`);
  }

  /** Đặt lại mật khẩu bằng token trong email → đăng xuất mọi phiên cũ rồi đăng nhập luôn. */
  async resetPassword(token, password) {
    const invalid = 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn';
    const record = await this.resetTokens.findByHash(sha256(token));
    if (!record || record.usedAt || record.expiresAt < new Date()) throw AppError.badRequest(invalid);
    const user = await this.userRepository.findById(record.userId);
    if (!user) throw AppError.badRequest(invalid);

    const passwordHash = await hashPassword(password);
    await this.unitOfWork.run(async (transaction) => {
      await user.update({ passwordHash }, { transaction });
      await this.resetTokens.invalidateForUser(user.id, { transaction });
      await this.refreshTokens.revokeAllForUser(user.id, { transaction });
    });
    return this.#signIn(user, {});
  }

  /**
   * Đặt / đổi mật khẩu khi đã đăng nhập. Tài khoản đã có mật khẩu phải nhập mật khẩu hiện tại;
   * tài khoản chỉ dùng Google thì đặt mới luôn. Các thiết bị khác bị đăng xuất.
   */
  async changePassword(user, { currentPassword, newPassword }) {
    if (user.passwordHash && !(await verifyPassword(currentPassword ?? '', user.passwordHash))) {
      throw AppError.badRequest('Mật khẩu hiện tại không đúng');
    }
    const passwordHash = await hashPassword(newPassword);
    await this.unitOfWork.run(async (transaction) => {
      await user.update({ passwordHash }, { transaction });
      await this.resetTokens.invalidateForUser(user.id, { transaction });
      await this.refreshTokens.revokeAllForUser(user.id, { transaction });
    });
    const tokens = await this.tokenService.issuePair(user);
    return { user, ...tokens };
  }

  /**
   * Gọi lúc khởi động: nếu có INITIAL_ADMIN_EMAIL + INITIAL_ADMIN_PASSWORD thì đảm bảo tài khoản đó
   * là Quản trị viên, đang hoạt động và đăng nhập được bằng đúng mật khẩu trong biến môi trường.
   */
  async ensureBootstrapAdmin() {
    const { INITIAL_ADMIN_EMAIL: email, INITIAL_ADMIN_PASSWORD: password } = this.config;
    if (!email || !password) return;

    const user = await this.userRepository.findByEmail(email);
    const passwordOk = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
    const changes = {
      ...(!passwordOk && { passwordHash: await hashPassword(password) }),
      ...(!user?.isAdmin && { isAdmin: true }),
      ...(user?.status !== 'active' && { status: 'active' }),
    };
    if (!user) {
      await this.userRepository.create({ email, fullName: 'Admin', ...changes });
      logger.info(`Đã tạo tài khoản Quản trị viên ${email}`);
    } else if (Object.keys(changes).length > 0) {
      await user.update(changes);
      logger.info(`Đã cập nhật tài khoản Quản trị viên ${email}`);
    }
    if (this.config.isProduction && password.length < 12) {
      logger.warn('INITIAL_ADMIN_PASSWORD đang ngắn/yếu trên production — ai đoán được sẽ có toàn quyền quản trị.');
    }
  }

  /** Chỉ dùng khi phát triển (ALLOW_DEV_LOGIN=true, không bao giờ ở production). */
  async devLogin(email) {
    if (!this.config.ALLOW_DEV_LOGIN || this.config.isProduction) throw AppError.notFound();
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw AppError.forbidden(NOT_ALLOWED);
    return this.#signIn(user, {});
  }

  async #signIn(user, profile) {
    if (user.status === 'disabled') throw AppError.forbidden('Tài khoản của bạn đã bị vô hiệu hóa');

    const changes = { lastLoginAt: new Date() };
    if (user.status === 'invited') changes.status = 'active';
    if (profile.googleId && !user.googleId) changes.googleId = profile.googleId;
    if (profile.fullName && !user.fullName) changes.fullName = profile.fullName;
    if (profile.avatarUrl && !user.avatarUrl) changes.avatarUrl = profile.avatarUrl;
    await user.update(changes);

    const tokens = await this.tokenService.issuePair(user);
    return { user, ...tokens };
  }

  async refresh(rawRefreshToken) {
    const { userId } = await this.tokenService.rotate(rawRefreshToken);
    const user = await this.userRepository.findById(userId);
    if (!user || user.status !== 'active') throw AppError.unauthorized('Tài khoản không còn quyền truy cập');
    const tokens = await this.tokenService.issuePair(user);
    return { user, ...tokens };
  }

  logout(rawRefreshToken) {
    return this.tokenService.revoke(rawRefreshToken);
  }
}

module.exports = AuthService;
