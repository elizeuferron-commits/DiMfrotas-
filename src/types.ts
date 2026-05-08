export type UserRole = 'admin' | 'manager' | 'driver';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: 'van' | 'bus';
  capacity: number;
  currentOdometer: number;
  factoryYear: string;
  licenseExpiration: string;
  tourismLicenseExpiration: string;
  insuranceExpiration: string;
  nextOilChangeKM?: number;
  nextPreventiveMaintenanceDate?: string;
  nextMaintenanceKM?: number;
  lastMaintenanceDate?: string;
  lastMaintenanceKM?: number;
  status: 'available' | 'maintenance' | 'trip';
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiration?: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  birthDate?: string;
  admissionDate?: string;
}

export interface FuelTank {
  id: string;
  name: string;
  fuelType: string;
  capacity: number;
  currentLevel: number;
  updatedAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  driverId: string;
  fuelTankId?: string;
  isExternal?: boolean;
  location?: string;
  quantity: number;
  arlaQuantity?: number;
  arlaTankId?: string;
  odometer: number;
  cost: number;
  timestamp: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  type: 'preventive' | 'corrective';
  status: 'pending' | 'completed';
  cost: number;
  odometer?: number;
  scheduledDate: string;
  completedAt?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
}

export interface FuelEntry {
  id: string;
  tankId: string;
  quantity: number;
  cost: number;
  supplier?: string;
  timestamp: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'ok' | 'issue' | 'n/a';
}

export interface Checklist {
  id: string;
  vehicleId: string;
  responsible: string;
  odometer: number;
  date: string;
  observations: string;
  items: ChecklistItem[];
}
