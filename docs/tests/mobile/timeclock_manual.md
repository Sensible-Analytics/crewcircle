# Time Clock Manual Test Script

## Precondition
- Physical device with GPS
- Expo Go installed and logged in as test employee
- Location geofence set to device's current position (lat/lon from Maps app), radius 150m
- Test employee has a shift today

## Steps

### Scenario A: Clock in within geofence

1. Open app, tap "Time Clock"
2. Verify: current shift info is visible (role, time range)
3. Tap "Clock In"
4. GPS permission dialog: tap "Allow While Using"
5. Expected: green indicator "Clocked in at [Location Name]"
6. Expected: duration timer starts counting up (00:00:01, 00:00:02...)
7. In database: verify `clock_events` row exists with:
   - type = 'clock_in'
   - is_within_geofence = true
   - latitude/longitude populated
   - source = 'mobile'
8. Save screenshot: `.sisyphus/evidence/mobile-clock-in-within.png`

### Scenario B: Clock out
1. Tap "Clock Out"
2. Expected: timer stops, "Clocked out" confirmation shown
3. In database: verify matching clock_out row

### Scenario C: Clock in outside geofence
1. Move 200m from location (or set geofence to a far location)
2. Tap "Clock In"
3. Expected: orange warning "You appear to be outside [Location Name]. Clock in anyway?"
4. Tap "Clock In Anyway"
5. In database: verify clock_events row with is_within_geofence = false
6. Save screenshot: `.sisyphus/evidence/mobile-clock-in-outside.png`

### Scenario D: Offline clock-in
1. Enable airplane mode
2. Tap "Clock In"
3. Expected: "Offline — will sync when connection restored" indicator
4. Check SQLite outbox: row exists with synced_at = null
5. Disable airplane mode, wait 30 seconds
6. In database: verify row now exists in clock_events
7. In SQLite: outbox row has synced_at set (not null)
8. Save evidence: `.sisyphus/evidence/mobile-clock-in-offline.txt`
