import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Training } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, GraduationCap, Trash2, CheckCircle2, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Training() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Training>>({
    title: '',
    description: '',
    workers: [],
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const trainings = useLiveQuery(() => db.trainings.orderBy('date').reverse().toArray());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.trainings.add({
        ...(formData as Training),
        synced: 0
      });
      setIsAddOpen(false);
      setFormData({
        title: '',
        description: '',
        workers: [],
        date: format(new Date(), 'yyyy-MM-dd')
      });
      toast.success('Formation enregistrée');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette formation ?')) {
      await db.trainings.delete(id);
      toast.success('Formation supprimée');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Formations</h1>
          <p className="text-green-700">Développement des compétences des ouvriers</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Nouvelle Formation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enregistrer une formation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du module</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description / Objectifs</Label>
                <Textarea 
                  id="desc" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date de la session</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workers">Ouvriers formés (séparés par virgule)</Label>
                <Input 
                  id="workers" 
                  placeholder="Jean, Paul, Marie"
                  onChange={e => setFormData({...formData, workers: e.target.value.split(',').map(s => s.trim())})}
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trainings && trainings.length > 0 ? (
          trainings.map((item) => (
            <Card key={item.id} className="border-green-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-green-600" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(item.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl mt-4 text-green-900">{item.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Le {format(new Date(item.date), 'dd MMMM yyyy', { locale: fr })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                <div className="pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ouvriers Formés ({item.workers.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.workers.map((worker, i) => (
                      <span key={i} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {worker}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucune formation enregistrée.</p>
          </div>
        )}
      </div>
    </div>
  );
}
