# Email Notifications System

## Overview

The Email Notifications System provides automated email notifications for test sheet events, user preferences management, and daily/weekly reporting capabilities.

## Features

- ✅ **Automated Notifications**: Email alerts for test sheet completion, failures, and approval requests
- ✅ **HTML Templates**: Professional, responsive email templates with branding
- ✅ **User Preferences**: Granular control over which notifications to receive
- ✅ **Test Mode**: Development mode using Ethereal Email for testing
- ✅ **Production Ready**: SMTP configuration for production email delivery
- ✅ **Daily/Weekly Reports**: Automated summary emails with statistics
- ✅ **React Hooks**: Easy-to-use hooks for notification management
- ✅ **UI Component**: Pre-built component for managing preferences

## Architecture

### Backend Components

```
server/
├── config/
│   └── email.ts           # Email configuration and types
├── services/
│   └── emailService.ts    # Email sending logic with Nodemailer
└── routes/
    └── notificationRoutes.ts  # API endpoints
```

### Frontend Components

```
client/src/
├── hooks/
│   └── useNotifications.ts  # React hooks for notifications
└── components/
    └── NotificationPreferences.tsx  # UI for managing preferences
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Email Configuration
EMAIL_FROM_NAME=NAE IT Technology
EMAIL_FROM_ADDRESS=noreply@naeit.tech

# SMTP Settings (Production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application
BASE_URL=https://your-domain.com
```

### Development Mode

In development, if SMTP credentials are not provided, the system automatically creates an **Ethereal Email** test account:

```typescript
// No SMTP config needed for dev
// System will auto-create test account and log credentials
```

When emails are sent in dev mode, you'll see console output like:

```
📧 Email service initialized with test account:
   User: test.account@ethereal.email
   Pass: randompassword123
   Preview emails at: https://ethereal.email
📨 Email sent: <message-id>
📧 Preview URL: https://ethereal.email/message/abc123
```

## Notification Types

| Type | Event | When Sent |
|------|-------|-----------|
| `test_sheet_completed` | Test sheet submission | When test status is "Test OK" |
| `test_sheet_draft_saved` | Draft saved | When test sheet is saved as draft |
| `test_sheet_failed` | Test failed | When test status is "Failed" |
| `admin_approval_required` | Approval needed | When test sheet requires admin review |
| `daily_summary` | Daily report | Once per day (configurable) |
| `weekly_report` | Weekly report | Once per week (configurable) |

## API Endpoints

### Send Notifications

#### Send Test Sheet Completed Notification

```http
POST /api/notifications/test-sheet/:id/completed
```

**Response:**

```json
{
  "success": true,
  "message": "Notification sent successfully"
}
```

#### Send Test Sheet Failed Notification

```http
POST /api/notifications/test-sheet/:id/failed
```

**Response:**

```json
{
  "success": true,
  "message": "Notification sent successfully"
}
```

#### Send Admin Approval Notification

```http
POST /api/notifications/test-sheet/:id/approval
Content-Type: application/json

{
  "adminEmail": "admin@naeit.tech"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Notification sent successfully"
}
```

#### Send Daily Summary

```http
POST /api/notifications/daily-summary
Content-Type: application/json

{
  "userEmail": "user@naeit.tech"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Daily summary sent successfully"
}
```

### Manage Preferences

#### Get User Preferences

```http
GET /api/notifications/preferences/:userId
```

**Response:**

```json
{
  "success": true,
  "preferences": {
    "test_sheet_completed": true,
    "test_sheet_draft_saved": false,
    "test_sheet_failed": true,
    "admin_approval_required": true,
    "daily_summary": false,
    "weekly_report": true
  }
}
```

#### Update Preferences

```http
PUT /api/notifications/preferences/:userId
Content-Type: application/json

{
  "preferences": {
    "test_sheet_completed": true,
    "test_sheet_draft_saved": true,
    "test_sheet_failed": true,
    "admin_approval_required": true,
    "daily_summary": true,
    "weekly_report": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "preferences": { ... }
}
```

### Testing

#### Send Test Email

```http
POST /api/notifications/test-email
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Test email sent successfully",
  "messageId": "<abc123@ethereal.email>",
  "previewUrl": "https://ethereal.email/message/abc123"
}
```

## React Hooks Usage

### Send Notifications

```tsx
import { 
  useSendCompletedNotification,
  useSendFailedNotification,
  useSendApprovalNotification 
} from '@/hooks/useNotifications';

function TestSheetSubmit() {
  const sendCompleted = useSendCompletedNotification();
  const sendFailed = useSendFailedNotification();

  const handleSubmit = (testSheetId: string, result: string) => {
    if (result === 'Test OK') {
      sendCompleted.mutate(testSheetId);
    } else if (result === 'Failed') {
      sendFailed.mutate(testSheetId);
    }
  };

  return (
    <button 
      onClick={() => handleSubmit('test-123', 'Test OK')}
      disabled={sendCompleted.isPending}
    >
      Submit Test Sheet
    </button>
  );
}
```

### Auto-Notify Helper

```tsx
import { useAutoNotify } from '@/hooks/useNotifications';

function TestSheetForm() {
  const { notifyTestSheet, isLoading } = useAutoNotify();

  const handleSubmit = async (data) => {
    const testSheet = await createTestSheet(data);
    
    // Automatically sends appropriate notification
    notifyTestSheet(testSheet.id, testSheet.Test);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Manage Preferences

```tsx
import { 
  useNotificationPreferences,
  useUpdateNotificationPreferences 
} from '@/hooks/useNotifications';

function PreferencesPage() {
  const { user } = useAuth();
  const { data: preferences } = useNotificationPreferences(user?.id);
  const updatePrefs = useUpdateNotificationPreferences();

  const togglePref = (key: string) => {
    updatePrefs.mutate({
      userId: user!.id,
      preferences: {
        ...preferences,
        [key]: !preferences[key],
      },
    });
  };

  return (
    <div>
      {Object.keys(preferences || {}).map(key => (
        <Switch 
          key={key}
          checked={preferences?.[key] || false}
          onCheckedChange={() => togglePref(key)}
        />
      ))}
    </div>
  );
}
```

### Send Test Email

```tsx
import { useSendTestEmail } from '@/hooks/useNotifications';

function EmailTester() {
  const sendTest = useSendTestEmail();
  const [email, setEmail] = useState('');

  return (
    <div>
      <input 
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={() => sendTest.mutate(email)}>
        Send Test Email
      </button>
    </div>
  );
}
```

## UI Component

### NotificationPreferences Component

```tsx
import NotificationPreferences from '@/components/NotificationPreferences';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <NotificationPreferences />
    </div>
  );
}
```

**Features:**

- Toggle switches for each notification type
- Save/cancel functionality
- Test email sender
- Email configuration status
- Auto-saves preferences to backend

## Email Templates

### Template Structure

All email templates follow a consistent structure:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #color; color: white; padding: 20px; }
    .content { background: #f9f9f9; padding: 20px; }
    .button { background: #color; color: white; padding: 12px 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Title</h1>
    </div>
    <div class="content">
      <!-- Content here -->
    </div>
    <div class="footer">
      <p>Automated message from NAE IT Technology</p>
    </div>
  </div>
</body>
</html>
```

### Template Types

1. **Test Sheet Completed** (Green theme)
   - Reference, customer, plant details
   - Test status and results
   - "View Test Sheet" button

2. **Test Sheet Failed** (Red theme)
   - Reference, customer, plant details
   - Status comments/reasons
   - Warning styling
   - "View Test Sheet" button

3. **Admin Approval** (Blue theme)
   - Submitted by user info
   - Test sheet details
   - "Review Test Sheet" button

4. **Daily Summary** (Purple theme)
   - Statistics cards (total, completed, passed, failed)
   - Recent test sheets list
   - "View Dashboard" button

## Integration Examples

### Integrate into Test Sheet Submission

```typescript
// server/simpleRoutes.ts
import emailService from './services/emailService';

app.post("/api/test-sheets", isAuthenticated, async (req, res) => {
  try {
    const testSheet = await createTestSheet(req.body);
    
    // Send notification based on test result
    if (!testSheet.isDraft) {
      if (testSheet.Test === 'Test OK') {
        await emailService.sendTestSheetCompletedEmail(testSheet.id);
      } else if (testSheet.Test === 'Failed') {
        await emailService.sendTestSheetFailedEmail(testSheet.id);
      }
    }
    
    res.json(testSheet);
  } catch (error) {
    console.error('Error creating test sheet:', error);
    res.status(500).json({ error: 'Failed to create test sheet' });
  }
});
```

### Add to React Form

```tsx
// client/src/pages/test-sheet-form.tsx
import { useAutoNotify } from '@/hooks/useNotifications';

function TestSheetForm() {
  const createMutation = useTestSheetMutation();
  const { notifyTestSheet } = useAutoNotify();

  const handleSubmit = async (data) => {
    const result = await createMutation.mutateAsync(data);
    
    // Automatically send email notification
    if (!result.isDraft) {
      notifyTestSheet(result.id, result.Test);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Scheduled Notifications

### Daily Summary Cron Job

Create a cron job to send daily summaries:

```typescript
// server/jobs/dailySummary.ts
import cron from 'node-cron';
import emailService from '../services/emailService';
import { db } from '../db';
import { users } from '@shared/schema';

// Run every day at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('📧 Running daily summary job...');
  
  const allUsers = await db.select().from(users);
  
  for (const user of allUsers) {
    if (user.email) {
      try {
        await emailService.sendDailySummaryEmail(user.email);
        console.log(`✅ Daily summary sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send to ${user.email}:`, error);
      }
    }
  }
  
  console.log('📧 Daily summary job complete');
});
```

Install dependencies:

```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

## Testing

### Test Email Service

```bash
# Start server
npm run dev

# The console will show:
📧 Email service initialized with test account:
   User: test.account@ethereal.email
   Pass: randompassword123
   Preview emails at: https://ethereal.email
```

### Send Test Email via API

```bash
curl -X POST http://localhost:5002/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### View Emails in Ethereal

1. Open <https://ethereal.email>
2. Login with credentials from console
3. View all sent emails with full HTML preview

## Production Setup

### Gmail Configuration

1. **Enable 2-Factor Authentication** in Google Account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification
   - App passwords → Generate new
   - Copy the 16-character password

3. **Update `.env`**:

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

### AWS SES Configuration

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-access-key
SMTP_PASS=your-ses-secret-key
```

### SendGrid Configuration

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## Troubleshooting

### Emails Not Sending

1. **Check console logs**:

   ```
   ❌ Email service initialization failed: [error message]
   ```

2. **Verify SMTP credentials**:

   ```typescript
   // Test connection
   const transporter = nodemailer.createTransport(config);
   await transporter.verify();
   ```

3. **Check firewall**: Ensure port 587 (or 465) is open

4. **Gmail blocks**: Enable "Less secure app access" or use App Password

### Preview URLs Not Working

- Preview URLs only work in development mode (Ethereal)
- In production, check actual email inbox

### Notifications Not Triggered

1. Check that email service initialized:

   ```
   ✅ Email service ready
   ```

2. Verify user has email in database

3. Check notification preferences (if implemented)

## Security Considerations

1. **Never commit SMTP credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Validate email addresses** before sending
4. **Rate limit** notification endpoints to prevent abuse
5. **Sanitize user input** in email templates
6. **Use HTTPS** in production for email links

## Performance

- Email sending is **asynchronous** and doesn't block API responses
- Failed email sends are **logged but don't fail the request**
- Uses connection pooling for better performance
- Template generation is in-memory (no file I/O)

## Future Enhancements

- [ ] Database table for notification preferences
- [ ] SMS notifications via Twilio
- [ ] Push notifications via Firebase
- [ ] Email templates from database
- [ ] Notification history/audit log
- [ ] Batch email sending
- [ ] Email analytics (open rates, clicks)
- [ ] Unsubscribe functionality
- [ ] Custom email templates per user/organization

## Complete Example

```typescript
// Complete workflow example
import emailService from './services/emailService';

// 1. Initialize service (automatic on server start)
// Logs: "✅ Email service ready"

// 2. Send notification when test sheet is completed
app.post('/api/test-sheets', async (req, res) => {
  const sheet = await createTestSheet(req.body);
  
  if (sheet.Test === 'Test OK') {
    await emailService.sendTestSheetCompletedEmail(sheet.id);
    // Logs: "📨 Email sent: <message-id>"
    // Logs: "📧 Preview URL: https://ethereal.email/message/..."
  }
  
  res.json(sheet);
});

// 3. User receives email with:
// - Professional HTML template
// - Test sheet details
// - "View Test Sheet" button linking to the app
```

## Summary

The Email Notifications System provides a complete solution for keeping users informed about test sheet activities. With automatic notifications, granular preferences, and production-ready SMTP support, it enhances user engagement and ensures important events are never missed.

**Key Benefits:**

- ✅ Zero configuration needed for development (Ethereal auto-setup)
- ✅ Production-ready with any SMTP provider
- ✅ Professional HTML email templates
- ✅ React hooks for easy frontend integration
- ✅ User preference management
- ✅ Test mode with preview URLs
