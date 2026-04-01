export type AppType = 'Uber' | '99' | 'inDrive' | 'Particular';
export type ExpenseCategory = 'Combustível' | 'Lavagem' | 'Pedágio' | 'Alimentação' | 'Manutenção' | 'Outros';

export interface Ride {
  id: string;
  date: string; // ISO string
  app: AppType;
  earnings: number;
  distanceKm: number;
  durationMinutes: number;
  origin: string;
  destination: string;
}

export interface Expense {
  id: string;
  date: string; // ISO string
  category: ExpenseCategory;
  amount: number;
  description?: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  engine: string;
  currentKm: number;
  idealConsumptionKmL: number;
}

export interface MaintenanceAlert {
  id: string;
  item: string;
  intervalKm: number;
  lastServiceKm: number;
}

export interface FixedExpenses {
  insurance: number;
  ipva: number; // Annual
  internet: number; // Monthly
  maintenanceReservePerKm: number; // e.g., 0.10 per km
}

export interface AppState {
  rides: Ride[];
  expenses: Expense[];
  vehicle: Vehicle;
  maintenanceAlerts: MaintenanceAlert[];
  fixedExpenses: FixedExpenses;
}
