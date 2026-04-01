import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Map, Clock, DollarSign, Car } from 'lucide-react';

export const Logbook = () => {
  const { rides, expenses } = useAppContext();

  // Group rides by date
  const groupedRides = rides.reduce((acc, ride) => {
    const dateStr = format(parseISO(ride.date), 'yyyy-MM-dd');
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(ride);
    return acc;
  }, {} as Record<string, typeof rides>);

  const sortedDates = Object.keys(groupedRides).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-2xl font-bold tracking-tight">Diário de Bordo & Rotas</h1>

      <div className="space-y-8">
        {sortedDates.map(dateStr => {
          const dayRides = groupedRides[dateStr];
          const dayTotal = dayRides.reduce((sum, r) => sum + r.earnings, 0);
          const dayKm = dayRides.reduce((sum, r) => sum + r.distanceKm, 0);
          const dayMinutes = dayRides.reduce((sum, r) => sum + r.durationMinutes, 0);

          return (
            <div key={dateStr} className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h2 className="text-lg font-semibold text-zinc-300">
                  {format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </h2>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">R$ {dayTotal.toFixed(2)}</p>
                  <p className="text-xs text-zinc-500">{dayKm.toFixed(1)} km • {Math.floor(dayMinutes / 60)}h {dayMinutes % 60}m</p>
                </div>
              </div>

              <div className="space-y-3">
                {dayRides.map(ride => (
                  <Card key={ride.id} className="bg-zinc-900/40 border-zinc-800">
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
                      <div className="text-right ml-4">
                        <p className="font-bold text-emerald-400">R$ {ride.earnings.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
