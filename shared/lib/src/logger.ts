export interface LogContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  [key: string]: any;
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private format(level: string, message: string, data?: any) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(data && { data })
    });
  }

  info(message: string, data?: any) {
    console.log(this.format('INFO', message, data));
  }

  error(message: string, error?: Error | any) {
    console.error(this.format('ERROR', message, {
      error: error?.message || error,
      stack: error?.stack
    }));
  }

  warn(message: string, data?: any) {
    console.warn(this.format('WARN', message, data));
  }

  debug(message: string, data?: any) {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      console.debug(this.format('DEBUG', message, data));
    }
  }
}