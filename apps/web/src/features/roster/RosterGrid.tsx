"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  KeyboardSensor,
  defaultCoordinates,
  DragOverlay,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRosterStore } from '@/store/rosterStore';
import { Shift } from '@/types/shift';
import { Profile } from '@/types/profile';
import { Roster } from '@/store/rosterStore';
import { Availability } from '@/packages/validators/src/conflicts';

interface ShiftFormData {
  employeeId: string;
  startTime: string;
  endTime: string;
  roleLabel: string;
  notes: string;
}
import { createBrowserSupabaseClient } from '@/packages/supabase/src/client.browser';
import { useAuth } from '@/packages/supabase/src/useAuth';
import { z } from 'zod';
import { shiftSchema } from '@/packages/validators/src/shift';
import { detectConflicts } from '@/packages/validators/src/conflicts';
import { format } from 'date-fns';
import { useRosterRealtime } from './hooks/useRosterRealtime';

// Constants
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Zod schema for shift creation (basic validation)
const shiftCreationSchema = z.object({
  employeeId: z.string(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start time'),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end time'),
  roleLabel: z.string().optional(),
  notes: z.string().optional(),
});

// Shift creation modal component
const ShiftCreationModal: React.FC<{ 
  open: boolean; 
  onClose: () => void; 
  onSave: (shiftData: z.infer<typeof shiftCreationSchema>) => void; 
  employees: Profile[]; 
}> = ({ open, onClose, onSave, employees }) => {
   const [formData, setFormData] = useState<ShiftFormData>({
     employeeId: '',
     startTime: '',
     endTime: '',
     roleLabel: '',
     notes: '',
   });
  const [errors, setErrors] = useState<{ [key: string]: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
       setFormData((prev: ShiftFormData) => ({ ...prev, [name]: value }));
      if (errors && errors[name]) {
        setErrors((prev: { [key: string]: string } | null) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsed = shiftCreationSchema.parse(formData);
      onSave(parsed);
      onClose();
     } catch (err) {
       if (err instanceof z.ZodError) {
         const errorMap: { [key: string]: string } = {};
         err.issues.forEach((issue) => {
           if (issue.path.length > 0) {
             errorMap[issue.path[0] as string] = issue.message;
           }
         });
         setErrors(errorMap);
       } else {
         console.error('Unexpected error:', err);
       }
     } finally {
       setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Shift</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Employee</label>
            <select
              value={formData.employeeId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Select an employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
            {errors?.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            {errors?.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            {errors?.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role Label (optional)</label>
            <input
              type="text"
              value={formData.roleLabel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting || !formData.employeeId || !formData.startTime || !formData.endTime}
            >
              {isSubmitting ? 'Saving...' : 'Save Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RosterGrid: React.FC = () => {
    const store = useRosterStore();
    const profiles: Profile[] = store.profiles;
    const shifts: Shift[] = store.shifts;
    const setShifts = store.setShifts;
    // @ts-expect-error - Supabase client type mismatch with zustand store
    const selectedWeekStart: string = store.selectedWeekStart;
    const setSelectedWeekStart = store.setSelectedWeekStart;
    const loading: boolean = store.loading;
    const roster: Roster | null = store.roster;
    const publishRoster: () => Promise<boolean> = store.publishRoster;
   const unpublishRoster: () => Promise<boolean> = store.unpublishRoster;
   const copyForwardRoster: () => Promise<boolean> = store.copyForwardRoster;
   const operationError: string | null = store.operationError;
   const isOperating: boolean = store.isOperating;
   const setOperationError = store.setOperationError;
  
  const { user, tenantId, isLoading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [modalEmployeeId, setModalEmployeeId] = useState<string>('');
  const [modalDayIndex, setModalDayIndex] = useState<number>(0);

  useRosterRealtime();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverlay, setDragOverlay] = useState<React.ReactNode | null>(null);
  
  // Virtual rows for employees
  const rowVirtualizer = useVirtualizer({
    count: profiles.length,
    getScrollElement: () => null,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Check if roster is published (read-only)
  const isReadOnly = roster?.status === 'published';

   // Handle drag start
   const handleDragStart = (event: { active: { id: string } }) => {
     if (isReadOnly) return; // Disable drag when published
     setActiveId(event.active.id);
   };

   // Handle drag over
   const handleDragOver = (event: { active: { id: string }; over: { id: string } | null }) => {
     const { active, over } = event;
     if (active.id === over?.id) return;
     
     // We'll handle the reordering in drag end for simplicity
   };

   // Handle drag end
   const handleDragEnd = (event: { active: { id: string }; over: { id: string } | null }) => {
     if (isReadOnly) return; // Disable drag when published
     
     const { active, over } = event;
     
     // If we dropped on a different cell, we need to update the shift
    if (over && active.id !== over.id) {
      // Parse the active and over IDs to get employee and day
      // ID format: shift-{shiftId} or cell-{employeeId}-{dayIndex}
      if (active.id.startsWith('shift-') && over.id.startsWith('cell-')) {
        const shiftId = active.id.split('-')[1];
        const [, employeeId, dayIndexStr] = over.id.split('-');
        const dayIndex = parseInt(dayIndexStr, 10);
        
        // Find the shift
        const shiftIndex = shifts.findIndex(s => s.id === shiftId);
        if (shiftIndex !== -1) {
          const shift = shifts[shiftIndex];
          
          // Update the shift to move it to the new day/employee
          // We need to keep the same time but change the day
          // For simplicity, we'll just update the profile_id and adjust the date
          // In a real app, we would have a more sophisticated date/time handling
          const updatedShift = {
            ...shift,
            profile_id: employeeId,
            // We would need to adjust the date to match the new day while keeping the same time
            // This is a simplified version - in reality, we'd need to calculate the correct date
            // based on the selected week and day index
          };

           // Update the shift in the store
           const newShifts = [...shifts];
           newShifts[shiftIndex] = updatedShift;
           setShifts(newShifts);
        }
      }
    }
    
    setActiveId(null);
    setDragOverlay(null);
  };

   // Sensors
   const pointerSensor = useSensor(PointerSensor, {
     activationConstraint: {
       distance: 5,
     },
   });
   
    const keyboardSensor = useSensor(KeyboardSensor);

  // Render a shift item
  const renderShiftItem = (shift: Shift, profile: Profile) => {
    // Find the employee for this shift (should match the profile passed in)
    const employee = profiles.find(p => p.id === shift.profile_id);
    if (!employee) return null;
    
    // Format times for display (in local timezone - we'll use UTC for now)
    const startTime = new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Calculate duration
    const startDate = new Date(shift.start_time);
    const endDate = new Date(shift.end_time);
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    
    return (
      <div
        key={shift.id}
        id={`shift-${shift.id}`}
        role="option"
        aria-label={`Shift for ${employee.first_name} ${employee.last_name} from ${startTime} to ${endTime}`}
        className={`shift-item p-2 bg-blue-50 border border-blue-200 rounded ${isReadOnly ? 'cursor-default' : 'cursor-grab'}`}
      >
        <div className="font-medium text-xs">
          {employee.first_name} {employee.last_name}
        </div>
        <div className="text-xs text-gray-600">
          {startTime} - {endTime}
        </div>
        {shift.role_label && (
          <div className="text-xs text-blue-600 italic">
            {shift.role_label}
          </div>
        )}
        <div className="text-xs text-gray-400">
          {durationHours.toFixed(1)}h
        </div>
      </div>
    );
  };

  // Render a cell (droppable area)
  const renderCell = (employeeId: string, dayIndex: number) => {
    // Find shifts for this employee on this day
    const dayShifts = shifts.filter(shift => 
      shift.profile_id === employeeId && 
      !shift.deleted_at &&
      getDayFromTimestamp(shift.start_time) === dayIndex
    );
    
    // We'll assume at most one shift per day per employee for simplicity
    const shift = dayShifts[0];
    
    // Find the employee
    const employee = profiles.find(p => p.id === employeeId);
    if (!employee) return null;
    
    // Determine if this cell is active (being dragged over)
    const isActive = activeId === `cell-${employeeId}-${dayIndex}`;
    
    return (
      <div
        key={`${employeeId}-${dayIndex}`}
        id={`cell-${employeeId}-${dayIndex}`}
        role="option"
        aria-label={`Cell for ${employee.first_name} ${employee.last_name} on ${DAYS_OF_WEEK[dayIndex]}`}
        className={`cell h-full border border-gray-200 rounded flex flex-col items-center justify-center p-2 
          ${isActive ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`
        }
        data-day={dayIndex}
        data-employee-id={employeeId}
      >
        {shift ? (
          renderShiftItem(shift, employee)
        ) : (
          <div className="text-center text-xs text-gray-400">
            <button
              onClick={() => {
                if (isReadOnly) return; // Disable when published
                // Open shift creation modal for this employee and day
                setModalEmployeeId(employeeId);
                setModalDayIndex(dayIndex);
                setOpenShiftModal(true);
              }}
              className={`add-shift-btn p-1 rounded border border-dashed border-gray-400 ${
                isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
              disabled={isReadOnly}
            >
              +
            </button>
          </div>
        )}
      </div>
    );
  };

  // Helper function to get day of week from timestamp
  const getDayFromTimestamp = (timestamp: string): number => {
    const date = new Date(timestamp);
    return date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  };

   // Week navigation
   const goToPreviousWeek = () => {
     const newDate = new Date(selectedWeekStart);
     newDate.setDate(newDate.getDate() - 7);
     setSelectedWeekStart(newDate.toISOString().split('T')[0]);
   };

   const goToNextWeek = () => {
     const newDate = new Date(selectedWeekStart);
     newDate.setDate(newDate.getDate() + 7);
     setSelectedWeekStart(newDate.toISOString().split('T')[0]);
   };

  const weekStart = new Date(selectedWeekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const dateRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  // Handle publish with confirmation
  const handlePublish = async () => {
    if (window.confirm('Are you sure you want to publish this roster? Shifts will become read-only.')) {
      const success = await publishRoster();
      if (!success && operationError) {
        alert(operationError);
      }
    }
  };

  // Handle unpublish with confirmation
  const handleUnpublish = async () => {
    if (window.confirm('Are you sure you want to unpublish this roster? Shifts will become editable again.')) {
      const success = await unpublishRoster();
      if (!success && operationError) {
        alert(operationError);
      }
    }
  };

  // Handle copy forward with confirmation
  const handleCopyForward = async () => {
    if (window.confirm('Copy shifts from this roster to the next week?')) {
      const success = await copyForwardRoster();
      if (!success && operationError) {
        alert(operationError);
      }
    }
  };

  // Auto-save draft roster to Supabase (debounced, every 5 seconds)
  useEffect(() => {
    // Only proceed if we have auth data and shifts
    if (authLoading || !user || !tenantId) return;

    let saveTimeout: NodeJS.Timeout;
    const saveRoster = async () => {
      try {
        setIsSaving(true);
        const supabase = createBrowserSupabaseClient();

        // Get or create a draft roster for the current week and tenant
        const { data: roster, error: rosterError } = await supabase
          .from('rosters')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('week_start', selectedWeekStart)
          .eq('status', 'draft')
          .single();

        if (rosterError && rosterError.code === 'PGRST116') {
          // No roster found, create one
          const { data: newRoster, error: insertError } = await supabase
            .from('rosters')
            .insert([
              {
                tenant_id: tenantId,
                week_start: selectedWeekStart,
                status: 'draft',
              }
            ])
            .select();

         if (insertError) throw insertError;
           roster = newRoster[0];
         } else if (rosterError) {
           throw rosterError;
         }

         // Make sure we have a roster
         if (!roster) {
           throw new Error('Roster is null');
         }

         const rosterId = roster.id;

        // Delete existing shifts for this roster
        const { error: deleteError } = await supabase
          .from('shifts')
          .delete()
          .eq('roster_id', rosterId);

        if (deleteError) throw deleteError;

        // Insert the new shifts
        const shiftsToInsert = shifts.map(shift => ({
          tenant_id: tenantId,
          roster_id: rosterId,
          profile_id: shift.profile_id,
          start_time: shift.start_time,
          end_time: shift.end_time,
          role_label: shift.role_label,
          notes: shift.notes,
        }));

        const { error: insertError } = await supabase
          .from('shifts')
          .insert(shiftsToInsert);

        if (insertError) throw insertError;

        console.log('Roster saved successfully');
      } catch (error) {
        console.error('Failed to save roster:', error);
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce the save function
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveRoster, 5000);
    };

    debouncedSave();

    return () => {
      clearTimeout(saveTimeout);
    };
  }, [shifts, selectedWeekStart, user, tenantId, authLoading, isSaving]);

  // Handle saving a shift from the modal
  const handleSaveShift = async (shiftData: z.infer<typeof shiftCreationSchema>) => {
    if (isReadOnly) {
      alert('Cannot add shifts to a published roster.');
      return;
    }

    try {
      // Validate the shift data
      const validated = shiftSchema.parse({
        ...shiftData,
        tenant_id: tenantId || "",
        profile_id: shiftData.employeeId,
      });

       // TODO: Fetch availability and calculate weekly hours from Supabase or store
       // For now, we'll use empty arrays and maps - this should be implemented properly
       const availability: Availability[] = [];
       const weeklyHoursMap = new Map<string, { profile_id: string; week_start: string; total_hours: number }>();
       const lastShiftEnd = null; // TODO: Get last shift end time for this employee

      // Check for conflicts
      const conflictResult = detectConflicts(validated, shifts, availability, weeklyHoursMap, lastShiftEnd);
      if (conflictResult.hasConflict) {
        // Show conflict warning but allow override (soft mode)
        if (!window.confirm(`Conflict detected: ${conflictResult.message}\n\nDo you want to add this shift anyway?`)) {
          return;
        }
      }

       // Create the shift via Supabase
       const supabase = createBrowserSupabaseClient();
       const { data: newShift, error: insertError } = await supabase
         .from('shifts')
         .insert({
           ...validated,
           tenant_id: tenantId || "",
           profile_id: shiftData.employeeId,
         })
         .select()
         .single();

       if (insertError) throw insertError;

       // Add the shift to the store (optimistic update)
       setShifts([...shifts, newShift]);

      // Close the modal
      setOpenShiftModal(false);
      setModalEmployeeId("");
      setModalDayIndex(0);

      // Note: The auto-save effect will trigger because shifts changed,
      // and it will save the entire roster (including this new shift) to Supabase.
    } catch (error) {
      console.error("Failed to save shift:", error);
      alert("Failed to save shift. Please try again.");
    }
  };

  return (
    <div className="roster-grid p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousWeek}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              ← Previous
            </button>
            <span className="font-medium">{dateRange}</span>
            <button
              onClick={goToNextWeek}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              Next →
            </button>
          </div>

          {isReadOnly && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Read Only
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {roster?.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={isOperating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOperating ? 'Publishing...' : 'Publish'}
            </button>
          )}
          {roster?.status === 'published' && (
            <>
              <button
                onClick={handleUnpublish}
                disabled={isOperating}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOperating ? 'Unpublishing...' : 'Unpublish'}
              </button>
              <button
                onClick={handleCopyForward}
                disabled={isOperating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOperating ? 'Copying...' : 'Copy Forward'}
              </button>
            </>
          )}
        </div>
        
        {operationError && (
          <div className="mt-2 p-2 bg-red-100 text-red-800 text-sm rounded-md">
            {operationError}
            <button
              onClick={() => setOperationError(null)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading roster...</p>
        </div>
      )}

      {!loading && (
        <DndContext
          sensors={[pointerSensor, keyboardSensor]}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-[200px_repeat(7,1fr)] gap-1">
            <div className="font-semibold p-2 bg-gray-100 rounded">Employee</div>
            {DAYS_OF_WEEK.map((day, index) => (
              <div key={day} className="font-semibold p-2 bg-gray-100 text-center rounded">
                {day}
              </div>
            ))}

            {profiles.map((profile) => (
              <React.Fragment key={profile.id}>
                <div className="p-2 bg-gray-50 border-t flex items-center">
                  <div className="font-medium">
                    {profile.first_name} {profile.last_name}
                  </div>
                </div>
                {DAYS_OF_WEEK.map((_, dayIndex) => (
                  <div key={`${profile.id}-${dayIndex}`} className="min-h-[80px]">
                    {renderCell(profile.id, dayIndex)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </DndContext>
      )}

      <ShiftCreationModal
        open={openShiftModal}
        onClose={() => setOpenShiftModal(false)}
        onSave={handleSaveShift}
        employees={profiles}
      />

      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
        {isSaving && <span>Saving...</span>}
        {roster && (
          <span>
            Status: <span className="font-medium capitalize">{roster.status}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default RosterGrid;