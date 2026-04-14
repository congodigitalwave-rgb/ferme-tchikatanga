import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Material } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Wrench, Trash2, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function MaterialManagement() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Material>>({
    name: '',
    serialNumber: '',
    status: 'Bon',
    lastMaintenance: format(new Date(), 'yyyy-MM-dd'),
    nextMaintenance: format(addDays(new Date(), 30), 'yyyy-MM-dd')
  });

  const materials = useLiveQuery(() => db.materials.toArray());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.materials.add({
        ...(formData as Material),
        synced: 0
      });
      setIsAddOpen(false);
      setFormData({
        name: '',
        serialNumber: '',
        status: 'Bon',
        lastMaintenance: format(new Date(), 'yyyy-MM-dd'),
        nextMaintenance: format(addDays(new Date(), 30), 'yyyy-MM-dd')
      });
      toast.success('Matériel ajouté');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cet équipement ?')) {
      await db.materials.delete(id);
      toast.success('Équipement supprimé');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Bon': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Bon État</Badge>;
      case 'Panne': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">En Panne</Badge>;
      case 'En maintenance': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Maintenance</Badge>;
      default: return null;
    }
  };

  const filteredMaterials = materials?.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Gestion Matériel</h1>
          <p className="text-green-700">Inventaire et maintenance des équipements</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="gap-2 bg-green-600 hover:bg-green-700" />}>
            <Plus className="h-4 w-4" />
            Ajouter Matériel
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouvel équipement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'équipement</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial">Numéro de série</Label>
                <Input 
                  id="serial" 
                  value={formData.serialNumber} 
                  onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>État actuel</Label>
                <Select onValueChange={(val: any) => setFormData({...formData, status: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir l'état" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bon">Bon État</SelectItem>
                    <SelectItem value="Panne">En Panne</SelectItem>
                    <SelectItem value="En maintenance">En maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="last">Dernier entretien</Label>
                  <Input 
                    id="last" 
                    type="date" 
                    value={formData.lastMaintenance} 
                    onChange={e => setFormData({...formData, lastMaintenance: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next">Prochain entretien</Label>
                  <Input 
                    id="next" 
                    type="date" 
                    value={formData.nextMaintenance} 
                    onChange={e => setFormData({...formData, nextMaintenance: e.target.value})}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">En Bon État</p>
                <p className="text-2xl font-bold text-green-900">
                  {materials?.filter(m => m.status === 'Bon').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700 font-medium">En Maintenance</p>
                <p className="text-2xl font-bold text-orange-900">
                  {materials?.filter(m => m.status === 'En maintenance').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700 font-medium">En Panne</p>
                <p className="text-2xl font-bold text-red-900">
                  {materials?.filter(m => m.status === 'Panne').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-semibold">Inventaire des Équipements</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Équipement</TableHead>
                  <TableHead>N° Série</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Dernier Entretien</TableHead>
                  <TableHead>Prochain Entretien</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials && filteredMaterials.length > 0 ? (
                  filteredMaterials.map((item) => {
                    const isUrgent = isBefore(new Date(item.nextMaintenance), addDays(new Date(), 7));
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-slate-500 font-mono text-xs">{item.serialNumber || '-'}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-sm">{format(new Date(item.lastMaintenance), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            {format(new Date(item.nextMaintenance), 'dd/MM/yyyy')}
                            {isUrgent && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                          </div>
                        </TableCell>
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
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Aucun équipement dans l'inventaire.
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
