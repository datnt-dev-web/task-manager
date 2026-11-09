// Logger tối giản; có thể thay bằng pino/winston mà không đổi nơi gọi.
const write = (level, args) => {
  const time = new Date().toISOString();
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`[${time}] ${level.toUpperCase()}`, ...args);
};

module.exports = {
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
};
