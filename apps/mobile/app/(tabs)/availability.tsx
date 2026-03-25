import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { createMobileSupabaseClient } from '../../lib/supabase/client.mobile';
import { useAuth } from '../../context/AuthContext';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Availability {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function AvailabilityScreen() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const { user } = useAuth();
  const supabase = createMobileSupabaseClient();

  const fetchAvailabilities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('profile_id', user.id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setAvailabilities(data || []);
    } catch (error) {
      console.error('Failed to fetch availabilities:', error);
    }
  };

  const toggleAvailability = async (dayIndex: number) => {
    const existing = availabilities.find(a => a.day_of_week === dayIndex);
    
    if (existing) {
      const updated = { ...existing, is_available: !existing.is_available };
      const { error } = await supabase
        .from('availability')
        .update(updated)
        .eq('id', existing.id);

      if (!error) {
        setAvailabilities(prev => prev.map(a => a.id === existing.id ? updated : a));
      }
    } else {
      const newAvailability: Availability = {
        day_of_week: dayIndex,
        start_time: '09:00',
        end_time: '17:00',
        is_available: false,
      };

      const { data, error } = await supabase
        .from('availability')
        .insert({ ...newAvailability, profile_id: user?.id })
        .select();

      if (!error && data) {
        setAvailabilities(prev => [...prev, data[0]]);
      }
    }
  };

  const isAvailable = (dayIndex: number) => {
    const availability = availabilities.find(a => a.day_of_week === dayIndex);
    return availability?.is_available ?? true;
  };

  useEffect(() => {
    fetchAvailabilities();
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Availability</Text>
        <Text style={styles.subtitle}>Set when you can work</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Weekly Availability</Text>
        
        <View style={styles.grid}>
          {DAYS_OF_WEEK.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCell,
                isAvailable(index) ? styles.available : styles.unavailable,
              ]}
              onPress={() => toggleAvailability(index)}
            >
              <Text style={[
                styles.dayText,
                isAvailable(index) && styles.availableText,
              ]}>
                {day}
              </Text>
              <Text style={[
                styles.statusText,
                isAvailable(index) && styles.availableText,
              ]}>
                {isAvailable(index) ? 'Available' : 'Unavailable'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Tap a day to toggle your availability. Green means you're available to work.
            Your manager will see this when creating rosters.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayCell: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  available: {
    backgroundColor: '#d4f7dc',
    borderColor: '#34C759',
  },
  unavailable: {
    backgroundColor: '#ffe5e5',
    borderColor: '#FF3B30',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  availableText: {
    color: '#2d8a4e',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});