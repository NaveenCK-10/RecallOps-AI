const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

const log = (level, message, data = {}) => {
  if (LOG_LEVELS[level] >= currentLevel) {
    const timestamp = new Date().toISOString();
    const prefix = { debug: '🐛', info: 'ℹ️', warn: '⚠️', error: '❌' }[level];
    console.log(`${prefix} [${timestamp}] ${message}`, Object.keys(data).length ? data : '');
  }
};

export const logger = {
  debug: (msg, data) => log('debug', msg, data),
  info: (msg, data) => log('info', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  error: (msg, data) => log('error', msg, data),
};
