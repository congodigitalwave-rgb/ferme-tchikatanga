import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Trash2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function WeeklyReports() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    zoneProgress: { 'Zone A': 0, 'Zone B': 0, 'Zone C': 0 },
    tasksAccomplished: [] as string[],
    problems: '',
    needs: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const reports = useLiveQuery(() => db.weeklyReports.orderBy('date').reverse().toArray());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.weeklyReports.add({
        ...formData,
        photos: [],
        synced: 0
      });
      setIsAddOpen(false);
      toast.success('Rapport enregistré');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce rapport ?')) {
      await db.weeklyReports.delete(id);
      toast.success('Rapport supprimé');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Rapports Hebdomadaires</h1>
          <p className="text-green-700">Suivi de l'avancement et planification</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Nouveau Rapport
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un rapport hebdomadaire</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-6 py-4">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Avancement par Zone (%)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.keys(formData.zoneProgress).map((zone) => (
                    <div key={zone} className="space-y-2">
                      <Label htmlFor={zone}>{zone}</Label>
                      <Input 
                        id={zone} 
                        type="number" 
                        min="0" 
                        max="100"
                        value={formData.zoneProgress[zone as keyof typeof formData.zoneProgress]}
                        onChange={e => setFormData({
                          ...formData, 
                          zoneProgress: {...formData.zoneProgress, [zone]: parseInt(e.target.value)}
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Tâches Accomplies</Label>
                <div className="flex gap-2">
                  <Input id="newTask" placeholder="Ajouter une tâche..." onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value;
                      if (val) {
                        setFormData({...formData, tasksAccomplished: [...formData.tasksAccomplished, val]});
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }} />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tasksAccomplished.map((t, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      {t}
                      <button type="button" onClick={() => setFormData({...formData, tasksAccomplished: formData.tasksAccomplished.filter((_, idx) => idx !== i)})}>
                        <CheckCircle2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problems" className="text-base font-semibold">Problèmes Rencontrés</Label>
                <Textarea 
                  id="problems" 
                  placeholder="Décrivez les difficultés..."
                  value={formData.problems}
                  onChange={e => setFormData({...formData, problems: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="needs" className="text-base font-semibold">Besoins Semaine Prochaine</Label>
                <Textarea 
                  id="needs" 
                  placeholder="Matériel, main d'œuvre, etc."
                  value={formData.needs}
                  onChange={e => setFormData({...formData, needs: e.target.value})}
                />
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 py-6">
                Enregistrer le Rapport
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports && reports.length > 0 ? (
          reports.map((report) => (
            <Card key={report.id} className="overflow-hidden border-green-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-green-50/50 border-b border-green-100">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg text-green-900">
                      Rapport du {format(new Date(report.date), 'dd MMMM yyyy', { locale: fr })}
                    </CardTitle>
                    <CardDescription>Ferme Tchikatanga - Congo</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2 border-green-200 text-green-700">
                      <Send className="h-4 w-4" />
                      Envoyer
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(report.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Avancement Zones</h4>
                    <div className="space-y-3">
                      {Object.entries(report.zoneProgress).map(([zone, progress]) => (
                        <div key={zone} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{zone}</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Tâches Accomplies</h4>
                    <ul className="space-y-2">
                      {report.tasksAccomplished.map((task, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Alertes & Besoins</h4>
                    <div className="space-y-3">
                      {report.problems && (
                        <div className="flex gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700">{report.problems}</p>
                        </div>
                      )}
                      {report.needs && (
                        <div className="flex gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <FileText className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-700">{report.needs}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun rapport hebdomadaire enregistré.</p>
            <Button variant="link" className="text-green-600" onClick={() => setIsAddOpen(true)}>
              Créer votre premier rapport
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
