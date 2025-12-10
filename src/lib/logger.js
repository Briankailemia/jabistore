/**
 * Centralized logging utility
 * Replaces console.log/error/warn with proper logging
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level] >= levels[this.logLevel]
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (data) {
      return { timestamp, level, message, data }
    }
    return { timestamp, level, message }
  }

  debug(message, data = null) {
    if (!this.shouldLog('debug')) return
    
    if (isDevelopment) {
      console.debug(this.formatMessage('debug', message, data))
    }
  }

  info(message, data = null) {
    if (!this.shouldLog('info')) return
    
    if (isDevelopment) {
      console.info(this.formatMessage('info', message, data))
    } else {
      // In production, send to logging service (e.g., Sentry, LogRocket)
      // For now, we'll use console but structured
      console.info(JSON.stringify(this.formatMessage('info', message, data)))
    }
  }

  warn(message, data = null) {
    if (!this.shouldLog('warn')) return
    
    const formatted = this.formatMessage('warn', message, data)
    
    if (isDevelopment) {
      console.warn(formatted)
    } else {
      console.warn(JSON.stringify(formatted))
      // TODO: Send to error tracking service
    }
  }

  error(message, error = null, data = null) {
    if (!this.shouldLog('error')) return
    
    const formatted = {
      ...this.formatMessage('error', message, data),
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : null,
    }
    
    if (isDevelopment) {
      console.error(formatted)
    } else {
      console.error(JSON.stringify(formatted))
      // TODO: Send to error tracking service (Sentry, etc.)
    }
  }

  // API-specific logging
  apiRequest(method, path, status, duration, userId = null) {
    this.info('API Request', {
      method,
      path,
      status,
      duration: `${duration}ms`,
      userId,
    })
  }

  apiError(method, path, error, userId = null) {
    this.error('API Error', error, {
      method,
      path,
      userId,
    })
  }

  // Database-specific logging
  dbQuery(query, duration, params = null) {
    if (isDevelopment && this.shouldLog('debug')) {
      this.debug('Database Query', {
        query: query.substring(0, 100), // Truncate long queries
        duration: `${duration}ms`,
        params,
      })
    }
  }

  dbError(query, error) {
    this.error('Database Error', error, {
      query: query.substring(0, 100),
    })
  }
}

// Create singleton instance
const logger = new Logger()

export default logger

// Export convenience methods
export const { debug, info, warn, error, apiRequest, apiError, dbQuery, dbError } = logger

