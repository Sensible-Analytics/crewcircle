import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { createMobileSupabaseClient } from '../../lib/supabase/client.mobile';
import { useAuth } from '../../context/AuthContext';

interface Shift {
  id: string;
  start_time: string;
  end_time: string;
  role_label?: string;
  notes?: string;
  profile_first_name?: string;
  profile_last_name?: string;
}

export default function RosterScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const { user } = useAuth();
  const supabase = createMobileSupabaseClient();

  const fetchShifts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const weekStart = new Date(currentWeekStart);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, tenant_id')
        .eq('id', user.id)
        .single();

      if (!profileData) return;

      const { data: rosterData } = await supabase
        .from('rosters')
        .select('id')
        .eq('tenant_id', profileData.tenant_id)
        .eq('status', 'published')
        .gte('week_start', weekStart.toISOString().split('T')[0])
        .lt('week_start', weekEnd.toISOString().split('T')[0])
        .single();

      if (!rosterData) {
        setShifts([]);
        return;
      }

      const { data: shiftsData, error } = await supabase
        .from('shifts')
        .select(`
          id,
          start_time,
          end_time,
          role_label,
          notes,
          profile_id
        `)
        .eq('roster_id', rosterData.id)
        .eq('profile_id', user.id)
        .is('deleted_at', null)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      const { data: profileInfo } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      const processedShifts = shiftsData?.map(shift => ({
        ...shift,
        profile_first_name: profileInfo?.first_name,
        profile_last_name: profileInfo?.last_name,
      })) || [];
      
      setShifts(processedShifts);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchShifts().then(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchShifts();
  }, [user, currentWeekStart]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return `${hours.toFixed(1)}h`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Roster</Text>
        <Text style={styles.subtitle}>
          {currentWeekStart.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : shifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No shifts scheduled</Text>
            <Text style={styles.emptyText}>Your manager will publish the roster soon.</Text>
          </View>
        ) : (
          <View style={styles.shiftsList}>
            {shifts.map((shift) => (
              <View key={shift.id} style={styles.shiftCard}>
                <View style={styles.shiftHeader}>
                  <Text style={styles.shiftDate}>{formatDate(shift.start_time)}</Text>
                  <Text style={styles.shiftDuration}>
                    {calculateDuration(shift.start_time, shift.end_time)}
                  </Text>
                </View>
                <View style={styles.shiftDetails}>
                  <Text style={styles.shiftTime}>
                    {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                  </Text>
                  {shift.profile_first_name && shift.profile_last_name && (
                    <Text style={styles.shiftRole}>
                      {shift.profile_first_name} {shift.profile_last_name}
                    </Text>
                  )}
                  {shift.notes && (
                    <Text style={styles.shiftNotes}>{shift.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
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
  loader: {
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  shiftsList: {
    padding: 16,
  },
  shiftCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shiftDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  shiftDuration: {
    fontSize: 14,
    color: '#666',
  },
  shiftDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  shiftTime: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 12,
  },
  shiftRole: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  shiftNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    width: '100%',
  },
});