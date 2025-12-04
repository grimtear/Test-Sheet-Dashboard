import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from "@shared/schema";
import path from 'path';

export async function initializeDatabase() {
  const dbPath = path.join(process.cwd(), 'server', 'database.sqlite');
  const sqlite = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite, { schema });

  // Create tables manually since we don't have migrations set up yet
  try {
    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        user_number INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);

    // Create sessions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      )
    `);

    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire)
    `);

    // Create test_sheets table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS test_sheets (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL REFERENCES users(id),
        tech_reference TEXT NOT NULL UNIQUE,
        admin_reference TEXT NOT NULL,
        form_type TEXT NOT NULL DEFAULT 'Test Sheet',
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        instruction TEXT,
        customer TEXT NOT NULL,
        plant_name TEXT NOT NULL,
        vehicle_make TEXT,
        vehicle_model TEXT,
        vehicle_voltage TEXT,
        serial_esn TEXT,
        sim_id TEXT,
        izwi_serial TEXT,
        eps_serial TEXT,
        units_replaced TEXT,
        pdu_installed TEXT,
        eps_linked TEXT,
        administrator TEXT,
        technician_name TEXT,
        technician_job_card_no TEXT,
        odometer_engine_hours TEXT,
        administrator_signature TEXT,
        notes TEXT,
        test TEXT,
        status_comment TEXT,
        is_draft INTEGER DEFAULT 0,
        gps TEXT,
        gsm TEXT,
        ignition TEXT,
        internal_battery TEXT,
        main_battery TEXT,
        buzzer TEXT,
        seat_belt TEXT,
        tag_authentication TEXT,
        panic TEXT,
        eps TEXT,
        izwi TEXT,
        bin_tip TEXT,
        tpms TEXT,
        service_brake TEXT,
        gps_comment TEXT,
        gsm_comment TEXT,
        ignition_comment TEXT,
        internal_battery_comment TEXT,
        main_battery_comment TEXT,
        buzzer_comment TEXT,
        seat_belt_comment TEXT,
        tag_authentication_comment TEXT,
        panic_comment TEXT,
        eps_comment TEXT,
        izwi_comment TEXT,
        bin_tip_comment TEXT,
        tpms_comment TEXT,
        service_brake_comment TEXT,
        pdu_voltage_parked TEXT,
        pdu_voltage_ignition TEXT,
        pdu_voltage_idle TEXT,
        eps_power_on_status TEXT,
        eps_power_on_comment TEXT,
        eps_trip1_status TEXT,
        eps_trip1_comment TEXT,
        eps_lock_cancel1_status TEXT,
        eps_lock_cancel1_comment TEXT,
        eps_trip2_status TEXT,
        eps_trip2_comment TEXT,
        eps_lock_cancel2_status TEXT,
        eps_lock_cancel2_comment TEXT,
        administrator_select TEXT,
        technician_select TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);

    // Create test_items table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS test_items (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        test_sheet_id TEXT NOT NULL REFERENCES test_sheets(id) ON DELETE CASCADE,
        test_name TEXT NOT NULL,
        status TEXT NOT NULL,
        comment TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);

    // Create test_templates table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS test_templates (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        test_names TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);

    console.log('Database tables created successfully');

    // Insert default test template if it doesn't exist
    const defaultTemplate = sqlite.prepare(`
      INSERT OR IGNORE INTO test_templates (name, test_names, is_default) 
      VALUES (?, ?, 1)
    `);

    const defaultTests = JSON.stringify([
      'GPS',
      'GSM',
      'Ignition',
      'Power Supply',
      'Communication Test',
      'System Diagnostic'
    ]);

    defaultTemplate.run('Default Tests', defaultTests);
    console.log('Default test template created');

  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }

  return { db, sqlite };
}