const env = require('../config/env');

const ACCESS_COOKIE = 'tm_access';
const REFRESH_COOKIE = 'tm_refresh';
const REFRESH_PATH = '/api/v1/auth';

const base = () => ({ httpOnly: true, secure: env.cookieSecure, sameSite: 'lax' });

function setAuthCookies(res, { accessToken, refreshToken }) {
  // Access token là cookie phiên; hết hạn thì client gọi /auth/refresh.
  res.cookie(ACCESS_COOKIE, accessToken, { ...base(), path: '/' });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base(),
    path: REFRESH_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...base(), path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...base(), path: REFRESH_PATH });
}

module.exports = { ACCESS_COOKIE, REFRESH_COOKIE, setAuthCookies, clearAuthCookies };
