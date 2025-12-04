/**
 * Email Service
 * 
 * Handles sending emails using Nodemailer with support for
 * HTML templates, attachments, and notification preferences
 */

import nodemailer, { type Transporter } from 'nodemailer';
import { emailConfig, NotificationType, type NotificationPreferences } from '../config/email';
import { db } from '../db';
import { users, testSheets } from '@shared/schema';
import { eq } from 'drizzle-orm';

let transporter: Transporter | null = null;

/**
 * Initialize email transporter
 */
export async function initializeEmailService() {
  try {
    // If no SMTP credentials provided, skip email initialization
    if (!process.env.SMTP_HOST && !process.env.SMTP_USER) {
      console.log('📧 Email service disabled (no SMTP credentials configured)');
      console.log('   To enable emails, set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env file');
      return;
    }

    // If no SMTP credentials provided, create test account for development
    if (!emailConfig.transport.auth) {
      console.log('📧 Creating test email account for development...');
      const testAccount = await nodemailer.createTestAccount();

      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('📧 Email service initialized with test account:');
      console.log(`   User: ${testAccount.user}`);
      console.log(`   Pass: ${testAccount.pass}`);
      console.log(`   Preview emails at: https://ethereal.email`);
    } else {
      // Use provided SMTP credentials
      transporter = nodemailer.createTransport(emailConfig.transport);
      console.log('📧 Email service initialized with SMTP:');
      console.log(`   Host: ${emailConfig.transport.host}:${emailConfig.transport.port}`);
    }

    // Verify connection
    await transporter.verify();
    console.log('✅ Email service ready');
  } catch (error) {
    console.error('⚠️  Email service initialization failed:', error);
    console.error('   Application will continue without email functionality');
    transporter = null;
  }
}

/**
 * Send email
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}) {
  if (!transporter) {
    console.warn('Email service not initialized, skipping email send');
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    console.log('📨 Email sent:', info.messageId);

    // Log preview URL for test accounts
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview URL:', previewUrl);
    }

    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send test sheet completion notification
 */
export async function sendTestSheetCompletedEmail(testSheetId: string) {
  try {
    // Get test sheet with user data
    const sheet = await db.query.testSheets.findFirst({
      where: eq(testSheets.id, testSheetId),
    });

    if (!sheet) {
      throw new Error('Test sheet not found');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, sheet.userId),
    });

    if (!user?.email) {
      console.log('User has no email, skipping notification');
      return;
    }

    // Check notification preferences (simplified - would check DB in production)
    // For now, send to all users

    const html = generateTestSheetCompletedEmail(sheet, user);
    const text = `Test Sheet Completed\n\nReference: ${sheet.techReference}\nCustomer: ${sheet.customer}\nPlant: ${sheet.plantName}\nStatus: ${sheet.Test || 'N/A'}`;

    await sendEmail({
      to: user.email,
      subject: `Test Sheet Completed - ${sheet.techReference}`,
      html,
      text,
    });
  } catch (error) {
    console.error('Failed to send test sheet completed email:', error);
  }
}

/**
 * Send test sheet failed notification
 */
export async function sendTestSheetFailedEmail(testSheetId: string) {
  try {
    const sheet = await db.query.testSheets.findFirst({
      where: eq(testSheets.id, testSheetId),
    });

    if (!sheet) {
      throw new Error('Test sheet not found');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, sheet.userId),
    });

    if (!user?.email) {
      console.log('User has no email, skipping notification');
      return;
    }

    const html = generateTestSheetFailedEmail(sheet, user);
    const text = `⚠️ Test Sheet Failed\n\nReference: ${sheet.techReference}\nCustomer: ${sheet.customer}\nPlant: ${sheet.plantName}\nStatus: ${sheet.Test}\nComments: ${sheet.StatusComment || 'None'}`;

    await sendEmail({
      to: user.email,
      subject: `⚠️ Test Sheet Failed - ${sheet.techReference}`,
      html,
      text,
    });
  } catch (error) {
    console.error('Failed to send test sheet failed email:', error);
  }
}

/**
 * Send admin approval required notification
 */
export async function sendAdminApprovalEmail(testSheetId: string, adminEmail: string) {
  try {
    const sheet = await db.query.testSheets.findFirst({
      where: eq(testSheets.id, testSheetId),
    });

    if (!sheet) {
      throw new Error('Test sheet not found');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, sheet.userId),
    });

    const html = generateAdminApprovalEmail(sheet, user);
    const text = `Test Sheet Requires Approval\n\nReference: ${sheet.techReference}\nSubmitted by: ${user?.firstName} ${user?.lastName}\nCustomer: ${sheet.customer}\nPlant: ${sheet.plantName}`;

    await sendEmail({
      to: adminEmail,
      subject: `Test Sheet Approval Required - ${sheet.techReference}`,
      html,
      text,
    });
  } catch (error) {
    console.error('Failed to send admin approval email:', error);
  }
}

/**
 * Send daily summary email
 */
export async function sendDailySummaryEmail(userEmail: string) {
  try {
    // Get today's test sheets
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000);

    const todaysSheets = await db
      .select()
      .from(testSheets)
      .where(eq(testSheets.createdAt, todayTimestamp));

    const completed = todaysSheets.filter(s => !s.isDraft).length;
    const drafts = todaysSheets.filter(s => s.isDraft).length;
    const passed = todaysSheets.filter(s => s.Test === 'Test OK').length;
    const failed = todaysSheets.filter(s => s.Test === 'Failed').length;

    const html = generateDailySummaryEmail({
      date: today,
      total: todaysSheets.length,
      completed,
      drafts,
      passed,
      failed,
      sheets: todaysSheets.slice(0, 10), // First 10
    });

    const text = `Daily Summary\n\nTotal: ${todaysSheets.length}\nCompleted: ${completed}\nDrafts: ${drafts}\nPassed: ${passed}\nFailed: ${failed}`;

    await sendEmail({
      to: userEmail,
      subject: `Daily Test Sheet Summary - ${today.toLocaleDateString()}`,
      html,
      text,
    });
  } catch (error) {
    console.error('Failed to send daily summary email:', error);
  }
}

/**
 * Generate HTML for test sheet completed email
 */
function generateTestSheetCompletedEmail(sheet: any, user: any): string {
  const viewUrl = `${emailConfig.templates.baseUrl}/test-sheets/${sheet.id}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
        .details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
        .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Test Sheet Completed</h1>
        </div>
        <div class="content">
          <p>Hello ${user.firstName},</p>
          <p>Your test sheet has been completed successfully.</p>
          
          <div class="details">
            <strong>Reference:</strong> ${sheet.techReference}<br>
            <strong>Customer:</strong> ${sheet.customer}<br>
            <strong>Plant:</strong> ${sheet.plantName}<br>
            <strong>Vehicle:</strong> ${sheet.vehicleMake || 'N/A'} ${sheet.vehicleModel || ''}<br>
            <strong>Status:</strong> ${sheet.Test || 'N/A'}<br>
            <strong>Administrator:</strong> ${sheet.administrator || 'N/A'}<br>
            <strong>Technician:</strong> ${sheet.technicianName || 'N/A'}
          </div>
          
          <a href="${viewUrl}" class="button">View Test Sheet</a>
        </div>
        <div class="footer">
          <p>This is an automated message from NAE IT Technology Test Sheet System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for test sheet failed email
 */
function generateTestSheetFailedEmail(sheet: any, user: any): string {
  const viewUrl = `${emailConfig.templates.baseUrl}/test-sheets/${sheet.id}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
        .details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #f44336; }
        .warning { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 10px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #f44336; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Test Sheet Failed</h1>
        </div>
        <div class="content">
          <p>Hello ${user.firstName},</p>
          <p>A test sheet has failed and requires attention.</p>
          
          <div class="details">
            <strong>Reference:</strong> ${sheet.techReference}<br>
            <strong>Customer:</strong> ${sheet.customer}<br>
            <strong>Plant:</strong> ${sheet.plantName}<br>
            <strong>Vehicle:</strong> ${sheet.vehicleMake || 'N/A'} ${sheet.vehicleModel || ''}<br>
            <strong>Status:</strong> ${sheet.Test}<br>
            <strong>Administrator:</strong> ${sheet.administrator || 'N/A'}<br>
            <strong>Technician:</strong> ${sheet.technicianName || 'N/A'}
          </div>
          
          ${sheet.StatusComment ? `
            <div class="warning">
              <strong>Comments:</strong><br>
              ${sheet.StatusComment}
            </div>
          ` : ''}
          
          <a href="${viewUrl}" class="button">View Test Sheet</a>
        </div>
        <div class="footer">
          <p>This is an automated message from NAE IT Technology Test Sheet System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for admin approval email
 */
function generateAdminApprovalEmail(sheet: any, user: any): string {
  const viewUrl = `${emailConfig.templates.baseUrl}/test-sheets/${sheet.id}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
        .details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2196F3; }
        .button { display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Test Sheet Approval Required</h1>
        </div>
        <div class="content">
          <p>A new test sheet requires your approval.</p>
          
          <div class="details">
            <strong>Reference:</strong> ${sheet.techReference}<br>
            <strong>Submitted by:</strong> ${user?.firstName} ${user?.lastName}<br>
            <strong>Customer:</strong> ${sheet.customer}<br>
            <strong>Plant:</strong> ${sheet.plantName}<br>
            <strong>Vehicle:</strong> ${sheet.vehicleMake || 'N/A'} ${sheet.vehicleModel || ''}<br>
            <strong>Status:</strong> ${sheet.Test || 'Pending'}<br>
            <strong>Date:</strong> ${new Date(sheet.startTime * 1000).toLocaleString()}
          </div>
          
          <a href="${viewUrl}" class="button">Review Test Sheet</a>
        </div>
        <div class="footer">
          <p>This is an automated message from NAE IT Technology Test Sheet System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for daily summary email
 */
function generateDailySummaryEmail(data: {
  date: Date;
  total: number;
  completed: number;
  drafts: number;
  passed: number;
  failed: number;
  sheets: any[];
}): string {
  const dashboardUrl = `${emailConfig.templates.baseUrl}/dashboard`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #673AB7; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: white; border-radius: 8px; flex: 1; margin: 0 5px; }
        .stat-value { font-size: 32px; font-weight: bold; color: #673AB7; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .sheets-list { background: white; padding: 15px; margin-top: 20px; }
        .sheet-item { padding: 10px; border-bottom: 1px solid #eee; }
        .button { display: inline-block; padding: 12px 24px; background: #673AB7; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Daily Test Sheet Summary</h1>
          <p>${data.date.toLocaleDateString()}</p>
        </div>
        <div class="content">
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${data.total}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat">
              <div class="stat-value">${data.completed}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat">
              <div class="stat-value">${data.passed}</div>
              <div class="stat-label">Passed</div>
            </div>
            <div class="stat">
              <div class="stat-value">${data.failed}</div>
              <div class="stat-label">Failed</div>
            </div>
          </div>
          
          ${data.sheets.length > 0 ? `
            <div class="sheets-list">
              <h3>Recent Test Sheets</h3>
              ${data.sheets.map(sheet => `
                <div class="sheet-item">
                  <strong>${sheet.techReference}</strong><br>
                  ${sheet.customer} - ${sheet.plantName}<br>
                  <small>Status: ${sheet.Test || 'Pending'}</small>
                </div>
              `).join('')}
            </div>
          ` : '<p>No test sheets created today.</p>'}
          
          <a href="${dashboardUrl}" class="button">View Dashboard</a>
        </div>
        <div class="footer">
          <p>This is an automated message from NAE IT Technology Test Sheet System</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Initialize on module load
initializeEmailService().catch(console.error);

export default {
  sendEmail,
  sendTestSheetCompletedEmail,
  sendTestSheetFailedEmail,
  sendAdminApprovalEmail,
  sendDailySummaryEmail,
};
