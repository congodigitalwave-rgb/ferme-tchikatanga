import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertTriangle,
  LayoutList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  format, 
  differenceInDays, 
  isPast, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Planning() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    assignedTo: [],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    progress: 0
  });

  const tasks = useLiveQuery(() => db.tasks.orderBy('startDate').toArray());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.tasks.add({
        ...(formData as Task),
        synced: 0
      });
      setIsAddOpen(false);
      setFormData({
        title: '',
        assignedTo: [],
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        progress: 0
      });
      toast.success('Tâche planifiée');
    } catch (error) {
      toast.error('Erreur lors de la planification');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette tâche ?')) {
      await db.tasks.delete(id);
      toast.success('Tâche supprimée');
    }
  };

  const updateProgress = async (id: number, progress: number) => {
    await db.tasks.update(id, { progress });
    toast.success('Progression mise à jour');
  };

  const getTaskStatus = (endDate: string, progress: number) => {
    const end = parseISO(endDate);
    const today = new Date();
    const daysRemaining = differenceInDays(end, today);

    if (progress === 100) return { type: 'completed', days: daysRemaining };
    if (isPast(end) && progress < 100) return { type: 'overdue', days: daysRemaining };
    if (daysRemaining <= 3 && progress < 100) return { type: 'critical', days: daysRemaining };
    return { type: 'normal', days: daysRemaining };
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return (
      <Card className="shadow-sm border-green-100 overflow-hidden">
        <CardHeader className="bg-green-50/50 border-b border-green-100 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-green-900 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 border-green-200 text-green-700 hover:bg-green-100"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 border-green-200 text-green-700 hover:bg-green-100"
                onClick={() => setCurrentMonth(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 border-green-200 text-green-700 hover:bg-green-100"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-green-100">
            {weekDays.map(day => (
              <div key={day} className="py-2 text-center text-[10px] font-bold text-green-800 uppercase bg-green-50/30">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayTasks = tasks?.filter(task => {
                const start = parseISO(task.startDate);
                const end = parseISO(task.endDate);
                return (isSameDay(day, start) || isSameDay(day, end) || (day > start && day < end));
              }) || [];

              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, monthStart);

              return (
                <div 
                  key={idx} 
                  className={`min-h-[100px] p-1 border-r border-b border-green-50 transition-colors hover:bg-green-50/20 ${
                    !isCurrentMonth ? 'bg-slate-50/50 opacity-40' : ''
                  } ${isToday ? 'bg-green-50/30' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      isToday ? 'bg-green-600 text-white' : 'text-slate-600'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => {
                      const status = getTaskStatus(task.endDate, task.progress);
                      return (
                        <div 
                          key={task.id} 
                          className={`text-[9px] p-1 rounded truncate border-l-2 shadow-sm ${
                            status.type === 'overdue' ? 'bg-red-100 text-red-800 border-red-500' :
                            status.type === 'critical' ? 'bg-orange-100 text-orange-800 border-orange-500' :
                            task.progress === 100 ? 'bg-green-100 text-green-800 border-green-500' :
                            'bg-blue-100 text-blue-800 border-blue-500'
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div className="text-[8px] text-center text-slate-400 font-medium">
                        + {dayTasks.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Planification</h1>
          <p className="text-green-700">Calendrier et suivi des activités</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={`h-8 gap-2 ${view === 'list' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setView('list')}
            >
              <LayoutList className="h-4 w-4" />
              Liste
            </Button>
            <Button 
              variant={view === 'calendar' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={`h-8 gap-2 ${view === 'calendar' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setView('calendar')}
            >
              <CalendarIcon className="h-4 w-4" />
              Calendrier
            </Button>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="gap-2 bg-green-600 hover:bg-green-700 flex-1 sm:flex-none" />}>
              <Plus className="h-4 w-4" />
              Nouvelle Tâche
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Planifier une activité</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'activité</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Date début</Label>
                  <Input 
                    id="start" 
                    type="date" 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Date fin</Label>
                  <Input 
                    id="end" 
                    type="date" 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workers">Assigné à (séparés par virgule)</Label>
                <Input 
                  id="workers" 
                  placeholder="Jean, Paul, Marie"
                  onChange={e => setFormData({...formData, assignedTo: e.target.value.split(',').map(s => s.trim())})}
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Planifier</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    {view === 'calendar' ? (
        renderCalendar()
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => {
            const status = getTaskStatus(task.endDate, task.progress);
            const isCritical = status.type === 'critical' || status.type === 'overdue';

            return (
              <Card 
                key={task.id} 
                className={`shadow-sm overflow-hidden transition-all duration-300 border-l-4 ${
                  status.type === 'overdue' ? 'border-l-red-600 border-red-200 bg-red-50/30' : 
                  status.type === 'critical' ? 'border-l-orange-500 border-orange-200 bg-orange-50/30' : 
                  'border-l-green-500 border-green-100'
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`md:w-48 p-4 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r ${
                    status.type === 'overdue' ? 'bg-red-50/50 border-red-100' :
                    status.type === 'critical' ? 'bg-orange-50/50 border-orange-100' :
                    'bg-green-50 border-green-100'
                  }`}>
                    {status.type === 'overdue' ? (
                      <AlertTriangle className="h-8 w-8 text-red-600 mb-2 animate-pulse" />
                    ) : status.type === 'critical' ? (
                      <Clock className="h-8 w-8 text-orange-600 mb-2" />
                    ) : (
                      <CalendarIcon className="h-8 w-8 text-green-600 mb-2" />
                    )}
                    <p className={`text-xs font-bold uppercase tracking-tighter ${
                      status.type === 'overdue' ? 'text-red-800' :
                      status.type === 'critical' ? 'text-orange-800' :
                      'text-green-800'
                    }`}>
                      {format(new Date(task.startDate), 'dd MMM', { locale: fr })}
                    </p>
                    <p className={`text-[10px] ${
                      status.type === 'overdue' ? 'text-red-600' :
                      status.type === 'critical' ? 'text-orange-600' :
                      'text-green-600'
                    }`}>au {format(new Date(task.endDate), 'dd MMM', { locale: fr })}</p>
                    
                    {status.type === 'overdue' && (
                      <span className="mt-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full">EN RETARD</span>
                    )}
                    {status.type === 'critical' && (
                      <span className="mt-2 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">URGENT</span>
                    )}
                  </div>
                  <div className="flex-1 p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
                          {isCritical && (
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Users className="h-3 w-3" />
                            {task.assignedTo.join(', ')}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {task.progress}% complété
                          </div>
                          {status.type === 'critical' && (
                            <div className="text-[10px] font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                              Finit dans {status.days} {status.days > 1 ? 'jours' : 'jour'}
                            </div>
                          )}
                          {status.type === 'overdue' && (
                            <div className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                              Retard de {Math.abs(status.days)} {Math.abs(status.days) > 1 ? 'jours' : 'jour'}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => handleDelete(task.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-700 ease-out ${
                            task.progress === 100 ? 'bg-green-500' : 
                            status.type === 'overdue' ? 'bg-red-500' :
                            status.type === 'critical' ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`} 
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    <div className="flex justify-between">
                      <div className="flex gap-1">
                        {[0, 25, 50, 75, 100].map((p) => (
                          <button
                            key={p}
                            onClick={() => updateProgress(task.id!, p)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                              task.progress === p 
                                ? 'bg-slate-800 text-white border-slate-800' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                      {task.progress === 100 && (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                          <CheckCircle2 className="h-4 w-4" />
                          Terminé
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune tâche planifiée.</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
