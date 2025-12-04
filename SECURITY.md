# Security Implementation Guide

## Overview

This document outlines the security measures implemented in the TestSheet application.

## Security Features Implemented

### 1. HTTP Security Headers (Helmet)

**Location**: `server/middleware/security.ts`

Helmet sets various HTTP headers to protect against common vulnerabilities:

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking (DENY)
- **X-Content-Type-Options**: Prevents MIME-sniffing (nosniff)
- **X-XSS-Protection**: Enables browser XSS filter
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

```typescript
import { helmetConfig } from './middleware/security';
app.use(helmetConfig);
```

### 2. Rate Limiting

Three types of rate limiters protect against abuse:

#### API Rate Limiter

- **Limit**: 100 requests per 15 minutes per IP
- **Applied to**: All `/api/*` routes
- **Purpose**: Prevent API abuse

#### Auth Rate Limiter

- **Limit**: 5 attempts per 15 minutes per IP
- **Applied to**: Login/authentication endpoints
- **Purpose**: Prevent brute force attacks
- **Feature**: Only counts failed attempts

#### Create Rate Limiter

- **Limit**: 50 creates per hour per IP
- **Applied to**: Test sheet creation endpoint
- **Purpose**: Prevent spam and abuse

**Usage**:

```typescript
import { apiLimiter, authLimiter, createLimiter } from './middleware/security';

app.use('/api', apiLimiter);
app.post('/api/auth/login', authLimiter, loginHandler);
app.post('/api/test-sheets', createLimiter, createHandler);
```

### 3. CSRF Protection

**Location**: `server/middleware/security.ts`

Implements double-submit cookie pattern:

- Token generated and stored in cookie
- Client must send token in `X-CSRF-Token` header
- Automatically bypassed in development mode
- Skipped for safe methods (GET, HEAD, OPTIONS)

**Client Implementation**:

```typescript
// Get CSRF token from cookie
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf-token='))
  ?.split('=')[1];

// Include in requests
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

### 4. Data Encryption

**Location**: `server/lib/encryption.ts`

Provides utilities for encrypting sensitive data:

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Management**: Environment variable or random generation
- **Features**:
  - Authenticated encryption
  - IV (Initialization Vector) randomization
  - Auth tag verification

**Usage**:

```typescript
import { encrypt, decrypt } from './lib/encryption';

// Encrypt sensitive data
const encrypted = encrypt('sensitive-data');
// Store: encrypted.encrypted, encrypted.iv, encrypted.authTag

// Decrypt when needed
const decrypted = decrypt(encrypted);
```

**Setup**:

```bash
# Generate encryption key
node -p "require('crypto').randomBytes(32).toString('hex')"

# Add to .env
ENCRYPTION_KEY=your_generated_key_here
```

### 5. Input Sanitization

**Location**: `server/middleware/security.ts`

Automatically sanitizes all incoming requests:

- Removes null bytes
- Applied to body, query, and params
- Runs before route handlers

### 6. Request Validation

**Location**: `server/middleware/security.ts`

Validates incoming requests:

- Checks payload size (max 150MB)
- Validates Content-Type headers
- Rejects malformed requests

### 7. Secure Comparison

**Location**: `server/lib/encryption.ts`

Timing-safe string comparison to prevent timing attacks:

```typescript
import { secureCompare } from './lib/encryption';

if (secureCompare(providedToken, storedToken)) {
  // Tokens match
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Critical for production
ENCRYPTION_KEY=<32-byte-hex-string>
SESSION_SECRET=<random-string>
NODE_ENV=production
```

### Generate Secrets

```bash
# Encryption key (256-bit)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Security Best Practices

### 1. Password Handling

**Never implemented yet** - For future:

```typescript
import bcrypt from 'bcrypt';

// Hash password
const hash = await bcrypt.hash(password, 12);

// Verify password
const match = await bcrypt.compare(password, hash);
```

### 2. Session Management

- Use secure session cookies
- Set appropriate expiration
- Regenerate session on login
- Clear session on logout

### 3. HTTPS in Production

```typescript
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH!),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH!),
};

https.createServer(options, app).listen(443);
```

### 4. Database Security

- Use parameterized queries (Drizzle ORM handles this)
- Encrypt sensitive fields
- Regular backups
- Access control

## Vulnerabilities Addressed

| Vulnerability | Mitigation |
|---------------|------------|
| XSS | CSP headers, input sanitization |
| CSRF | Double-submit cookie pattern |
| SQL Injection | ORM with parameterized queries |
| Brute Force | Rate limiting on auth endpoints |
| Clickjacking | X-Frame-Options: DENY |
| MIME Sniffing | X-Content-Type-Options: nosniff |
| DoS | Rate limiting, payload size limits |
| Timing Attacks | Secure comparison functions |
| Data Exposure | Encryption for sensitive data |

## Security Checklist

### Development

- [ ] Use `.env` for sensitive configuration
- [ ] Never commit secrets to git
- [ ] Use HTTPS in development with self-signed certs
- [ ] Test rate limiting behavior
- [ ] Validate all user inputs

### Production

- [ ] Generate strong encryption keys
- [ ] Enable HTTPS with valid certificates
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CSP headers
- [ ] Enable security monitoring
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Implement backup strategy
- [ ] Configure firewall rules
- [ ] Enable access logging

## Monitoring and Logging

### What to Log

- Failed authentication attempts
- Rate limit violations
- Unusual access patterns
- Error responses
- Security header rejections

### What NOT to Log

- Passwords (plain or hashed)
- Encryption keys
- Session tokens
- Personal sensitive data

## Incident Response

If a security breach is detected:

1. **Immediate Actions**:
   - Rotate all secrets and keys
   - Force logout all users
   - Enable maintenance mode
   - Assess the damage

2. **Investigation**:
   - Review access logs
   - Identify compromised data
   - Determine attack vector
   - Document timeline

3. **Recovery**:
   - Patch vulnerabilities
   - Restore from backups if needed
   - Notify affected users
   - Update security measures

4. **Post-Mortem**:
   - Document lessons learned
   - Update security policies
   - Implement additional controls
   - Train team members

## Future Security Enhancements

- [ ] Implement OAuth2/OIDC for authentication
- [ ] Add 2FA/MFA support
- [ ] Integrate with security monitoring service (e.g., Sentry)
- [ ] Implement API key management
- [ ] Add IP whitelisting for admin panel
- [ ] Implement security.txt file
- [ ] Add CSP reporting endpoint
- [ ] Implement automated security testing
- [ ] Add DDoS protection (Cloudflare/AWS Shield)
- [ ] Implement database encryption at rest
- [ ] Add regular vulnerability scanning
- [ ] Implement secrets rotation schedule

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Helmet Documentation](https://helmetjs.github.io/)
