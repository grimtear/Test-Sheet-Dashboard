import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Security middleware configuration
 */

// Helmet configuration for security headers
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval needed for dev
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"], // Added WebSocket support for HMR
            fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Disabled for local development
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false, // Disable to prevent localhost errors
});

// Rate limiting for API endpoints
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Please try again later',
            retryAfter: 900, // 15 minutes in seconds
        });
    },
});

// Stricter rate limiting for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    skipSuccessfulRequests: true, // Don't count successful requests
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for test sheet creation
export const createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 creates per hour
    message: 'Too many test sheets created, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Simple CSRF protection using double-submit cookie pattern
 * Since csurf is deprecated, we implement a simple version
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip CSRF in development for easier testing
    if (process.env.NODE_ENV === 'development') {
        return next();
    }

    const token = req.headers['x-csrf-token'];
    const cookieToken = req.cookies?.['csrf-token'];

    if (!token || !cookieToken || token !== cookieToken) {
        return res.status(403).json({
            error: 'Invalid CSRF token',
            message: 'Request rejected for security reasons',
        });
    }

    next();
}

/**
 * Generate and set CSRF token
 */
export function generateCsrfToken(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies?.['csrf-token']) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        res.cookie('csrf-token', token, {
            httpOnly: false, // Needs to be readable by client
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
    }
    next();
}

/**
 * Request validation middleware
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
    // Check for suspiciously large payloads
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 150 * 1024 * 1024) { // 150MB max
        return res.status(413).json({
            error: 'Payload too large',
            message: 'Request body exceeds maximum allowed size',
        });
    }

    // Validate content type for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];
        if (!contentType ||
            (!contentType.includes('application/json') &&
                !contentType.includes('application/x-www-form-urlencoded') &&
                !contentType.includes('multipart/form-data'))) {
            return res.status(415).json({
                error: 'Unsupported Media Type',
                message: 'Content-Type must be application/json, application/x-www-form-urlencoded, or multipart/form-data',
            });
        }
    }

    next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
    // Remove server information
    res.removeHeader('X-Powered-By');

    // Add additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Don't set Cross-Origin headers in development to avoid localhost errors
    if (process.env.NODE_ENV !== 'development') {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    }

    next();
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
    // Basic sanitization for common attack vectors
    const sanitize = (obj: any): any => {
        if (typeof obj === 'string') {
            // Remove null bytes
            return obj.replace(/\0/g, '');
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                obj[key] = sanitize(obj[key]);
            }
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }
    if (req.query) {
        req.query = sanitize(req.query);
    }
    if (req.params) {
        req.params = sanitize(req.params);
    }

    next();
}
