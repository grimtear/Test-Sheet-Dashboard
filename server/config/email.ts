/**
 * Email Configuration
 * 
 * Configure email settings for Nodemailer
 * Supports multiple transport methods (SMTP, SendGrid, etc.)
 */

export interface EmailConfig {
    from: {
        name: string;
        email: string;
    };
    transport: {
        host: string;
        port: number;
        secure: boolean;
        auth?: {
            user: string;
            pass: string;
        };
    };
    templates: {
        baseUrl: string; // For links in emails
        logoUrl?: string; // Company logo
    };
}

/**
 * Default email configuration
 * 
 * For development: Uses ethereal.email (fake SMTP for testing)
 * For production: Set environment variables for real SMTP service
 */
export const emailConfig: EmailConfig = {
    from: {
        name: process.env.EMAIL_FROM_NAME || 'NAE IT Technology',
        email: process.env.EMAIL_FROM_ADDRESS || 'noreply@naeit.tech',
    },
    transport: {
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        } : undefined,
    },
    templates: {
        baseUrl: process.env.BASE_URL || 'http://192.168.1.194:5002',
        logoUrl: process.env.LOGO_URL,
    },
};

/**
 * Email notification types
 */
export enum NotificationType {
    TEST_SHEET_COMPLETED = 'test_sheet_completed',
    TEST_SHEET_DRAFT_SAVED = 'test_sheet_draft_saved',
    TEST_SHEET_FAILED = 'test_sheet_failed',
    ADMIN_APPROVAL_REQUIRED = 'admin_approval_required',
    DAILY_SUMMARY = 'daily_summary',
    WEEKLY_REPORT = 'weekly_report',
}

/**
 * Email notification preferences
 */
export interface NotificationPreferences {
    userId: string;
    emailEnabled: boolean;
    notifications: {
        [NotificationType.TEST_SHEET_COMPLETED]: boolean;
        [NotificationType.TEST_SHEET_DRAFT_SAVED]: boolean;
        [NotificationType.TEST_SHEET_FAILED]: boolean;
        [NotificationType.ADMIN_APPROVAL_REQUIRED]: boolean;
        [NotificationType.DAILY_SUMMARY]: boolean;
        [NotificationType.WEEKLY_REPORT]: boolean;
    };
}

/**
 * Default notification preferences (all enabled)
 */
export const defaultNotificationPreferences: Omit<NotificationPreferences, 'userId'> = {
    emailEnabled: true,
    notifications: {
        [NotificationType.TEST_SHEET_COMPLETED]: true,
        [NotificationType.TEST_SHEET_DRAFT_SAVED]: false, // Disabled by default
        [NotificationType.TEST_SHEET_FAILED]: true,
        [NotificationType.ADMIN_APPROVAL_REQUIRED]: true,
        [NotificationType.DAILY_SUMMARY]: false, // Disabled by default
        [NotificationType.WEEKLY_REPORT]: true,
    },
};
