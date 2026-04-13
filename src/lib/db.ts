import Dexie, { type Table } from 'dexie';

export interface WorkerAttendance {
  id?: number;
  workerName: string;
  arrivalTime: string;
  departureTime: string;
  tasks: string[];
  observations: string;
  photo?: string;
  date: string;
  synced: number; // 0 for no, 1 for yes
}

export interface WeeklyReport {
  id?: number;
  zoneProgress: Record<string, number>;
  tasksAccomplished: string[];
  problems: string;
  needs: string;
  photos: string[];
  date: string;
  synced: number;
}

export interface Material {
  id?: number;
  name: string;
  serialNumber: string;
  status: 'Bon' | 'Panne' | 'En maintenance';
  lastMaintenance: string;
  nextMaintenance: string;
  synced: number;
}

export interface Task {
  id?: number;
  title: string;
  assignedTo: string[];
  startDate: string;
  endDate: string;
  progress: number;
  synced: number;
}

export interface Training {
  id?: number;
  title: string;
  description: string;
  workers: string[];
  date: string;
  synced: number;
}

export interface Expense {
  id?: number;
  category: 'Matériel' | 'Main d\'œuvre' | 'Transport' | 'Divers';
  amount: number;
  justificationPhoto?: string;
  date: string;
  synced: number;
}

export interface Employee {
  id?: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  photo?: string;
  hiringDate: string;
  status: 'Actif' | 'Inactif';
  synced: number;
}

export class AppDatabase extends Dexie {
  workerAttendance!: Table<WorkerAttendance>;
  weeklyReports!: Table<WeeklyReport>;
  materials!: Table<Material>;
  tasks!: Table<Task>;
  trainings!: Table<Training>;
  expenses!: Table<Expense>;
  employees!: Table<Employee>;

  constructor() {
    super('FermeTchikatangaDB');
    this.version(3).stores({
      workerAttendance: '++id, date, synced',
      weeklyReports: '++id, date, synced',
      materials: '++id, status, synced',
      tasks: '++id, startDate, endDate, synced',
      trainings: '++id, date, synced',
      expenses: '++id, date, category, synced',
      employees: '++id, name, role, status, synced'
    });
  }
}

export const db = new AppDatabase();
