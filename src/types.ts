export type UserRole = 
  | 'Dono / Proprietário' 
  | 'Gestor de Frotas' 
  | 'Coordenador Logístico' 
  | 'Administrativo' 
  | 'Motorista' 
  | 'Limpeza / Conservação' 
  | 'Visitante'
  | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  permissions?: string[];
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

export interface FinancialTransaction {
  id: string;
  type: 'payable' | 'receivable';
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  refId?: string;
  refType?: 'maintenance' | 'trip' | 'fuel' | 'other';
  observations?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  cpf?: string;
  rg?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiration?: string;
  phone: string;
  email: string;
  password?: string;
  status: 'active' | 'inactive';
  birthDate?: string;
  admissionDate?: string;
  photoUrl?: string;
  permissions?: string[];
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

export interface Passenger {
  name: string;
  document: string;
}

export interface Stop {
  location: string;
  arrivalTime: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  secondDriverId?: string;
  title: string;
  origin: string;
  destination: string;
  stops: Stop[];
  tripType: 'state' | 'interstate' | 'mercosur';
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  passengers: Passenger[];
  passengerCount?: number;
  documentation: { label: string; checked: boolean }[];
  attachments?: { name: string; url: string; type: 'image' | 'pdf' | 'word' | 'excel' }[];
  notes?: string;
  osNumber?: string;
}

export interface Journey {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime?: string;
  breaks: { start: string; end?: string }[];
  status: 'active' | 'on_break' | 'completed';
  totalMinutes?: number;
  location?: { lat: number; lng: number };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
