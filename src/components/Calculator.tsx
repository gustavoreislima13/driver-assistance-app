import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MapPin, Navigation, DollarSign, Clock, Route, AlertCircle, CheckCircle, Share2, Download, Plus, Trash2, Car } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as htmlToImage from 'html-to-image';

import { formatISO } from 'date-fns';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to fit map to bounds
const MapBounds = ({ bounds }: { bounds: L.LatLngBounds | null }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

export const Calculator = () => {
  const { fixedExpenses, vehicle, addRide } = useAppContext();
  
  const [addresses, setAddresses] = useState<string[]>(['', '']);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');
  
  // Route data
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [waypointsCoords, setWaypointsCoords] = useState<[number, number][]>([]);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

  // Pricing config
  const [fuelPrice, setFuelPrice] = useState('5.50');
  const [desiredProfitPerKm, setDesiredProfitPerKm] = useState('1.50');
  const [desiredProfitPerHour, setDesiredProfitPerHour] = useState('20.00');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const quotationRef = useRef<HTMLDivElement>(null);

  const geocode = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validAddresses = addresses.filter(a => a.trim() !== '');
    if (validAddresses.length < 2) {
      setError('Preencha pelo menos a origem e o destino.');
      return;
    }

    setIsCalculating(true);
    setError('');

    try {
      // 1. Geocode all addresses
      const coordsPromises = validAddresses.map(addr => geocode(addr));
      const coordsResults = await Promise.all(coordsPromises);
      
      const validCoords = coordsResults.filter((c): c is [number, number] => c !== null);
      
      if (validCoords.length !== validAddresses.length) {
        throw new Error('Não foi possível encontrar um ou mais endereços.');
      }
      
      setWaypointsCoords(validCoords);

      // 2. Get Route from OSRM
      const coordinatesString = validCoords.map(c => `${c[1]},${c[0]}`).join(';');
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`);
      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('Não foi possível calcular a rota.');
      }

      const route = data.routes[0];
      setDistanceKm(route.distance / 1000);
      setDurationMin(route.duration / 60);

      // Extract coordinates for polyline (OSRM returns [lon, lat], Leaflet needs [lat, lon])
      const coords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      setRouteCoords(coords);

      // Set bounds
      const bounds = L.latLngBounds(validCoords);
      setMapBounds(bounds);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao calcular a rota.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculations
  let totalCost = 0;
  let suggestedPrice = 0;
  let profit = 0;

  if (distanceKm !== null && durationMin !== null) {
    const fuelCost = (distanceKm / (vehicle.idealConsumptionKmL || 10)) * parseFloat(fuelPrice || '0');
    const maintCost = distanceKm * (fixedExpenses.maintenanceReservePerKm || 0);
    
    // Daily fixed costs approximation
    const dailyFixed = (fixedExpenses.insurance / 30) + (fixedExpenses.ipva / 365) + (fixedExpenses.internet / 30) + ((fixedExpenses.carInstallment || 0) / 30) + ((fixedExpenses.tireSetCost || 0) / 365);
    const hourlyFixed = dailyFixed / 24;
    const timeCost = (durationMin / 60) * hourlyFixed;

    totalCost = fuelCost + maintCost + timeCost;

    const profitFromKm = distanceKm * parseFloat(desiredProfitPerKm || '0');
    const profitFromTime = (durationMin / 60) * parseFloat(desiredProfitPerHour || '0');
    profit = profitFromKm + profitFromTime;

    suggestedPrice = totalCost + profit;
  }

  const handleSaveRide = () => {
    if (distanceKm === null || durationMin === null) return;
    
    const validAddresses = addresses.filter(a => a.trim() !== '');
    
    addRide({
      date: formatISO(new Date()),
      app: 'Particular',
      earnings: suggestedPrice,
      distanceKm: distanceKm,
      durationMinutes: Math.round(durationMin),
      origin: validAddresses[0] || '',
      destination: validAddresses[validAddresses.length - 1] || '',
    });
    
    // Reset form or show success
    setAddresses(['', '']);
    setDistanceKm(null);
    setDurationMin(null);
    setRouteCoords([]);
    setWaypointsCoords([]);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleShare = async () => {
    if (!quotationRef.current) return;
    
    setIsSharing(true);
    try {
      // Use html-to-image which supports modern CSS like oklch
      const dataUrl = await htmlToImage.toPng(quotationRef.current, {
        backgroundColor: '#18181b', // zinc-950 to match theme
        pixelRatio: 2, // better quality
      });
      
      // Convert dataUrl to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const file = new File([blob], 'cotacao-corrida.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        const validAddresses = addresses.filter(a => a.trim() !== '');
        const origin = validAddresses[0];
        const destination = validAddresses[validAddresses.length - 1];
        
        const shareText = `
🚗 *COTAÇÃO DE CORRIDA PARTICULAR* 🚗

📍 *Origem:* ${origin}
🏁 *Destino:* ${destination}

📏 *Distância:* ${distanceKm?.toFixed(1)} km
⏱️ *Tempo Estimado:* ${Math.round(durationMin || 0)} min

💰 *Valor Total:* R$ ${suggestedPrice.toFixed(2)}

✨ *Por que viajar comigo?*
✅ Conforto e segurança garantidos
✅ Carro limpo e higienizado
✅ Sem surpresas no valor final

Gostou da proposta? Vamos fechar? 🤝
Responda esta mensagem para confirmar sua viagem! 🚀
`.trim();

        await navigator.share({
          title: 'Cotação de Corrida Particular',
          text: shareText,
          files: [file]
        });
      } else {
        // Fallback to download
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'cotacao-corrida.png';
        a.click();
      }
    } catch (err) {
      console.error('Error sharing:', err);
      alert('Não foi possível gerar a imagem da cotação. Tente novamente.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleAddStop = () => {
    setAddresses([...addresses, '']);
  };

  const handleRemoveStop = (index: number) => {
    const newAddresses = [...addresses];
    newAddresses.splice(index, 1);
    setAddresses(newAddresses);
  };

  const handleAddressChange = (index: number, value: string) => {
    const newAddresses = [...addresses];
    newAddresses[index] = value;
    setAddresses(newAddresses);
  };

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-2xl font-bold tracking-tight">Calculadora Particular</h1>
      
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <form onSubmit={handleCalculate} className="space-y-4">
            {addresses.map((address, index) => (
              <div key={index} className="space-y-2 relative">
                <label className="text-xs text-zinc-400 flex items-center">
                  {index === 0 ? (
                    <><MapPin className="w-3 h-3 mr-1 text-emerald-500" /> Origem</>
                  ) : index === addresses.length - 1 ? (
                    <><Navigation className="w-3 h-3 mr-1 text-blue-500" /> Destino</>
                  ) : (
                    <><MapPin className="w-3 h-3 mr-1 text-yellow-500" /> Parada {index}</>
                  )}
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={address} 
                    onChange={e => handleAddressChange(index, e.target.value)} 
                    placeholder={index === 0 ? "Ex: Av. Paulista, 1000, São Paulo" : index === addresses.length - 1 ? "Ex: Aeroporto de Guarulhos" : "Ex: Rua Augusta, 500"} 
                    required 
                  />
                  {addresses.length > 2 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      className="shrink-0 border-zinc-700 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                      onClick={() => handleRemoveStop(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
              onClick={handleAddStop}
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar Parada
            </Button>
            
            {error && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-start text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isCalculating}
            >
              {isCalculating ? 'Calculando...' : 'Calcular Rota'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {distanceKm !== null && durationMin !== null && (
        <div className="space-y-6">
          <div ref={quotationRef} className="space-y-6 p-6 bg-zinc-950 rounded-xl -mx-4 sm:mx-0 border border-zinc-800">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-500/20 rounded-full mb-3">
                <Car className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Sua Viagem Particular</h2>
              <p className="text-sm text-zinc-400 mt-1">Viagem segura, confortável e sem surpresas.</p>
            </div>

            <Card className="bg-zinc-900/80 border-zinc-700 overflow-hidden shadow-xl">
              <div className="p-5 border-b border-zinc-800 space-y-4">
                {addresses.filter(a => a.trim() !== '').map((address, index, arr) => (
                  <div key={index} className="flex items-start">
                    <div className="flex flex-col items-center mr-3">
                      {index === 0 ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                        </div>
                      ) : index === arr.length - 1 ? (
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Navigation className="w-3 h-3 text-blue-500" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-yellow-500" />
                        </div>
                      )}
                      {index < arr.length - 1 && <div className="w-0.5 h-full bg-zinc-700 my-1"></div>}
                    </div>
                    <div className="pb-2">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        {index === 0 ? 'Saindo de' : index === arr.length - 1 ? 'Indo para' : `Parada ${index}`}
                      </p>
                      <p className="text-sm font-medium text-zinc-100 mt-0.5">{address}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-48 w-full bg-zinc-800 relative z-0">
                <MapContainer 
                  center={waypointsCoords[0] || [-23.5505, -46.6333]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {waypointsCoords.map((coord, index) => (
                    <Marker key={index} position={coord} />
                  ))}
                  {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#3b82f6" weight={4} />}
                  <MapBounds bounds={mapBounds} />
                </MapContainer>
              </div>
              <CardContent className="p-5 grid grid-cols-2 gap-4 bg-zinc-900/90">
                <div className="flex flex-col items-center justify-center text-center p-3 bg-zinc-950/50 rounded-lg">
                  <Route className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-xs text-zinc-400 mb-1">Distância</p>
                  <p className="text-lg font-bold text-zinc-100">{distanceKm.toFixed(1)} km</p>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-3 bg-zinc-950/50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400 mb-2" />
                  <p className="text-xs text-zinc-400 mb-1">Tempo Estimado</p>
                  <p className="text-lg font-bold text-zinc-100">{Math.round(durationMin)} min</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-900/40 to-zinc-900/80 border-emerald-900/50 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-emerald-400/80 uppercase tracking-wider">Valor do Investimento</p>
                  <p className="text-5xl font-bold text-emerald-400">R$ {suggestedPrice.toFixed(2)}</p>
                  <p className="text-xs text-zinc-400 mt-2">Pagamento via PIX, Cartão ou Dinheiro</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center pt-2">
              <p className="text-sm font-medium text-zinc-300">Gostou da proposta? Vamos fechar! 🤝</p>
            </div>
          </div>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ações e Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button 
                  onClick={handleShare} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSharing}
                >
                  {isSharing ? 'Gerando...' : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar / Baixar
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t border-zinc-800">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Custo Estimado (Combustível + Manut + Fixo)</span>
                  <span className="text-red-400">R$ {totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Lucro Estimado</span>
                  <span className="text-emerald-400">R$ {profit.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <h3 className="text-sm font-medium text-zinc-300">Configurar Preços</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400">Preço Combustível (R$/L)</label>
                    <Input type="number" step="0.01" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400">Lucro Desejado (R$/KM)</label>
                    <Input type="number" step="0.01" value={desiredProfitPerKm} onChange={e => setDesiredProfitPerKm(e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs text-zinc-400">Lucro Desejado (R$/Hora)</label>
                    <Input type="number" step="0.01" value={desiredProfitPerHour} onChange={e => setDesiredProfitPerHour(e.target.value)} />
                  </div>
                </div>
              </div>

              {showSuccess && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg flex items-center text-emerald-400 text-sm justify-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Corrida salva no Diário!
                </div>
              )}

              <Button 
                onClick={handleSaveRide} 
                className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
              >
                Salvar no Diário
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
