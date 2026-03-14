import { getRequestId } from './requestContext.js';

type LogLevel = 'info' | 'warn' | 'error';

function emit(level: LogLevel, message: string, data: Record<string, unknown> = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    request_id: getRequestId(),
    ...data
  };
  const serialized = JSON.stringify(payload);
  if (level === 'error') {
    console.error(serialized);
    return;
  }
  console.log(serialized);
}

export const logger = {
  info(message: string, data?: Record<string, unknown>) {
    emit('info', message, data);
  },
  warn(message: string, data?: Record<string, unknown>) {
    emit('warn', message, data);
  },
  error(message: string, data?: Record<string, unknown>) {
    emit('error', message, data);
  }
};
