import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WorkerAttendance } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileDown, Trash2, UserPlus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DailyTracking() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    workerName: '',
    arrivalTime: '07:00',
    departureTime: '16:00',
    tasks: [] as string[],
    observations: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const attendance = useLiveQuery(() => 
    db.workerAttendance.where('date').equals(formData.date).toArray()
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.workerAttendance.add({
        ...formData,
        synced: 0
      });
      setIsAddOpen(false);
      setFormData({
        ...formData,
        workerName: '',
        observations: '',
        tasks: []
      });
      toast.success('Pointage enregistré');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce pointage ?')) {
      await db.workerAttendance.delete(id);
      toast.success('Pointage supprimé');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`Fiche de Présence - ${format(new Date(formData.date), 'dd MMMM yyyy', { locale: fr })}`, 14, 15);
    
    const tableData = attendance?.map(item => [
      item.workerName,
      item.arrivalTime,
      item.departureTime,
      item.tasks.join(', '),
      item.observations
    ]) || [];

    autoTable(doc, {
      head: [['Ouvrier', 'Arrivée', 'Départ', 'Tâches', 'Observations']],
      body: tableData,
      startY: 25,
    });

    doc.save(`presence_${formData.date}.pdf`);
  };

  const filteredAttendance = attendance?.filter(item => 
    item.workerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Suivi Quotidien</h1>
          <p className="text-green-700">Gestion des présences et tâches du jour</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={generatePDF} variant="outline" className="flex-1 md:flex-none gap-2 border-green-200 text-green-700">
            <FileDown className="h-4 w-4" />
            Exporter PDF
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="flex-1 md:flex-none gap-2 bg-green-600 hover:bg-green-700" />}>
              <UserPlus className="h-4 w-4" />
              Nouveau Pointage
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ajouter un pointage</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'ouvrier</Label>
                  <Input 
                    id="name" 
                    value={formData.workerName} 
                    onChange={e => setFormData({...formData, workerName: e.target.value})}
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="arrival">Heure d'arrivée</Label>
                    <Input 
                      id="arrival" 
                      type="time" 
                      value={formData.arrivalTime} 
                      onChange={e => setFormData({...formData, arrivalTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departure">Heure de départ</Label>
                    <Input 
                      id="departure" 
                      type="time" 
                      value={formData.departureTime} 
                      onChange={e => setFormData({...formData, departureTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tâches assignées</Label>
                  <Select onValueChange={(val) => setFormData({...formData, tasks: [...formData.tasks, val]})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une tâche" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Plantation">Plantation</SelectItem>
                      <SelectItem value="Arrosage">Arrosage</SelectItem>
                      <SelectItem value="Désherbage">Désherbage</SelectItem>
                      <SelectItem value="Entretien Matériel">Entretien Matériel</SelectItem>
                      <SelectItem value="Récolte">Récolte</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tasks.map((t, i) => (
                      <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        {t}
                        <button type="button" onClick={() => setFormData({...formData, tasks: formData.tasks.filter((_, idx) => idx !== i)})}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="obs">Observations</Label>
                  <Input 
                    id="obs" 
                    value={formData.observations} 
                    onChange={e => setFormData({...formData, observations: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Enregistrer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-green-50 bg-green-50/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-semibold text-green-900">
              Présences du {format(new Date(formData.date), 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher un ouvrier..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Input 
                type="date" 
                className="w-auto" 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Ouvrier</TableHead>
                  <TableHead className="font-semibold">Arrivée</TableHead>
                  <TableHead className="font-semibold">Départ</TableHead>
                  <TableHead className="font-semibold">Tâches</TableHead>
                  <TableHead className="font-semibold">Observations</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance && filteredAttendance.length > 0 ? (
                  filteredAttendance.map((item) => (
                    <TableRow key={item.id} className="hover:bg-green-50/50 transition-colors">
                      <TableCell className="font-medium text-green-900">{item.workerName}</TableCell>
                      <TableCell>{item.arrivalTime}</TableCell>
                      <TableCell>{item.departureTime}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.tasks.map((t, i) => (
                            <span key={i} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.observations}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(item.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Aucun pointage pour cette date.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
