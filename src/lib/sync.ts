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
    setSyncing(true);

    try {
      // Sync Worker Attendance
      const unsyncedAttendance = await db.workerAttendance.where('synced').equals(0).toArray();
      for (const item of unsyncedAttendance) {
        const { id, synced, ...data } = item;
        const { error } = await supabase.from('worker_attendance').insert(data);
        if (!error) await db.workerAttendance.update(id!, { synced: 1 });
      }

      // Sync Weekly Reports
      const unsyncedReports = await db.weeklyReports.where('synced').equals(0).toArray();
      for (const item of unsyncedReports) {
        const { id, synced, ...data } = item;
        const { error } = await supabase.from('weekly_reports').insert(data);
        if (!error) await db.weeklyReports.update(id!, { synced: 1 });
      }

      // Sync Materials
      const unsyncedMaterials = await db.materials.where('synced').equals(0).toArray();
      for (const item of unsyncedMaterials) {
        const { id, synced, ...data } = item;
        const { error } = await supabase.from('materials').insert(data);
        if (!error) await db.materials.update(id!, { synced: 1 });
      }

      // Sync Tasks
      const unsyncedTasks = await db.tasks.where('synced').equals(0).toArray();
      for (const item of unsyncedTasks) {
        const { id, synced, ...data } = item;
        const { error } = await supabase.from('tasks').insert(data);
        if (!error) await db.tasks.update(id!, { synced: 1 });
      }

      // Sync Trainings
      const unsyncedTrainings = await db.trainings.where('synced').equals(0).toArray();
      for (const item of unsyncedTrainings) {
        const { id, synced, ...data } = item;
        const { error } = await supabase.from('trainings').insert(data);
        if (!error) await db.trainings.update(id!, { synced: 1 });
      }

      // Sync Expenses
      const unsyncedExpenses = await db.expenses.where('synced').equals(0).toArray();
      for (const item of unsyncedExpenses) {
        const { id, synced, ...data } = item;
        const { error } = await supabase.from('expenses').insert(data);
        if (!error) await db.expenses.update(id!, { synced: 1 });
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
