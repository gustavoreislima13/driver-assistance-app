import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Map, Clock, Car, Fuel, Edit2, Trash2, X, Check } from 'lucide-react';
import { Ride, Expense, AppType, ExpenseCategory } from '../types';

type LogItem = 
  | { type: 'ride'; data: Ride }
  | { type: 'expense'; data: Expense };

export const Logbook = () => {
  const { rides, expenses, updateRide, deleteRide, updateExpense, deleteExpense } = useAppContext();
  const [editingItem, setEditingItem] = useState<LogItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<LogItem | null>(null);

  // Edit Form States
  const [editDate, setEditDate] = useState('');
  const [editApp, setEditApp] = useState<AppType>('Uber');
  const [editEarnings, setEditEarnings] = useState('');
  const [editKm, setEditKm] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('Combustível');
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const allItems: LogItem[] = [
    ...rides.map(r => ({ type: 'ride' as const, data: r })),
    ...expenses.map(e => ({ type: 'expense' as const, data: e }))
  ];

  const groupedItems = allItems.reduce((acc, item) => {
    const dateStr = format(parseISO(item.data.date), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {} as Record<string, LogItem[]>);

  const sortedDates = Object.keys(groupedItems).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const handleEditClick = (item: LogItem) => {
    setEditingItem(item);
    setEditDate(format(parseISO(item.data.date), 'yyyy-MM-dd'));
    if (item.type === 'ride') {
      setEditApp(item.data.app);
      setEditEarnings(item.data.earnings.toString());
      setEditKm(item.data.distanceKm.toString());
      setEditDuration((item.data.durationMinutes / 60).toFixed(1));
    } else {
      setEditCategory(item.data.category);
      setEditAmount(item.data.amount.toString());
      setEditDesc(item.data.description || '');
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    const dateObj = new Date(`${editDate}T12:00:00`);
    const dateStr = dateObj.toISOString();

    if (editingItem.type === 'ride') {
      await updateRide(editingItem.data.id, {
        date: dateStr,
        app: editApp,
        earnings: parseFloat(editEarnings),
        distanceKm: parseFloat(editKm),
        durationMinutes: Math.round(parseFloat(editDuration) * 60),
      });
    } else {
      await updateExpense(editingItem.data.id, {
        date: dateStr,
        category: editCategory,
        amount: parseFloat(editAmount),
        description: editDesc,
      });
    }
    setEditingItem(null);
  };

  const handleDelete = async (item: LogItem) => {
    setDeletingItem(item);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    if (deletingItem.type === 'ride') {
      await deleteRide(deletingItem.data.id);
    } else {
      await deleteExpense(deletingItem.data.id);
    }
    setDeletingItem(null);
  };

  const cancelDelete = () => {
    setDeletingItem(null);
  };

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-2xl font-bold tracking-tight">Diário de Bordo & Rotas</h1>

      <div className="space-y-8">
        {sortedDates.map(dateStr => {
          const dayItems = groupedItems[dateStr];
          const dayRides = dayItems.filter(i => i.type === 'ride').map(i => i.data as Ride);
          const dayExpenses = dayItems.filter(i => i.type === 'expense').map(i => i.data as Expense);
          
          const dayTotalEarnings = dayRides.reduce((sum, r) => sum + r.earnings, 0);
          const dayTotalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
          const dayKm = dayRides.reduce((sum, r) => sum + r.distanceKm, 0);
          const dayMinutes = dayRides.reduce((sum, r) => sum + r.durationMinutes, 0);

          return (
            <div key={dateStr} className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h2 className="text-lg font-semibold text-zinc-300">
                  {format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </h2>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">Ganhos: R$ {dayTotalEarnings.toFixed(2)}</p>
                  <p className="text-sm font-bold text-red-400">Despesas: R$ {dayTotalExpenses.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500">{dayKm.toFixed(1)} km • {Math.floor(dayMinutes / 60)}h {dayMinutes % 60}m</p>
                </div>
              </div>

              <div className="space-y-3">
                {dayItems.map((item, idx) => {
                  const isEditing = editingItem?.data.id === item.data.id && editingItem?.type === item.type;

                  if (isEditing) {
                    return (
                      <Card key={`edit-${item.data.id}`} className="bg-zinc-800 border-zinc-700">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-sm">Editar {item.type === 'ride' ? 'Corrida' : 'Despesa'}</h3>
                            <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-6 w-6"><X className="h-4 w-4" /></Button>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-xs text-zinc-400">Data</label>
                            <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="h-8 text-sm" />
                          </div>

                          {item.type === 'ride' ? (
                            <>
                              <div className="space-y-2">
                                <label className="text-xs text-zinc-400">Aplicativo</label>
                                <div className="flex gap-2">
                                  {['Uber', '99', 'inDrive', 'Particular'].map(app => (
                                    <Button
                                      key={app}
                                      type="button"
                                      variant={editApp === app ? 'default' : 'outline'}
                                      onClick={() => setEditApp(app as AppType)}
                                      className="flex-1 text-xs px-1 h-8"
                                    >
                                      {app}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <label className="text-xs text-zinc-400">Valor (R$)</label>
                                  <Input type="number" step="0.01" value={editEarnings} onChange={e => setEditEarnings(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-zinc-400">KM</label>
                                  <Input type="number" step="0.1" value={editKm} onChange={e => setEditKm(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-zinc-400">Horas</label>
                                  <Input type="number" step="0.1" value={editDuration} onChange={e => setEditDuration(e.target.value)} className="h-8 text-sm" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="space-y-2">
                                <label className="text-xs text-zinc-400">Categoria</label>
                                <select 
                                  className="flex h-8 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
                                  value={editCategory} 
                                  onChange={e => setEditCategory(e.target.value as ExpenseCategory)}
                                >
                                  {['Combustível', 'Lavagem', 'Pedágio', 'Alimentação', 'Manutenção', 'Outros'].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-xs text-zinc-400">Valor (R$)</label>
                                  <Input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs text-zinc-400">Descrição</label>
                                  <Input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="h-8 text-sm" />
                                </div>
                              </div>
                            </>
                          )}
                          
                          <Button onClick={handleSaveEdit} className="w-full h-8 mt-2 bg-emerald-600 hover:bg-emerald-700">
                            <Check className="w-4 h-4 mr-2" /> Salvar Alterações
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }

                  const isDeleting = deletingItem?.data.id === item.data.id && deletingItem?.type === item.type;

                  if (isDeleting) {
                    return (
                      <Card key={`delete-${item.data.id}`} className="bg-red-950/30 border-red-900/50">
                        <CardContent className="p-4 flex flex-col items-center justify-center space-y-3">
                          <p className="text-sm text-zinc-300 text-center">Tem certeza que deseja excluir este registro?</p>
                          <div className="flex gap-3">
                            <Button variant="outline" size="sm" onClick={cancelDelete} className="h-8 text-xs">Cancelar</Button>
                            <Button variant="destructive" size="sm" onClick={confirmDelete} className="h-8 text-xs bg-red-600 hover:bg-red-700">Excluir</Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  if (item.type === 'ride') {
                    const ride = item.data;
                    return (
                      <Card key={`ride-${ride.id}`} className="bg-zinc-900/40 border-zinc-800">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                ride.app === 'Uber' ? 'bg-black text-white border border-zinc-700' :
                                ride.app === '99' ? 'bg-yellow-500 text-black' :
                                ride.app === 'inDrive' ? 'bg-green-500 text-white' :
                                'bg-blue-500 text-white'
                              }`}>
                                {ride.app}
                              </span>
                              <span className="text-xs text-zinc-400 flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> {ride.durationMinutes} min
                              </span>
                              <span className="text-xs text-zinc-400 flex items-center">
                                <Car className="w-3 h-3 mr-1" /> {ride.distanceKm} km
                              </span>
                            </div>
                            <div className="flex items-start mt-2">
                              <Map className="w-4 h-4 text-zinc-500 mr-2 mt-0.5 shrink-0" />
                              <div className="text-sm text-zinc-300">
                                <p className="truncate max-w-[200px]">{ride.origin}</p>
                                <p className="text-zinc-500 text-xs truncate max-w-[200px]">→ {ride.destination}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4 flex flex-col items-end gap-2">
                            <p className="font-bold text-emerald-400">R$ {ride.earnings.toFixed(2)}</p>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditClick(item)} className="text-zinc-500 hover:text-blue-400"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(item)} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else {
                    const expense = item.data;
                    return (
                      <Card key={`expense-${expense.id}`} className="bg-zinc-900/40 border-zinc-800">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-900">
                                Despesa
                              </span>
                              <span className="text-xs text-zinc-400 flex items-center">
                                <Fuel className="w-3 h-3 mr-1" /> {expense.category}
                              </span>
                            </div>
                            {expense.description && (
                              <div className="flex items-start mt-2">
                                <p className="text-sm text-zinc-300 truncate max-w-[250px]">{expense.description}</p>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4 flex flex-col items-end gap-2">
                            <p className="font-bold text-red-400">- R$ {expense.amount.toFixed(2)}</p>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditClick(item)} className="text-zinc-500 hover:text-blue-400"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(item)} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
