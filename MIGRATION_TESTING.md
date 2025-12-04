# Testing Database Migrations

## Quick Test Guide

This guide helps you verify that the database migration system is working correctly.

## Step 1: Test Initial Migration

The initial migration has already been generated. When you start the server, it should apply automatically.

### Start the development server

```powershell
npm run dev:server
```

### Expected output in terminal

```
Running database migrations...
Database migrations completed successfully
Server running on port 3000
```

If you see this, the migration system is working! ✅

## Step 2: Test Migration Generation

Let's test generating a new migration by making a small schema change.

### 2.1 Add a test column to the users table

Edit `shared/schema.ts` and add a new column to the users table:

```typescript
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  userNumber: integer("user_number").notNull().default(1),
  testColumn: text("test_column"), // ADD THIS LINE FOR TESTING
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});
```

### 2.2 Generate migration

```powershell
npm run db:generate
```

### Expected output

```
6 tables
sessions 3 columns 1 indexes 0 fks
test_items 6 columns 0 indexes 1 fks
test_sheets 74 columns 1 indexes 1 fks
test_templates 6 columns 0 indexes 0 fks
user_logins 8 columns 0 indexes 1 fks
users 9 columns 1 indexes 0 fks  <- Changed from 8 to 9!

[✓] Your SQL migration file ➜ drizzle/0001_some_name.sql 🚀
```

### 2.3 Review the migration

```powershell
cat drizzle/0001_*.sql
```

You should see:

```sql
ALTER TABLE `users` ADD `test_column` text;
```

### 2.4 Apply the migration

Restart the dev server:

```powershell
npm run dev:server
```

The migration will be applied automatically. Check the logs:

```
Running database migrations...
Applying migration: 0001_some_name.sql
Database migrations completed successfully
```

### 2.5 Remove the test column

Now remove the test column from `shared/schema.ts` (undo the change from step 2.1).

Generate another migration:

```powershell
npm run db:generate
```

You should see a new migration file that drops the column:

```sql
-- Note: SQLite may require table recreation for column drops
ALTER TABLE `users` DROP COLUMN `test_column`;
```

Restart the server to apply.

## Step 3: Test Drizzle Studio

Launch the database browser:

```powershell
npm run db:studio
```

This should:

1. Start Drizzle Studio server
2. Open browser at <https://local.drizzle.studio>
3. Show all 6 tables
4. Allow you to browse data

You should see:

- users
- sessions  
- user_logins
- test_sheets
- test_items
- test_templates

## Step 4: Verify Migration Persistence

### 4.1 Check migration journal

```powershell
cat drizzle/meta/_journal.json
```

You should see all applied migrations listed:

```json
{
  "entries": [
    {
      "idx": 0,
      "when": 1234567890,
      "tag": "0000_friendly_agent_zero",
      "breakpoints": true
    }
  ]
}
```

### 4.2 Test idempotency

Restart the server multiple times. The migrations should only run once:

```powershell
npm run dev:server
# Stop (Ctrl+C)
npm run dev:server
# Stop (Ctrl+C)
npm run dev:server
```

Each time, you should see:

```
Running database migrations...
Database migrations completed successfully
```

But the actual SQL should only execute on the first run (when migrations are new).

## Common Issues

### Issue: "Migration file already exists"

**Cause**: You generated a migration but didn't apply it, then changed the schema again.

**Solution**: Either apply the existing migration first (restart server) or delete it and regenerate.

### Issue: "Cannot read properties of undefined"

**Cause**: Schema syntax error or TypeScript compilation issue.

**Solution**:

```powershell
npm run check  # Check TypeScript errors
```

Fix any TypeScript errors in `shared/schema.ts`.

### Issue: Migration fails with SQL error

**Cause**: Invalid SQL in migration or conflicting constraints.

**Solution**:

1. Review the migration SQL file
2. Check for syntax errors
3. Ensure foreign key references are valid
4. If needed, manually edit the migration file

### Issue: "No such table" error

**Cause**: Database file deleted or migrations not applied.

**Solution**:

1. Delete `server/database.sqlite*` files
2. Restart server (migrations will recreate tables)

## Clean Slate Test

To test the complete migration system from scratch:

### 1. Backup current database (if needed)

```powershell
cp server/database.sqlite server/database.sqlite.backup
```

### 2. Delete database files

```powershell
rm server/database.sqlite*
```

### 3. Start server

```powershell
npm run dev:server
```

### 4. Verify migration ran

Check logs for:

```
Running database migrations...
Applying migration: 0000_friendly_agent_zero.sql
Database migrations completed successfully
```

### 5. Verify tables exist

```powershell
npm run db:studio
```

All 6 tables should be present with the correct schema.

## Success Criteria

✅ The migration system is working correctly if:

1. Server starts without errors
2. Migration logs appear in console
3. Database file is created with all tables
4. New migrations can be generated
5. New migrations are applied automatically
6. Migration journal tracks applied migrations
7. Drizzle Studio shows correct schema
8. Restarting server doesn't re-run migrations
9. Schema changes generate correct SQL
10. Multiple migration files work in sequence

## Next Steps

Once testing is complete:

1. ✅ Keep the initial migration (`0000_friendly_agent_zero.sql`)
2. ❌ Delete any test migrations created during testing
3. ✅ Restore the original `shared/schema.ts` (remove test columns)
4. ✅ Commit migration files to version control
5. ✅ Document any schema changes in future migrations

## Production Checklist

Before deploying to production:

- [ ] All migrations tested in development
- [ ] No test/temporary migrations in `drizzle/` folder
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Migration journal committed to git
- [ ] Schema types match database structure
- [ ] No pending schema changes (run `npm run db:generate` and verify no new migrations)
