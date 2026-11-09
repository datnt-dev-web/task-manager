const AppError = require('../utils/AppError');

const NOT_ALLOWED = 'Tài khoản của bạn chưa được cấp quyền truy cập, vui lòng liên hệ quản trị viên';

class AuthService {
  constructor({ userRepository, tokenService, googleIdentityClient, config }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.googleIdentityClient = googleIdentityClient;
    this.config = config;
  }

  /** AUTH-01..03: chỉ email đã được Quản trị viên thêm vào mới đăng nhập được. */
  async loginWithGoogle(credential) {
    const profile = await this.googleIdentityClient.verify(credential);

    const user =
      (await this.userRepository.findByGoogleId(profile.googleId)) ||
      (await this.userRepository.findByEmail(profile.email));
    if (!user) throw AppError.forbidden(NOT_ALLOWED);

    return this.#signIn(user, profile);
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
