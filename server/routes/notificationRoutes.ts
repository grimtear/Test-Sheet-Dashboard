/**
 * Notification Routes
 * 
 * API endpoints for email notifications and preferences
 */

import { Router } from 'express';
import emailService from '../services/emailService';
import { db } from '../db';
import { testSheets, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/notifications/test-sheet/:id/completed
 * Send test sheet completed notification
 */
router.post('/test-sheet/:id/completed', async (req, res) => {
    try {
        const { id } = req.params;

        await emailService.sendTestSheetCompletedEmail(id);

        res.json({
            success: true,
            message: 'Notification sent successfully'
        });
    } catch (error) {
        console.error('Error sending completed notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send notification'
        });
    }
});

/**
 * POST /api/notifications/test-sheet/:id/failed
 * Send test sheet failed notification
 */
router.post('/test-sheet/:id/failed', async (req, res) => {
    try {
        const { id } = req.params;

        await emailService.sendTestSheetFailedEmail(id);

        res.json({
            success: true,
            message: 'Notification sent successfully'
        });
    } catch (error) {
        console.error('Error sending failed notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send notification'
        });
    }
});

/**
 * POST /api/notifications/test-sheet/:id/approval
 * Send admin approval required notification
 */
router.post('/test-sheet/:id/approval', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminEmail } = req.body;

        if (!adminEmail) {
            return res.status(400).json({
                success: false,
                error: 'Admin email is required'
            });
        }

        await emailService.sendAdminApprovalEmail(id, adminEmail);

        res.json({
            success: true,
            message: 'Notification sent successfully'
        });
    } catch (error) {
        console.error('Error sending approval notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send notification'
        });
    }
});

/**
 * POST /api/notifications/daily-summary
 * Send daily summary email (typically triggered by cron job)
 */
router.post('/daily-summary', async (req, res) => {
    try {
        const { userEmail } = req.body;

        if (!userEmail) {
            return res.status(400).json({
                success: false,
                error: 'User email is required'
            });
        }

        await emailService.sendDailySummaryEmail(userEmail);

        res.json({
            success: true,
            message: 'Daily summary sent successfully'
        });
    } catch (error) {
        console.error('Error sending daily summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send daily summary'
        });
    }
});

/**
 * POST /api/notifications/test-email
 * Send test email to verify configuration
 */
router.post('/test-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email address is required'
            });
        }

        const info = await emailService.sendEmail({
            to: email,
            subject: 'NAE IT Technology - Test Email',
            html: `
        <h1>✅ Email Service is Working!</h1>
        <p>This is a test email from the NAE IT Technology Test Sheet System.</p>
        <p>If you received this, your email configuration is set up correctly.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `,
            text: 'NAE IT Technology - Test Email\n\nEmail service is working correctly!',
        });

        res.json({
            success: true,
            message: 'Test email sent successfully',
            messageId: info?.messageId,
            previewUrl: info ? require('nodemailer').getTestMessageUrl(info) : null,
        });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test email'
        });
    }
});

/**
 * GET /api/notifications/preferences/:userId
 * Get user notification preferences
 * 
 * Note: This is a placeholder. In production, you would:
 * 1. Create a notification_preferences table in the database
 * 2. Store user preferences (email, SMS, push, etc.)
 * 3. Query from the database instead of returning defaults
 */
router.get('/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify user exists
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Return default preferences for now
        // TODO: Query from notification_preferences table
        const preferences = {
            test_sheet_completed: true,
            test_sheet_draft_saved: false,
            test_sheet_failed: true,
            admin_approval_required: true,
            daily_summary: false,
            weekly_report: true,
        };

        res.json({
            success: true,
            preferences
        });
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch preferences'
        });
    }
});

/**
 * PUT /api/notifications/preferences/:userId
 * Update user notification preferences
 * 
 * Note: This is a placeholder. In production, you would:
 * 1. Validate the preferences object
 * 2. Update the notification_preferences table
 * 3. Return the updated preferences
 */
router.put('/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { preferences } = req.body;

        // Verify user exists
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid preferences object'
            });
        }

        // TODO: Validate preferences and update database
        // For now, just echo back the preferences

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            preferences
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update preferences'
        });
    }
});

export default router;
