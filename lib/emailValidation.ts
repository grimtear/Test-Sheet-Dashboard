/**
 * Email validation utilities for the authentication system
 * Only allows @NAE.co.za and @gmail.com domains
 */

const ALLOWED_DOMAINS = ['@NAE.co.za', '@gmail.com'];

/**
 * Validates if an email address uses an allowed domain
 * @param email - The email address to validate
 * @returns true if the domain is allowed, false otherwise
 */
export function isAllowedEmailDomain(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return false;
    }

    // Check if the email ends with any of the allowed domains
    const normalizedEmail = email.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => normalizedEmail.endsWith(domain.toLowerCase()));
}

/**
 * Gets a user-friendly error message for invalid emails
 * @param email - The email address that failed validation
 * @returns A descriptive error message
 */
export function getEmailValidationError(email: string): string {
    if (!email) {
        return 'Email address is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }

    if (!isAllowedEmailDomain(email)) {
        return 'Only @NAE.co.za and @gmail.com email addresses are allowed';
    }

    return '';
}

/**
 * Extracts a display name from an email address
 * @param email - The email address
 * @returns The local part of the email (before @) as a display name
 */
export function getDisplayNameFromEmail(email: string): string {
    if (!email || !email.includes('@')) {
        return email || 'User';
    }

    const localPart = email.split('@')[0];
    // Capitalize first letter and replace dots/underscores with spaces
    return localPart
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}