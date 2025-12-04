# Audit Logging System

## Overview

The Audit Logging System provides comprehensive tracking of all data changes, user actions, and system events with full context, timestamps, and change history.

## Features

- ✅ **Complete Activity Tracking**: Logs all CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, EXPORT, and SEARCH actions
- ✅ **Change Detection**: Automatically captures before/after values for all data modifications
- ✅ **User Attribution**: Every action is tied to a specific user with email and name
- ✅ **Request Metadata**: Captures IP address, user agent, endpoint, and HTTP method
- ✅ **Severity Levels**: Categorize logs as info, warning, error, or critical
- ✅ **Advanced Filtering**: Search and filter by user, action, entity, date range, severity
- ✅ **Pagination**: Efficient browsing of large audit log datasets
- ✅ **Statistics Dashboard**: Real-time insights into system activity
- ✅ **Entity History**: View complete audit trail for any specific record
- ✅ **React Components**: Pre-built UI for viewing and analyzing audit logs

## Architecture

### Database Schema

```typescript
// shared/schema.ts
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  
  // Who made the change
  userId: text("user_id").references(() => users.id),
  userEmail: text("user_email").notNull(),
  userName: text("user_name"),
  
  // What was changed
  action: text("action").notNull(), // CREATE, UPDATE, DELETE, etc.
  entity: text("entity").notNull(), // test_sheets, users, etc.
  entityId: text("entity_id"),
  
  // Change details
  changes: text("changes"), // JSON: { field: { from: x, to: y } }
  oldValues: text("old_values"), // JSON snapshot before
  newValues: text("new_values"), // JSON snapshot after
  
  // Request metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  endpoint: text("endpoint"),
  method: text("method"),
  
  // Context
  description: text("description"),
  severity: text("severity").default("info"),
  
  // Timestamps
  timestamp: integer("timestamp").notNull(),
  createdAt: integer("created_at"),
}, (table) => [
  index("idx_audit_user").on(table.userId),
  index("idx_audit_entity").on(table.entity, table.entityId),
  index("idx_audit_action").on(table.action),
  index("idx_audit_timestamp").on(table.timestamp),
]);
```

### Backend Components

```
server/
├── services/
│   └── auditService.ts     # Audit logging logic (500+ lines)
└── routes/
    └── auditRoutes.ts      # API endpoints (200+ lines)
```

### Frontend Components

```
client/src/
├── hooks/
│   └── useAudit.ts         # React hooks (300+ lines)
└── components/
    └── AuditLogViewer.tsx  # UI component (400+ lines)
```

## Audit Actions

| Action | Description | When Used |
|--------|-------------|-----------|
| `CREATE` | New record created | Test sheet submission, user registration |
| `UPDATE` | Existing record modified | Test sheet editing, profile updates |
| `DELETE` | Record removed | Test sheet deletion, user removal |
| `LOGIN` | User logged in | Successful authentication |
| `LOGOUT` | User logged out | Session termination |
| `VIEW` | Record accessed | Viewing test sheet details |
| `EXPORT` | Data exported | PDF generation, CSV downloads |
| `SEARCH` | Search performed | Test sheet search operations |

## Audit Entities

- `test_sheets` - Test sheet records
- `users` - User accounts
- `test_items` - Individual test items
- `test_templates` - Test templates
- `audit_logs` - Audit log records (meta-auditing)

## Severity Levels

| Level | Usage | Color |
|-------|-------|-------|
| `info` | Normal operations (default) | Blue |
| `warning` | Important but non-critical events | Yellow |
| `error` | Operation failures | Orange |
| `critical` | Security issues, data loss | Red |

## API Endpoints

### Get Audit Logs

```http
GET /api/audit/logs?page=1&limit=20
```

**Query Parameters:**

- `userId` - Filter by user ID
- `action` - Filter by action type (CREATE, UPDATE, DELETE, etc.)
- `entity` - Filter by entity type (test_sheets, users, etc.)
- `entityId` - Filter by specific entity ID
- `severity` - Filter by severity level
- `startDate` - Unix timestamp (filter from date)
- `endDate` - Unix timestamp (filter to date)
- `search` - Text search in email, name, description, entityId
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)

**Response:**

```json
{
  "success": true,
  "logs": [
    {
      "id": "abc123",
      "userId": "user-id",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "action": "CREATE",
      "entity": "test_sheets",
      "entityId": "sheet-id",
      "changes": null,
      "oldValues": null,
      "newValues": "{...}",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "endpoint": "/api/test-sheets",
      "method": "POST",
      "description": "Created test sheet: TS391703-11-2025",
      "severity": "info",
      "timestamp": 1699123456,
      "createdAt": 1699123456
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

### Get Audit Statistics

```http
GET /api/audit/stats
```

**Query Parameters:**

- `userId` - Filter stats by user
- `startDate` - Unix timestamp
- `endDate` - Unix timestamp

**Response:**

```json
{
  "success": true,
  "stats": {
    "total": 1250,
    "byAction": [
      { "action": "CREATE", "count": 450 },
      { "action": "UPDATE", "count": 320 },
      { "action": "DELETE", "count": 80 }
    ],
    "byEntity": [
      { "entity": "test_sheets", "count": 800 },
      { "entity": "users", "count": 200 }
    ],
    "bySeverity": [
      { "severity": "info", "count": 1100 },
      { "severity": "warning", "count": 100 }
    ],
    "topUsers": [
      { "email": "john@example.com", "name": "John Doe", "count": 450 }
    ]
  }
}
```

### Get Entity Audit History

```http
GET /api/audit/entity/:entity/:entityId?limit=20
```

**Parameters:**

- `entity` - Entity type (test_sheets, users, etc.)
- `entityId` - Specific entity ID
- `limit` - Maximum records (default: 20)

**Response:**

```json
{
  "success": true,
  "history": [
    {
      "id": "log-1",
      "action": "UPDATE",
      "timestamp": 1699123456,
      "description": "Updated test sheet: TS391703-11-2025",
      ...
    }
  ]
}
```

### Get User Audit Logs

```http
GET /api/audit/user/:userId?page=1&limit=20
```

**Response:** Same structure as GET /api/audit/logs

### Get Recent Activity

```http
GET /api/audit/recent?limit=50
```

Returns audit logs from the last 24 hours.

### Cleanup Old Logs

```http
POST /api/audit/cleanup
Content-Type: application/json

{
  "daysToKeep": 90
}
```

Deletes audit logs older than specified days (minimum: 7 days).

**Response:**

```json
{
  "success": true,
  "message": "Cleaned up audit logs older than 90 days"
}
```

### Get Available Actions/Entities

```http
GET /api/audit/actions
GET /api/audit/entities
```

Returns static lists of available audit actions and entities.

## Backend Usage

### Automatic Audit Logging

```typescript
// server/services/auditService.ts
import auditService from './services/auditService';

// Log test sheet creation
await auditService.logTestSheetCreate(
  userId,
  userEmail,
  testSheetId,
  testSheetData,
  req  // Optional Express request object
);

// Log test sheet update
await auditService.logTestSheetUpdate(
  userId,
  userEmail,
  testSheetId,
  oldData,
  newData,
  req
);

// Log test sheet deletion
await auditService.logTestSheetDelete(
  userId,
  userEmail,
  testSheetId,
  testSheetData,
  req
);

// Log user login
await auditService.logUserLogin(
  userId,
  userEmail,
  userName,
  req
);

// Log data export
await auditService.logDataExport(
  userId,
  userEmail,
  'PDF',
  1,  // Number of records exported
  req
);

// Log search operation
await auditService.logSearch(
  userId,
  userEmail,
  'search query',
  25,  // Number of results
  req
);
```

### Custom Audit Logs

```typescript
import auditService from './services/auditService';

await auditService.createAuditLog({
  userId: 'user-id',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  action: 'UPDATE',
  entity: 'test_sheets',
  entityId: 'sheet-123',
  changes: {
    status: { from: 'draft', to: 'completed' },
    Test: { from: null, to: 'Test OK' }
  },
  description: 'Completed test sheet',
  severity: 'info',
  req, // Automatically extracts IP, user agent, endpoint
});
```

### Integration Example

```typescript
// server/simpleRoutes.ts
import auditService from './services/auditService';

app.post("/api/test-sheets", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const user = (req.session as any)?.user;
    
    const testSheet = await createTestSheet(req.body);
    
    // Log the creation
    await auditService.logTestSheetCreate(
      userId,
      user.email,
      testSheet.id,
      testSheet,
      req
    );
    
    res.json(testSheet);
  } catch (error) {
    console.error('Error creating test sheet:', error);
    res.status(500).json({ error: 'Failed to create test sheet' });
  }
});
```

## Frontend Usage

### React Hooks

```tsx
import {
  useAuditLogs,
  useAuditStats,
  useEntityAuditHistory,
  useUserAuditLogs,
  useRecentAuditActivity,
} from '@/hooks/useAudit';

// Get audit logs with filters
function AuditPage() {
  const { data, isLoading } = useAuditLogs({
    action: 'CREATE',
    entity: 'test_sheets',
    page: 1,
    limit: 20,
  });

  return (
    <div>
      {data?.logs.map(log => (
        <div key={log.id}>{log.description}</div>
      ))}
    </div>
  );
}

// Get statistics
function StatsWidget() {
  const { data: stats } = useAuditStats({
    startDate: Math.floor(Date.now() / 1000) - 86400, // Last 24h
  });

  return (
    <div>
      <p>Total: {stats?.stats.total}</p>
      <p>Creates: {stats?.stats.byAction.find(a => a.action === 'CREATE')?.count}</p>
    </div>
  );
}

// Get entity history
function TestSheetAudit({ testSheetId }: { testSheetId: string }) {
  const { data } = useEntityAuditHistory('test_sheets', testSheetId, 10);

  return (
    <div>
      <h3>Audit Trail</h3>
      {data?.history.map(log => (
        <div key={log.id}>
          {log.action} by {log.userName} at {formatAuditTimestamp(log.timestamp)}
        </div>
      ))}
    </div>
  );
}

// Get recent activity
function RecentActivity() {
  const { data } = useRecentAuditActivity(25);

  return (
    <div>
      <h3>Recent Activity</h3>
      {data?.logs.map(log => (
        <div key={log.id}>{log.description}</div>
      ))}
    </div>
  );
}
```

### AuditLogViewer Component

```tsx
import AuditLogViewer from '@/components/AuditLogViewer';

function AdminPanel() {
  return (
    <div>
      <h1>Audit Logs</h1>
      <AuditLogViewer />
    </div>
  );
}
```

**Component Features:**

- Real-time statistics dashboard (4 cards)
- Advanced filtering (search, action, entity, severity)
- Expandable log items showing full details
- Change highlighting (red for old, green for new)
- Pagination with page navigation
- Auto-refresh for recent activity
- Responsive design

### Helper Functions

```tsx
import {
  parseAuditLogChanges,
  formatAuditTimestamp,
  getSeverityColor,
  getActionIcon,
} from '@/hooks/useAudit';

// Parse JSON fields
const { changes, oldValues, newValues } = parseAuditLogChanges(log);

// Format timestamp
const dateStr = formatAuditTimestamp(log.timestamp);
// Returns: "11/6/2025, 3:30:45 PM"

// Get severity color
const color = getSeverityColor('warning'); // Returns: 'yellow'

// Get action icon
const icon = getActionIcon('CREATE'); // Returns: '➕'
```

## Change Detection

The audit system automatically captures changes for UPDATE operations:

```typescript
// Automatic change detection
const oldData = { name: 'Test 1', status: 'draft' };
const newData = { name: 'Test 1', status: 'completed' };

await auditService.logTestSheetUpdate(userId, userEmail, id, oldData, newData, req);

// Stored changes:
{
  "status": {
    "from": "draft",
    "to": "completed"
  }
}
```

## Indexes for Performance

The audit_logs table has 4 indexes for fast querying:

1. `idx_audit_user` - Filter by user
2. `idx_audit_entity` - Filter by entity and entityId
3. `idx_audit_action` - Filter by action type
4. `idx_audit_timestamp` - Sort by time, filter by date range

## Security Considerations

1. **Immutable Logs**: Audit logs should never be modified or deleted (except via cleanup)
2. **Access Control**: Only admins should access full audit logs
3. **PII Protection**: Be careful with sensitive data in changes/values fields
4. **Retention Policy**: Set up automated cleanup (default: 90 days)
5. **No Failures**: Audit logging never throws errors that break main flow

## Maintenance

### Automated Cleanup

Set up a cron job to clean old logs:

```typescript
// server/jobs/auditCleanup.ts
import cron from 'node-cron';
import auditService from '../services/auditService';

// Run every week on Sunday at 2 AM
cron.schedule('0 2 * * 0', async () => {
  console.log('🧹 Running audit log cleanup...');
  await auditService.cleanupOldAuditLogs(90); // Keep 90 days
  console.log('✅ Audit log cleanup complete');
});
```

### Manual Cleanup

```bash
curl -X POST http://localhost:5002/api/audit/cleanup \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 90}'
```

## Monitoring

### Check Audit Log Growth

```sql
-- Check total audit logs
SELECT COUNT(*) FROM audit_logs;

-- Check logs per day
SELECT 
  DATE(timestamp, 'unixepoch') as date,
  COUNT(*) as count
FROM audit_logs
GROUP BY date
ORDER BY date DESC
LIMIT 30;

-- Check database size
SELECT page_count * page_size as size 
FROM pragma_page_count(), pragma_page_size();
```

### Disk Space Estimation

Average audit log size: ~500 bytes

- 1,000 logs ≈ 500 KB
- 10,000 logs ≈ 5 MB
- 100,000 logs ≈ 50 MB
- 1,000,000 logs ≈ 500 MB

## Best Practices

1. **Log Everything Important**: CREATE, UPDATE, DELETE operations
2. **Include Context**: Always pass the Express `req` object for metadata
3. **Use Descriptions**: Provide human-readable descriptions
4. **Set Severity**: Use warning/error for important events
5. **Don't Log Passwords**: Never include sensitive credentials
6. **Regular Cleanup**: Set up automated cleanup to manage disk space
7. **Monitor Growth**: Track audit log size in production
8. **Index Properly**: The provided indexes cover most queries

## Troubleshooting

### Audit Logs Not Appearing

1. Check that migration ran: `npx drizzle-kit push`
2. Verify audit service is imported in routes
3. Check console for audit log errors (won't throw)
4. Verify database has audit_logs table

### Performance Issues

1. Add more indexes if needed for custom queries
2. Reduce retention period (cleanup more frequently)
3. Consider archiving old logs to separate database
4. Use pagination (don't query all logs at once)

### Large Database

If audit_logs table grows too large:

1. Lower retention period (e.g., 30 days instead of 90)
2. Archive old logs to external storage
3. Consider log rotation (monthly tables)
4. Vacuum database after cleanup

## Future Enhancements

- [ ] Export audit logs to CSV/JSON
- [ ] Real-time audit log streaming (WebSocket)
- [ ] Advanced analytics and charts
- [ ] Audit log anomaly detection
- [ ] Integration with external SIEM systems
- [ ] Audit log encryption at rest
- [ ] Compliance reports (GDPR, SOC 2)
- [ ] Audit log replay/rollback

## Complete Example

```typescript
// Complete audit logging workflow

// 1. User creates test sheet
app.post('/api/test-sheets', isAuthenticated, async (req, res) => {
  const testSheet = await createTestSheet(req.body);
  
  await auditService.logTestSheetCreate(
    req.session.userId,
    req.session.user.email,
    testSheet.id,
    testSheet,
    req
  );
  // Logs: "📋 Audit: CREATE test_sheets (abc123) by user@example.com"
  
  res.json(testSheet);
});

// 2. User updates test sheet
app.put('/api/test-sheets/:id', isAuthenticated, async (req, res) => {
  const oldSheet = await getTestSheet(req.params.id);
  const newSheet = await updateTestSheet(req.params.id, req.body);
  
  await auditService.logTestSheetUpdate(
    req.session.userId,
    req.session.user.email,
    req.params.id,
    oldSheet,
    newSheet,
    req
  );
  
  res.json(newSheet);
});

// 3. Admin views audit logs in UI
function AdminPanel() {
  return <AuditLogViewer />;
  // Shows all logs with filters, stats, and full change history
}

// 4. Automated cleanup runs weekly
cron.schedule('0 2 * * 0', async () => {
  await auditService.cleanupOldAuditLogs(90);
});
```

## Summary

The Audit Logging System provides enterprise-grade activity tracking with:

- ✅ Complete audit trail of all system changes
- ✅ Automatic change detection and capture
- ✅ User attribution and request metadata
- ✅ Advanced filtering and search
- ✅ Real-time statistics dashboard
- ✅ Entity-specific audit history
- ✅ Automated cleanup and maintenance
- ✅ Production-ready React components

**Code Statistics:**

- 1,400+ lines of production code
- 4 database indexes
- 8 API endpoints
- 7 React hooks
- 1 complete UI component
- Full TypeScript support
