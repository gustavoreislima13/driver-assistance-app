import { AppState } from './types';
import { subDays, formatISO } from 'date-fns';

const today = new Date();

export const initialData: AppState = {
  vehicle: {
    make: 'Volkswagen',
    model: 'Fox',
    year: 2014,
    engine: '1.0',
    currentKm: 125430,
    idealConsumptionKmL: 12.5, // City driving
  },
  maintenanceAlerts: [
    { id: '1', item: 'Troca de Óleo', intervalKm: 10000, lastServiceKm: 120000 },
    { id: '2', item: 'Pastilhas de Freio', intervalKm: 30000, lastServiceKm: 105000 },
    { id: '3', item: 'Pneus', intervalKm: 50000, lastServiceKm: 80000 },
  ],
  fixedExpenses: {
    insurance: 150, // Monthly
    ipva: 1200, // Annual
    internet: 50, // Monthly
    maintenanceReservePerKm: 0.15, // R$ 0.15 per km driven
    carInstallment: 1200,
    tireSetCost: 2000,
    netIncomeGoal: 4000,
  },
  rides: [
    {
      id: 'r1',
      date: formatISO(today),
      app: 'Uber',
      earnings: 45.50,
      distanceKm: 15.2,
      durationMinutes: 35,
      origin: 'Centro, Santana de Parnaíba',
      destination: 'Alphaville, Barueri',
    },
    {
      id: 'r2',
      date: formatISO(today),
      app: '99',
      earnings: 28.00,
      distanceKm: 8.5,
      durationMinutes: 20,
      origin: 'Alphaville, Barueri',
      destination: 'Tamboré, Barueri',
    },
    {
      id: 'r3',
      date: formatISO(subDays(today, 1)),
      app: 'Uber',
      earnings: 120.00,
      distanceKm: 45.0,
      durationMinutes: 65,
      origin: 'Santana de Parnaíba',
      destination: 'Aeroporto de Guarulhos',
    },
    {
      id: 'r4',
      date: formatISO(subDays(today, 1)),
      app: 'inDrive',
      earnings: 55.00,
      distanceKm: 22.0,
      durationMinutes: 40,
      origin: 'Guarulhos',
      destination: 'Osasco',
    },
    {
      id: 'r5',
      date: formatISO(subDays(today, 2)),
      app: 'Uber',
      earnings: 85.00,
      distanceKm: 30.0,
      durationMinutes: 50,
      origin: 'Osasco',
      destination: 'Santana de Parnaíba',
    },
    {
      id: 'r6',
      date: formatISO(subDays(today, 3)),
      app: '99',
      earnings: 150.00,
      distanceKm: 60.0,
      durationMinutes: 90,
      origin: 'Santana de Parnaíba',
      destination: 'São Paulo (Paulista)',
    },
    {
      id: 'r7',
      date: formatISO(subDays(today, 4)),
      app: 'Uber',
      earnings: 200.00,
      distanceKm: 80.0,
      durationMinutes: 120,
      origin: 'São Paulo',
      destination: 'Campinas',
    }
  ],
  expenses: [
    {
      id: 'e1',
      date: formatISO(today),
      category: 'Combustível',
      amount: 100.00,
      description: 'Posto Ipiranga Alphaville',
    },
    {
      id: 'e2',
      date: formatISO(subDays(today, 1)),
      category: 'Alimentação',
      amount: 25.00,
      description: 'Almoço',
    },
    {
      id: 'e3',
      date: formatISO(subDays(today, 2)),
      category: 'Lavagem',
      amount: 40.00,
      description: 'Lava Rápido Centro',
    },
    {
      id: 'e4',
      date: formatISO(subDays(today, 3)),
      category: 'Combustível',
      amount: 150.00,
      description: 'Etanol',
    }
  ]
};
