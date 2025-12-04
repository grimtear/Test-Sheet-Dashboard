import crypto from 'crypto';

/**
 * Encryption utilities for sensitive data
 */

// Get encryption key from environment or generate one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

if (!process.env.ENCRYPTION_KEY) {
    console.warn(
        '⚠️  WARNING: ENCRYPTION_KEY not set in environment. Using random key. ' +
        'Data will not be decryptable after server restart. ' +
        'Set ENCRYPTION_KEY environment variable for production.'
    );
}

interface EncryptedData {
    encrypted: string;
    iv: string;
    authTag: string;
}

/**
 * Encrypt sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted data object with IV and auth tag
 */
export function encrypt(text: string): EncryptedData {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(
            ALGORITHM,
            Buffer.isBuffer(ENCRYPTION_KEY) ? ENCRYPTION_KEY : Buffer.from(ENCRYPTION_KEY, 'hex'),
            iv
        );

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt encrypted data
 * @param encryptedData - Object containing encrypted text, IV, and auth tag
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: EncryptedData): string {
    try {
        const { encrypted, iv, authTag } = encryptedData;

        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            Buffer.isBuffer(ENCRYPTION_KEY) ? ENCRYPTION_KEY : Buffer.from(ENCRYPTION_KEY, 'hex'),
            Buffer.from(iv, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Generate a secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Hex-encoded random token
 */
export function generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password using bcrypt
 * Note: This is a placeholder. bcrypt should be used for actual password hashing
 * @param password - Plain text password
 * @returns Hashed password
 */
export function hashPassword(password: string): string {
    // Use bcrypt in production - this is just SHA-256 for structure
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}

/**
 * Generate encryption key for environment variable
 * Run this once and store the result in ENCRYPTION_KEY env var
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Securely compare two strings to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings match
 */
export function secureCompare(a: string, b: string): boolean {
    try {
        const bufA = Buffer.from(a);
        const bufB = Buffer.from(b);

        if (bufA.length !== bufB.length) {
            return false;
        }

        return crypto.timingSafeEqual(bufA, bufB);
    } catch {
        return false;
    }
}

// Export a function to display the encryption key for first-time setup
if (require.main === module) {
    console.log('\n🔐 Generated Encryption Key (add to .env file):');
    console.log(`ENCRYPTION_KEY=${generateEncryptionKey()}\n`);
}
