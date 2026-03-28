"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from '@/lib/clerk/useAuth';
import { sql } from '@/lib/neon/client';

interface TimesheetEntry {
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string;
  work_date: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  location_name: string | null;
  is_within_geofence: boolean | null;
  approved_at: string | null;
  approved_by: string | null;
}

export default function TimesheetsPage() {
  const { user, tenantId, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const fetchEntries = useCallback(async () => {
    if (authLoading || !tenantId) return;
    
    setIsLoading(true);
    try {
      const start = dateRange.start.toISOString();
      const end = dateRange.end.toISOString();
      
      const data = await sql`
        WITH paired_events AS (
          SELECT
            ce.profile_id,
            p.first_name,
            p.last_name,
            p.email,
            DATE(ce.recorded_at AT TIME ZONE 'Australia/Melbourne') as work_date,
            MIN(CASE WHEN ce.type = 'clock_in' THEN ce.recorded_at END) as clock_in,
            MAX(CASE WHEN ce.type = 'clock_out' THEN ce.recorded_at END) as clock_out,
            MAX(ce.is_within_geofence) as is_within_geofence,
            MAX(ce.approved_at) as approved_at,
            MAX(ce.approved_by) as approved_by,
            MAX(l.name) as location_name
          FROM clock_events ce
          JOIN profiles p ON p.id = ce.profile_id
          LEFT JOIN locations l ON l.id = ce.location_id
          WHERE p.tenant_id = ${tenantId}
            AND ce.deleted_at IS NULL
            AND ce.recorded_at >= ${start}
            AND ce.recorded_at < ${end}
          GROUP BY ce.profile_id, p.first_name, p.last_name, p.email, work_date
        )
        SELECT 
          profile_id,
          first_name,
          last_name,
          email,
          work_date,
          clock_in,
          clock_out,
          CASE 
            WHEN clock_in IS NOT NULL AND clock_out IS NOT NULL 
            THEN ROUND(EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600, 2)
            ELSE NULL 
          END as total_hours,
          is_within_geofence,
          approved_at,
          approved_by,
          location_name
        FROM paired_events
        ORDER BY last_name, first_name, work_date
      `;
      
      setEntries(data as TimesheetEntry[]);
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, dateRange, authLoading]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const groupedEntries = useMemo(() => {
    const grouped: Record<string, TimesheetEntry[]> = {};
    entries.forEach((entry) => {
      const date = entry.work_date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    });
    return grouped;
  }, [entries]);

  const totalHours = useMemo(() => {
    return entries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
  }, [entries]);

  const handleApprove = async (profileId: string, workDate: string) => {
    if (!user) return;
    try {
      await fetch('/api/timesheets/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, workDate, tenantId }),
      });
      fetchEntries();
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleApproveAll = async () => {
    if (!user) return;
    const unapproved = entries.filter(e => !e.approved_at);
    for (const entry of unapproved) {
      await handleApprove(entry.profile_id, entry.work_date);
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) return;
    
    const headers = 'Employee Name,Email,Date,Start,End,Hours,Location,Geofence,Approved\n';
    const rows = entries.map(entry => {
      const date = entry.work_date ? format(new Date(entry.work_date), 'dd/MM/yyyy') : '';
      const clockIn = entry.clock_in ? format(new Date(entry.clock_in), 'HH:mm') : '';
      const clockOut = entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : 'Open';
      return [
        `"${entry.first_name} ${entry.last_name}"`,
        entry.email,
        date,
        clockIn,
        clockOut,
        entry.total_hours?.toFixed(2) || '',
        `"${entry.location_name || ''}"`,
        entry.is_within_geofence ? 'Yes' : 'No',
        entry.approved_at ? 'Yes' : 'No',
      ].join(',');
    }).join('\n');
    
    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheets-${format(dateRange.start, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || !user) {
    return <div className="p-6">Loading...</div>;
  }

  const unapprovedCount = entries.filter(e => !e.approved_at).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Timesheets</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange({
              start: new Date(dateRange.start.getTime() - 7 * 24 * 60 * 60 * 1000),
              end: new Date(dateRange.end.getTime() - 7 * 24 * 60 * 60 * 1000),
            })}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            ← Previous Week
          </button>
          <button
            onClick={() => setDateRange({
              start: new Date(dateRange.start.getTime() + 7 * 24 * 60 * 60 * 1000),
              end: new Date(dateRange.end.getTime() + 7 * 24 * 60 * 60 * 1000),
            })}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Next Week →
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold">Total: {totalHours.toFixed(1)} hours</span>
            <div className="flex gap-2">
              {unapprovedCount > 0 && (
                <button
                  onClick={handleApproveAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Approve All ({unapprovedCount})
                </button>
              )}
              <button
                onClick={handleExportCSV}
                disabled={entries.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading timesheets...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No timesheet entries found for this period.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <div key={date} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b font-medium text-sm flex justify-between items-center">
                <span>{format(new Date(date), 'EEEE, MMMM d, yyyy')}</span>
                <span className="text-gray-500">
                  {dayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0).toFixed(1)}h
                </span>
              </div>
              <div className="divide-y">
                {dayEntries.map((entry, idx) => (
                  <div key={`${entry.profile_id}-${entry.work_date}`} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                        {entry.first_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-medium">
                          {entry.first_name} {entry.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.location_name || 'No location'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium">
                          {entry.clock_in && format(new Date(entry.clock_in), 'h:mm a')}
                          {entry.clock_out && ` - ${format(new Date(entry.clock_out), 'h:mm a')}`}
                          {!entry.clock_in && <span className="text-gray-400">Not clocked in</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.total_hours?.toFixed(1) || '0'} hours
                          {entry.is_within_geofence && (
                            <span className="ml-2 text-green-600">✓ GPS verified</span>
                          )}
                        </p>
                      </div>
                      {entry.approved_at ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          ✓ Approved
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApprove(entry.profile_id, entry.work_date)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
