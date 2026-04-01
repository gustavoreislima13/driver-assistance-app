import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatISO, parseISO, isSameDay } from 'date-fns';
import { DollarSign, PlusCircle, TrendingDown, TrendingUp, Settings } from 'lucide-react';
import { AppType, ExpenseCategory } from '../types';

export const Finances = () => {
  const { rides, expenses, fixedExpenses, addRide, addExpense, updateFixedExpenses } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'receitas' | 'despesas' | 'fixas'>('receitas');
  
  // Form states
  const [rideApp, setRideApp] = useState<AppType>('Uber');
  const [rideEarnings, setRideEarnings] = useState('');
  const [rideKm, setRideKm] = useState('');
  const [rideDuration, setRideDuration] = useState('');

  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Combustível');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const [fixedIns, setFixedIns] = useState(fixedExpenses.insurance.toString());
  const [fixedIpva, setFixedIpva] = useState(fixedExpenses.ipva.toString());
  const [fixedInt, setFixedInt] = useState(fixedExpenses.internet.toString());
  const [fixedMaint, setFixedMaint] = useState(fixedExpenses.maintenanceReservePerKm.toString());

  useEffect(() => {
    const handleOpenRide = () => setActiveTab('receitas');
    const handleOpenExpense = () => setActiveTab('despesas');
    
    window.addEventListener('open-add-ride', handleOpenRide);
    window.addEventListener('open-add-expense', handleOpenExpense);
    
    return () => {
      window.removeEventListener('open-add-ride', handleOpenRide);
      window.removeEventListener('open-add-expense', handleOpenExpense);
    };
  }, []);

  const handleAddRide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rideEarnings || !rideKm || !rideDuration) return;
    
    addRide({
      date: formatISO(new Date()),
      app: rideApp,
      earnings: parseFloat(rideEarnings),
      distanceKm: parseFloat(rideKm),
      durationMinutes: parseInt(rideDuration, 10),
      origin: 'Local (Manual)',
      destination: 'Destino (Manual)',
    });
    
    setRideEarnings('');
    setRideKm('');
    setRideDuration('');
    alert('Corrida adicionada com sucesso!');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount) return;

    addExpense({
      date: formatISO(new Date()),
      category: expCategory,
      amount: parseFloat(expAmount),
      description: expDesc,
    });

    setExpAmount('');
    setExpDesc('');
    alert('Despesa adicionada com sucesso!');
  };

  const handleUpdateFixed = (e: React.FormEvent) => {
    e.preventDefault();
    updateFixedExpenses({
      insurance: parseFloat(fixedIns),
      ipva: parseFloat(fixedIpva),
      internet: parseFloat(fixedInt),
      maintenanceReservePerKm: parseFloat(fixedMaint),
    });
    alert('Despesas fixas atualizadas!');
  };

  // Calculations for today
  const today = new Date();
  const todayRides = rides.filter(r => isSameDay(parseISO(r.date), today));
  const todayExpenses = expenses.filter(e => isSameDay(parseISO(e.date), today));
  
  const grossEarnings = todayRides.reduce((sum, r) => sum + r.earnings, 0);
  const totalKm = todayRides.reduce((sum, r) => sum + r.distanceKm, 0);
  const variableCosts = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Daily fixed costs approximation
  const dailyFixed = (fixedExpenses.insurance / 30) + (fixedExpenses.ipva / 365) + (fixedExpenses.internet / 30);
  const maintenanceReserve = totalKm * fixedExpenses.maintenanceReservePerKm;
  
  const realProfit = grossEarnings - variableCosts - dailyFixed - maintenanceReserve;

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-2xl font-bold tracking-tight">Gestão Financeira</h1>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm text-zinc-400">Lucro Real (Hoje)</p>
              <h2 className="text-3xl font-bold text-emerald-400">R$ {realProfit.toFixed(2)}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Ganhos: R$ {grossEarnings.toFixed(2)}</p>
              <p className="text-xs text-red-400">Despesas: R$ {(variableCosts + dailyFixed + maintenanceReserve).toFixed(2)}</p>
            </div>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${Math.max(0, (grossEarnings / (grossEarnings + variableCosts + dailyFixed + maintenanceReserve || 1)) * 100)}%` }}></div>
            <div className="bg-red-500 h-full flex-1"></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button 
          variant={activeTab === 'receitas' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('receitas')}
          className="flex-1 min-w-[100px]"
        >
          <TrendingUp className="w-4 h-4 mr-2" /> Receitas
        </Button>
        <Button 
          variant={activeTab === 'despesas' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('despesas')}
          className="flex-1 min-w-[100px]"
        >
          <TrendingDown className="w-4 h-4 mr-2" /> Despesas
        </Button>
        <Button 
          variant={activeTab === 'fixas' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('fixas')}
          className="flex-1 min-w-[100px]"
        >
          <Settings className="w-4 h-4 mr-2" /> Fixas
        </Button>
      </div>

      {activeTab === 'receitas' && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle>Adicionar Corrida / Ganhos</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRide} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Aplicativo</label>
                <div className="flex gap-2">
                  {['Uber', '99', 'inDrive', 'Particular'].map(app => (
                    <Button
                      key={app}
                      type="button"
                      variant={rideApp === app ? 'default' : 'outline'}
                      onClick={() => setRideApp(app as AppType)}
                      className="flex-1 text-xs"
                    >
                      {app}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Valor Ganho (R$)</label>
                <Input type="number" step="0.01" value={rideEarnings} onChange={e => setRideEarnings(e.target.value)} placeholder="0.00" required className="text-lg py-6" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Distância (KM)</label>
                  <Input type="number" step="0.1" value={rideKm} onChange={e => setRideKm(e.target.value)} placeholder="0.0" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Duração (Min)</label>
                  <Input type="number" value={rideDuration} onChange={e => setRideDuration(e.target.value)} placeholder="0" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                <PlusCircle className="mr-2 h-5 w-5" /> Lançar Receita
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'despesas' && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle>Adicionar Despesa Variável</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Combustível', 'Lavagem', 'Pedágio', 'Alimentação', 'Manutenção', 'Outros'].map(cat => (
                    <Button
                      key={cat}
                      type="button"
                      variant={expCategory === cat ? 'default' : 'outline'}
                      onClick={() => setExpCategory(cat as ExpenseCategory)}
                      className="text-xs"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Valor (R$)</label>
                <Input type="number" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" required className="text-lg py-6" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Descrição (Opcional)</label>
                <Input type="text" value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Ex: Posto Ipiranga" />
              </div>
              <Button type="submit" className="w-full h-12 text-lg bg-red-600 hover:bg-red-700 text-white mt-4">
                <PlusCircle className="mr-2 h-5 w-5" /> Lançar Despesa
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'fixas' && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle>Despesas Fixas & Depreciação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateFixed} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Seguro (Mensal - R$)</label>
                <Input type="number" step="0.01" value={fixedIns} onChange={e => setFixedIns(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">IPVA (Anual - R$)</label>
                <Input type="number" step="0.01" value={fixedIpva} onChange={e => setFixedIpva(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Internet/Plano Celular (Mensal - R$)</label>
                <Input type="number" step="0.01" value={fixedInt} onChange={e => setFixedInt(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Reserva de Manutenção (R$ por KM)</label>
                <p className="text-xs text-zinc-500 mb-2">Valor guardado a cada KM rodado para futuras manutenções.</p>
                <Input type="number" step="0.01" value={fixedMaint} onChange={e => setFixedMaint(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white mt-4">
                Salvar Configurações
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
