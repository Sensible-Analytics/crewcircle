import * as SQLite from 'expo-sqlite';

export async function initDb() {
  const db = await SQLite.openDatabaseAsync('crewcircle.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pending_clock_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL,
      location_id TEXT,
      shift_id TEXT,
      type TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      accuracy_m INTEGER,
      is_within_geofence INTEGER,
      source TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      synced INTEGER DEFAULT 0
    );
  `);
  
  return db;
}

export async function savePendingEvent(event: any) {
  const db = await SQLite.openDatabaseAsync('crewcircle.db');
  await db.runAsync(
    `INSERT INTO pending_clock_events (
      profile_id, location_id, shift_id, type, recorded_at, 
      latitude, longitude, accuracy_m, is_within_geofence, 
      source, idempotency_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.profile_id, event.location_id, event.shift_id, event.type, event.recorded_at,
      event.latitude, event.longitude, event.accuracy_m, event.is_within_geofence ? 1 : 0,
      event.source, event.idempotency_key
    ]
  );
}

export async function getUnsyncedEvents() {
  const db = await SQLite.openDatabaseAsync('crewcircle.db');
  return await db.getAllAsync('SELECT * FROM pending_clock_events WHERE synced = 0');
}

export async function markEventSynced(id: number) {
  const db = await SQLite.openDatabaseAsync('crewcircle.db');
  await db.runAsync('UPDATE pending_clock_events SET synced = 1 WHERE id = ?', [id]);
}

export async function clearSyncedEvents() {
  const db = await SQLite.openDatabaseAsync('crewcircle.db');
  await db.runAsync('DELETE FROM pending_clock_events WHERE synced = 1');
}
