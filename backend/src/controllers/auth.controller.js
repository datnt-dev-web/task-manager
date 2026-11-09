const { REFRESH_COOKIE, setAuthCookies, clearAuthCookies } = require('../utils/cookies');

/** Người dùng của phiên hiện tại, kèm hasPassword để giao diện hiện "Đặt" hay "Đổi" mật khẩu. */
const sessionUser = (user) => ({ ...user.toJSON(), hasPassword: !!user.passwordHash });

/** Controller chỉ làm việc với HTTP (đọc request, ghi response/cookie); nghiệp vụ nằm ở service. */
class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  googleLogin = async (req, res) => {
    const { user, ...tokens } = await this.authService.loginWithGoogle(req.valid.body.credential);
    setAuthCookies(res, tokens);
    res.json({ data: sessionUser(user) });
  };

  register = async (req, res) => {
    const { user, ...tokens } = await this.authService.register(req.valid.body);
    setAuthCookies(res, tokens);
    res.status(201).json({ data: sessionUser(user) });
  };

  passwordLogin = async (req, res) => {
    const { user, ...tokens } = await this.authService.loginWithPassword(req.valid.body);
    setAuthCookies(res, tokens);
    res.json({ data: sessionUser(user) });
  };

  forgotPassword = async (req, res) => {
    await this.authService.requestPasswordReset(req.valid.body.email);
    res.status(204).end();
  };

  resetPassword = async (req, res) => {
    const { user, ...tokens } = await this.authService.resetPassword(req.valid.body.token, req.valid.body.password);
    setAuthCookies(res, tokens);
    res.json({ data: sessionUser(user) });
  };

  changePassword = async (req, res) => {
    const { user, ...tokens } = await this.authService.changePassword(req.user, req.valid.body);
    setAuthCookies(res, tokens);
    res.json({ data: sessionUser(user) });
  };

  devLogin = async (req, res) => {
    const { user, ...tokens } = await this.authService.devLogin(req.valid.body.email);
    setAuthCookies(res, tokens);
    res.json({ data: sessionUser(user) });
  };

  refresh = async (req, res) => {
    try {
      const { user, ...tokens } = await this.authService.refresh(req.cookies?.[REFRESH_COOKIE]);
      setAuthCookies(res, tokens);
      res.json({ data: sessionUser(user) });
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  };

  logout = async (req, res) => {
    await this.authService.logout(req.cookies?.[REFRESH_COOKIE]);
    clearAuthCookies(res);
    res.status(204).end();
  };

  me = async (req, res) => {
    res.json({ data: sessionUser(req.user) });
  };
}

module.exports = AuthController;
