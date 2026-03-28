"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from '@/lib/clerk/useAuth';
import { sql } from '@/lib/neon/client';

interface TimesheetEntry {
  id: string;
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string;
  start_time: string;
  end_time: string | null;
  total_hours: number | null;
  location_name: string | null;
  is_within_geofence: boolean;
  approved_at: string | null;
}

export default function TimesheetsPage() {
  const { user, tenantId, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  useEffect(() => {
    async function fetchEntries() {
      if (authLoading || !tenantId) return;
      
      setIsLoading(true);
      try {
        const start = dateRange.start.toISOString();
        const end = dateRange.end.toISOString();
        
        const data = await sql`
          SELECT 
            te.id,
            te.profile_id,
            p.first_name,
            p.last_name,
            p.email,
            te.start_time,
            te.end_time,
            te.total_hours,
            l.name as location_name,
            te.is_within_geofence,
            te.approved_at
          FROM timesheet_entries te
          JOIN profiles p ON te.profile_id = p.id
          LEFT JOIN locations l ON te.location_id = l.id
          WHERE p.tenant_id = ${tenantId}
            AND te.start_time >= ${start}
            AND te.start_time <= ${end}
            AND te.deleted_at IS NULL
          ORDER BY te.start_time DESC
        `;
        
        setEntries(data as TimesheetEntry[]);
      } catch (error) {
        console.error('Error fetching timesheet entries:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntries();
  }, [tenantId, dateRange, authLoading]);

  const groupedEntries = useMemo(() => {
    const grouped: Record<string, TimesheetEntry[]> = {};
    entries.forEach((entry) => {
      const date = format(new Date(entry.start_time), 'yyyy-MM-dd');
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    });
    return grouped;
  }, [entries]);

  const totalHours = useMemo(() => {
    return entries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
  }, [entries]);

  if (authLoading || !user) {
    return <div className="p-6">Loading...</div>;
  }

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
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
          </span>
          <span className="font-semibold">Total: {totalHours.toFixed(1)} hours</span>
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
              <div className="bg-gray-50 px-4 py-2 border-b font-medium text-sm">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="divide-y">
                {dayEntries.map((entry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between">
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
                    <div className="text-right">
                      <p className="font-medium">
                        {entry.start_time && format(new Date(entry.start_time), 'h:mm a')}
                        {entry.end_time && ` - ${format(new Date(entry.end_time), 'h:mm a')}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {entry.total_hours?.toFixed(1) || '0'} hours
                        {entry.is_within_geofence && (
                          <span className="ml-2 text-green-600">✓ GPS verified</span>
                        )}
                      </p>
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
