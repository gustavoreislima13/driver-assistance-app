import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Car, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';

export const Vehicle = () => {
  const { vehicle, maintenanceAlerts, updateVehicle } = useAppContext();
  
  const [make, setMake] = useState(vehicle.make);
  const [model, setModel] = useState(vehicle.model);
  const [year, setYear] = useState(vehicle.year.toString());
  const [engine, setEngine] = useState(vehicle.engine);
  const [currentKm, setCurrentKm] = useState(vehicle.currentKm.toString());
  const [idealConsumptionKmL, setIdealConsumptionKmL] = useState(vehicle.idealConsumptionKmL.toString());

  const handleUpdateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicle({
      make,
      model,
      year: parseInt(year, 10),
      engine,
      currentKm: parseInt(currentKm, 10),
      idealConsumptionKmL: parseFloat(idealConsumptionKmL),
    });
    alert('Veículo atualizado!');
  };

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
                <label className="text-xs text-zinc-400">Consumo Ideal (KM/L)</label>
                <Input type="number" step="0.1" value={idealConsumptionKmL} onChange={e => setIdealConsumptionKmL(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Atualizar Veículo</Button>
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

          return (
            <Card key={alert.id} className={`border-zinc-800 ${isOverdue ? 'bg-red-950/30 border-red-900/50' : isUrgent ? 'bg-yellow-950/30 border-yellow-900/50' : 'bg-zinc-900/50'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{alert.item}</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Próxima troca: {nextServiceKm.toLocaleString()} KM
                  </p>
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
