import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar as CalendarIcon, Trash2, CheckCircle2, Clock, Users, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Planning() {
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
    if (progress === 100) return 'completed';
    
    const end = parseISO(endDate);
    const today = new Date();
    const daysRemaining = differenceInDays(end, today);
    
    if (isPast(end) && progress < 100) return 'overdue';
    if (daysRemaining <= 3) return 'critical';
    return 'normal';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Planification</h1>
          <p className="text-green-700">Calendrier et suivi des activités</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Nouvelle Tâche
            </Button>
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

      <div className="grid grid-cols-1 gap-4">
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => {
            const status = getTaskStatus(task.endDate, task.progress);
            const isCritical = status === 'critical' || status === 'overdue';

            return (
              <Card 
                key={task.id} 
                className={`shadow-sm overflow-hidden transition-all duration-300 ${
                  status === 'overdue' ? 'border-red-500 ring-1 ring-red-500' : 
                  status === 'critical' ? 'border-orange-400 ring-1 ring-orange-400' : 
                  'border-green-100'
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`md:w-48 p-4 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r ${
                    status === 'overdue' ? 'bg-red-50 border-red-100' :
                    status === 'critical' ? 'bg-orange-50 border-orange-100' :
                    'bg-green-50 border-green-100'
                  }`}>
                    {status === 'overdue' ? (
                      <AlertTriangle className="h-8 w-8 text-red-600 mb-2 animate-pulse" />
                    ) : status === 'critical' ? (
                      <Clock className="h-8 w-8 text-orange-600 mb-2" />
                    ) : (
                      <CalendarIcon className="h-8 w-8 text-green-600 mb-2" />
                    )}
                    <p className={`text-xs font-bold uppercase tracking-tighter ${
                      status === 'overdue' ? 'text-red-800' :
                      status === 'critical' ? 'text-orange-800' :
                      'text-green-800'
                    }`}>
                      {format(new Date(task.startDate), 'dd MMM', { locale: fr })}
                    </p>
                    <p className={`text-[10px] ${
                      status === 'overdue' ? 'text-red-600' :
                      status === 'critical' ? 'text-orange-600' :
                      'text-green-600'
                    }`}>au {format(new Date(task.endDate), 'dd MMM', { locale: fr })}</p>
                    
                    {status === 'overdue' && (
                      <span className="mt-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full">EN RETARD</span>
                    ) || status === 'critical' && (
                      <span className="mt-2 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">URGENT</span>
                    )}
                  </div>
                  <div className="flex-1 p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
                          {isCritical && (
                            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Users className="h-3 w-3" />
                          {task.assignedTo.join(', ')}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {task.progress}% complété
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(task.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          task.progress === 100 ? 'bg-green-500' : 
                          status === 'overdue' ? 'bg-red-500' :
                          status === 'critical' ? 'bg-orange-500' :
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
    </div>
  );
}
