# Database Migrations with Drizzle Kit

This document explains the database migration system for the TestSheet application using Drizzle Kit.

## Overview

The application uses **Drizzle ORM** with **SQLite** and **Drizzle Kit** for managing database schema migrations. This approach provides:

- **Version Control**: Track all schema changes over time
- **Safety**: Rollback capabilities and migration history
- **Automation**: Auto-generate migrations from schema definitions
- **Consistency**: Ensure all environments use the same schema version
- **Developer Experience**: Type-safe database operations with full TypeScript support

## Architecture

### Components

1. **Schema Definitions** (`shared/schema.ts`)
   - Drizzle schema definitions using TypeScript
   - Single source of truth for database structure
   - Includes Zod validation schemas

2. **Migration Files** (`drizzle/` directory)
   - Auto-generated SQL migration files
   - Metadata and journal files for tracking
   - Each migration has a unique timestamp and descriptive name

3. **Database Configuration** (`drizzle.config.ts`)
   - Drizzle Kit configuration
   - Specifies SQLite dialect, schema location, and migration output

4. **Database Initialization** (`server/db.ts`)
   - Runs migrations automatically on server startup
   - Initializes database connection with WAL mode

### Current Schema

The application manages 6 tables:

- **users**: User accounts and profile information
- **sessions**: Express session storage
- **user_logins**: Login history and audit trail
- **test_sheets**: Test sheet records (74 columns)
- **test_items**: Individual test items linked to sheets
- **test_templates**: Reusable test templates

## Configuration

### Drizzle Configuration

**File**: `drizzle.config.ts`

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./server/database.sqlite",
  },
});
```

**Key Settings**:

- `dialect`: "sqlite" - Uses SQLite database
- `schema`: Points to schema definitions
- `out`: Migration files output directory
- `dbCredentials.url`: Path to SQLite database file

### Database Initialization

**File**: `server/db.ts`

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Create database with WAL mode for better concurrency
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Initialize Drizzle ORM
export const db = drizzle(sqlite, { schema });

// Run migrations automatically on startup
migrate(db, { migrationsFolder: './drizzle' });
```

## Migration Workflow

### 1. Modify Schema

Edit `shared/schema.ts` to add, modify, or remove tables/columns:

```typescript
// Example: Add a new column to users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  // ... existing columns ...
  newColumn: text("new_column"), // NEW COLUMN
});
```

### 2. Generate Migration

Run the generate command to create a new migration:

```bash
npm run db:generate
```

**What happens**:

- Drizzle Kit compares schema with current database state
- Generates SQL migration file in `drizzle/` directory
- Creates snapshot and updates journal
- Migration file format: `XXXX_description.sql`

**Example output**:

```
6 tables
sessions 3 columns 1 indexes 0 fks
test_items 6 columns 0 indexes 1 fks
test_sheets 74 columns 1 indexes 1 fks
test_templates 6 columns 0 indexes 0 fks
user_logins 8 columns 0 indexes 1 fks
users 9 columns 1 indexes 0 fks  <- Changed!

[✓] Your SQL migration file ➜ drizzle/0001_add_new_column.sql
```

### 3. Review Migration

**Always review** the generated migration file before applying:

```bash
# View the migration file
cat drizzle/0001_add_new_column.sql
```

**Check for**:

- Correct column types and constraints
- Proper default values
- Foreign key relationships
- Index creation
- Data migration logic (if needed)

### 4. Apply Migration

Migrations are applied **automatically** when the server starts. The migration system:

- Checks which migrations have been applied
- Runs only new migrations in order
- Updates migration journal
- Throws error if migration fails (preventing server startup)

**Manual migration** (if needed):

```bash
npm run db:migrate
```

### 5. Verify Changes

After applying migrations:

1. **Check server logs**:

```
Running database migrations...
Database migrations completed successfully
```

2. **Inspect database schema**:

```bash
npm run db:studio
```

3. **Verify in application**:

```typescript
// Test the new column
const user = await db.select().from(users).where(...);
console.log(user.newColumn); // Should work
```

## Available Commands

### `npm run db:generate`

Generate a new migration from schema changes.

**When to use**:

- After modifying `shared/schema.ts`
- Adding new tables or columns
- Changing column types or constraints
- Adding indexes or foreign keys

**Output**:

- New SQL file in `drizzle/XXXX_description.sql`
- Updated `drizzle/meta/_journal.json`
- New snapshot in `drizzle/meta/XXXX_snapshot.json`

### `npm run db:migrate`

Apply pending migrations to the database.

**When to use**:

- Manually applying migrations (usually automatic on server start)
- Testing migrations before deployment
- Applying migrations in CI/CD pipeline

**What it does**:

- Reads migration journal
- Identifies unapplied migrations
- Executes SQL in order
- Updates journal with applied migrations

### `npm run db:push`

Push schema changes directly to database **without** creating migration files.

⚠️ **Use with caution!** This bypasses migration history.

**When to use**:

- Local development rapid prototyping
- One-off schema fixes in development
- **Never use in production**

**What it does**:

- Compares schema with database
- Applies changes directly via ALTER/CREATE statements
- No migration file created
- No rollback capability

### `npm run db:studio`

Launch Drizzle Studio - a visual database browser.

**Features**:

- View all tables and data
- Run queries interactively
- Edit records (with caution)
- Inspect relationships and indexes

**Access**:

- Opens in browser at `https://local.drizzle.studio`
- Read-only by default (can enable edits)

### `npm run db:drop`

Interactive migration rollback tool.

⚠️ **Destructive operation!**

**What it does**:

- Lists applied migrations
- Allows you to select migrations to rollback
- Generates SQL to undo changes
- **May result in data loss**

**Use cases**:

- Undoing a faulty migration in development
- Reverting schema changes
- **Use extreme caution in production**

## Migration Best Practices

### 1. Always Generate Migrations

❌ **Don't**: Manually edit the database schema
✅ **Do**: Update `shared/schema.ts` and run `npm run db:generate`

**Why**: Ensures all environments stay in sync and changes are tracked.

### 2. Review Before Applying

❌ **Don't**: Blindly apply generated migrations
✅ **Do**: Review the SQL in generated migration files

**Check for**:

- Destructive operations (DROP, TRUNCATE)
- Missing default values for new NOT NULL columns
- Data migration logic requirements

### 3. Test Migrations

❌ **Don't**: Apply migrations directly to production
✅ **Do**: Test migrations in development and staging first

**Process**:

1. Generate migration in development
2. Test locally with real-like data
3. Review migration SQL
4. Apply to staging environment
5. Verify application works correctly
6. Deploy to production

### 4. Handle Data Migrations

For complex schema changes requiring data transformation:

**Example**: Renaming a column with data preservation

```sql
-- Generated migration (may need manual editing)
ALTER TABLE users ADD COLUMN full_name TEXT;

-- Add data migration logic
UPDATE users SET full_name = first_name || ' ' || last_name;

-- Remove old columns (after verifying data)
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
```

**Steps**:

1. Generate initial migration
2. Edit migration file to add data transformation
3. Test thoroughly in development
4. Apply carefully in production

### 5. Maintain Migration Order

❌ **Don't**: Modify or delete old migration files
✅ **Do**: Create new migrations for changes

**Why**:

- Maintains historical record
- Prevents migration conflicts
- Allows recreation of database from scratch

### 6. Use Descriptive Names

The migration generator creates timestamped files. Add descriptive suffixes:

❌ **Don't**: `0001_migration.sql`
✅ **Do**: `0001_add_user_roles.sql`, `0002_create_audit_log.sql`

### 7. Backup Before Major Changes

**Before running destructive migrations**:

```bash
# Backup SQLite database
cp server/database.sqlite server/database.sqlite.backup

# Or export data
npm run db:studio  # Export tables to CSV
```

## Schema Definition Guidelines

### Column Definitions

**Primary Keys**:

```typescript
id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`)
```

- Uses UUID-like random blob
- Auto-generated on insert

**Timestamps**:

```typescript
createdAt: integer("created_at").default(sql`(unixepoch())`),
updatedAt: integer("updated_at").default(sql`(unixepoch())`),
```

- Uses Unix timestamp (seconds since epoch)
- Auto-populated on insert

**Foreign Keys**:

```typescript
userId: text("user_id").notNull().references(() => users.id)
```

- Creates foreign key constraint
- Use `.references()` for relationships

**Indexes**:

```typescript
export const users = sqliteTable("users", {
  email: text("email").unique(),
  // ... other columns
}, (table) => [
  index("idx_email").on(table.email),
]);
```

### Type Mappings

| Drizzle Type | SQLite Type | TypeScript Type | Example |
|--------------|-------------|-----------------|---------|
| `text()` | TEXT | `string \| null` | `text("name")` |
| `integer()` | INTEGER | `number \| null` | `integer("age")` |
| `real()` | REAL | `number \| null` | `real("price")` |
| `blob()` | BLOB | `Buffer \| null` | `blob("data")` |

**Modifiers**:

- `.notNull()` - NOT NULL constraint
- `.unique()` - UNIQUE constraint
- `.default(value)` - Default value
- `.primaryKey()` - Primary key
- `.references()` - Foreign key

## Common Migration Scenarios

### Adding a New Table

1. **Define in schema**:

```typescript
export const products = sqliteTable("products", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  price: real("price").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});
```

2. **Generate migration**:

```bash
npm run db:generate
```

3. **Review & restart server** (migration applies automatically)

### Adding a Column

1. **Update schema**:

```typescript
export const users = sqliteTable("users", {
  // ... existing columns ...
  phoneNumber: text("phone_number"), // NEW
});
```

2. **Generate migration**:

```bash
npm run db:generate
```

3. **Review migration file**:

```sql
ALTER TABLE users ADD COLUMN phone_number TEXT;
```

4. **Restart server** (applies automatically)

### Modifying a Column

SQLite has **limited ALTER TABLE support**. For type changes:

1. **Create new column**:

```typescript
userNumberNew: integer("user_number_new").notNull().default(1),
```

2. **Generate migration**

3. **Edit migration to add data copy**:

```sql
ALTER TABLE users ADD COLUMN user_number_new INTEGER DEFAULT 1;
UPDATE users SET user_number_new = CAST(user_number AS INTEGER);
ALTER TABLE users DROP COLUMN user_number;
ALTER TABLE users RENAME COLUMN user_number_new TO user_number;
```

4. **Update schema** to use renamed column

### Adding an Index

1. **Update schema**:

```typescript
export const testSheets = sqliteTable("test_sheets", {
  // ... columns ...
}, (table) => [
  index("idx_customer").on(table.customer),
  index("idx_created_at").on(table.createdAt),
]);
```

2. **Generate migration**:

```bash
npm run db:generate
```

3. **Review migration**:

```sql
CREATE INDEX idx_customer ON test_sheets(customer);
CREATE INDEX idx_created_at ON test_sheets(created_at);
```

### Adding a Foreign Key

1. **Update schema**:

```typescript
export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { 
    onDelete: 'cascade' 
  }),
  // ... other columns ...
});
```

2. **Generate and apply migration**

## Troubleshooting

### Migration Fails on Startup

**Symptoms**:

```
Database migration error: ...
```

**Solutions**:

1. **Check migration SQL syntax**:

```bash
# Review the latest migration
cat drizzle/XXXX_latest.sql
```

2. **Check for conflicting schema**:

```bash
# Use db:push to see differences
npm run db:push
```

3. **Restore from backup**:

```bash
cp server/database.sqlite.backup server/database.sqlite
```

4. **Reset migrations** (development only):

```bash
# Delete database and migration journal
rm server/database.sqlite*
rm drizzle/meta/_journal.json
# Regenerate initial migration
npm run db:generate
```

### Migration Already Applied

**Symptoms**:
Migration runs twice or conflicts with existing schema.

**Solution**:
Check `drizzle/meta/_journal.json` to see applied migrations:

```json
{
  "entries": [
    {
      "idx": 0,
      "when": 1234567890,
      "tag": "0000_initial_schema",
      "breakpoints": true
    }
  ]
}
```

### Schema Out of Sync

**Symptoms**:
Schema doesn't match database structure.

**Solutions**:

1. **Development**: Use `db:push` to sync

```bash
npm run db:push
```

2. **Production**: Generate migration for changes

```bash
npm run db:generate
```

### Cannot Generate Migration

**Symptoms**:
`drizzle-kit generate` fails or generates empty migration.

**Solutions**:

1. **Check schema syntax**:

```bash
npm run check  # TypeScript check
```

2. **Verify config**:

```bash
cat drizzle.config.ts
```

3. **Clear cache and regenerate**:

```bash
rm -rf drizzle/meta
npm run db:generate
```

### SQLite Limitations

**ALTER TABLE restrictions**:

- Cannot change column type directly
- Cannot drop columns in older SQLite versions
- Cannot add NOT NULL without default

**Workarounds**:

1. Create new table with desired schema
2. Copy data from old table
3. Drop old table
4. Rename new table

**Example**:

```sql
-- Create new table
CREATE TABLE users_new (...);

-- Copy data
INSERT INTO users_new SELECT ... FROM users;

-- Swap tables
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations tested in development
- [ ] Migrations tested in staging
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Migration SQL reviewed
- [ ] Data migration logic tested
- [ ] Application tested with new schema

### Deployment Process

1. **Backup database**:

```bash
cp server/database.sqlite server/database.sqlite.backup-$(date +%Y%m%d_%H%M%S)
```

2. **Deploy application** (migrations run on startup)

3. **Monitor logs**:

```
Running database migrations...
Database migrations completed successfully
```

4. **Verify application**:

- Test critical features
- Check data integrity
- Monitor error logs

5. **Keep backup** for 24-48 hours before deleting

### Rollback Procedure

If migration causes issues:

1. **Stop application**

2. **Restore database backup**:

```bash
cp server/database.sqlite.backup server/database.sqlite
```

3. **Revert code** to previous version

4. **Restart application**

5. **Investigate** migration issue

6. **Fix and redeploy** after testing

## Migration History

### Initial Migration

**File**: `drizzle/0000_friendly_agent_zero.sql`
**Date**: 2025-01-XX
**Description**: Initial database schema with 6 tables

**Tables created**:

- users (8 columns, 1 unique index)
- sessions (3 columns, 1 index)
- user_logins (8 columns, 1 foreign key)
- test_sheets (74 columns, 1 unique index, 1 foreign key)
- test_items (6 columns, 1 foreign key with CASCADE delete)
- test_templates (6 columns)

**Notable features**:

- UUID-like primary keys using randomblob
- Unix timestamp-based created_at/updated_at
- Foreign key constraints with CASCADE delete on test_items
- Unique constraint on test_sheets.tech_reference

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Drizzle Kit Migration Guide](https://orm.drizzle.team/kit-docs/overview)
- [SQLite ALTER TABLE Limitations](https://www.sqlite.org/lang_altertable.html)
- [Better SQLite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

## Support

For issues or questions:

1. Check this documentation
2. Review Drizzle ORM docs
3. Check server logs for migration errors
4. Use `npm run db:studio` to inspect database
5. Create backup before making changes
