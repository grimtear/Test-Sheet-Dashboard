import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  email: text('email').unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  profileImageUrl: text('profile_image_url'),
  userNumber: integer('user_number').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const sessions = sqliteTable('sessions', {
  sid: text('sid').primaryKey(),
  sess: text('sess').notNull(),
  expire: integer('expire').notNull(),
}, (table) => ({
  expireIdx: index('IDX_session_expire').on(table.expire),
}));

export const userLogins = sqliteTable('user_logins', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  firstName: text('first_name'),
  loginTime: integer('login_time', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const testSheets = sqliteTable('test_sheets', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  techReference: text('tech_reference').notNull().unique(),
  adminReference: text('admin_reference').notNull(),
  formType: text('form_type').notNull().default('Test Sheet'),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  instruction: text('instruction'),
  customer: text('customer').notNull(),
  plantName: text('plant_name').notNull(),
  vehicleMake: text('vehicle_make'),
  vehicleModel: text('vehicle_model'),
  vehicleVoltage: text('vehicle_voltage'),
  serialEsn: text('serial_esn'),
  simId: text('sim_id'),
  izwiSerial: text('izwi_serial'),
  epsSerial: text('eps_serial'),
  unitsReplaced: text('units_replaced'),
  pduInstalled: text('pdu_installed'),
  epsLinked: text('eps_linked'),
  administrator: text('administrator'),
  technicianName: text('technician_name'),
  technicianJobCardNo: text('technician_job_card_no'),
  odometerEngineHours: text('odometer_engine_hours'),
  administratorSignature: text('administrator_signature'),
  notes: text('notes'),
  test: text('test'),
  statusComment: text('status_comment'),
  isDraft: integer('is_draft', { mode: 'boolean' }).default(false),
  gps: text('gps'),
  gsm: text('gsm'),
  ignition: text('ignition'),
  internalBattery: text('internal_battery'),
  mainBattery: text('main_battery'),
  buzzer: text('buzzer'),
  seatBelt: text('seat_belt'),
  tagAuthentication: text('tag_authentication'),
  panic: text('panic'),
  eps: text('eps'),
  izwi: text('izwi'),
  binTip: text('bin_tip'),
  tpms: text('tpms'),
  serviceBrake: text('service_brake'),
  gpsComment: text('gps_comment'),
  gsmComment: text('gsm_comment'),
  ignitionComment: text('ignition_comment'),
  internalBatteryComment: text('internal_battery_comment'),
  mainBatteryComment: text('main_battery_comment'),
  buzzerComment: text('buzzer_comment'),
  seatBeltComment: text('seat_belt_comment'),
  tagAuthenticationComment: text('tag_authentication_comment'),
  panicComment: text('panic_comment'),
  epsComment: text('eps_comment'),
  izwiComment: text('izwi_comment'),
  binTipComment: text('bin_tip_comment'),
  tpmsComment: text('tpms_comment'),
  serviceBrakeComment: text('service_brake_comment'),
  pduVoltageParked: text('pdu_voltage_parked'),
  pduVoltageIgnition: text('pdu_voltage_ignition'),
  pduVoltageIdle: text('pdu_voltage_idle'),
  epsPowerOnStatus: text('eps_power_on_status'),
  epsPowerOnComment: text('eps_power_on_comment'),
  epsTrip1Status: text('eps_trip1_status'),
  epsTrip1Comment: text('eps_trip1_comment'),
  epsLockCancel1Status: text('eps_lock_cancel1_status'),
  epsLockCancel1Comment: text('eps_lock_cancel1_comment'),
  epsTrip2Status: text('eps_trip2_status'),
  epsTrip2Comment: text('eps_trip2_comment'),
  epsLockCancel2Status: text('eps_lock_cancel2_status'),
  epsLockCancel2Comment: text('eps_lock_cancel2_comment'),
  administratorSelect: text('administrator_select'),
  technicianSelect: text('technician_select'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const testItems = sqliteTable('test_items', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  testSheetId: text('test_sheet_id').notNull().references(() => testSheets.id, { onDelete: 'cascade' }),
  testName: text('test_name').notNull(),
  status: text('status').notNull(),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const testTemplates = sqliteTable('test_templates', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(),
  testNames: text('test_names').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').references(() => users.id),
  userEmail: text('user_email').notNull(),
  userName: text('user_name'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  changes: text('changes'),
  oldValues: text('old_values'),
  newValues: text('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  endpoint: text('endpoint'),
  method: text('method'),
  description: text('description'),
  severity: text('severity').default('info'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  userIdx: index('idx_audit_user').on(table.userId),
  entityIdx: index('idx_audit_entity').on(table.entity, table.entityId),
  actionIdx: index('idx_audit_action').on(table.action),
  timestampIdx: index('idx_audit_timestamp').on(table.timestamp),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserLogin = typeof userLogins.$inferSelect;
export type InsertUserLogin = typeof userLogins.$inferInsert;
export type TestSheet = typeof testSheets.$inferSelect;
export type InsertTestSheet = typeof testSheets.$inferInsert;
export type TestItem = typeof testItems.$inferSelect;
export type InsertTestItem = typeof testItems.$inferInsert;
export type TestTemplate = typeof testTemplates.$inferSelect;
export type InsertTestTemplate = typeof testTemplates.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
