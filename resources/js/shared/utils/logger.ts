/**
 * Application Logger Utility
 * Centralized logging system with environment-aware output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private createLogEntry(level: LogLevel, message: string, data?: unknown, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    // In development, log everything
    return true;
  }

  private formatMessage(entry: LogEntry): string {
    const prefix = entry.context ? `[${entry.context}]` : '';
    return `${prefix} ${entry.message}`;
  }

  debug(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, data, context);
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage(entry), data || '');
    }
  }

  info(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, data, context);
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(this.formatMessage(entry), data || '');
    }
  }

  warn(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, data, context);
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage(entry), data || '');
    
    // In production, you might want to send warnings to a logging service
    if (this.isProduction) {
      this.sendToLoggingService(entry);
    }
  }

  error(message: string, error?: Error | unknown, context?: string): void {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', message, error, context);
    // eslint-disable-next-line no-console
    console.error(this.formatMessage(entry), error || '');
    
    // In production, always send errors to logging service
    if (this.isProduction) {
      this.sendToLoggingService(entry);
    }
  }

  private sendToLoggingService(entry: LogEntry): void {
    // Placeholder for external logging service integration
    // Could integrate with services like Sentry, LogRocket, etc.
    try {
      // Example: Send to external service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (error) {
      // Fallback to console if logging service fails
      // eslint-disable-next-line no-console
      console.error('Failed to send log to service:', error);
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, data?: unknown, context?: string) => logger.debug(message, data, context),
  info: (message: string, data?: unknown, context?: string) => logger.info(message, data, context),
  warn: (message: string, data?: unknown, context?: string) => logger.warn(message, data, context),
  error: (message: string, error?: Error | unknown, context?: string) => logger.error(message, error, context),
};

export default logger;
