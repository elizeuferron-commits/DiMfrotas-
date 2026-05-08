import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Bus, 
  Fuel, 
  Wrench, 
  Bell, 
  Plus, 
  Search,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Share2,
  MapPin,
  Cake,
  Printer,
  Droplets,
  CheckCircle,
  Hash
} from 'lucide-react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  orderBy,
  limit,
  addDoc
} from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format, isAfter, parseISO, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { cn } from './lib/utils';
import { 
  Vehicle, 
  Employee, 
  FuelTank, 
  FuelLog, 
  MaintenanceLog, 
  StockItem, 
  UserProfile,
  FuelEntry 
} from './types';

// Componentes Modulares
import { Sidebar } from './components/Sidebar';
import { Card, StatCard } from './components/Cards';
import { Modal } from './components/UI';
import { VehicleForm, FuelForm, TankForm, TankRefillForm, EmployeeForm, MaintenanceForm } from './components/Forms';
import { VehicleDetail } from './components/VehicleDetail';

import { Toaster, toast } from 'sonner';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('fleet');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Section labels updated
  const sections = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'fleet', label: 'Frota', icon: Bus },
    { id: 'vencimentos', label: 'Vencimentos', icon: Calendar },
    { id: 'fuel', label: 'Combustível', icon: Fuel },
    { id: 'maintenance', label: 'Manutenções', icon: Wrench },
    { id: 'staff', label: 'Equipe', icon: Users },
    { id: 'trips', label: 'Viagens', icon: TrendingUp },
    { id: 'inventory', label: 'Almoxarifado', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: Bell },
  ];
  
  // Modais
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExternalFuelModalOpen, setIsExternalFuelModalOpen] = useState(false);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Data States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelTanks, setFuelTanks] = useState<FuelTank[]>([]);
  const [recentFuelLogs, setRecentFuelLogs] = useState<FuelLog[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email!,
              displayName: user.displayName || 'Novo Usuário',
              role: 'driver',
              photoURL: user.photoURL || undefined
            };
            await setDoc(doc(db, 'users', user.uid), {
              ...newProfile,
              createdAt: serverTimestamp()
            });
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
          // Don't throw here to avoid blocking setLoading(false)
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
      setVehicles(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Vehicle)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'vehicles'));

    const unsubFuel = onSnapshot(collection(db, 'fuel_tanks'), (snapshot) => {
      setFuelTanks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FuelTank)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'fuel_tanks'));

    const unsubLogs = onSnapshot(query(collection(db, 'fuel_logs'), orderBy('timestamp', 'desc'), limit(100)), (snapshot) => {
      setRecentFuelLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FuelLog)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'fuel_logs'));

    const unsubEntries = onSnapshot(query(collection(db, 'fuel_entries'), orderBy('timestamp', 'desc'), limit(100)), (snapshot) => {
      setFuelEntries(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FuelEntry)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'fuel_entries'));

    const unsubMaint = onSnapshot(collection(db, 'maintenance_logs'), (snapshot) => {
      setMaintenance(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceLog)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'maintenance_logs'));

    const unsubStock = onSnapshot(collection(db, 'stock_items'), (snapshot) => {
      setStock(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StockItem)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'stock_items'));

    const unsubStaff = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'employees'));

    return () => {
      unsubVehicles();
      unsubFuel();
      unsubLogs();
      unsubEntries();
      unsubMaint();
      unsubStock();
      unsubStaff();
    };
  }, [user]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = () => signOut(auth);

  const handleSaveVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const newOdometer = Number(data.currentOdometer);

    try {
      if (selectedVehicle) {
        // Validation: Odometer must be >= previous
        if (newOdometer < selectedVehicle.currentOdometer) {
          toast.error(`O odômetro não pode ser menor que o último registrado (${selectedVehicle.currentOdometer} KM)`);
          setFormLoading(false);
          return;
        }

        await setDoc(doc(db, 'vehicles', selectedVehicle.id), {
          ...selectedVehicle,
          ...data,
          capacity: Number(data.capacity),
          currentOdometer: newOdometer,
          nextOilChangeKM: data.nextOilChangeKM ? Number(data.nextOilChangeKM) : undefined,
          updatedAt: new Date().toISOString()
        });
        toast.success('Veículo atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'vehicles'), {
          ...data,
          capacity: Number(data.capacity),
          currentOdometer: newOdometer,
          nextOilChangeKM: data.nextOilChangeKM ? Number(data.nextOilChangeKM) : undefined,
          status: 'available',
          updatedAt: new Date().toISOString()
        });
        toast.success('Veículo cadastrado com sucesso!');
      }
      setIsVehicleModalOpen(false);
      setSelectedVehicle(null);
    } catch (error) {
      toast.error('Erro ao salvar veículo');
      handleFirestoreError(error, OperationType.WRITE, 'vehicles');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveFuel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const quantity = Number(data.quantity || 0);
    const odometer = Number(data.odometer || 0);
    const cost = Number(data.cost || 0);
    const vehicleId = data.vehicleId as string;
    const tankId = data.fuelTankId as string;
    const arlaTankId = data.arlaTankId as string;
    const arlaQuantity = Number(data.arlaQuantity || 0);
    const isExternal = data.isExternal === 'true';
    const location = data.location as string;

    if (!vehicleId || (!isExternal && !tankId)) {
      toast.error(isExternal ? 'Selecione um veículo' : 'Selecione um veículo e um tanque de origem');
      setFormLoading(false);
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Quantidade inválida');
      setFormLoading(false);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get vehicle reference
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleSnapshot = await transaction.get(vehicleRef);
        if (!vehicleSnapshot.exists()) throw new Error('Veículo não encontrado');
        const vehicle = vehicleSnapshot.data() as Vehicle;

        if (odometer < vehicle.currentOdometer) {
          throw new Error(`Km informado (${odometer}) é menor que o atual (${vehicle.currentOdometer})`);
        }

        // 2. Get tank reference (only if internal)
        let tankSnapshot = null;
        let tankRef = null;
        if (!isExternal) {
          tankRef = doc(db, 'fuel_tanks', tankId);
          tankSnapshot = await transaction.get(tankRef);
          if (!tankSnapshot.exists()) throw new Error('Tanque não encontrado');
          const tank = tankSnapshot.data() as FuelTank;

          if (tank.currentLevel < quantity) {
            throw new Error(`Saldo insuficiente no tanque (${tank.currentLevel}L disponível)`);
          }
        }

        // 3. Get Arla tank reference (if requested and internal) - MUST BE READ BEFORE ANY WRITES
        let arlaTankSnapshot = null;
        let arlaTankRef = null;
        if (!isExternal && arlaTankId && arlaQuantity > 0) {
          arlaTankRef = doc(db, 'fuel_tanks', arlaTankId);
          arlaTankSnapshot = await transaction.get(arlaTankRef);
          if (!arlaTankSnapshot.exists()) throw new Error('Tanque de Arla não encontrado');
        }

        // --- ALL READS MUST BE ABOVE THIS LINE ---

        // 4. Register Fuel Log
        const logRef = doc(collection(db, 'fuel_logs'));
        transaction.set(logRef, {
          ...data,
          quantity,
          odometer,
          cost,
          isExternal: isExternal || false,
          location: location || 'Interno',
          timestamp: new Date().toISOString()
        });

        // 5. Update Tank Level (only if internal)
        if (!isExternal && tankSnapshot && tankRef) {
          const tank = tankSnapshot.data() as FuelTank;
          transaction.update(tankRef, {
            currentLevel: tank.currentLevel - quantity,
            updatedAt: new Date().toISOString()
          });
        }

        // 6. Update Vehicle Odometer
        transaction.update(vehicleRef, {
          currentOdometer: odometer,
          updatedAt: new Date().toISOString()
        });

        // 7. Update Arla Tank Level (if requested and internal)
        if (!isExternal && arlaTankSnapshot && arlaTankRef && arlaQuantity > 0) {
          const arlaTank = arlaTankSnapshot.data() as FuelTank;
          if (arlaTank.currentLevel < arlaQuantity) {
            throw new Error(`Saldo insuficiente no tanque de Arla (${arlaTank.currentLevel}L disponível)`);
          }

          transaction.update(arlaTankRef, {
            currentLevel: arlaTank.currentLevel - arlaQuantity,
            updatedAt: new Date().toISOString()
          });
        }
      });

      toast.success('Abastecimento registrado com sucesso!');
      setIsFuelModalOpen(false);
      setIsExternalFuelModalOpen(false);
    } catch (error: any) {
      const message = error.message.includes('insuficiente') || error.message.includes('Km informado') 
        ? error.message 
        : 'Erro ao registrar abastecimento';
      toast.error(message);
      handleFirestoreError(error, OperationType.WRITE, 'fuel_logs');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveTank = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await addDoc(collection(db, 'fuel_tanks'), {
        ...data,
        capacity: Number(data.capacity),
        currentLevel: Number(data.currentLevel),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast.success('Tanque cadastrado com sucesso!');
      setIsTankModalOpen(false);
    } catch (error) {
      toast.error('Erro ao cadastrar tanque');
      handleFirestoreError(error, OperationType.WRITE, 'fuel_tanks');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveRefill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const tankId = data.tankId as string;
    const quantity = Number(data.quantity || 0);
    const cost = Number(data.cost || 0);

    if (!tankId) {
      toast.error('Selecione um tanque para reabastecer');
      setFormLoading(false);
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Quantidade inválida');
      setFormLoading(false);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const tankRef = doc(db, 'fuel_tanks', tankId);
        const tankSnapshot = await transaction.get(tankRef);
        if (!tankSnapshot.exists()) throw new Error('Tanque não encontrado');
        const tank = tankSnapshot.data() as FuelTank;

        // Update Tank
        transaction.update(tankRef, {
          currentLevel: tank.currentLevel + quantity,
          updatedAt: new Date().toISOString()
        });

        // Record entry log
        const entryRef = doc(collection(db, 'fuel_entries'));
        transaction.set(entryRef, {
          ...data,
          quantity,
          cost,
          timestamp: new Date().toISOString()
        });
      });

      toast.success('Entrada de combustível registrada!');
      setIsRefillModalOpen(false);
    } catch (error) {
      toast.error('Erro ao registrar entrada');
      handleFirestoreError(error, OperationType.WRITE, 'fuel_entries');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      if (selectedEmployee) {
        await setDoc(doc(db, 'employees', selectedEmployee.id), {
          ...selectedEmployee,
          ...data,
          updatedAt: new Date().toISOString()
        });
        toast.success('Funcionário atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'employees'), {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        toast.success('Funcionário cadastrado com sucesso!');
      }

      setIsEmployeeModalOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      toast.error('Erro ao cadastrar funcionário');
      handleFirestoreError(error, OperationType.WRITE, 'employees');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveMaintenance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const vehicleId = data.vehicleId as string;
    const cost = Number(data.cost || 0);
    const odometer = Number(data.odometer || 0);

    try {
      await runTransaction(db, async (transaction) => {
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleSnapshot = await transaction.get(vehicleRef);
        if (!vehicleSnapshot.exists()) throw new Error('Veículo não encontrado');

        // Create log
        const logRef = doc(collection(db, 'maintenance_logs'));
        transaction.set(logRef, {
          ...data,
          cost,
          odometer,
          vehicleId, // Ensure vehicleId is saved
          createdAt: new Date().toISOString()
        });

        // Update vehicle maintenance stats
        transaction.update(vehicleRef, {
          lastMaintenanceDate: data.completedAt,
          lastMaintenanceKM: odometer,
          nextPreventiveMaintenanceDate: data.nextPreventiveMaintenanceDate || null,
          nextMaintenanceKM: Number(data.nextMaintenanceKM) || null,
          updatedAt: new Date().toISOString()
        });
      });

      toast.success('Manutenção registrada com sucesso!');
      setIsMaintenanceModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar manutenção');
      handleFirestoreError(error, OperationType.WRITE, 'maintenance_logs');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePrintOS = (log: MaintenanceLog) => {
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Ordem de Serviço - ${vehicle?.plate || '---'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #000; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 4px solid #000; pb: 20px; mb: 40px; align-items: center; }
            .logo { font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: -1px; }
            .os-number { font-weight: 900; font-size: 40px; color: #eee; position: absolute; top: 20px; right: 40px; z-index: -1; }
            .section { margin-bottom: 30px; }
            .section-title { font-weight: 900; text-transform: uppercase; font-size: 12px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; color: #666; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .item { margin-bottom: 10px; }
            .label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #888; }
            .value { font-size: 14px; font-weight: 700; }
            .description-box { border: 2px solid #000; padding: 20px; margin-top: 10px; min-height: 100px; font-weight: 700; }
            .footer { margin-top: 60px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 10px; text-align: center; color: #999; }
            .sign-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 80px; }
            .sign-line { border-top: 1px solid #000; text-align: center; padding-top: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="os-number">OS #${log.id?.substring(0, 6).toUpperCase()}</div>
          <div class="header">
            <div class="logo">Unimult Transportes</div>
            <div style="text-align: right">
              <div class="value">RELATÓRIO DE MANUTENÇÃO</div>
              <div class="label">Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Dados do Veículo</div>
            <div class="grid">
              <div class="item">
                <div class="label">Placa</div>
                <div class="value">${vehicle?.plate || '---'}</div>
              </div>
              <div class="item">
                <div class="label">Modelo</div>
                <div class="value">${vehicle?.model || '---'}</div>
              </div>
              <div class="item">
                <div class="label">Ano</div>
                <div class="value">${vehicle?.factoryYear || '---'}</div>
              </div>
              <div class="item">
                <div class="label">Capacidade</div>
                <div class="value">${vehicle?.capacity || '---'} PAX</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Informações do Serviço</div>
            <div class="grid">
              <div class="item">
                <div class="label">Data de Conclusão</div>
                <div class="value">${log.completedAt ? format(parseISO(log.completedAt), 'dd/MM/yyyy') : '---'}</div>
              </div>
              <div class="item">
                <div class="label">KM no Ato</div>
                <div class="value">${log.odometer?.toLocaleString() || '---'} KM</div>
              </div>
              <div class="item">
                <div class="label">Tipo</div>
                <div class="value">${log.type === 'preventive' ? 'PREVENTIVA' : 'CORRETIVA'}</div>
              </div>
              <div class="item">
                <div class="label">Custo do Serviço</div>
                <div class="value">R$ ${log.cost.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Descrição Técnica do Serviço</div>
            <div class="description-box">
              ${log.description}
            </div>
          </div>

          <div class="section" style="margin-top: 40px;">
            <div class="section-title">Próxima Revisão Programada</div>
            <div class="grid">
              <div class="item">
                <div class="label">Data Prevista</div>
                <div class="value">${vehicle?.nextPreventiveMaintenanceDate ? format(parseISO(vehicle.nextPreventiveMaintenanceDate), 'dd/MM/yyyy') : 'Não agendada'}</div>
              </div>
              <div class="item">
                <div class="label">KM Previsto</div>
                <div class="value">${vehicle?.nextMaintenanceKM?.toLocaleString() || '---'} KM</div>
              </div>
            </div>
          </div>

          <div class="sign-grid">
            <div class="sign-line">Responsável pela Oficina</div>
            <div class="sign-line">Responsável pela Frota</div>
          </div>

          <div class="footer">
            Este documento é um registro interno de manutenção da Unimult Transportes.<br>
            A manutenção correta garante a segurança de nossos passageiros e colaboradores.
          </div>

          <script>
            window.onload = () => {
              window.print();
              // window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const openAddVehicle = () => {
    setSelectedVehicle(null);
    setIsVehicleModalOpen(true);
  };

  const openVehicleDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDetailModalOpen(true);
  };

  const openEditFromDetail = () => {
    setIsDetailModalOpen(false);
    setIsVehicleModalOpen(true);
  };

  const openEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsVehicleModalOpen(true);
  };

  const handleShareReport = async (reportTitle: string) => {
    const reportUrl = `${window.location.origin}/#reports/${reportTitle.toLowerCase()}`;
    const shareData = {
      title: `Relatório DM Frotas: ${reportTitle}`,
      text: `Confira o relatório de ${reportTitle.toLowerCase()} da DM Frotas.`,
      url: reportUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(reportUrl);
        toast.success(`Link do relatório de ${reportTitle} copiado!`);
      } catch (clipErr) {
        console.error('Clipboard share failed:', clipErr);
        toast.error('Erro ao compartilhar relatório.');
      }
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-rustic-gradient flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md space-y-12 text-center animate-in fade-in zoom-in duration-1000">
          <div className="w-32 h-32 bg-brand-accent rounded-[2.5rem] mx-auto flex items-center justify-center transform rotate-12 shadow-2xl shadow-brand-accent/20">
            <Bus className="w-16 h-16 text-zinc-950 transform -rotate-12" />
          </div>
          <div className="space-y-6">
            <h1 className="text-6xl font-black text-white tracking-tighter leading-none uppercase">DM Frotas</h1>
            <p className="text-zinc-500 font-medium tracking-tight px-10 leading-relaxed opacity-80 uppercase text-[10px] tracking-[0.3em]">Gestão Operacional de Alto Desempenho</p>
          </div>
          <button 
            onClick={login} 
            className="w-full py-6 bg-zinc-100 hover:bg-white text-zinc-950 rounded-[2rem] font-black transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 group relative overflow-hidden"
          >
             <div className="w-8 h-8 bg-zinc-900/10 rounded-xl flex items-center justify-center text-xs font-black group-hover:bg-zinc-900/20 transition-colors">G</div>
             Acessar DM Dashboard
          </button>
          <div className="pt-8">
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.5em]">DM Frotas • Industrial Standard © 2026</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rustic-gradient flex font-sans selection:bg-brand-accent/30 selection:text-white overflow-hidden text-zinc-300">
      <Toaster theme="dark" position="top-right" expand={false} richColors />
      
      {/* Subtle Industrial Background Overlay */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 -z-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />


      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        profile={profile}
        logout={logout}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800 px-10 h-24 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-3.5 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-all bg-zinc-900 border border-zinc-700 shadow-xl active:scale-95 group"
            >
              {sidebarOpen ? <ChevronRight className="rotate-180 group-hover:-translate-x-0.5 transition-transform" size={22} /> : <Bus size={22} />}
            </button>
            <div 
              className="cursor-pointer group flex flex-col pt-1"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter group-hover:text-brand-accent transition-colors leading-none">
                DM Frotas
              </h2>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-1.5 opacity-60">
                {sections.find(s => s.id === activeSection)?.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-zinc-900 rounded-xl border border-zinc-700 uppercase">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-zinc-400 tracking-widest leading-none">Dados Sincronizados</span>
            </div>
            <button className="p-3.5 relative hover:bg-zinc-800 rounded-xl text-zinc-400 bg-zinc-900 border border-zinc-700 transition-all active:scale-95 shadow-xl">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-brand-accent rounded-full border border-zinc-900 shadow-sm" />
            </button>
          </div>
        </header>

        <div className="p-8 md:p-12 max-w-7xl mx-auto w-full space-y-12">
          {activeSection === 'dashboard' && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard 
                   title="Veículos Livres" 
                   value={vehicles.filter(v => v.status === 'available').length} 
                   icon={Bus} 
                   color="bg-zinc-800 border-zinc-700" 
                   glow="glow-amber"
                   trend="+12%"
                />
                <StatCard 
                   title="Abastecimentos" 
                   value={recentFuelLogs.length} 
                   icon={Fuel} 
                   color="bg-zinc-800 border-zinc-700" 
                   trend="+5%"
                />
                <StatCard 
                   title="Em Oficina" 
                   value={maintenance.filter(m => m.status === 'pending').length} 
                   icon={Wrench} 
                   color="bg-amber-600 shadow-amber-900/40" 
                   trend="-2"
                />
                <StatCard 
                   title="Vencimentos" 
                   value={vehicles.filter(v => v.licenseExpiration && isAfter(addDays(new Date(), 15), parseISO(v.licenseExpiration))).length} 
                   icon={AlertTriangle} 
                   color="bg-zinc-800 border-zinc-700" 
                   glow="shadow-rose-900/10"
                   trend="Crítico"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-zinc-900/40 border-zinc-800/50">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest leading-none">Consumo de Diesel (S10)</h3>
                      <p className="text-2xl font-black text-white uppercase mt-2 tabular-nums">Volume Mensal (L)</p>
                    </div>
                    <TrendingUp className="text-brand-accent scale-125" size={32} />
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Jan', v: 4500, c: '#3f3f46' }, 
                        { name: 'Fev', v: 3800, c: '#27272a' }, 
                        { name: 'Mar', v: 5200, c: '#f59e0b' },
                        { name: 'Abr', v: 4100, c: '#18181b' },
                        { name: 'Mai', v: 4900, c: '#f59e0b' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.5} />
                        <XAxis dataKey="name" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} dy={10} />
                        <YAxis fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} />
                        <Tooltip 
                          contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                          cursor={{ fill: 'rgba(245, 158, 11, 0.03)' }}
                        />
                        <Bar dataKey="v" radius={[4, 4, 0, 0]} barSize={40}>
                           {[
                            { c: '#3f3f46' }, { c: '#27272a' }, { c: '#f59e0b' }, { c: '#18181b' }, { c: '#f59e0b' }
                           ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.c} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <div className="flex flex-col items-center">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-10">Eficiência da Frota</h3>
                    <div className="relative w-64 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Operacional', value: 85 },
                              { name: 'Manutenção', value: 15 },
                            ]}
                            cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none"
                          >
                            <Cell fill="#f59e0b" />
                            <Cell fill="#27272a" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-5xl font-black text-white tracking-tighter tabular-nums">85%</span>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Status OK</p>
                      </div>
                    </div>
                    <div className="w-full mt-12 space-y-6">
                       <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-brand-accent rounded-full" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Disponibilidade</span>
                          </div>
                          <span className="text-sm font-black text-white">92%</span>
                       </div>
                       <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-zinc-600 rounded-full" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ociosidade</span>
                          </div>
                          <span className="text-sm font-black text-white">08%</span>
                       </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'vencimentos' && (
            <div className="space-y-12">
              <div className="flex flex-col gap-3">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Vencimentos & Documentação</h1>
                <p className="text-zinc-500 font-medium tracking-tight">Monitoramento crítico de licenças, seguros e documentação de turismo.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <Card className="border-zinc-800 bg-rose-950/10">
                  <h3 className="text-sm font-black uppercase text-rose-500 mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center border border-zinc-800 text-rose-500"><AlertTriangle size={20} /></div> 
                    Licenciamento & Turismo (Próximos)
                  </h3>
                  <div className="space-y-4">
                    {vehicles.flatMap(v => [
                      { 
                        id: `${v.id}-lic`, 
                        plate: v.plate, 
                        label: 'Licenciamento', 
                        date: v.licenseExpiration,
                        icon: 'DETRAN'
                      },
                      { 
                        id: `${v.id}-tour`, 
                        plate: v.plate, 
                        label: 'Certificado Turismo', 
                        date: v.tourismLicenseExpiration,
                        icon: 'ANTT'
                      }
                    ]).filter(item => !!item.date).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()).map(item => {
                      const days = differenceInDays(parseISO(item.date!), new Date());
                      const isExpiringSoon = days <= 15 && days >= 0;
                      
                      return (
                       <div key={item.id} className={cn(
                         "flex items-center justify-between p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-xl hover:bg-zinc-800 transition-all cursor-pointer group relative overflow-hidden",
                         isExpiringSoon && "border-amber-500/50 bg-amber-500/5"
                       )}>
                        {isExpiringSoon && (
                          <div className="absolute top-0 right-0 p-1">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 rounded-bl-lg">
                              <AlertTriangle size={10} className="text-zinc-950" />
                              <span className="text-[8px] font-black text-zinc-950 uppercase">Próximo do Vencimento</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center font-black text-[10px] border border-zinc-800 transition-colors",
                            isExpiringSoon ? "text-amber-500 border-amber-500/30" : "text-rose-500 group-hover:border-rose-900/50"
                          )}>{item.icon}</div>
                          <div>
                            <div className="font-black text-white tracking-tight text-lg leading-none uppercase">{item.plate}</div>
                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">
                              {item.label}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "text-xs font-black tabular-nums",
                            isExpiringSoon ? "text-amber-500" : "text-rose-500"
                          )}>
                            {format(parseISO(item.date!), 'dd/MM/yyyy')}
                          </div>
                          {isExpiringSoon && (
                            <p className="text-[9px] font-black text-amber-500/70 uppercase mt-1">Vence em {days} dias</p>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </Card>
                <Card className="border-zinc-800 bg-amber-950/10">
                  <h3 className="text-sm font-black uppercase text-amber-500 mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center border border-zinc-800 text-amber-500"><Calendar size={20} /></div> 
                    Vencimento CNH Motoristas
                  </h3>
                  <div className="space-y-4">
                    {employees.filter(e => e.licenseExpiration).map(e => {
                      const days = differenceInDays(parseISO(e.licenseExpiration!), new Date());
                      const isExpiringSoon = days <= 15 && days >= 0;

                      return (
                       <div key={e.id} className={cn(
                         "flex items-center justify-between p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-xl hover:bg-zinc-800 transition-all cursor-pointer group relative overflow-hidden",
                         isExpiringSoon && "border-amber-500/50 bg-amber-500/5"
                       )}>
                        {isExpiringSoon && (
                           <div className="absolute top-0 right-0 p-1">
                             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 rounded-bl-lg">
                               <AlertTriangle size={10} className="text-zinc-950" />
                               <span className="text-[8px] font-black text-zinc-950 uppercase">Próximo do Vencimento</span>
                             </div>
                           </div>
                         )}
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center font-black text-[10px] border border-zinc-800 transition-colors",
                            isExpiringSoon ? "text-amber-500 border-amber-500/30" : "text-amber-500 group-hover:border-amber-900/50"
                          )}>CNH</div>
                          <div>
                            <div className="font-black text-white tracking-tight text-lg leading-none uppercase">{e.name}</div>
                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{e.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-amber-500 tabular-nums">
                            {format(parseISO(e.licenseExpiration!), 'dd/MM/yyyy')}
                          </div>
                          {isExpiringSoon && (
                            <p className="text-[9px] font-black text-amber-500/70 uppercase mt-1">Vence em {days} dias</p>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'trips' && (
            <div className="space-y-8">
              <h1 className="text-3xl font-black text-slate-900 uppercase">Viagens & Fretamento</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <Card key={i} className="bg-indigo-50/50 border-indigo-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-3 py-1 bg-white rounded-lg text-[10px] font-black uppercase text-indigo-600 border border-indigo-100">VAN-2234</div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase">Em Curso</span>
                    </div>
                    <h4 className="font-black text-slate-900 uppercase text-sm mb-1">Turismo Rio x SP</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">Previsão: 18h00</p>
                    <div className="h-1 bg-indigo-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[60%]" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="space-y-12">
              <div className="flex flex-col gap-3">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Relatórios Gerenciais</h1>
                <p className="text-zinc-500 font-medium tracking-tight">Análise de desempenho, custos e indicadores operacionais.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {['Financeiro', 'Consumo', 'Produtividade', 'Manutenção', 'Entradas'].map(t => (
                   <Card key={t} className="flex flex-col items-center justify-center py-12 gap-6 hover:border-brand-accent transition-all cursor-pointer group bg-zinc-900 border-zinc-800 relative">
                      <div className={cn(
                        "p-6 bg-zinc-800 rounded-3xl group-hover:bg-brand-accent transition-all group-hover:text-zinc-950 text-zinc-500 group-hover:scale-110 shadow-xl border border-zinc-700 group-hover:border-transparent",
                        t === 'Entradas' && "text-brand-accent/50 group-hover:text-zinc-950"
                      )}>
                        {t === 'Entradas' ? <Package size={40} /> : <TrendingUp size={40} />}
                      </div>
                      <div className="text-center">
                        <span className="font-black text-white uppercase text-xs tracking-[0.2em]">
                          {t === 'Entradas' ? 'Entradas de Combustível' : t}
                        </span>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase mt-2 group-hover:text-zinc-400 transition-colors">Gerar PDF/Excel</p>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareReport(t);
                        }}
                        className="absolute top-4 right-4 p-2.5 bg-zinc-800 hover:bg-brand-accent text-zinc-500 hover:text-zinc-950 rounded-xl transition-all border border-zinc-700 hover:border-transparent active:scale-90"
                        title="Compartilhar Relatório"
                      >
                        <Share2 size={16} />
                      </button>
                   </Card>
                 ))}
              </div>
            </div>
          )}

          {activeSection === 'fuel' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Gestão de Combustível</h1>
                  <div className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                    Bomba de Abastecimento Interna DM
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button 
                    onClick={() => setIsTankModalOpen(true)}
                    className="flex items-center gap-3 px-6 py-4 bg-zinc-900 text-zinc-400 rounded-xl font-bold border border-zinc-800 transition-all hover:bg-zinc-800 active:scale-95"
                  >
                    <Plus size={18} />
                    Configurar Tanque
                  </button>
                  <button 
                    onClick={() => setIsRefillModalOpen(true)}
                    className="flex items-center gap-3 px-6 py-4 bg-zinc-900 text-zinc-400 rounded-xl font-bold border border-zinc-800 transition-all hover:bg-zinc-800 active:scale-95"
                  >
                    <Package size={18} />
                    Carga Refil (Tanque)
                  </button>
                  <button 
                    onClick={() => setIsExternalFuelModalOpen(true)}
                    className="flex items-center gap-3 px-6 py-4 bg-rose-500/10 text-rose-500 rounded-xl font-bold border border-rose-500/20 transition-all hover:bg-rose-500/20 active:scale-95"
                  >
                    <MapPin size={18} />
                    Abastecimento Externo
                  </button>
                  <button 
                    onClick={() => setIsFuelModalOpen(true)}
                    className="flex items-center gap-4 px-10 py-5 bg-brand-accent text-zinc-950 rounded-2xl font-black shadow-2xl transition-all active:scale-95 group hover:scale-[1.02] border-2 border-white/10"
                  >
                    <Plus size={24} className="stroke-[3]" />
                    Carregar Abastecimento (Veículo)
                  </button>
                </div>
              </div>

              {/* Summary Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl group hover:border-brand-accent/50 transition-all">
                   <div className="flex justify-between items-start mb-6">
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Estoque em Tanques</p>
                   </div>
                   <div className="space-y-4">
                     <div className="flex items-end justify-between">
                       <div>
                         <p className="text-3xl font-black text-white tabular-nums tracking-tighter leading-none">
                           {fuelTanks.filter(t => t.fuelType.toLowerCase().includes('s10') || t.fuelType.toLowerCase().includes('diesel')).reduce((acc, t) => acc + t.currentLevel, 0).toLocaleString()} <span className="text-xs text-zinc-600 font-bold">L</span>
                         </p>
                         <p className="text-[9px] font-black text-zinc-500 uppercase mt-1 tracking-widest">Diesel S10</p>
                       </div>
                       <div className="text-right">
                         <p className="text-xl font-black text-brand-accent tabular-nums tracking-tighter leading-none">
                           {fuelTanks.filter(t => t.fuelType.toLowerCase().includes('arla')).reduce((acc, t) => acc + t.currentLevel, 0).toLocaleString()} <span className="text-[10px] text-zinc-600">L</span>
                         </p>
                         <p className="text-[9px] font-black text-zinc-600 uppercase mt-1 tracking-widest leading-none">Arla 32</p>
                       </div>
                     </div>
                   </div>
                </div>
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
                   <div className="flex justify-between items-start mb-6">
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Saídas (Mês Atual)</p>
                   </div>
                   <div className="flex items-end justify-between">
                     <p className="text-4xl font-black text-white tabular-nums tracking-tighter leading-none">
                       {recentFuelLogs.reduce((acc, l) => acc + l.quantity, 0).toLocaleString()} <span className="text-sm text-zinc-600">L</span>
                     </p>
                     <div className="text-right">
                        <p className="text-lg font-black text-brand-accent tabular-nums tracking-tighter leading-none">
                          {recentFuelLogs.reduce((acc, l) => acc + (l.arlaQuantity || 0), 0).toLocaleString()}
                        </p>
                        <p className="text-[9px] font-black text-zinc-600 uppercase mt-1 tracking-widest leading-none">Arla 32</p>
                     </div>
                   </div>
                </div>
                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-6">Economia Operacional</p>
                   <div className="flex items-end justify-between">
                     <p className="text-4xl font-black text-emerald-500 tabular-nums tracking-tighter leading-none">
                       R$ {(recentFuelLogs.reduce((acc, l) => acc + l.cost, 0) * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {fuelTanks.map(tank => {
                  const percentage = (tank.currentLevel / tank.capacity) * 100;
                  const isLow = percentage < 20;

                  return (
                    <Card key={tank.id} className="relative group border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all p-8 flex flex-col justify-between min-h-[320px]">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-black text-2xl text-white uppercase tracking-tighter">{tank.name}</h3>
                          <span className="inline-flex px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-black text-zinc-500 uppercase tracking-widest">{tank.fuelType}</span>
                        </div>
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl border transition-all",
                          isLow ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-zinc-950 border-zinc-800 text-brand-accent"
                        )}>
                          <Fuel size={32} />
                        </div>
                      </div>

                      <div className="space-y-6 mt-12">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-2">Volume Atual</p>
                            <p className={cn(
                              "font-black text-4xl tracking-tighter tabular-nums leading-none",
                              isLow ? "text-rose-500" : "text-white"
                            )}>
                              {tank.currentLevel.toLocaleString()}<span className="text-sm ml-1 text-zinc-500">L</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-2">Percentual</p>
                            <p className="font-black text-xl text-zinc-300 tabular-nums leading-none">{Math.round(percentage)}%</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                            <motion.div 
                              className={cn(
                                "h-full rounded-full shadow-lg",
                                isLow ? "bg-rose-600 shadow-rose-900/40" : "bg-brand-accent shadow-brand-accent/20"
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                            />
                          </div>
                          <div className="flex justify-between px-1">
                             <span className="text-[9px] font-black text-zinc-700 uppercase">Vazio</span>
                             <span className="text-[9px] font-black text-zinc-700 uppercase">Capacidade: {tank.capacity.toLocaleString()}L</span>
                          </div>
                        </div>

                        {/* Nova seção: Entrada de Combustível */}
                        <div className="pt-4 border-t border-zinc-800/50 mt-4">
                          {(() => {
                            const lastEntry = [...fuelEntries].filter(e => e.tankId === tank.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
                            if (lastEntry) {
                              return (
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                    <Package size={16} />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter leading-none mb-1.5">Último Refil (Entrada)</p>
                                    <p className="text-[11px] font-black text-emerald-500 tabular-nums uppercase">
                                      +{Number(lastEntry.quantity).toLocaleString()}L • {lastEntry.timestamp ? format(parseISO(lastEntry.timestamp), 'dd MMM', { locale: ptBR }) : '---'}
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-4 opacity-30">
                                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600">
                                  <Package size={14} />
                                </div>
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">Nenhuma carga vinculada</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {isLow && (
                        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
                          <AlertTriangle size={20} className="text-rose-500" />
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Atenção: Nível de Reserva Ativado</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
                
                {/* Empty State / Add Tank Placeholder */}
                {fuelTanks.length === 0 && (
                  <div className="col-span-full py-20 bg-zinc-950 rounded-[2rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                      <Fuel size={40} className="text-zinc-700" />
                    </div>
                    <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em]">Nenhum tanque cadastrado no sistema</p>
                  </div>
                )}
              </div>

              {/* History Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Abastecimentos Recentes */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <Fuel size={16} className="text-brand-accent" />
                       Abastecimentos (Saídas)
                    </h2>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{recentFuelLogs.length} Registros</span>
                  </div>
                  <div className="space-y-3">
                    {recentFuelLogs.slice(0, 5).map(log => {
                      const v = vehicles.find(v => v.id === log.vehicleId);
                      return (
                        <div key={log.id} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex justify-between items-center hover:bg-zinc-900/60 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-brand-accent text-[10px] tracking-tight group-hover:bg-brand-accent group-hover:text-zinc-950 transition-colors">{v?.plate || '---'}</div>
                            <div>
                              <p className="text-xs font-black text-white uppercase">{v?.model || 'Desconhecido'}</p>
                              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">
                                {log.timestamp ? format(parseISO(log.timestamp), 'dd MMM | HH:mm', { locale: ptBR }) : '---'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-white tabular-nums">{log.quantity}L</p>
                            {log.arlaQuantity && log.arlaQuantity > 0 && (
                              <p className="text-[10px] font-black text-brand-accent tabular-nums tracking-tighter">+{log.arlaQuantity}L Arla</p>
                            )}
                            <p className={cn(
                              "text-[9px] font-black uppercase mt-1 tracking-widest",
                              log.isExternal ? "text-rose-400" : "text-rose-500/50"
                            )}>
                              {log.isExternal ? `Externo: ${log.location?.substring(0, 15)}...` : "Saída Operacional"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {recentFuelLogs.length === 0 && (
                      <div className="py-10 text-center bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-900 text-[10px] font-black text-zinc-700 uppercase tracking-widest">Nenhuma saída registrada</div>
                    )}
                  </div>
                </div>

                {/* Entradas Recentes */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <Package size={16} className="text-emerald-500" />
                       Cargas / Refis (Entradas)
                    </h2>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{fuelEntries.length} Registros</span>
                  </div>
                  <div className="space-y-3">
                    {fuelEntries.slice(0, 5).map(entry => {
                      const tank = fuelTanks.find(t => t.id === entry.tankId);
                      return (
                        <div key={entry.id} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex justify-between items-center hover:bg-zinc-900/60 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-emerald-500 text-[9px] uppercase tracking-tighter text-center leading-[1] px-1 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-colors">Refil <br/> Tanque</div>
                            <div>
                              <p className="text-xs font-black text-white uppercase">{tank?.name || '---'}</p>
                              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">
                                {entry.timestamp ? format(parseISO(entry.timestamp), 'dd MMM | HH:mm', { locale: ptBR }) : '---'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-500 tabular-nums">+{entry.quantity.toLocaleString()}L</p>
                            <p className="text-[9px] text-zinc-500 font-black uppercase mt-1 tracking-widest">NF: {entry.supplier?.split('-').pop() || 'S/N'}</p>
                          </div>
                        </div>
                      );
                    })}
                    {fuelEntries.length === 0 && (
                      <div className="py-10 text-center bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-900 text-[10px] font-black text-zinc-700 uppercase tracking-widest">Nenhuma entrada registrada</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'maintenance' && (
            <div className="space-y-12">
              <div className="flex flex-col gap-8 border-b border-zinc-800 pb-8">
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Manutenções</h1>
                  <p className="text-zinc-500 font-medium tracking-tight">Gestão preventiva, corretiva e controle de custos da frota.</p>
                </div>
                <button 
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="flex items-center gap-4 px-10 py-5 bg-brand-accent text-zinc-950 rounded-2xl font-black shadow-2xl transition-all active:scale-95 group hover:scale-[1.02] w-fit"
                >
                  <Plus size={20} className="stroke-[3]" />
                  Criar Nova Ordem de Serviço
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Ordens Pendentes" 
                  value={maintenance.filter(m => m.status === 'pending').length} 
                  icon={Wrench}
                  color="amber"
                />
                <StatCard 
                  title="Alertas de Vencimento" 
                  value={vehicles.filter(v => (v.nextOilChangeKM && v.nextOilChangeKM - v.currentOdometer <= 1000) || (v.nextPreventiveMaintenanceDate && differenceInDays(parseISO(v.nextPreventiveMaintenanceDate), new Date()) <= 15)).length} 
                  icon={AlertTriangle}
                  color="rose"
                />
                <Card className="bg-zinc-900 border-zinc-800 p-8 flex flex-col justify-between">
                  <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Custo Oficina (Mês)</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                      R$ {maintenance.filter(m => m.completedAt && parseISO(m.completedAt).getMonth() === new Date().getMonth()).reduce((acc, m) => acc + m.cost, 0).toLocaleString()}
                    </p>
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500">
                      <Hash size={20} />
                    </div>
                  </div>
                </Card>
                <Card className="bg-zinc-950 border-emerald-500/20 p-8 flex flex-col justify-between">
                  <p className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest mb-1">Disponibilidade Frota</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-black text-emerald-500 tabular-nums tracking-tighter">
                      {Math.round((vehicles.filter(v => v.status === 'available').length / vehicles.length) * 100)}%
                    </p>
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                      <Bus size={20} />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                <div className="xl:col-span-1 space-y-8">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                       <AlertTriangle size={16} className="text-amber-500" />
                       Ponto de Revisão
                    </h3>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Atenção Prioritária</span>
                  </div>
                  
                  <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                    {vehicles
                      .filter(v => (v.nextOilChangeKM && v.nextOilChangeKM - v.currentOdometer <= 2500) || (v.nextPreventiveMaintenanceDate && differenceInDays(parseISO(v.nextPreventiveMaintenanceDate), new Date()) <= 45))
                      .sort((a, b) => {
                        const aDate = a.nextPreventiveMaintenanceDate ? new Date(a.nextPreventiveMaintenanceDate).getTime() : Infinity;
                        const bDate = b.nextPreventiveMaintenanceDate ? new Date(b.nextPreventiveMaintenanceDate).getTime() : Infinity;
                        return aDate - bDate;
                      })
                      .map(v => {
                        const daysToMaintenance = v.nextPreventiveMaintenanceDate ? differenceInDays(parseISO(v.nextPreventiveMaintenanceDate), new Date()) : null;
                        const oilKmRemaining = v.nextOilChangeKM ? v.nextOilChangeKM - v.currentOdometer : null;
                        
                        const isCritical = (daysToMaintenance !== null && daysToMaintenance <= 5) || (oilKmRemaining !== null && oilKmRemaining <= 500);
                        const isWarning = (daysToMaintenance !== null && daysToMaintenance <= 15) || (oilKmRemaining !== null && oilKmRemaining <= 1000);

                        return (
                          <div 
                            key={v.id} 
                            onClick={() => openVehicleDetails(v)}
                            className={cn(
                              "group border-l-4 bg-zinc-900/40 hover:bg-zinc-900 transition-all cursor-pointer p-5 rounded-r-2xl border-y border-r",
                              isCritical ? "border-rose-500 border-y-rose-500/20 border-r-rose-500/20" : 
                              isWarning ? "border-amber-500 border-y-amber-500/20 border-r-amber-500/20" : 
                              "border-zinc-800 border-y-zinc-800 border-r-zinc-800"
                            )}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-black text-white uppercase text-base tracking-tight leading-none mb-1 group-hover:text-brand-accent transition-colors">{v.plate}</h4>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{v.model}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-zinc-400 tabular-nums">{v.currentOdometer.toLocaleString()} KM</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {oilKmRemaining !== null && (
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                                    <span className="text-zinc-500 flex items-center gap-1"><Droplets size={10} /> Óleo do Motor</span>
                                    <span className={oilKmRemaining <= 500 ? "text-rose-500" : "text-zinc-400"}>{oilKmRemaining.toLocaleString()} KM RESTANTES</span>
                                  </div>
                                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className={cn("h-full transition-all duration-1000", oilKmRemaining <= 500 ? "bg-rose-500" : "bg-brand-accent")} 
                                      style={{ width: `${Math.max(0, Math.min(100, (oilKmRemaining / 10000) * 100))}%` }} 
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {daysToMaintenance !== null && (
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                                    <span className="text-zinc-500 flex items-center gap-1"><Calendar size={10} /> Revisão Preventiva</span>
                                    <span className={daysToMaintenance <= 7 ? "text-rose-500" : "text-zinc-400"}>
                                      {daysToMaintenance < 0 ? `ATRASADA ${Math.abs(daysToMaintenance)} DIAS` : `EM ${daysToMaintenance} DIAS`}
                                    </span>
                                  </div>
                                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className={cn("h-full transition-all duration-1000", daysToMaintenance <= 7 ? "bg-rose-500" : "bg-emerald-500")} 
                                      style={{ width: `${Math.max(0, Math.min(100, ((30 - Math.max(0, daysToMaintenance)) / 30) * 100))}%` }} 
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {vehicles.filter(v => (v.nextOilChangeKM && v.nextOilChangeKM - v.currentOdometer <= 2500) || (v.nextPreventiveMaintenanceDate && differenceInDays(parseISO(v.nextPreventiveMaintenanceDate), new Date()) <= 45)).length === 0 && (
                      <div className="py-12 text-center bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-800">
                        <CheckCircle size={32} className="text-emerald-500/20 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Todos os veículos em dia</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="xl:col-span-2 space-y-8">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                       <Wrench size={16} className="text-brand-accent" />
                       Histórico de O.S. (Últimos 30 dias)
                    </h3>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-accent" />
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Preventiva</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Corretiva</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 rounded-[2rem] border border-zinc-900 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-900 bg-zinc-950/50">
                          <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Data / Status</th>
                          <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Veículo / KM</th>
                          <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Serviço Realizado</th>
                          <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Custo / O.S.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {maintenance
                          .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
                          .slice(0, 12)
                          .map(log => {
                            const vehicle = vehicles.find(v => v.id === log.vehicleId);
                            const isPending = log.status === 'pending';
                            return (
                              <tr key={log.id} className="group hover:bg-zinc-900/60 transition-all">
                                <td className="p-6">
                                  <div className="flex flex-col gap-2">
                                    <p className="text-xs font-black text-zinc-100 tabular-nums">
                                      {log.completedAt ? format(parseISO(log.completedAt), 'dd/MM/yyyy') : format(parseISO(log.createdAt), 'dd/MM/yyyy')}
                                    </p>
                                    <span className={cn(
                                      "text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest w-fit border",
                                      isPending ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    )}>
                                      {isPending ? 'EM ABERTO' : 'CONCLUÍDA'}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: log.type === 'preventive' ? '#ff6b00' : '#f43f5e' }} />
                                      <p className="text-xs font-black text-white uppercase group-hover:text-brand-accent transition-colors">{vehicle?.plate || '---'}</p>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 font-bold tabular-nums uppercase">{log.odometer?.toLocaleString() || '---'} KM</p>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <div className="max-w-[250px]">
                                    <p className="text-xs font-black text-zinc-300 uppercase leading-tight mb-1 truncate">{log.description}</p>
                                    <p className="text-[9px] text-zinc-600 font-medium line-clamp-1 italic">{vehicle?.model || 'Desconhecido'}</p>
                                  </div>
                                </td>
                                <td className="p-6 text-right">
                                  <div className="flex items-center justify-end gap-6">
                                    <div className="text-right">
                                      <p className="text-sm font-black text-white tabular-nums tracking-tighter">R$ {log.cost.toLocaleString()}</p>
                                      <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1">Total Pago</p>
                                    </div>
                                    <button 
                                      onClick={() => handlePrintOS(log)}
                                      className="w-10 h-10 bg-zinc-800 hover:bg-white hover:text-zinc-950 text-zinc-500 rounded-xl transition-all flex items-center justify-center border border-zinc-700"
                                    >
                                      <Printer size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {maintenance.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-20 text-center">
                              <Wrench size={40} className="text-zinc-800 mx-auto mb-6" />
                              <p className="text-xs font-black text-zinc-800 uppercase tracking-[0.4em]">Nenhum histórico disponível</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'staff' && (
            <div className="space-y-12">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-8">
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Fichário Operacional</h1>
                  <p className="text-zinc-500 font-medium tracking-tight flex items-center gap-2">
                    <Users size={14} />
                    {employees.length} Colaboradores Registrados
                  </p>
                </div>
                {/* Space for the day/Current date */}
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Hoje é dia</p>
                  <p className="text-2xl font-black text-brand-accent tracking-tighter uppercase">
                    {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Minimalist Add Card */}
                <button 
                  onClick={() => {
                    setSelectedEmployee(null);
                    setIsEmployeeModalOpen(true);
                  }}
                  className="h-full min-h-[220px] flex flex-col items-center justify-center gap-4 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-3xl hover:border-brand-accent/50 hover:bg-zinc-900/50 transition-all group"
                >
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 group-hover:bg-brand-accent group-hover:text-zinc-950 transition-all">
                    <Plus size={24} />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">Admitir Funcionário</span>
                </button>

                {employees.map(e => {
                  const birthDate = e.birthDate ? parseISO(e.birthDate) : null;
                  const isBirthday = birthDate && (format(birthDate, 'MM-dd') === format(new Date(), 'MM-dd'));

                  return (
                    <Card 
                      key={e.id} 
                      onClick={() => {
                        setSelectedEmployee(e);
                        setIsEmployeeModalOpen(true);
                      }}
                      className={cn(
                        "relative overflow-hidden group border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-all cursor-pointer p-0",
                        isBirthday && "border-brand-accent/50 ring-1 ring-brand-accent/20"
                      )}
                    >
                      {/* Fichário Header */}
                      <div className="p-6 border-b border-zinc-800/50 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-700 transition-all",
                            isBirthday && "bg-brand-accent text-zinc-950 border-brand-accent"
                          )}>
                            {isBirthday ? <Cake size={24} /> : <Users size={24} />}
                          </div>
                          <div>
                            <h4 className="font-black text-white uppercase text-sm tracking-tight leading-none mb-1.5">{e.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded uppercase tracking-widest">{e.role}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fichário Details */}
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Data Nascimento</p>
                            <p className={cn(
                              "text-xs font-bold text-zinc-400 tabular-nums",
                              isBirthday && "text-brand-accent"
                            )}>
                              {e.birthDate ? format(parseISO(e.birthDate), 'dd/MM/yyyy') : '---'}
                            </p>
                            {isBirthday && <p className="text-[8px] font-black text-brand-accent uppercase mt-1 animate-pulse">Parabéns! 🎂</p>}
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Data Admissão</p>
                            <p className="text-xs font-bold text-zinc-400 tabular-nums">
                              {e.admissionDate ? format(parseISO(e.admissionDate), 'dd/MM/yyyy') : '---'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Contato Operacional</p>
                          <div className="flex items-center gap-3">
                             <div className="flex-1 px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-500 font-mono tracking-tighter">
                                {e.phone || 'N/A'}
                             </div>
                             <a 
                               href={`https://wa.me/${e.phone?.replace(/\D/g, '')}`} 
                               onClick={(e) => e.stopPropagation()}
                               target="_blank"
                               rel="noreferrer"
                               className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                             >
                               <Share2 size={16} />
                             </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          {activeSection === 'inventory' && (
            <div className="space-y-12">
              <div className="flex flex-col gap-3">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Almoxarifado DM</h1>
                <p className="text-zinc-500 font-medium tracking-tight">Gestão de peças, materiais de limpeza e escritório.</p>
              </div>

              {/* Categorization Tabs */}
              <div className="flex items-center p-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit">
                {['TUDO', 'PEÇAS', 'LIMPEZA', 'ESCRITÓRIO'].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setInventoryFilter(cat)}
                    className={cn(
                      "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      (cat === 'TUDO' && inventoryFilter === '') || inventoryFilter === cat
                        ? "bg-zinc-800 text-brand-accent shadow-lg" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stock.filter(item => 
                  inventoryFilter === '' || 
                  inventoryFilter === 'TUDO' || 
                  item.category.toUpperCase().includes(inventoryFilter)
                ).length > 0 ? stock
                  .filter(item => 
                    inventoryFilter === '' || 
                    inventoryFilter === 'TUDO' || 
                    item.category.toUpperCase().includes(inventoryFilter)
                  )
                  .map(item => (
                  <Card key={item.id} className="flex justify-between items-center group border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-all cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center shadow-lg border border-zinc-700 group-hover:rotate-6 transition-transform">
                        <Package className="text-zinc-500 group-hover:text-brand-accent transition-colors" size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white uppercase text-sm tracking-tight">{item.name}</h4>
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1.5">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-white tabular-nums text-2xl leading-none">{item.quantity}</p>
                      <p className="text-[9px] text-zinc-600 font-black uppercase mt-2">{item.unit}</p>
                      <div className={cn(
                        "mt-4 inline-block px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border",
                        item.quantity < item.minQuantity ? "bg-rose-950/50 text-rose-500 border-rose-900/40" : "bg-emerald-950/50 text-emerald-500 border-emerald-900/40"
                      )}>
                        {item.quantity < item.minQuantity ? 'CRÍTICO' : 'NORMAL'}
                      </div>
                    </div>
                  </Card>
                )) : (
                  <Card className="col-span-full py-24 text-center border-zinc-800 bg-zinc-900/20 shadow-none">
                    <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-zinc-800">
                      <Package size={48} className="text-zinc-800" />
                    </div>
                    <p className="font-black text-zinc-600 uppercase text-xs tracking-[0.3em]">Nenhum item localizado no almoxarifado</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeSection === 'fleet' && (
            <div className="space-y-12">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-3">
                  <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Frota DM</h1>
                  <p className="text-zinc-500 font-medium tracking-tight">Gestão de cavalos, vans e ônibus executivos.</p>
                </div>
                <button 
                  onClick={openAddVehicle}
                  className="flex items-center gap-4 px-10 py-5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl font-black shadow-2xl transition-all active:scale-95 group"
                >
                  <Plus size={20} className="stroke-[3]" />
                  Novo Ativo
                </button>
              </div>

              <Card className="p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden">
                <div className="p-10 bg-zinc-900/50 border-b border-zinc-800 flex gap-6">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-accent transition-colors" size={24} />
                    <input 
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      className="w-full pl-20 pr-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl focus:border-brand-accent outline-none transition-all placeholder:text-zinc-700 font-bold text-white shadow-inner" 
                      placeholder="Buscar placa ou prefixo..." 
                    />
                  </div>
                </div>
                <div className="divide-y divide-zinc-800">
                  {vehicles
                    .filter(v => 
                      v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) || 
                      v.model.toLowerCase().includes(vehicleSearch.toLowerCase())
                    )
                    .map(v => {
                      const isOilChangeClose = v.nextOilChangeKM && (v.nextOilChangeKM - v.currentOdometer <= 1000);
                      const daysToMaintenance = v.nextPreventiveMaintenanceDate ? differenceInDays(parseISO(v.nextPreventiveMaintenanceDate), new Date()) : null;
                      const isMaintenanceClose = daysToMaintenance !== null && daysToMaintenance <= 15 && daysToMaintenance >= 0;

                      return (
                      <div 
                        key={v.id} 
                        onClick={() => openVehicleDetails(v)}
                        className="grid grid-cols-4 p-8 items-center hover:bg-zinc-800/30 transition-all group cursor-pointer relative"
                      >
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center shadow-lg border transition-all",
                            (isOilChangeClose || isMaintenanceClose) ? "border-amber-500/50 shadow-amber-900/20" : "border-zinc-700 group-hover:border-zinc-500"
                          )}>
                            {isMaintenanceClose ? (
                              <Wrench className="text-amber-500 animate-pulse" size={24} />
                            ) : isOilChangeClose ? (
                              <Droplets className="text-amber-500 animate-pulse" size={24} />
                            ) : (
                              <Bus className="text-zinc-500 group-hover:text-brand-accent transition-colors" size={24} />
                            )}
                          </div>
                          <div>
                            <div className="font-black text-white tabular-nums text-lg uppercase tracking-tight leading-none flex items-center gap-2">
                              {v.plate}
                              {(isOilChangeClose || isMaintenanceClose) && (
                                <AlertTriangle size={14} className="text-amber-500" />
                              )}
                            </div>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-2">{v.type === 'van' ? 'Transporte Van' : 'Executivo Ônibus'}</p>
                          </div>
                        </div>
                        <div>
                          <div className="font-black text-zinc-300 uppercase text-xs tracking-widest leading-none">{v.model}</div>
                          <div className="flex flex-col gap-1 mt-2">
                            <p className="text-[9px] text-zinc-600 font-black">FAB: {v.factoryYear}</p>
                            {isOilChangeClose && (
                              <p className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Troca de Óleo em {v.nextOilChangeKM! - v.currentOdometer} KM</p>
                            )}
                            {isMaintenanceClose && (
                              <p className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Maint. Prev em {daysToMaintenance} dias</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-zinc-800 rounded-lg text-zinc-500"><Users size={18} /></div>
                          <div>
                            <span className="text-sm font-black text-zinc-100 leading-none block">{v.capacity} PAX</span>
                            <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mt-1 block">Lotação</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border",
                            v.status === 'available' 
                              ? "bg-emerald-950/30 text-emerald-500 border-emerald-900/50" 
                              : "bg-amber-950/30 text-amber-500 border-amber-900/50"
                          )}>
                            {v.status === 'available' ? 'OPERACIONAL' : 'EM REVISÃO'}
                          </span>
                        </div>
                      </div>
                    );
                    })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Modais */}
      <Modal 
        isOpen={isVehicleModalOpen} 
        onClose={() => {
          setIsVehicleModalOpen(false);
          setSelectedVehicle(null);
        }} 
        title={selectedVehicle ? "Editar Veículo" : "Cadastrar Novo Veículo"}
      >
        <VehicleForm onSubmit={handleSaveVehicle} loading={formLoading} initialData={selectedVehicle} />
      </Modal>

      <Modal 
        isOpen={isFuelModalOpen} 
        onClose={() => setIsFuelModalOpen(false)}
        title="Novo Abastecimento Interno"
      >
        <FuelForm 
          onSubmit={handleSaveFuel} 
          loading={formLoading}
          vehicles={vehicles}
          tanks={fuelTanks}
          employees={employees}
          isExternal={false}
        />
      </Modal>

      <Modal 
        isOpen={isExternalFuelModalOpen} 
        onClose={() => setIsExternalFuelModalOpen(false)}
        title="Novo Abastecimento Externo"
      >
        <FuelForm 
          onSubmit={handleSaveFuel} 
          loading={formLoading}
          vehicles={vehicles}
          tanks={fuelTanks}
          employees={employees}
          isExternal={true}
        />
      </Modal>

      <Modal 
        isOpen={isTankModalOpen} 
        onClose={() => setIsTankModalOpen(false)}
        title="Cadastrar Novo Tanque"
      >
        <TankForm onSubmit={handleSaveTank} loading={formLoading} />
      </Modal>

      <Modal 
        isOpen={isRefillModalOpen} 
        onClose={() => setIsRefillModalOpen(false)}
        title="Registrar Entrada de Combustível"
      >
        <TankRefillForm 
          onSubmit={handleSaveRefill} 
          loading={formLoading} 
          tanks={fuelTanks}
        />
      </Modal>

      <Modal 
        isOpen={isEmployeeModalOpen} 
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setSelectedEmployee(null);
        }}
        title={selectedEmployee ? "Editar Funcionário" : "Cadastrar Novo Funcionário"}
      >
        <EmployeeForm onSubmit={handleSaveEmployee} loading={formLoading} initialData={selectedEmployee} />
      </Modal>

      <Modal 
        isOpen={isMaintenanceModalOpen} 
        onClose={() => setIsMaintenanceModalOpen(false)}
        title="Nova Ordem de Serviço"
      >
        <MaintenanceForm 
          onSubmit={handleSaveMaintenance} 
          loading={formLoading}
          vehicles={vehicles}
        />
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedVehicle(null);
        }}
        title="Detalhes do Ativo"
      >
        {selectedVehicle && (
          <VehicleDetail 
            vehicle={selectedVehicle} 
            maintenanceHistory={maintenance} 
            fuelHistory={recentFuelLogs} 
            employees={employees}
            onEdit={openEditFromDetail}
            onPrintOS={handlePrintOS}
          />
        )}
      </Modal>
    </div>
  );
}
