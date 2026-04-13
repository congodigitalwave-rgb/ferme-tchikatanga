import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wrench, 
  Calendar, 
  GraduationCap, 
  Wallet, 
  LogOut,
  Menu,
  X,
  Sprout,
  Wifi,
  WifiOff,
  RefreshCw,
  UsersRound,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import { useSync } from '@/lib/sync';
import { toast } from 'sonner';

interface NavItem {
  id: string;
  label: string;
  icon: any;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { id: 'personnel', label: 'Personnel', icon: UsersRound },
  { id: 'tracking', label: 'Suivi Quotidien', icon: Users },
  { id: 'reports', label: 'Rapports Hebdo', icon: FileText },
  { id: 'material', label: 'Gestion Matériel', icon: Wrench },
  { id: 'planning', label: 'Planification', icon: Calendar },
  { id: 'training', label: 'Formations', icon: GraduationCap },
  { id: 'expenses', label: 'Dépenses', icon: Wallet },
];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDemo?: boolean;
  onExitDemo?: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, isDemo, onExitDemo }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isOnline, syncing, syncData } = useSync();

  const handleLogout = async () => {
    if (isDemo && onExitDemo) {
      onExitDemo();
      return;
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
    toast.success('Déconnexion réussie');
  };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="space-y-1 px-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setActiveTab(item.id);
            onClick?.();
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === item.id
              ? 'bg-green-600 text-white shadow-lg shadow-green-200'
              : 'text-green-700 hover:bg-green-50'
          }`}
        >
          <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-white' : 'text-green-600'}`} />
          {item.label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-green-100 shadow-sm">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-green-600 p-2 rounded-lg">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-green-900 tracking-tight">Tchikatanga</span>
        </div>
        
        <div className="flex-1 py-4">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-green-50 space-y-4">
          {isDemo && (
            <div className="px-4 py-2 bg-orange-50 border border-orange-100 rounded-lg text-orange-700 text-xs font-bold text-center">
              MODE DÉMO (LOCAL)
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs font-medium text-slate-600">
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
            {isOnline && (
              <button 
                onClick={syncData}
                disabled={syncing}
                className={`p-1 hover:bg-green-100 rounded-full transition-colors ${syncing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="h-4 w-4 text-green-600" />
              </button>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-600 hover:text-green-700 hover:bg-green-50 gap-3"
            onClick={async () => {
              const newPass = prompt('Entrez votre nouveau mot de passe :');
              if (newPass) {
                const { error } = await supabase.auth.updateUser({ password: newPass });
                if (error) toast.error(error.message);
                else toast.success('Mot de passe mis à jour !');
              }
            }}
          >
            <Lock className="h-5 w-5" />
            Changer le mot de passe
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {isDemo ? 'Quitter la Démo' : 'Déconnexion'}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-green-100 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-green-600 p-1.5 rounded-lg">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-green-900">Tchikatanga</span>
        </div>
        
        <div className="flex items-center gap-4">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-green-700">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-r-green-100">
              <div className="p-6 border-b border-green-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-green-600 p-1.5 rounded-lg">
                    <Sprout className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-green-900">Tchikatanga</span>
                </div>
              </div>
              <div className="py-6">
                <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
              </div>
              <div className="absolute bottom-0 w-full p-4 border-t border-green-50">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  {isDemo ? 'Quitter la Démo' : 'Déconnexion'}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
