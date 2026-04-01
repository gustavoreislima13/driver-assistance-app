import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Car, Wrench, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

export const Vehicle = () => {
  const { vehicle, maintenanceAlerts, updateVehicle } = useAppContext();
  
  const [make, setMake] = useState(vehicle.make);
  const [model, setModel] = useState(vehicle.model);
  const [year, setYear] = useState(vehicle.year.toString());
  const [engine, setEngine] = useState(vehicle.engine);
  const [currentKm, setCurrentKm] = useState(vehicle.currentKm.toString());
  const [idealConsumptionKmL, setIdealConsumptionKmL] = useState(vehicle.idealConsumptionKmL.toString());
  const [fipeValue, setFipeValue] = useState((vehicle.fipeValue || 0).toString());
  const [fipeValueLastYear, setFipeValueLastYear] = useState((vehicle.fipeValueLastYear || 0).toString());
  const [averageKmPerMonth, setAverageKmPerMonth] = useState((vehicle.averageKmPerMonth || 3000).toString());

  const handleUpdateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicle({
      make,
      model,
      year: parseInt(year, 10),
      engine,
      currentKm: parseInt(currentKm, 10),
      idealConsumptionKmL: parseFloat(idealConsumptionKmL),
      fipeValue: parseFloat(fipeValue),
      fipeValueLastYear: parseFloat(fipeValueLastYear),
      averageKmPerMonth: parseInt(averageKmPerMonth, 10),
    });
  };

  const depreciation = parseFloat(fipeValueLastYear) - parseFloat(fipeValue);
  const depreciationPercent = parseFloat(fipeValueLastYear) > 0 ? (depreciation / parseFloat(fipeValueLastYear)) * 100 : 0;

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-2xl font-bold tracking-tight">Minha Garagem</h1>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
          <div className="p-3 bg-zinc-800 rounded-full">
            <Car className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-xl">{vehicle.make} {vehicle.model}</CardTitle>
            <p className="text-sm text-zinc-400">{vehicle.year} - Motor {vehicle.engine}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateVehicle} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-400">Marca</label>
                <Input value={make} onChange={e => setMake(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400">Modelo</label>
                <Input value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400">Ano</label>
                <Input type="number" value={year} onChange={e => setYear(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400">Motor</label>
                <Input value={engine} onChange={e => setEngine(e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs text-zinc-400">Quilometragem Atual (KM)</label>
                <Input type="number" value={currentKm} onChange={e => setCurrentKm(e.target.value)} className="text-lg font-bold text-blue-400" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs text-zinc-400">Média de KM rodados por mês</label>
                <p className="text-[10px] text-zinc-500 mb-1">Usado para estimar a data das próximas manutenções.</p>
                <Input type="number" value={averageKmPerMonth} onChange={e => setAverageKmPerMonth(e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs text-zinc-400">Consumo Ideal (KM/L)</label>
                <Input type="number" step="0.1" value={idealConsumptionKmL} onChange={e => setIdealConsumptionKmL(e.target.value)} />
              </div>
              
              <div className="col-span-2 pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-2 text-red-400" />
                  Desvalorização (Tabela FIPE)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400">Valor FIPE Ano Passado (R$)</label>
                    <Input type="number" step="0.01" value={fipeValueLastYear} onChange={e => setFipeValueLastYear(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400">Valor FIPE Atual (R$)</label>
                    <Input type="number" step="0.01" value={fipeValue} onChange={e => setFipeValue(e.target.value)} />
                  </div>
                </div>
                
                {depreciation > 0 && (
                  <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-zinc-300">Desvalorização no ano:</span>
                    <div className="text-right">
                      <span className="block text-red-400 font-bold">R$ {depreciation.toFixed(2)}</span>
                      <span className="text-xs text-red-500/80">-{depreciationPercent.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-6">Atualizar Veículo</Button>
          </form>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold tracking-tight mt-8 flex items-center">
        <Wrench className="mr-2 h-5 w-5" /> Controle de Manutenção
      </h2>

      <div className="space-y-4">
        {maintenanceAlerts.map(alert => {
          const nextServiceKm = alert.lastServiceKm + alert.intervalKm;
          const remainingKm = nextServiceKm - vehicle.currentKm;
          const isUrgent = remainingKm <= 1000;
          const isOverdue = remainingKm < 0;
          
          let estimatedDateStr = '';
          if (!isOverdue && vehicle.averageKmPerMonth && vehicle.averageKmPerMonth > 0) {
            const daysRemaining = (remainingKm / vehicle.averageKmPerMonth) * 30;
            const estimatedDate = addDays(new Date(), daysRemaining);
            estimatedDateStr = format(estimatedDate, "dd 'de' MMMM", { locale: ptBR });
          }

          return (
            <Card key={alert.id} className={`border-zinc-800 ${isOverdue ? 'bg-red-950/30 border-red-900/50' : isUrgent ? 'bg-yellow-950/30 border-yellow-900/50' : 'bg-zinc-900/50'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{alert.item}</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Última: {alert.lastServiceKm.toLocaleString()} KM
                  </p>
                  <p className="text-xs text-zinc-400">
                    Próxima: {nextServiceKm.toLocaleString()} KM
                  </p>
                  {estimatedDateStr && (
                    <p className="text-[10px] text-blue-400 mt-1">
                      Estimativa: {estimatedDateStr}
                    </p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end">
                  {isOverdue ? (
                    <div className="flex items-center text-red-500 font-bold">
                      <AlertTriangle className="w-4 h-4 mr-1" /> Vencido
                    </div>
                  ) : isUrgent ? (
                    <div className="flex items-center text-yellow-500 font-bold">
                      <AlertTriangle className="w-4 h-4 mr-1" /> Faltam {remainingKm.toLocaleString()} KM
                    </div>
                  ) : (
                    <div className="flex items-center text-emerald-500 font-bold">
                      <CheckCircle className="w-4 h-4 mr-1" /> OK
                    </div>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">Intervalo: {alert.intervalKm.toLocaleString()} KM</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
