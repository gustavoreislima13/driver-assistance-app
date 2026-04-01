import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Car, Fuel, DollarSign, Clock, Plus, Activity, Target } from 'lucide-react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Dashboard = () => {
  const { rides, expenses, vehicle, fixedExpenses } = useAppContext();
  const [showAddRide, setShowAddRide] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const today = new Date();

  // Calculate today's metrics
  const todayRides = rides.filter(r => isSameDay(parseISO(r.date), today));
  const todayExpenses = expenses.filter(e => isSameDay(parseISO(e.date), today));

  const grossEarnings = todayRides.reduce((sum, r) => sum + r.earnings, 0);
  const fuelCosts = todayExpenses.filter(e => e.category === 'Combustível').reduce((sum, e) => sum + e.amount, 0);
  const otherExpenses = todayExpenses.filter(e => e.category !== 'Combustível').reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossEarnings - fuelCosts - otherExpenses;

  const totalKm = todayRides.reduce((sum, r) => sum + r.distanceKm, 0);
  const totalMinutes = todayRides.reduce((sum, r) => sum + r.durationMinutes, 0);
  
  const earningsPerKm = totalKm > 0 ? grossEarnings / totalKm : 0;
  const earningsPerHour = totalMinutes > 0 ? grossEarnings / (totalMinutes / 60) : 0;

  // Calculate monthly net income for the goal progress
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const monthlyRides = rides.filter(r => {
    const d = parseISO(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const monthlyExpenses = expenses.filter(e => {
    const d = parseISO(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyGross = monthlyRides.reduce((sum, r) => sum + r.earnings, 0);
  const monthlyVarExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyKm = monthlyRides.reduce((sum, r) => sum + r.distanceKm, 0);
  const monthlyMaintReserve = monthlyKm * fixedExpenses.maintenanceReservePerKm;
  
  // Calculate fixed expenses portion for the month
  const monthlyFixed = 
    fixedExpenses.insurance + 
    fixedExpenses.internet + 
    (fixedExpenses.carInstallment || 0) + 
    (fixedExpenses.ipva / 12) + // IPVA is annual
    ((fixedExpenses.tireSetCost || 0) / 12); // Assuming a set lasts a year for simplicity
    
  const monthlyNet = monthlyGross - monthlyVarExpenses - monthlyMaintReserve - monthlyFixed;
  const netIncomeGoal = fixedExpenses.netIncomeGoal || 0;
  const goalProgress = netIncomeGoal > 0 ? Math.min(100, Math.max(0, (monthlyNet / netIncomeGoal) * 100)) : 0;

  // Chart data (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, 6 - i);
    const dayRides = rides.filter(r => isSameDay(parseISO(r.date), date));
    const dayEarnings = dayRides.reduce((sum, r) => sum + r.earnings, 0);
    return {
      name: format(date, 'EEE', { locale: ptBR }),
      ganhos: dayEarnings,
    };
  });

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Goal Progress Card */}
        {netIncomeGoal > 0 && (
          <Card className="col-span-2 bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-medium text-zinc-400">Meta de Renda Líquida (Mês)</h3>
                </div>
                <span className="text-sm font-bold text-indigo-400">{goalProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${goalProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Atual: R$ {monthlyNet.toFixed(2)}</span>
                <span>Meta: R$ {netIncomeGoal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="col-span-2 bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Lucro Líquido (Hoje)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">R$ {netProfit.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Ganhos Brutos</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">R$ {grossEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Combustível</CardTitle>
            <Fuel className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-400">R$ {fuelCosts.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">R$ / KM</CardTitle>
            <Car className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">R$ {earningsPerKm.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">R$ / Hora</CardTitle>
            <Clock className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">R$ {earningsPerHour.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle>Faturamento (Últimos 7 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
              <Tooltip 
                cursor={{fill: '#27272a'}}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Bar dataKey="ganhos" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-3">
        <Button size="icon" className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg" onClick={() => window.dispatchEvent(new CustomEvent('open-add-ride'))}>
          <Car className="h-6 w-6" />
        </Button>
        <Button size="icon" className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 shadow-lg" onClick={() => window.dispatchEvent(new CustomEvent('open-add-expense'))}>
          <Fuel className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};
