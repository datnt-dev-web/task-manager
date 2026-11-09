const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

/**
 * Lưu tệp trên ổ đĩa máy chủ (MVP). Có thể thay bằng MinIO/S3 với cùng 3 phương thức
 * save / createReadStream / remove mà không phải sửa service.
 */
class LocalStorageClient {
  constructor(rootDir) {
    this.rootDir = path.resolve(rootDir);
  }

  async save(buffer, extension) {
    const now = new Date();
    const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const key = `${folder}/${crypto.randomUUID()}${extension}`;
    const fullPath = this.#resolve(key);
    await fsp.mkdir(path.dirname(fullPath), { recursive: true });
    await fsp.writeFile(fullPath, buffer, { flag: 'wx' });
    return key;
  }

  createReadStream(key) {
    return fs.createReadStream(this.#resolve(key));
  }

  async remove(key) {
    await fsp.rm(this.#resolve(key), { force: true });
  }

  /** Chặn path traversal: key luôn phải nằm trong thư mục gốc. */
  #resolve(key) {
    const fullPath = path.resolve(this.rootDir, key);
    if (!fullPath.startsWith(this.rootDir + path.sep)) throw new Error('Khóa lưu trữ không hợp lệ');
    return fullPath;
  }
}

module.exports = LocalStorageClient;
