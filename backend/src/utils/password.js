const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };

/** Băm mật khẩu bằng scrypt (có sẵn trong Node, không cần thư viện ngoài). Định dạng: scrypt$salt$hash */
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH, PARAMS);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

async function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored ?? '').split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, PARAMS);
  return crypto.timingSafeEqual(actual, expected);
}

// Dùng khi không tìm thấy tài khoản để thời gian phản hồi không lộ email có tồn tại hay không.
const DUMMY_HASH = 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(KEY_LENGTH).toString('base64');

module.exports = { hashPassword, verifyPassword, DUMMY_HASH };
