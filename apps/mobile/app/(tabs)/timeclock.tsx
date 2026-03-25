import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import * as Crypto from 'expo-crypto';
import { createMobileSupabaseClient } from '../../lib/supabase/client.mobile';
import { useAuth } from '../../context/AuthContext';
import { haversineDistance } from '../../lib/geofence';
import { initDb, savePendingEvent, getUnsyncedEvents, markEventSynced } from '../../lib/db';

interface LocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  geofence_radius_m: number;
}

export default function TimeClockScreen() {
  const { user } = useAuth();
  const supabase = createMobileSupabaseClient();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [assignedLocation, setAssignedLocation] = useState<LocationData | null>(null);
  const [currentShift, setCurrentShift] = useState<any>(null);

  // Sync timer
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize DB and fetch status
  useEffect(() => {
    if (user) {
      initDb();
      fetchStatus();
      fetchAssignedLocation();
      fetchCurrentShift();
    }
  }, [user]);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('clock_events')
        .select('*')
        .eq('profile_id', user?.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.type === 'clock_in') {
        setIsClockedIn(true);
        setClockInTime(new Date(data.recorded_at));
      } else {
        setIsClockedIn(false);
        setClockInTime(null);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchAssignedLocation = async () => {
    try {
      // For MVP, get the first location of the tenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single();

      if (profile) {
        const { data: location } = await supabase
          .from('locations')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .limit(1)
          .single();
        
        if (location) {
          setAssignedLocation(location as LocationData);
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  const fetchCurrentShift = async () => {
     try {
       const now = new Date().toISOString();
       const { data: shift } = await supabase
         .from('shifts')
         .select('*, locations(name)')
         .eq('profile_id', user?.id)
         .lte('start_time', now)
         .gte('end_time', now)
         .single();
       
       if (shift) {
         setCurrentShift(shift);
       }
     } catch (error) {
       console.error('Error fetching current shift:', error);
     }
  };

  const syncOfflineEvents = async () => {
    setIsSyncing(true);
    try {
      const pending = await getUnsyncedEvents();
      for (const event of pending as any[]) {
        const { error } = await supabase.from('clock_events').insert({
          profile_id: event.profile_id,
          location_id: event.location_id,
          shift_id: event.shift_id,
          type: event.type,
          recorded_at: event.recorded_at,
          latitude: event.latitude,
          longitude: event.longitude,
          accuracy_m: event.accuracy_m,
          is_within_geofence: event.is_within_geofence === 1,
          source: event.source,
          idempotency_key: event.idempotency_key,
        });

        if (!error || error.code === '23505') { // Success or already exists
          await markEventSynced(event.id);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClockToggle = async () => {
    setIsLoading(true);
    try {
      // 1. Get GPS Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS permission is required to clock in/out.');
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // 2. Check Geofence (Soft Mode)
      let isWithinGeofence = true;
      if (assignedLocation) {
        const distance = haversineDistance(
          location.coords.latitude,
          location.coords.longitude,
          assignedLocation.latitude,
          assignedLocation.longitude
        );
        isWithinGeofence = distance <= assignedLocation.geofence_radius_m;

        if (!isWithinGeofence) {
          const proceed = await new Promise((resolve) => {
            Alert.alert(
              'Outside Geofence',
              `You appear to be ${Math.round(distance)}m away from ${assignedLocation.name}. Clock in anyway?`,
              [
                { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
                { text: 'Clock In Anyway', onPress: () => resolve(true) },
              ]
            );
          });
          if (!proceed) {
            setIsLoading(false);
            return;
          }
        }
      }

      // 3. Prepare Event
      const type = isClockedIn ? 'clock_out' : 'clock_in';
      const event = {
        profile_id: user?.id,
        location_id: assignedLocation?.id || null,
        shift_id: currentShift?.id || null,
        type,
        recorded_at: new Date().toISOString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy_m: Math.round(location.coords.accuracy || 0),
        is_within_geofence: isWithinGeofence,
        source: 'mobile',
        idempotency_key: Crypto.randomUUID(),
      };

      // 4. Save Locally first
      await savePendingEvent(event);

      // 5. Update UI
      if (type === 'clock_in') {
        setIsClockedIn(true);
        setClockInTime(new Date(event.recorded_at));
      } else {
        setIsClockedIn(false);
        setClockInTime(null);
      }

      // 6. Try to Sync
      syncOfflineEvents();

    } catch (error) {
      console.error('Clock toggle error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getElapsedTime = () => {
    if (!clockInTime) return '00:00:00';
    const diff = Math.floor((currentTime.getTime() - clockInTime.getTime()) / 1000);
    const h = Math.floor(diff / 3600).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Clock</Text>
        <Text style={styles.subtitle}>{formatDate(currentTime)}</Text>
        <Text style={styles.time}>{currentTime.toLocaleTimeString('en-AU', { hour12: false })}</Text>
      </View>

      <View style={styles.card}>
        {currentShift ? (
          <View style={styles.shiftInfo}>
            <Text style={styles.label}>Current Shift</Text>
            <Text style={styles.value}>{currentShift.locations.name}</Text>
            <Text style={styles.value}>
              {formatTime(new Date(currentShift.start_time))} - {formatTime(new Date(currentShift.end_time))}
            </Text>
          </View>
        ) : (
          <Text style={styles.noShift}>No scheduled shift right now</Text>
        )}
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>{isClockedIn ? 'Clocked In For' : 'Ready to Work'}</Text>
        <Text style={[styles.timerValue, isClockedIn ? styles.activeTimer : null]}>
          {getElapsedTime()}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isClockedIn ? styles.buttonOut : styles.buttonIn]}
        onPress={handleClockToggle}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isClockedIn ? 'CLOCK OUT' : 'CLOCK IN'}</Text>
        )}
      </TouchableOpacity>

      {assignedLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            Worksite: {assignedLocation.name}
          </Text>
        </View>
      )}

      {isSyncing && (
        <View style={styles.syncingContainer}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={styles.syncingText}>Syncing offline events...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f9fafb',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  time: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    marginBottom: 32,
  },
  shiftInfo: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  noShift: {
    textAlign: 'center',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  timerLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 64,
    fontWeight: '300',
    color: '#d1d5db',
    fontVariant: ['tabular-nums'],
  },
  activeTimer: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonIn: {
    backgroundColor: '#3b82f6',
  },
  buttonOut: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  locationInfo: {
    marginTop: 32,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#4b5563',
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  syncingText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
