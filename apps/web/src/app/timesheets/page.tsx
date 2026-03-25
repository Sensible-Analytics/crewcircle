"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addDays, subDays, isWithinInterval, parseISO } from 'date-fns';
import { createBrowserSupabaseClient } from '@/packages/supabase/src/client.browser';
import { useAuth } from '@/packages/supabase/src/useAuth';

interface TimesheetEntry {
  id: string;
  profile_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  start_time: string;
  end_time: string | null;
  total_hours: number | null;
  location_id: string | null;
  locations: {
    name: string;
  } | null;
  is_within_geofence: boolean;
  approved_at: string | null;
  approved_by: string | null;
}

export default function TimesheetsPage() {
  const { user } = useAuth();
  const supabase = createBrowserSupabaseClient();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('timesheet_entries')
        .select(`
          *,
          profiles (first_name, last_name, email),
          locations (name)
        `)
        .gte('start_time', dateRange.start.toISOString())
        .lte('start_time', dateRange.end.toISOString())
        .is('deleted_at', null)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setEntries(data as any || []);
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, dateRange]);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('timesheet_entries')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;
      fetchEntries();
    } catch (error) {
      console.error('Error approving timesheet entry:', error);
    }
  };

  const handleApproveAll = async () => {
    try {
      const unapprovedIds = entries
        .filter((e) => !e.approved_at)
        .map((e) => e.id);

      if (unapprovedIds.length === 0) return;

      const { error } = await supabase
        .from('timesheet_entries')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .in('id', unapprovedIds);

      if (error) throw error;
      fetchEntries();
    } catch (error) {
      console.error('Error approving all timesheet entries:', error);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Employee Name',
      'Employee Email',
      'Date',
      'Start Time',
      'End Time',
      'Hours',
      'Location',
      'Approved',
    ];

    const rows = entries.map((e) => [
      `${e.profiles.first_name} ${e.profiles.last_name}`,
      e.profiles.email,
      format(new Date(e.start_time), 'dd/MM/yyyy'),
      format(new Date(e.start_time), 'HH:mm'),
      e.end_time ? format(new Date(e.end_time), 'HH:mm') : 'N/A',
      e.total_hours?.toFixed(2) || '0.00',
      e.locations?.name || 'N/A',
      e.approved_at ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheets_${format(dateRange.start, 'yyyyMMdd')}_${format(dateRange.end, 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Timesheets</h1>
        <div className="flex gap-4">
          <button
            onClick={handleApproveAll}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Approve All
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 items-center">
        <button
          onClick={() => setDateRange({
            start: subDays(dateRange.start, 7),
            end: subDays(dateRange.end, 7),
          })}
          className="p-2 border rounded hover:bg-gray-100"
        >
          &larr; Previous Week
        </button>
        <span className="font-medium">
          {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
        </span>
        <button
          onClick={() => setDateRange({
            start: addDays(dateRange.start, 7),
            end: addDays(dateRange.end, 7),
          })}
          className="p-2 border rounded hover:bg-gray-100"
        >
          Next Week &rarr;
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    No timesheet entries found for this period.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.profiles.first_name} {entry.profiles.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{entry.profiles.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(entry.start_time), 'EEE, MMM d')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(entry.start_time), 'HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.end_time ? format(new Date(entry.end_time), 'HH:mm') : (
                        <span className="text-orange-500 font-medium italic">Still clocked in</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {entry.total_hours?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.locations?.name || 'Unknown'}</div>
                      {!entry.is_within_geofence && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Outside Geofence
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.approved_at ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!entry.approved_at && (
                        <button
                          onClick={() => handleApprove(entry.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
