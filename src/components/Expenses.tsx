import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Expense } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Wallet, Trash2, PieChart, TrendingDown, TrendingUp, Search } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReTooltip,
  Legend
} from 'recharts';

export default function Expenses() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Expense>>({
    category: 'Divers',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.expenses.add({
        ...(formData as Expense),
        synced: 0
      });
      setIsAddOpen(false);
      setFormData({
        category: 'Divers',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd')
      });
      toast.success('Dépense enregistrée');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette dépense ?')) {
      await db.expenses.delete(id);
      toast.success('Dépense supprimée');
    }
  };

  const totalExpenses = expenses?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  
  const categoryData = expenses ? Object.entries(
    expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })) : [];

  const COLORS = ['#16a34a', '#2563eb', '#ea580c', '#64748b'];

  const filteredExpenses = expenses?.filter(e => 
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-green-900">Dépenses</h1>
          <p className="text-green-700">Suivi du budget et des coûts opérationnels</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Nouvelle Dépense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enregistrer une dépense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (FCFA)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: parseInt(e.target.value)})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select onValueChange={(val: any) => setFormData({...formData, category: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Matériel">Matériel</SelectItem>
                    <SelectItem value="Main d'œuvre">Main d'œuvre</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Divers">Divers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Enregistrer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="border-b border-slate-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-600" />
                Historique des Dépenses
              </CardTitle>
              <div className="relative w-48 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Filtrer par catégorie..." 
                  className="pl-9 h-9"
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
                    <TableHead>Date</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses && filteredExpenses.length > 0 ? (
                    filteredExpenses.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-sm">{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            item.category === 'Matériel' ? 'bg-blue-100 text-blue-700' :
                            item.category === 'Main d\'œuvre' ? 'bg-green-100 text-green-700' :
                            item.category === 'Transport' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {item.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {item.amount.toLocaleString()} FCFA
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        Aucune dépense enregistrée.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-green-600" />
                Répartition
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                  Pas de données
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-green-600 text-white shadow-lg shadow-green-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-green-100 text-sm font-medium uppercase tracking-wider">Total Dépenses</p>
                <div className="text-3xl font-bold">{totalExpenses.toLocaleString()} FCFA</div>
                <div className="pt-4 flex items-center gap-2 text-green-100 text-xs">
                  <TrendingDown className="h-4 w-4" />
                  <span>-12% par rapport au mois dernier</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
