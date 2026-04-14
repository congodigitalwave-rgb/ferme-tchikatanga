import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Employee } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  UserPlus, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar, 
  Camera,
  Search,
  User,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Personnel() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    role: '',
    phone: '',
    email: '',
    hiringDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'Actif',
    photo: ''
  });

  const employees = useLiveQuery(() => 
    db.employees.orderBy('name').toArray()
  );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.employees.add({
        ...(formData as Employee),
        synced: 0
      });
      setIsAddOpen(false);
      setFormData({
        name: '',
        role: '',
        phone: '',
        email: '',
        hiringDate: format(new Date(), 'yyyy-MM-dd'),
        status: 'Actif',
        photo: ''
      });
      toast.success('Employé ajouté avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'employé');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cet employé ?')) {
      await db.employees.delete(id);
      toast.success('Employé supprimé');
    }
  };

  const filteredEmployees = employees?.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Gestion du Personnel</h1>
          <p className="text-green-700">Gérez les informations et les coordonnées de vos employés</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="gap-2 bg-green-600 hover:bg-green-700" />}>
            <UserPlus className="h-4 w-4" />
            Ajouter un Employé
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nouvel Employé</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 py-4">
              <div className="flex justify-center mb-4">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                    {formData.photo ? (
                      <img src={formData.photo} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-slate-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-green-600 text-white p-1.5 rounded-full cursor-pointer shadow-lg hover:bg-green-700 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Nom Complet</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Poste / Rôle</Label>
                  <Input 
                    id="role" 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    placeholder="ex: Chef de culture"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val: any) => setFormData({...formData, status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+243..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="hiringDate">Date d'embauche</Label>
                  <Input 
                    id="hiringDate" 
                    type="date"
                    value={formData.hiringDate} 
                    onChange={e => setFormData({...formData, hiringDate: e.target.value})}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Enregistrer l'employé</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Rechercher un employé par nom ou poste..." 
          className="pl-10 bg-white border-green-100"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees && filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => (
            <Card key={emp.id} className="overflow-hidden border-green-100 shadow-sm hover:shadow-md transition-all group">
              <div className="h-2 bg-green-600" />
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                  {emp.photo ? (
                    <img src={emp.photo} alt={emp.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-green-50">
                      <User className="h-8 w-8 text-green-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate text-green-900">{emp.name}</CardTitle>
                  <CardDescription className="font-medium text-green-600">{emp.role}</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(emp.id!)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span>{emp.phone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="truncate">{emp.email || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span>Embauché le {format(new Date(emp.hiringDate), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    emp.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {emp.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Aucun employé trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}
