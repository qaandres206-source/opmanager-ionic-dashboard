import { environment } from '../../../environments/environment';

/**
 * Secure Logger Utility
 * 
 * This logger automatically disables console output in production
 * to prevent information leakage through browser console.
 */
export class Logger {
    private static isProduction = environment.production;

    /**
     * Log informational messages (disabled in production)
     */
    static log(...args: any[]): void {
        if (!this.isProduction) {
            console.log(...args);
        }
    }

    /**
     * Log debug messages (disabled in production)
     */
    static debug(...args: any[]): void {
        if (!this.isProduction) {
            console.debug(...args);
        }
    }

    /**
     * Log warning messages (disabled in production)
     */
    static warn(...args: any[]): void {
        if (!this.isProduction) {
            console.warn(...args);
        }
    }

    /**
     * Log error messages
     * Errors are logged even in production, but with sanitized data
     */
    static error(...args: any[]): void {
        if (this.isProduction) {
            // In production, only log error type without sensitive details
            console.error('An error occurred. Please contact support.');
        } else {
            console.error(...args);
        }
    }

    /**
     * Log API requests (disabled in production)
     */
    static apiRequest(method: string, url: string, params?: any, headers?: any): void {
        if (!this.isProduction) {
            console.debug('[API Request]', {
                method,
                url,
                params,
                headers: this.sanitizeHeaders(headers)
            });
        }
    }

    /**
     * Sanitize headers to remove sensitive information
     */
    private static sanitizeHeaders(headers: any): any {
        if (!headers) return {};

        const sanitized = { ...headers };

        // Remove sensitive headers
        const sensitiveKeys = ['apikey', 'apiKey', 'authorization', 'token', 'api-key'];

        sensitiveKeys.forEach(key => {
            if (sanitized[key]) {
                sanitized[key] = '***REDACTED***';
            }
        });

        return sanitized;
    }

    /**
     * Completely disable all console methods in production
     */
    static disableConsoleInProduction(): void {
        if (this.isProduction) {
            console.log = () => { };
            console.debug = () => { };
            console.info = () => { };
            console.warn = () => { };
            // Keep console.error for critical issues
        }
    }
}
