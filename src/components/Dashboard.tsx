import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Car, Fuel, DollarSign, Clock, Plus, Activity, Target } from 'lucide-react';
import { format, subDays, isSameDay, parseISO, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Stopwatch } from './Stopwatch';

export const Dashboard = () => {
  const { rides, expenses, vehicle, fixedExpenses } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [revenueFilter, setRevenueFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  const referenceDate = parseISO(selectedDate);

  // Calculate today's metrics based on selectedDate
  const todayRides = rides.filter(r => isSameDay(parseISO(r.date), referenceDate));
  const todayExpenses = expenses.filter(e => isSameDay(parseISO(e.date), referenceDate));

  const grossEarnings = todayRides.reduce((sum, r) => sum + r.earnings, 0);
  const fuelCosts = todayExpenses.filter(e => e.category === 'Combustível').reduce((sum, e) => sum + e.amount, 0);
  const otherExpenses = todayExpenses.filter(e => e.category !== 'Combustível').reduce((sum, e) => sum + e.amount, 0);
  const totalKm = todayRides.reduce((sum, r) => sum + r.distanceKm, 0);
  const totalMinutes = todayRides.reduce((sum, r) => sum + r.durationMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const formattedDuration = `${totalHours}h ${remainingMinutes}m`;
  
  const earningsPerKm = totalKm > 0 ? grossEarnings / totalKm : 0;
  const earningsPerHour = totalMinutes > 0 ? grossEarnings / (totalMinutes / 60) : 0;

  // Calculate fixed expenses portion for the month
  const dailyFixed = (fixedExpenses.insurance / 30) + (fixedExpenses.ipva / 365) + (fixedExpenses.internet / 30) + ((fixedExpenses.carInstallment || 0) / 30) + ((fixedExpenses.tireSetCost || 0) / 365);
  const monthlyFixed = dailyFixed * 30; // Approximate monthly fixed costs

  const netProfit = grossEarnings - fuelCosts - otherExpenses - dailyFixed - (totalKm * fixedExpenses.maintenanceReservePerKm);
  
  // Calculate weekly metrics
  const startOfCurrentWeek = startOfWeek(referenceDate, { weekStartsOn: 0 }); // Sunday
  const weeklyRides = rides.filter(r => parseISO(r.date) >= startOfCurrentWeek);
  const weeklyExpenses = expenses.filter(e => parseISO(e.date) >= startOfCurrentWeek);
  
  const weeklyGross = weeklyRides.reduce((sum, r) => sum + r.earnings, 0);
  const weeklyVarExpenses = weeklyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const weeklyKm = weeklyRides.reduce((sum, r) => sum + r.distanceKm, 0);
  const weeklyMaintReserve = weeklyKm * fixedExpenses.maintenanceReservePerKm;
  const weeklyFixed = dailyFixed * 7; // Approximate weekly fixed costs
  const weeklyNet = weeklyGross - weeklyVarExpenses - weeklyMaintReserve - weeklyFixed;

  // Calculate monthly net income for the goal progress
  const currentMonth = referenceDate.getMonth();
  const currentYear = referenceDate.getFullYear();
  
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
    
  const monthlyNet = monthlyGross - monthlyVarExpenses - monthlyMaintReserve - monthlyFixed;
  
  // Calculate yearly metrics
  const yearlyRides = rides.filter(r => parseISO(r.date).getFullYear() === currentYear);
  const yearlyGross = yearlyRides.reduce((sum, r) => sum + r.earnings, 0);

  const netIncomeGoal = fixedExpenses.netIncomeGoal || 0;
  const workDaysPerMonth = fixedExpenses.workDaysPerMonth || 24;
  
  const dailyGoal = netIncomeGoal / workDaysPerMonth;
  const weeklyGoal = dailyGoal * (workDaysPerMonth / 4.33); // Approx weeks per month
  const missingMonthly = Math.max(0, netIncomeGoal - monthlyNet);
  const missingWeekly = Math.max(0, weeklyGoal - weeklyNet);
  const missingDaily = Math.max(0, dailyGoal - netProfit);

  const goalProgress = netIncomeGoal > 0 ? Math.min(100, Math.max(0, (monthlyNet / netIncomeGoal) * 100)) : 0;

  // Chart data (last 7 days from referenceDate)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(referenceDate, 6 - i);
    const dayRides = rides.filter(r => isSameDay(parseISO(r.date), date));
    const dayEarnings = dayRides.reduce((sum, r) => sum + r.earnings, 0);
    return {
      name: format(date, 'EEE', { locale: ptBR }),
      ganhos: dayEarnings,
    };
  });

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-sm rounded-md px-3 py-1.5 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <Stopwatch />
      
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
              <div className="flex justify-between text-xs text-zinc-500 mb-4">
                <span>Atual: R$ {monthlyNet.toFixed(2)}</span>
                <span>Falta: R$ {missingMonthly.toFixed(2)}</span>
                <span>Meta: R$ {netIncomeGoal.toFixed(2)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div>
                  <h4 className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Meta Semanal</h4>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-200">R$ {weeklyGoal.toFixed(2)}</span>
                    <span className="text-[10px] text-zinc-500">Atual: R$ {weeklyNet.toFixed(2)}</span>
                    <span className="text-[10px] text-indigo-400">Falta: R$ {missingWeekly.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Meta Diária</h4>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-200">R$ {dailyGoal.toFixed(2)}</span>
                    <span className="text-[10px] text-zinc-500">Atual: R$ {netProfit.toFixed(2)}</span>
                    <span className="text-[10px] text-indigo-400">Falta: R$ {missingDaily.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Card with Filter */}
        <Card className="col-span-2 bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Faturamento</CardTitle>
            <div className="flex bg-zinc-950 border border-zinc-800 rounded-md p-0.5">
              <button 
                onClick={() => setRevenueFilter('daily')}
                className={`text-[10px] px-2 py-1 rounded-sm transition-colors ${revenueFilter === 'daily' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Dia
              </button>
              <button 
                onClick={() => setRevenueFilter('weekly')}
                className={`text-[10px] px-2 py-1 rounded-sm transition-colors ${revenueFilter === 'weekly' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Semana
              </button>
              <button 
                onClick={() => setRevenueFilter('monthly')}
                className={`text-[10px] px-2 py-1 rounded-sm transition-colors ${revenueFilter === 'monthly' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Mês
              </button>
              <button 
                onClick={() => setRevenueFilter('yearly')}
                className={`text-[10px] px-2 py-1 rounded-sm transition-colors ${revenueFilter === 'yearly' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Ano
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              R$ {revenueFilter === 'daily' ? grossEarnings.toFixed(2) : 
                  revenueFilter === 'weekly' ? weeklyGross.toFixed(2) : 
                  revenueFilter === 'monthly' ? monthlyGross.toFixed(2) : 
                  yearlyGross.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* KM Card */}
        <Card className="col-span-2 bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">KM Rodados</CardTitle>
            <Car className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-bold text-zinc-100">{totalKm.toFixed(1)} km</div>
                <p className="text-xs text-zinc-500">Hoje</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-zinc-300">{weeklyKm.toFixed(1)} km</div>
                <p className="text-xs text-zinc-500">Na semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Lucro Líquido (Diário)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">R$ {netProfit.toFixed(2)}</div>
            <p className="text-xs text-zinc-500 mt-1">Duração: {formattedDuration}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Despesas (Semana)</CardTitle>
            <Fuel className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-400">R$ {weeklyVarExpenses.toFixed(2)}</div>
            <p className="text-[10px] text-zinc-500 mt-1">Apenas variáveis registradas</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Combustível (Diário)</CardTitle>
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
