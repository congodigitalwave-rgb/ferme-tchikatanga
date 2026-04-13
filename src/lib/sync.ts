import { useEffect, useState } from 'react';
import { db } from './db';
import { supabase } from './supabase';

export function useSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    if (!isOnline || syncing || !supabase) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSyncing(true);

    try {
      // Sync Worker Attendance
      const unsyncedAttendance = await db.workerAttendance.where('synced').equals(0).toArray();
      for (const item of unsyncedAttendance) {
        const { id, synced, workerName, arrivalTime, departureTime, ...rest } = item;
        const data = {
          ...rest,
          worker_name: workerName,
          arrival_time: arrivalTime,
          departure_time: departureTime,
          user_id: user.id
        };
        const { error } = await supabase.from('worker_attendance').insert(data);
        if (!error) await db.workerAttendance.update(id!, { synced: 1 });
      }

      // Sync Weekly Reports
      const unsyncedReports = await db.weeklyReports.where('synced').equals(0).toArray();
      for (const item of unsyncedReports) {
        const { id, synced, zoneProgress, tasksAccomplished, ...rest } = item;
        const data = {
          ...rest,
          zone_progress: zoneProgress,
          tasks_accomplished: tasksAccomplished,
          user_id: user.id
        };
        const { error } = await supabase.from('weekly_reports').insert(data);
        if (!error) await db.weeklyReports.update(id!, { synced: 1 });
      }

      // Sync Materials
      const unsyncedMaterials = await db.materials.where('synced').equals(0).toArray();
      for (const item of unsyncedMaterials) {
        const { id, synced, serialNumber, lastMaintenance, nextMaintenance, ...rest } = item;
        const data = {
          ...rest,
          serial_number: serialNumber,
          last_maintenance: lastMaintenance,
          next_maintenance: nextMaintenance,
          user_id: user.id
        };
        const { error } = await supabase.from('materials').insert(data);
        if (!error) await db.materials.update(id!, { synced: 1 });
      }

      // Sync Tasks
      const unsyncedTasks = await db.tasks.where('synced').equals(0).toArray();
      for (const item of unsyncedTasks) {
        const { id, synced, assignedTo, startDate, endDate, ...rest } = item;
        const data = {
          ...rest,
          assigned_to: assignedTo,
          start_date: startDate,
          end_date: endDate,
          user_id: user.id
        };
        const { error } = await supabase.from('tasks').insert(data);
        if (!error) await db.tasks.update(id!, { synced: 1 });
      }

      // Sync Trainings
      const unsyncedTrainings = await db.trainings.where('synced').equals(0).toArray();
      for (const item of unsyncedTrainings) {
        const { id, synced, ...rest } = item;
        const data = {
          ...rest,
          user_id: user.id
        };
        const { error } = await supabase.from('trainings').insert(data);
        if (!error) await db.trainings.update(id!, { synced: 1 });
      }

      // Sync Expenses
      const unsyncedExpenses = await db.expenses.where('synced').equals(0).toArray();
      for (const item of unsyncedExpenses) {
        const { id, synced, justificationPhoto, ...rest } = item;
        const data = {
          ...rest,
          justification_photo: justificationPhoto,
          user_id: user.id
        };
        const { error } = await supabase.from('expenses').insert(data);
        if (!error) await db.expenses.update(id!, { synced: 1 });
      }

      // Sync Employees
      const unsyncedEmployees = await db.employees.where('synced').equals(0).toArray();
      for (const item of unsyncedEmployees) {
        const { id, synced, hiringDate, ...rest } = item;
        const data = {
          ...rest,
          hiring_date: hiringDate,
          user_id: user.id
        };
        const { error } = await supabase.from('employees').insert(data);
        if (!error) await db.employees.update(id!, { synced: 1 });
      }

    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      syncData();
    }
  }, [isOnline]);

  return { isOnline, syncing, syncData };
}
