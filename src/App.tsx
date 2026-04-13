import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Auth from '@/components/Auth';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import DailyTracking from '@/components/DailyTracking';
import WeeklyReports from '@/components/WeeklyReports';
import MaterialManagement from '@/components/MaterialManagement';
import Planning from '@/components/Planning';
import Training from '@/components/Training';
import Expenses from '@/components/Expenses';
import Personnel from '@/components/Personnel';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { format } from 'date-fns';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  public state: any = {
    hasError: false,
    error: null
  };

  constructor(props: any) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-2">Une erreur est survenue</h2>
            <p className="text-red-700 mb-4">L'application n'a pas pu démarrer correctement.</p>
            <div className="bg-red-50 p-4 rounded-lg text-left text-xs font-mono text-red-600 overflow-x-auto mb-4">
              {this.state.error?.toString()}
            </div>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white">
              Recharger l'application
            </Button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(!isSupabaseConfigured);

  useEffect(() => {
    // Seed data if database is empty
    const seedData = async () => {
      const attendanceCount = await db.workerAttendance.count();
      if (attendanceCount === 0) {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        await db.workerAttendance.bulkAdd([
          { workerName: 'Jean Mukendi', arrivalTime: '07:15', departureTime: '16:30', tasks: ['Plantation', 'Arrosage'], observations: 'Bon travail', date: today, synced: 0 },
          { workerName: 'Marie Kabange', arrivalTime: '07:30', departureTime: '16:00', tasks: ['Désherbage'], observations: 'RAS', date: today, synced: 0 },
          { workerName: 'Paul Tshilombo', arrivalTime: '08:00', departureTime: '17:00', tasks: ['Entretien Matériel'], observations: 'Tracteur révisé', date: today, synced: 0 }
        ]);

        await db.materials.bulkAdd([
          { name: 'Tracteur Massey Ferguson', serialNumber: 'MF-2024-001', status: 'Bon', lastMaintenance: '2024-03-01', nextMaintenance: '2024-06-01', synced: 0 },
          { name: 'Motopompe Honda', serialNumber: 'H-500-X', status: 'En maintenance', lastMaintenance: '2024-02-15', nextMaintenance: '2024-05-15', synced: 0 }
        ]);

        await db.tasks.bulkAdd([
          { title: 'Récolte Maïs Zone A', assignedTo: ['Jean', 'Marie'], startDate: today, endDate: '2024-05-20', progress: 45, synced: 0 },
          { title: 'Préparation Sol Zone B', assignedTo: ['Paul'], startDate: today, endDate: '2024-05-25', progress: 10, synced: 0 }
        ]);

        await db.expenses.bulkAdd([
          { category: 'Matériel', amount: 150000, date: today, synced: 0 },
          { category: 'Main d\'œuvre', amount: 75000, date: today, synced: 0 }
        ]);

        await db.employees.bulkAdd([
          { name: 'Jean Mukendi', role: 'Chef de culture', phone: '+243 812 345 678', email: 'jean.m@ferme.com', hiringDate: '2023-01-15', status: 'Actif', synced: 0 },
          { name: 'Marie Kabange', role: 'Responsable Elevage', phone: '+243 822 345 678', email: 'marie.k@ferme.com', hiringDate: '2023-03-10', status: 'Actif', synced: 0 },
          { name: 'Paul Tshilombo', role: 'Mécanicien Agricole', phone: '+243 852 345 678', email: 'paul.t@ferme.com', hiringDate: '2023-06-20', status: 'Actif', synced: 0 }
        ]);
      }
    };

    seedData();

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!session && !demoMode) {
    return (
      <>
        <Auth />
        <Toaster position="top-center" />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'personnel': return <Personnel />;
      case 'tracking': return <DailyTracking />;
      case 'reports': return <WeeklyReports />;
      case 'material': return <MaterialManagement />;
      case 'planning': return <Planning />;
      case 'training': return <Training />;
      case 'expenses': return <Expenses />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isDemo={demoMode}
        onExitDemo={() => setDemoMode(false)}
      >
        {renderContent()}
      </Layout>
      <Toaster position="top-center" />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
