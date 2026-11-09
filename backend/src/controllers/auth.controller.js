const { REFRESH_COOKIE, setAuthCookies, clearAuthCookies } = require('../utils/cookies');

/** Controller chỉ làm việc với HTTP (đọc request, ghi response/cookie); nghiệp vụ nằm ở service. */
class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  googleLogin = async (req, res) => {
    const { user, ...tokens } = await this.authService.loginWithGoogle(req.valid.body.credential);
    setAuthCookies(res, tokens);
    res.json({ data: user });
  };

  devLogin = async (req, res) => {
    const { user, ...tokens } = await this.authService.devLogin(req.valid.body.email);
    setAuthCookies(res, tokens);
    res.json({ data: user });
  };

  refresh = async (req, res) => {
    try {
      const { user, ...tokens } = await this.authService.refresh(req.cookies?.[REFRESH_COOKIE]);
      setAuthCookies(res, tokens);
      res.json({ data: user });
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
    res.json({ data: req.user });
  };
}

module.exports = AuthController;
