import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatISO, parseISO, isSameDay, format } from 'date-fns';
import { DollarSign, PlusCircle, TrendingDown, TrendingUp, Settings } from 'lucide-react';
import { AppType, ExpenseCategory } from '../types';

export const Finances = () => {
  const { rides, expenses, fixedExpenses, addRide, addExpense, updateFixedExpenses } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'receitas' | 'despesas' | 'fixas'>('receitas');
  
  // Form states
  const [rideDate, setRideDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rideApp, setRideApp] = useState<AppType>('Uber');
  const [rideEarnings, setRideEarnings] = useState('');
  const [rideKm, setRideKm] = useState('');
  const [rideDuration, setRideDuration] = useState('');

  const [expDate, setExpDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Combustível');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const [fixedIns, setFixedIns] = useState(fixedExpenses.insurance.toString());
  const [fixedIpva, setFixedIpva] = useState(fixedExpenses.ipva.toString());
  const [fixedInt, setFixedInt] = useState(fixedExpenses.internet.toString());
  const [fixedMaint, setFixedMaint] = useState(fixedExpenses.maintenanceReservePerKm.toString());
  const [fixedInstallment, setFixedInstallment] = useState((fixedExpenses.carInstallment || 0).toString());
  const [fixedTireCost, setFixedTireCost] = useState((fixedExpenses.tireSetCost || 0).toString());
  const [fixedGoal, setFixedGoal] = useState((fixedExpenses.netIncomeGoal || 0).toString());
  const [fixedWorkDays, setFixedWorkDays] = useState((fixedExpenses.workDaysPerMonth || 24).toString());
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

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
    
    const dateObj = new Date(`${rideDate}T12:00:00`);
    
    addRide({
      date: formatISO(dateObj),
      app: rideApp,
      earnings: parseFloat(rideEarnings),
      distanceKm: parseFloat(rideKm),
      durationMinutes: Math.round(parseFloat(rideDuration) * 60),
      origin: 'Local (Manual)',
      destination: 'Destino (Manual)',
    });
    
    setRideEarnings('');
    setRideKm('');
    setRideDuration('');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount) return;

    const dateObj = new Date(`${expDate}T12:00:00`);

    addExpense({
      date: formatISO(dateObj),
      category: expCategory,
      amount: parseFloat(expAmount),
      description: expDesc,
    });

    setExpAmount('');
    setExpDesc('');
  };

  const handleUpdateFixed = (e: React.FormEvent) => {
    e.preventDefault();
    updateFixedExpenses({
      insurance: parseFloat(fixedIns),
      ipva: parseFloat(fixedIpva),
      internet: parseFloat(fixedInt),
      maintenanceReservePerKm: parseFloat(fixedMaint),
      carInstallment: parseFloat(fixedInstallment),
      tireSetCost: parseFloat(fixedTireCost),
      netIncomeGoal: parseFloat(fixedGoal),
      workDaysPerMonth: parseInt(fixedWorkDays, 10),
    });
  };

  // Calculations for selected date
  const referenceDate = parseISO(selectedDate);
  const todayRides = rides.filter(r => isSameDay(parseISO(r.date), referenceDate));
  const todayExpenses = expenses.filter(e => isSameDay(parseISO(e.date), referenceDate));
  
  const grossEarnings = todayRides.reduce((sum, r) => sum + r.earnings, 0);
  const totalKm = todayRides.reduce((sum, r) => sum + r.distanceKm, 0);
  const variableCosts = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Daily fixed costs approximation (aligned with Dashboard)
  const dailyFixed = (fixedExpenses.insurance / 30) + (fixedExpenses.ipva / 365) + (fixedExpenses.internet / 30) + ((fixedExpenses.carInstallment || 0) / 30) + ((fixedExpenses.tireSetCost || 0) / 365);
  const maintenanceReserve = totalKm * fixedExpenses.maintenanceReservePerKm;
  
  const realProfit = grossEarnings - variableCosts - dailyFixed - maintenanceReserve;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Gestão Financeira</h1>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-sm rounded-md px-3 py-1.5 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm text-zinc-400">Lucro Real (Diário)</p>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Data</label>
                  <Input type="date" value={rideDate} onChange={e => setRideDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Aplicativo</label>
                  <div className="flex gap-2">
                    {['Uber', '99', 'inDrive', 'Particular'].map(app => (
                      <Button
                        key={app}
                        type="button"
                        variant={rideApp === app ? 'default' : 'outline'}
                        onClick={() => setRideApp(app as AppType)}
                        className="flex-1 text-xs px-1"
                      >
                        {app}
                      </Button>
                    ))}
                  </div>
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
                  <label className="text-sm font-medium text-zinc-300">Duração (Horas)</label>
                  <Input type="number" step="0.1" value={rideDuration} onChange={e => setRideDuration(e.target.value)} placeholder="Ex: 1.5" required />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Data</label>
                  <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Valor (R$)</label>
                  <Input type="number" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" required className="text-lg py-6" />
                </div>
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
                <label className="text-sm font-medium text-zinc-300">Parcela do Carro (Mensal - R$)</label>
                <Input type="number" step="0.01" value={fixedInstallment} onChange={e => setFixedInstallment(e.target.value)} required />
              </div>
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
                <label className="text-sm font-medium text-zinc-300">Jogo de Pneus (Valor Total - R$)</label>
                <p className="text-xs text-zinc-500 mb-2">Valor para trocar os 4 pneus.</p>
                <Input type="number" step="0.01" value={fixedTireCost} onChange={e => setFixedTireCost(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Reserva de Manutenção (R$ por KM)</label>
                <p className="text-xs text-zinc-500 mb-2">Valor guardado a cada KM rodado para futuras manutenções.</p>
                <Input type="number" step="0.01" value={fixedMaint} onChange={e => setFixedMaint(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Meta de Renda Líquida (Mensal - R$)</label>
                <p className="text-xs text-zinc-500 mb-2">Quanto você quer lucrar limpo no mês.</p>
                <Input type="number" step="0.01" value={fixedGoal} onChange={e => setFixedGoal(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Dias de Trabalho por Mês</label>
                <p className="text-xs text-zinc-500 mb-2">Quantos dias você pretende trabalhar no mês (ex: 24).</p>
                <Input type="number" value={fixedWorkDays} onChange={e => setFixedWorkDays(e.target.value)} required />
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
