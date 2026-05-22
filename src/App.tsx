import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
  DollarSign,
  Package,
  Share2,
  MessageCircle,
  MapPin,
  Cake,
  Printer,
  Droplets,
  CheckCircle,
  Hash,
  Route as RouteIcon,
  FileText,
  FileSpreadsheet,
  Trash2,
  User,
  Smartphone,
  X,
  Sparkles,
  Bot as BotIcon,
  Loader2,
  ShieldCheck,
  Globe,
  Map,
  SquareCheck,
  Clock,
  Paperclip,
  Edit3,
  ArrowLeft,
  Image as ImageIcon,
  Video
} from 'lucide-react';
import { generateAPKDigital, shareAppDirectly } from './services/apkService';
import { geminiService } from './services/geminiService';
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
  setDoc,
  runTransaction,
  serverTimestamp,
  orderBy,
  limit,
  addDoc,
  deleteDoc
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
import { format, isAfter, isBefore, parseISO, addDays, differenceInDays, subMonths, isSameMonth, startOfMonth, isSameWeek, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Toaster, toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { setRolePermissions } from './lib/permissions';
import { cn } from './lib/utils';
import { SplashScreen } from './components/SplashScreen';
import { OfflineSync } from './components/OfflineSync';
import { 
  Vehicle, 
  Employee, 
  FuelTank, 
  FuelLog, 
  MaintenanceLog, 
  StockItem, 
  UserProfile,
  FuelEntry,
  FinancialTransaction,
  Trip,
  Journey
} from './types';

// Extend Window interface for PWA prompt
declare global {
  interface WindowEventMap {
    beforeinstallprompt: any;
  }
}


import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { AttachmentViewer } from './components/AttachmentViewer';

// Componentes Modulares
import { Sidebar } from './components/Sidebar';
import { Card, StatCard } from './components/Cards';
import { Modal, ConfirmModal } from './components/UI';
import { VehicleForm, FuelForm, TankForm, TankRefillForm, EmployeeForm } from './components/Forms';
import { MaintenanceForm } from './components/MaintenanceForm';

import { ServiceOrderListItem } from './components/ServiceOrderListItem';
import { auditService } from './services/auditService';

import { Dashboard } from './components/Dashboard';
import { VehicleDetail } from './components/VehicleDetail';
import { Finance } from './components/Finance';
import { FinancialForm } from './components/FinancialForm';
import { DistributionConfig } from './components/DistributionConfig';
import { TripForm } from './components/TripForm';
import { TripServiceOrder } from './components/TripServiceOrder';
import { MaintenanceServiceOrder } from './components/MaintenanceServiceOrder';
import { FleetAlerts } from './components/FleetAlerts';
import { CreationTool } from './components/CreationTool';
import { Vencimentos } from './components/Vencimentos';
import { FleetList } from './components/FleetList';
import { UnifiedFleetManagement } from './components/UnifiedFleetManagement';
import { ReportsView } from './components/ReportsView';
import { CharteredRoutes } from './components/CharteredRoutes';
import { AIConsultant } from './components/AIConsultant';
import { PointManagement } from './components/PointManagement';
import { StaffManagement } from './components/StaffManagement';
import { TripsManagement } from './components/TripsManagement';
import { ServiceOrders } from './components/ServiceOrders';
import { FuelManagement } from './components/FuelManagement';
import { TripAlerts } from './components/TripAlerts';
import { InventoryManagement } from './components/InventoryManagement';
import Criador from './components/Criador';
import { MediaHub } from './components/MediaHub';
import { hasPermission } from './lib/permissions';


// Role permissions mapping
const ROLE_PERMISSIONS: Record<string, { label: string, icon: string }[]> = {
  'Dono / Proprietário': [
    { label: 'Dashboard', icon: 'LayoutDashboard' },
    { label: 'Viagens', icon: 'Map' },
    { label: 'Frota', icon: 'Bus' },
    { label: 'Equipe', icon: 'Users' },
    { label: 'Almoxarifado', icon: 'Package' },
    { label: 'Financeiro', icon: 'DollarSign' },
    { label: 'Usuários', icon: 'Users' },
    { label: 'Criação', icon: 'PlusCircle' },
    { label: 'Media Hub', icon: 'Video' },
  ],
  'Gestor de Frotas': [
    { label: 'Dashboard', icon: 'LayoutDashboard' },
    { label: 'Frota', icon: 'Bus' },
    { label: 'Almoxarifado', icon: 'Package' },
    { label: 'Criação', icon: 'PlusCircle' },
    { label: 'Media Hub', icon: 'Video' },
  ],
  'Coordenador Logístico': [
    { label: 'Dashboard', icon: 'LayoutDashboard' },
    { label: 'Viagens', icon: 'Map' },
    { label: 'Frota', icon: 'Bus' },
    { label: 'Almoxarifado', icon: 'Package' },
  ],
  'Administrativo': [
    { label: 'Dashboard', icon: 'LayoutDashboard' },
    { label: 'Equipe', icon: 'Users' },
    { label: 'Financeiro', icon: 'DollarSign' },
  ],
  'Motorista': [
    { label: 'Dashboard', icon: 'LayoutDashboard' },
    { label: 'Viagens', icon: 'Map' },
  ],
  'Limpeza / Conservação': [
    { label: 'Dashboard', icon: 'LayoutDashboard' },
    { label: 'Almoxarifado', icon: 'Package' },
  ],
  'Visitante': [
    { label: 'Dashboard', icon: 'LayoutDashboard' },
    { label: 'Viagens', icon: 'Map' },
  ],
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTripForAttachments, setSelectedTripForAttachments] = useState<Trip | null>(null);
  const [selectedMaintenanceForAttachments, setSelectedMaintenanceForAttachments] = useState<MaintenanceLog | null>(null);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isMaintenanceAttachmentsModalOpen, setIsMaintenanceAttachmentsModalOpen] = useState(false);
  const [isProcessingModalAttachment, setIsProcessingModalAttachment] = useState<string | null>(null);
  
  // Sync activeSection with URL path
  const activeSection = useMemo(() => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    return path;
  }, [location.pathname]);

  const [showHistory, setShowHistory] = useState(false);
  const [navStack, setNavStack] = useState<string[]>(['dashboard']);

  const handleNavigate = useCallback((sectionId: string) => {
    navigate(`/${sectionId}`);
    setNavStack(stack => {
      if (stack[stack.length - 1] === sectionId) return stack;
      return [...stack, sectionId].slice(-10);
    });
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (navStack.length > 1) {
      navigate(-1);
      setNavStack(stack => {
        const newStack = [...stack];
        newStack.pop();
        return newStack;
      });
    }
  }, [navigate, navStack.length]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Section labels updated
  const sections = useMemo(() => {
    const base = [
      { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
      { id: 'fretamento', label: 'Fretamento', icon: RouteIcon },
      { id: 'fleet', label: 'Frota', icon: Bus },
      { id: 'vencimentos', label: 'Vencimentos', icon: Calendar },
      { id: 'finance', label: 'Financeiro', icon: DollarSign },
      { id: 'fuel', label: 'Combustível', icon: Fuel },
      { id: 'maintenance', label: 'Manutenções', icon: Wrench },
      { id: 'trips', label: 'Viagens', icon: TrendingUp },
      { id: 'staff', label: 'Equipe', icon: Users },
      { id: 'os', label: 'Ordens de Serviço', icon: FileText },
      { id: 'inventory', label: 'Almoxarifado', icon: Package },
      { id: 'reports', label: 'Relatórios', icon: Bell },
      { id: 'media-hub', label: 'Media Hub', icon: Video },
      { id: 'criador', label: 'Criador', icon: Sparkles },
    ];

    return base.filter(s => hasPermission(profile?.role, s.id, profile?.email, profile?.permissions, profile?.displayName));
  }, [profile]);
  
  // Modais
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExternalFuelModalOpen, setIsExternalFuelModalOpen] = useState(false);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [maintenanceInitialData, setMaintenanceInitialData] = useState<any>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isMaintenanceRelatorioOpen, setIsMaintenanceRelatorioOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isOSModalOpen, setIsOSModalOpen] = useState(false);
  const [employeeContext, setEmployeeContext] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; onConfirm: () => void; title: string; message: string }>({
    isOpen: false,
    onConfirm: () => {},
    title: '',
    message: ''
  });
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceLog | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [financialType, setFinancialType] = useState<'payable' | 'receivable'>('payable');
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
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [charteredRoutes, setCharteredRoutes] = useState<any[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState<string>('all');
  const [tripTypeFilter, setTripTypeFilter] = useState<string>('all');
  const [tripDateStart, setTripDateStart] = useState<string>('');
  const [tripDateEnd, setTripDateEnd] = useState<string>('');
  const [tripSearch, setTripSearch] = useState('');
  const [sharedAttachments, setSharedAttachments] = useState<{name: string, url: string, type: 'image' | 'pdf' | 'word' | 'excel'}[]>([]);

  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
  }, []);

  const handleShareAppLink = () => {
    const appUrl = window.location.origin;
    const shareData = {
      title: 'DM Turismo - Sistema de Gestão',
      text: 'Acesse o sistema de gestão operacional da DM Turismo:',
      url: appUrl,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(appUrl);
      toast.success("Link do sistema copiado!");
    }
  };

  const handleShareStaffAccess = (employee: Employee) => {
    const appUrl = window.location.origin;
    const shareUrl = `${appUrl}/?emp=${employee.id}`;
    const message = `🏢 *DM TURISMO - ACESSO LIBERADO* 🏢%0A%0AOlá *${employee.name.toUpperCase()}*! 👋%0A%0ASeu terminal de logística e viagens foi liberado. Acesse pelo link abaixo:%0A%0A🔗 *LINK:*%0A${shareUrl}%0A%0A_DM TURISMO - Tecnologia e Logística Avançada._`;
    const cleanPhone = (employee.phone || '').replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const handleExportStaffToExcel = () => {
    try {
      const data = employees.map(e => ({
        ID: e.id,
        Nome: e.name,
        Cargo: e.role,
        CPF: e.cpf || 'N/A',
        Nascimento: e.birthDate ? format(parseISO(e.birthDate), 'dd/MM/yyyy') : 'N/A',
        Admissão: e.admissionDate ? format(parseISO(e.admissionDate), 'dd/MM/yyyy') : 'N/A',
        Telefone: e.phone || 'N/A',
        Email: e.email || 'N/A',
        'Vencimento CNH': e.licenseExpiration ? format(parseISO(e.licenseExpiration), 'dd/MM/yyyy') : 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Equipe DM");
      XLSX.writeFile(wb, `Equipe_DM_Turismo_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
      toast.success("Equipe exportada com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao gerar arquivo Excel.");
    }
  };

  const handleExportEmployeeToExcel = (employee: Employee) => {
    try {
      const data = [{
        'Aba Aplicativo': 'DM TURISMO PRO',
        'Ficha do Colaborador': employee.name,
        '-------------------': '-------------------',
        'ID': employee.id,
        'Nome Completo': employee.name,
        'Cargo/Função': employee.role,
        'CPF': employee.cpf || 'N/A',
        'RG': employee.rg || 'N/A',
        'Data de Nascimento': employee.birthDate ? format(parseISO(employee.birthDate), 'dd/MM/yyyy') : 'N/A',
        'Data de Admissão': employee.admissionDate ? format(parseISO(employee.admissionDate), 'dd/MM/yyyy') : 'N/A',
        'Telefone Contato': employee.phone || 'N/A',
        'E-mail': employee.email || 'N/A',
        'Vencimento CNH': employee.licenseExpiration ? format(parseISO(employee.licenseExpiration), 'dd/MM/yyyy') : 'N/A',
        'Categoria CNH': employee.licenseCategory || 'N/A',
        'Status do Perfil': employee.status === 'active' ? 'Ativo' : 'Inativo',
        'Exportado em': format(new Date(), 'dd/MM/yyyy HH:mm')
      }];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ficha Colaborador");
      
      // Auto-size columns
      const maxWidths = Object.keys(data[0]).map(key => Math.max(key.length, String(data[0][key as keyof typeof data[0]]).length) + 2);
      ws['!cols'] = maxWidths.map(w => ({ wch: w }));

      XLSX.writeFile(wb, `Ficha_${employee.name.replace(/\s+/g, '_')}.xlsx`);
      toast.success(`Ficha de ${employee.name} exportada!`);
    } catch (error) {
      console.error("Erro ao exportar ficha:", error);
      toast.error("Erro ao gerar ficha Excel.");
    }
  };

  const handleExportEmployeeAPK = (employee: Employee) => {
    const appUrl = window.location.origin;
    const shareUrl = `${appUrl}/?emp=${employee.id}`;
    generateAPKDigital(shareUrl, employee.name);
  };

  const handleExportAPKDigital = () => {
    generateAPKDigital();
  };

  useEffect(() => {
    const handleParams = async () => {
      const url = new URL(window.location.href);
      
      const empId = url.searchParams.get('emp');
      if (empId && employees.length > 0) {
        const emp = employees.find(e => e.id === empId);
        if (emp) {
          setEmployeeContext(emp);
          handleNavigate('journey');
          toast.success(`Terminal Operacional: ${emp.name}`, {
            description: "Sua escala e jornada estão prontas para acesso.",
            icon: <Users size={16} />
          });
        }
      }

      // Handle explicit sections from PWA shortcuts
      const section = url.searchParams.get('section');
      if (section && sections.some(s => s.id === section)) {
        handleNavigate(section);
      }

      if (url.searchParams.get('shared') === 'true') {
        try {
          const dbRequest = indexedDB.open('dm-frotas-share', 1);
          dbRequest.onsuccess = () => {
            const db = dbRequest.result;
            if (!db.objectStoreNames.contains('files')) return;
            
            const transaction = db.transaction('files', 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.getAll();
            
            request.onsuccess = async () => {
              const items = request.result;
              if (items.length > 0) {
                const attachments = await Promise.all(items.map(async (item: any) => {
                  const reader = new FileReader();
                  const dataUrl = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(item.file);
                  });
                  
                  let type: 'image' | 'pdf' | 'word' | 'excel' = 'image';
                  if (item.type.includes('pdf')) type = 'pdf';
                  else if (item.type.includes('word') || item.type.includes('officedocument.word')) type = 'word';
                  else if (item.type.includes('excel') || item.type.includes('sheet') || item.type.includes('csv')) type = 'excel';
                  
                  return {
                    name: item.name,
                    url: dataUrl,
                    type
                  };
                }));

                setSharedAttachments(attachments);
                handleNavigate('trips');
                setIsTripModalOpen(true);
                
                const clearTx = db.transaction('files', 'readwrite');
                clearTx.objectStore('files').clear();
                
                toast.success(`${attachments.length} arquivos compartilhados carregados!`);
              }
            };
          };
        } catch (err) {
          console.error("Error retrieving shared files:", err);
        }
        window.history.replaceState({}, document.title, "/");
      }
    };
    handleParams();
  }, [employees]);

  const maintenanceData = useMemo(() => {
    const last6Months = [...Array(6)].map((_, i) => {
      const date = subMonths(new Date(), i);
      return {
        month: format(date, 'MMM', { locale: ptBR }),
        start: startOfMonth(date),
        preventive: 0,
        corrective: 0,
        total: 0
      };
    }).reverse();

    maintenance.forEach(m => {
      const date = parseISO(m.completedAt || m.createdAt);
      const monthIndex = last6Months.findIndex(item => isSameMonth(item.start, date));
      if (monthIndex !== -1) {
        if (m.type === 'preventive') {
          last6Months[monthIndex].preventive += Number(m.cost || 0);
        } else {
          last6Months[monthIndex].corrective += Number(m.cost || 0);
        }
        last6Months[monthIndex].total += Number(m.cost || 0);
      }
    });

    return last6Months;
  }, [maintenance]);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = undefined;
      }

      if (user) {
        unsubProfile = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
            if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            
            // Force super admin logic for specific email
            if (data.email === 'elizeuferron@gmail.com' && data.role !== 'Dono / Proprietário') {
              data.role = 'Dono / Proprietário';
            }
            
            setProfile(data);
            setLoading(false);
          } else {
            // Profile doesn't exist, create it
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email!,
              displayName: user.displayName || 'Novo Usuário',
              role: user.email === 'elizeuferron@gmail.com' ? 'Dono / Proprietário' : 'Aguardando Liberação',
              photoURL: user.photoURL || undefined
            };
            try {
              await setDoc(doc(db, 'users', user.uid), {
                ...newProfile,
                createdAt: serverTimestamp()
              });
              // onSnapshot will catch this new document
            } catch (error) {
              console.error("Erro ao criar perfil:", error);
              setLoading(false);
            }
          }
        }, (error) => {
          console.error("Erro ao carregar perfil (snapshot):", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  useEffect(() => {
    // Employee list is needed for the login page and access verification
    const unsubStaff = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    }, error => {
      // Only log if user is logged in, to avoid clutter during landing page view
      if (user) handleFirestoreError(error, OperationType.LIST, 'employees');
    });

    if (!user) return () => unsubStaff();

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

    const unsubFinance = onSnapshot(query(collection(db, 'financial_transactions'), orderBy('createdAt', 'desc'), limit(500)), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FinancialTransaction[];
      setTransactions(data);
    }, error => handleFirestoreError(error, OperationType.LIST, 'financial_transactions'));

    const unsubTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
      setTrips(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trip)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'trips'));


    const unsubRoutes = onSnapshot(collection(db, 'chartered_routes'), (snapshot) => {
      setCharteredRoutes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => handleFirestoreError(error, OperationType.LIST, 'chartered_routes'));
    
    // Listen for role permissions
    onSnapshot(doc(db, 'settings', 'permissions'), (snapshot) => {
      if (snapshot.exists()) {
        setRolePermissions(snapshot.data().roles);
      }
    });

    return () => {
      unsubVehicles();
      unsubFuel();
      unsubLogs();
      unsubEntries();
      unsubMaint();
      unsubStock();
      unsubStaff();
      unsubFinance();
      unsubTrips();
      unsubRoutes();
    };
  }, [user]);

  const login = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

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
        const docRef = await addDoc(collection(db, 'vehicles'), {
          ...data,
          capacity: Number(data.capacity),
          currentOdometer: newOdometer,
          nextOilChangeKM: data.nextOilChangeKM ? Number(data.nextOilChangeKM) : undefined,
          status: 'available',
          updatedAt: new Date().toISOString()
        });
        await auditService.log(user.uid, user.email!, 'CREATE', 'VEHICLE', docRef.id, `Veículo ${data.plate} cadastrado`);
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

  const handleSaveEmployee = async (data: any) => {
    setFormLoading(true);

    try {
      if (selectedEmployee) {
        await setDoc(doc(db, 'employees', selectedEmployee.id), {
          ...selectedEmployee,
          ...data,
          updatedAt: new Date().toISOString()
        });
        toast.success('Funcionário atualizado com sucesso!');

        // Offer to share updated access via WhatsApp
        if (data.phone) {
          const appUrl = window.location.origin;
          const text = `🏢 *DM TURISMO - ACESSO ATUALIZADO* 🏢%0A%0AOlá ${data.name}! 👋%0A%0ASeu perfil no sistema foi atualizado. Acesse agora a plataforma oficial:%0A%0A🔗 *LINK:*%0A${appUrl}`;
          const cleanPhone = data.phone.replace(/\D/g, '');
          const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
          const whatsappUrl = `https://wa.me/${formattedPhone}?text=${text}`;
          
          setTimeout(() => {
            if (window.confirm("Deseja compartilhar o link de acesso atualizado com o colaborador via WhatsApp?")) {
              window.open(whatsappUrl, '_blank');
            }
          }, 500);
        }
      } else {
        const docRef = await addDoc(collection(db, 'employees'), {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await auditService.log(user.uid, user.email!, 'CREATE', 'EMPLOYEE', docRef.id, `Funcionário ${data.name} cadastrado`);
        toast.success('Funcionário cadastrado com sucesso!');

        // Offer to share access via WhatsApp for NEW employee
        if (data.phone) {
          const appUrl = window.location.origin;
          const message = `🏢 *DM TURISMO - ACESSO LIBERADO* 🏢%0A%0AOlá ${data.name}! 👋%0A%0ASeu acesso como *${data.role.toUpperCase()}* está pronto. Acesse a plataforma digital DM:%0A%0A🔗 *LINK DE ACESSO:*%0A${appUrl}`;
          const cleanPhone = data.phone.replace(/\D/g, '');
          const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
          const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
          
          setTimeout(() => {
            if (window.confirm("Deseja enviar o link de acesso para o novo colaborador via WhatsApp?")) {
              window.open(whatsappUrl, '_blank');
            }
          }, 500);
        }
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

  const handleDeleteEmployee = async (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Excluir Funcionário',
      message: `Tem certeza que deseja remover ${name} do sistema? Esta ação é irreversível e removerá todos os acessos vinculados.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'employees', id));
          await auditService.log(user?.uid || 'system', user?.email || 'system', 'DELETE', 'EMPLOYEE', id, `Colaborador: ${name} excluído`);
          toast.success("Funcionário excluído com sucesso");
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'employees');
        }
      }
    });
  };

  const handleSaveMaintenance = async (data: any) => {
    setFormLoading(true);
    const vehicleId = data.vehicleId;
    const cost = Number(data.cost || 0);
    const odometer = Number(data.odometer || 0);

    try {
      await runTransaction(db, async (transaction) => {
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleSnapshot = await transaction.get(vehicleRef);
        if (!vehicleSnapshot.exists()) throw new Error('Veículo não encontrado');

        // Create or Update log
        const logRef = data.id ? doc(db, 'maintenance_logs', data.id) : doc(collection(db, 'maintenance_logs'));
        transaction.set(logRef, {
          ...data,
          cost,
          odometer,
          vehicleId, // Ensure vehicleId is saved
          updatedAt: new Date().toISOString(),
          createdAt: data.createdAt || new Date().toISOString()
        }, { merge: true });

        // Update vehicle maintenance stats
        transaction.update(vehicleRef, {
          lastMaintenanceDate: data.completedAt,
          lastMaintenanceKM: odometer,
          nextOilChangeKM: data.checklist?.oilChanged ? (odometer + 10000) : (vehicleSnapshot.data() as Vehicle).nextOilChangeKM,
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
    setSelectedMaintenance(log);
    setIsMaintenanceRelatorioOpen(true);
  };

  const handlePrintBatchOS = useCallback((scope: 'week' | 'month') => {
    const today = startOfToday();
    const batchLogs = maintenance.filter(log => {
      const logDate = parseISO(log.completedAt || log.createdAt);
      return scope === 'week' 
        ? isSameWeek(logDate, today, { weekStartsOn: 0 }) 
        : isSameMonth(logDate, today);
    });

    if (batchLogs.length === 0) {
      toast.info(`Nenhuma Ordem de Serviço encontrada para ${scope === 'week' ? 'esta semana' : 'este mês'}.`);
      return;
    }

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    batchLogs.forEach((log, index) => {
      if (index > 0) doc.addPage();
      
      const vehicle = vehicles.find(v => v.id === log.vehicleId);
      let currentY = 25;

      // Header Section
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 30, 30);
      doc.text("DM TURISMO", margin, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("ORDEM DE SERVIÇO DE MANUTENÇÃO", margin, 35);
      
      doc.setFontSize(14);
      doc.setTextColor(255, 107, 0); // brand-accent hex approximation
      doc.text(`#${log.id?.substring(0, 8).toUpperCase() || 'NOVO'}`, pageWidth - margin - 40, 25);

      currentY = 60;

      // Vehicle Info Box
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.rect(margin, currentY, pageWidth - (2 * margin), 35);
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("DADOS DO VEÍCULO", margin + 5, currentY + 7);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`PLACA: ${vehicle?.plate || 'N/A'}`, margin + 5, currentY + 18);
      doc.text(`MODELO: ${vehicle?.model || 'N/A'}`, margin + 5, currentY + 28);
      doc.text(`KM ATUAL: ${log.odometer?.toLocaleString() || 'N/A'} KM`, pageWidth / 2, currentY + 18);
      doc.text(`TIPO: ${vehicle?.type?.toUpperCase() || 'N/A'}`, pageWidth / 2, currentY + 28);

      currentY += 45;

      // Service Details
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("DESCRIÇÃO DO SERVIÇO", margin, currentY);
      
      currentY += 8;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(log.type === 'preventive' ? 'MANUTENÇÃO PREVENTIVA' : 'MANUTENÇÃO CORRETIVA', margin, currentY);
      
      currentY += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitDesc = doc.splitTextToSize(log.description || "Sem descrição detalhada.", pageWidth - (2 * margin));
      doc.text(splitDesc, margin, currentY);
      
      currentY += (splitDesc.length * 6) + 15;

      // Checklist section if exists
      if (log.checklist) {
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text("CHECKLIST TÉCNICO", margin, currentY);
          currentY += 8;

          const activeChecks = Object.entries(log.checklist)
            .filter(([k, v]) => v === true && k !== 'others')
            .map(([k]) => {
                const labels: any = {
                    oilChanged: 'Troca de Óleo',
                    filtersChanged: 'Filtros',
                    frontPadsChanged: 'Pastilha Dianteira',
                    rearPadsChanged: 'Pastilha Traseira',
                    frontDiscsChanged: 'Disco Dianteiro',
                    rearDiscsChanged: 'Disco Traseira',
                    airConditioning: 'Ar Condicionado',
                    tires: 'Pneus',
                    suspension: 'Suspensão',
                    transmission: 'Transmissão'
                };
                return labels[k] || k;
            });

          if (activeChecks.length > 0) {
              const checkText = activeChecks.join(' | ');
              const splitChecks = doc.splitTextToSize(checkText, pageWidth - (2 * margin));
              doc.setTextColor(60, 60, 60);
              doc.text(splitChecks, margin, currentY);
              currentY += (splitChecks.length * 5) + 15;
          } else {
              currentY += 5;
          }
      }

      // Financials
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`VALOR TOTAL: R$ ${log.cost?.toLocaleString() || '0,00'}`, margin, currentY);
      doc.text(`DATA: ${format(parseISO(log.completedAt || log.createdAt), "dd/MM/yyyy")}`, pageWidth - margin - 40, currentY);

      // Signatures at bottom
      const footerY = pageHeight - 40;
      doc.line(margin, footerY, margin + 60, footerY);
      doc.line(pageWidth - margin - 60, footerY, pageWidth - margin, footerY);
      
      doc.setFontSize(8);
      doc.text("ASSINATURA RESPONSÁVEL", margin + 10, footerY + 5);
      doc.text("ASSINATURA MOTORISTA", pageWidth - margin - 50, footerY + 5);
    });

    doc.save(`ORDENS_SERVICO_${scope.toUpperCase()}_${format(new Date(), "ddMMyyyy")}.pdf`);
    toast.success(`PDF de OS ${scope === 'week' ? 'semanal' : 'mensal'} gerado com sucesso!`);
  }, [maintenance, vehicles]);
  
  const handleDeleteMaintenance = async (id: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'maintenance_logs', id));
      toast.success('Registro de manutenção excluído com sucesso.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `maintenance_logs/${id}`);
    }
  };

  const handleFinancialSubmit = async (data: any) => {
    setFormLoading(true);
    try {
      if (Array.isArray(data)) {
        for (const item of data) {
          await addDoc(collection(db, 'financial_transactions'), {
            ...item,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        await addDoc(collection(db, 'financial_transactions'), {
          ...data,
          createdAt: new Date().toISOString()
        });
      }
      toast.success('Lançamento realizado com sucesso!');
      setIsFinancialModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'financial_transactions');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSmartExtractFromModal = async (trip: Trip, attachment: any) => {
    if (attachment.type !== 'image' && attachment.type !== 'pdf') {
      toast.error("Formato não suportado para extração automática.");
      return;
    }

    setIsProcessingModalAttachment(attachment.name);
    try {
      const [header, base64Data] = attachment.url.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

      const extractedData = await geminiService.extractPassengers(base64Data, mimeType);

      if (extractedData && Array.isArray(extractedData)) {
        const newPassengers = extractedData.map((p: any) => ({
          name: String(p.name || '').toUpperCase(),
          document: String(p.document || 'S/D').toUpperCase()
        }));

        const updatedTrip = {
          ...trip,
          passengers: [...(trip.passengers || []), ...newPassengers],
          passengerCount: (trip.passengers?.length || 0) + newPassengers.length
        };

        await handleSaveTrip(updatedTrip);
        toast.success(`${newPassengers.length} passageiros adicionados à viagem!`);
      }
    } catch (error) {
      console.error("Modal AI Extraction Error:", error);
      toast.error("Erro ao processar arquivo.");
    } finally {
      setIsProcessingModalAttachment(null);
    }
  };

  const handleDeleteTrip = useCallback((trip: Trip) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Excluir Viagem',
      message: `Tem certeza que deseja excluir permanentemente a viagem "${trip.title}"? Todos os registros financeiros vinculados também serão removidos.`,
      onConfirm: async () => {
        try {
          setFormLoading(true);
          const tripRef = doc(db, 'trips', trip.id);
          await deleteDoc(tripRef);

          const linkedTransactions = transactions.filter(t => t.refId === trip.id && t.refType === 'trip');
          for (const t of linkedTransactions) {
            await deleteDoc(doc(db, 'financial_transactions', t.id));
          }

          await auditService.log(user!.uid, user!.email!, 'DELETE', 'TRIP', trip.id, `Viagem ${trip.title} excluída`);
          toast.success("Viagem Excluída", {
            description: "A viagem e seus registros vinculados foram removidos."
          });
          setIsOSModalOpen(false);
          setIsTripModalOpen(false);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `trips/${trip.id}`);
        } finally {
          setFormLoading(false);
        }
      }
    });
  }, [transactions, user]);

  const handleDeleteVehicle = async (vehicleId: string, plate: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Excluir Veículo',
      message: `Tem certeza que deseja remover o veículo ${plate} da frota? Todos os históricos de manutenção e combustível vinculados serão perdidos permanentemente.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'vehicles', vehicleId));
          await auditService.log(user?.uid || 'system', user?.email || 'system', 'DELETE', 'VEHICLE', vehicleId, `Veículo ${plate} excluído`);
          toast.success("Veículo excluído");
          setIsDetailModalOpen(false);
          setSelectedVehicle(null);
          setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, 'vehicles');
        }
      }
    });
  };

  const handleSaveTrip = async (data: any) => {
    setFormLoading(true);
    try {
      if (selectedTrip) {
        // Update existing trip
        const tripRef = doc(db, 'trips', selectedTrip.id);
        await setDoc(tripRef, {
          ...data,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        toast.success("Viagem Atualizada", {
          description: `Alterações em "${data.title}" salvas com sucesso.`
        });
      } else {
        // Create new trip
        const docRef = await addDoc(collection(db, 'trips'), {
          ...data,
          createdAt: new Date().toISOString()
        });
        await auditService.log(user.uid, user.email!, 'CREATE', 'TRIP', docRef.id, `Viagem ${data.title} agendada`);
        toast.success("Viagem Cadastrada", {
          description: `Operação "${data.title}" agendada com sucesso.`
        });
      }
      setIsTripModalOpen(false);
      setSelectedTrip(null);
    } catch (error) {
      handleFirestoreError(error, selectedTrip ? OperationType.WRITE : OperationType.CREATE, 'trips');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateFinanceStatus = async (id: string, status: 'paid' | 'pending') => {
    try {
      await setDoc(doc(db, 'financial_transactions', id), { 
        status,
        paymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : null
      }, { merge: true });
      toast.success('Status atualizado!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'financial_transactions');
    }
  };

  const openFinancialModal = (type: 'payable' | 'receivable') => {
    setFinancialType(type);
    setIsFinancialModalOpen(true);
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
      title: `Relatório DM Turismo: ${reportTitle}`,
      text: `Confira o relatório de ${reportTitle.toLowerCase()} da DM Turismo.`,
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

  // Derived Memoized States
  const vehicleVencimentos = useMemo(() => {
    return vehicles.flatMap(v => [
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
        label: 'ANTT/Turismo', 
        date: v.tourismLicenseExpiration,
        icon: 'ANTT'
      },
      { 
        id: `${v.id}-antt`, 
        plate: v.plate, 
        label: 'ANTT Interestadual', 
        date: v.anttExpiration,
        icon: 'ANTT'
      },
      { 
        id: `${v.id}-cadastur`, 
        plate: v.plate, 
        label: 'CADASTUR', 
        date: v.cadasturExpiration,
        icon: 'MTUR'
      },
      { 
        id: `${v.id}-state`, 
        plate: v.plate, 
        label: 'Estadual (D/A)', 
        date: v.detroArtespExpiration,
        icon: 'EST'
      },
      { 
        id: `${v.id}-mun`, 
        plate: v.plate, 
        label: 'Lic. Municipal', 
        date: v.municipalLicenseExpiration,
        icon: 'MUN'
      },
      { 
        id: `${v.id}-taco`, 
        plate: v.plate, 
        label: 'Cronotacógrafo', 
        date: v.tacografoExpiration,
        icon: 'INM'
      },
      { 
        id: `${v.id}-ins`, 
        plate: v.plate, 
        label: 'Seguro APP', 
        date: v.insuranceExpiration,
        icon: 'SEG'
      }
    ]).filter(item => !!item.date).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
  }, [vehicles]);

  const driverVencimentos = useMemo(() => {
    return employees.filter(e => e.licenseExpiration).sort((a, b) => new Date(a.licenseExpiration!).getTime() - new Date(b.licenseExpiration!).getTime());
  }, [employees]);

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const matchesSearch = !tripSearch || 
        t.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.origin.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.destination.toLowerCase().includes(tripSearch.toLowerCase());
      
      const matchesStatus = tripStatusFilter === 'all' || t.status === tripStatusFilter;
      const matchesType = tripTypeFilter === 'all' || t.type === tripTypeFilter;
      
      let matchesDate = true;
      if (tripDateStart) {
        matchesDate = matchesDate && isAfter(parseISO(t.startDate), addDays(parseISO(tripDateStart), -1));
      }
      if (tripDateEnd) {
        matchesDate = matchesDate && isBefore(parseISO(t.startDate), addDays(parseISO(tripDateEnd), 1));
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [trips, tripSearch, tripStatusFilter, tripTypeFilter, tripDateStart, tripDateEnd]);

  const handleOpenAddVehicle = useCallback(() => {
    setSelectedVehicle(null);
    setIsVehicleModalOpen(true);
  }, []);

  const handleVehicleClick = useCallback((v: Vehicle) => {
    setSelectedVehicle(v);
    setIsDetailModalOpen(true);
  }, []);

  if (loading) return <SplashScreen />;

  if (!user) {
    return <Login onSuccess={() => navigate('/dashboard')} />;
  }

  if (profile?.role === 'Aguardando Liberação') {
    const handleRequestAccess = () => {
      const message = `Olá Elizeu Ferron, acabo de cadastrar meu e-mail (${profile.email}) no aplicativo DM Turismo Pro e gostaria de solicitar a liberação para o meu acesso.`;
      const whatsappUrl = `https://wa.me/5545999864273?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    };

    return (
      <div className="min-h-screen text-slate-100 flex items-center justify-center relative p-6 bg-zinc-950 font-sans">
        <div className="absolute inset-0 map-pattern opacity-5 pointer-events-none" />
        <Toaster theme="dark" position="top-right" expand={false} richColors />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-zinc-900/60 border border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl space-y-8 animate-in fade-in"
        >
          <div className="mx-auto w-20 h-20 bg-brand-accent/10 border border-brand-accent/20 rounded-3xl flex items-center justify-center text-brand-accent animate-pulse">
            <ShieldCheck size={40} />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white font-display">
              Acesso <span className="text-brand-accent">Pendente</span>
            </h1>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-sm mx-auto">
              Seu cadastro foi realizado com sucesso! Para garantir a segurança operacional da DM Turismo, o seu acesso precisa ser liberado antes de prosseguir.
            </p>
          </div>

          <div className="p-5 bg-zinc-950/50 border border-white/5 rounded-2xl text-left space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent block">Instruções para Liberação</span>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Clique no botão abaixo para enviar uma solicitação direta ao proprietário <strong className="text-zinc-300">Elizeu Ferron</strong> solicitando a ativação das permissões para o seu e-mail:
            </p>
            <div className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg break-all select-all">
              {profile.email}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRequestAccess}
              className="flex-1 h-14 bg-brand-accent text-zinc-950 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-105 hover:bg-white transition-all shadow-xl shadow-brand-accent/10 active:scale-95 cursor-pointer"
            >
              <Smartphone size={16} /> Solicitar Liberação
            </button>
            <button
              onClick={logout}
              className="px-6 h-14 bg-zinc-800/50 hover:bg-rose-500/20 hover:text-rose-400 border border-zinc-700/50 text-zinc-400 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 cursor-pointer"
            >
              Sair
            </button>
          </div>

          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
            DM TURISMO • TODOS OS DIREITOS RESERVADOS
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen travel-gradient h-screen overflow-hidden flex font-sans selection:bg-brand-accent/30 selection:text-white text-slate-100 relative">
      <div className="absolute inset-0 map-pattern opacity-5 pointer-events-none" />
      <Toaster theme="dark" position="top-right" expand={false} richColors />
      <TripAlerts trips={trips} />
      <OfflineSync />
      
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        activeSection={activeSection} 
        setActiveSection={handleNavigate}
        profile={profile}
        logout={logout}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10 transition-all duration-500">
        <header className="sticky top-0 z-40 bg-asphalt-950/80 backdrop-blur-2xl border-b border-white/5 px-10 h-24 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-3.5 hover:bg-brand-accent hover:text-asphalt-950 rounded-[1.25rem] text-zinc-400 transition-all bg-asphalt-900 border border-white/5 shadow-xl active:scale-95 group"
            >
              {sidebarOpen ? <ChevronRight className="rotate-180 group-hover:-translate-x-0.5 transition-transform" size={22} /> : <Bus size={22} />}
            </button>
            
            {navStack.length > 1 && (
              <button 
                onClick={handleBack}
                className="p-3.5 hover:bg-white hover:text-zinc-950 rounded-xl text-zinc-400 transition-all bg-zinc-900 border border-zinc-700 shadow-xl active:scale-95 group flex items-center gap-2"
                title="Voltar para seção anterior"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest leading-none">Voltar</span>
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="p-3.5 hover:bg-white hover:text-zinc-950 rounded-xl text-zinc-400 transition-all bg-zinc-900 border border-zinc-700 shadow-xl active:scale-95 group flex items-center gap-2"
                title="Histórico de Navegação"
              >
                <Calendar size={18} />
                <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest leading-none">Histórico</span>
              </button>
              
              <AnimatePresence>
                {showHistory && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowHistory(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-4 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recentes</span>
                      </div>
                      <div className="py-2 max-h-80 overflow-y-auto">
                        {navStack.slice().reverse().map((step, idx) => {
                          const section = sections.find(s => s.id === step);
                          if (!section) return null;
                          return (
                            <button
                              key={`${step}-${idx}`}
                              onClick={() => {
                                handleNavigate(step);
                                setShowHistory(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors group",
                                activeSection === step && "text-brand-accent bg-brand-accent/5"
                              )}
                            >
                              <section.icon size={16} className={activeSection === step ? "text-brand-accent" : "text-zinc-500"} />
                              <span className={cn(
                                "text-xs font-bold uppercase tracking-wide",
                                activeSection === step ? "text-brand-accent" : "text-zinc-300"
                              )}>
                                {section.label}
                              </span>
                              {idx === 0 && (
                                <span className="ml-auto text-[8px] font-black text-brand-accent px-1.5 py-0.5 bg-brand-accent/10 rounded uppercase">Atual</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div 
              className="cursor-pointer group flex flex-col pt-1"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter group-hover:text-brand-accent transition-colors leading-none">
                DM Turismo
              </h2>
              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] mt-1.5 ">
                {sections.find(s => s.id === activeSection)?.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-asphalt-900 rounded-xl border border-white/5 uppercase">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-zinc-300 tracking-widest leading-none">Cloud Sync Active</span>
            </div>
            <button className="p-3.5 relative hover:bg-asphalt-800 rounded-xl text-zinc-400 bg-asphalt-900 border border-white/5 transition-all active:scale-95 shadow-xl">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-brand-accent rounded-full border border-asphalt-950 shadow-sm" />
            </button>
          </div>
        </header>

        <div className="p-8 md:p-12 max-w-7xl mx-auto w-full space-y-12 pb-24">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-brand-accent" size={32} />
            </div>
          }>
            <Routes>
              <Route path="/dashboard" element={
                <Dashboard 
                  vehicles={vehicles}
                  employees={employees}
                  fuelLogs={recentFuelLogs}
                  maintenance={maintenance}
                  trips={trips}
                  user={profile}
                  setActiveSection={handleNavigate}
                  onVehicleClick={(v) => {
                    setSelectedVehicle(v);
                    handleNavigate('fleet');
                  }}
                  onViewTrip={(trip) => {
                    setSelectedTrip(trip);
                    setIsOSModalOpen(true);
                  }}
                  onUpdateEmployeePhoto={async (employeeId, photoUrl) => {
                    try {
                      await setDoc(doc(db, 'employees', employeeId), { photoUrl }, { merge: true });
                      toast.success('Foto atualizada com sucesso!');
                    } catch (error) {
                      handleFirestoreError(error, OperationType.WRITE, 'employees');
                    }
                  }}
                />
              } />

              <Route path="/media-hub" element={<MediaHub />} />

              <Route path="/staff" element={
                <StaffManagement 
                  employees={employees}
                  onExportToExcel={handleExportStaffToExcel}
                  onAddEmployee={() => {
                    setSelectedEmployee(null);
                    setIsEmployeeModalOpen(true);
                  }}
                  onEditEmployee={(e) => {
                    setSelectedEmployee(e);
                    setIsEmployeeModalOpen(true);
                  }}
                  onDeleteEmployee={handleDeleteEmployee}
                  onUpdateEmployeePhoto={async (employeeId, photoUrl) => {
                    try {
                      await setDoc(doc(db, 'employees', employeeId), { photoUrl }, { merge: true });
                      toast.success('Foto atualizada com sucesso!');
                    } catch (error) {
                      handleFirestoreError(error, OperationType.WRITE, 'employees');
                    }
                  }}
                  user={profile}
                />
              } />

              <Route path="/fretamento" element={<CharteredRoutes vehicles={vehicles} employees={employees} routes={charteredRoutes} />} />

              <Route path="/fleet" element={
                <UnifiedFleetManagement 
                  vehicles={vehicles}
                  maintenance={maintenance}
                  employees={employees}
                  trips={trips}
                  vehicleVencimentos={vehicleVencimentos}
                  driverVencimentos={driverVencimentos}
                  maintenanceData={maintenanceData}
                  onAddVehicle={handleOpenAddVehicle}
                  onVehicleClick={handleVehicleClick}
                  onAddMaintenance={() => {
                    setMaintenanceInitialData(null);
                    setIsMaintenanceModalOpen(true);
                  }}
                  onPrintOS={handlePrintOS}
                  onPrintBatchOS={handlePrintBatchOS}
                  onOpenMaintenanceAttachments={(log) => {
                    setSelectedMaintenanceForAttachments(log);
                    setIsMaintenanceAttachmentsModalOpen(true);
                  }}
                />
              } />

              <Route path="/vencimentos" element={<Navigate to="/fleet" replace />} />
              
              <Route path="/finance" element={
                <Finance 
                  transactions={transactions}
                  onAddTransaction={(type) => {
                    setFinancialType(type);
                    setIsFinancialModalOpen(true);
                  }}
                  onUpdateStatus={async (id, status) => {
                    try {
                      await setDoc(doc(db, 'financial_transactions', id), { status }, { merge: true });
                      toast.success('Status atualizado');
                    } catch (error) {
                      handleFirestoreError(error, OperationType.UPDATE, 'financial_transactions');
                    }
                  }}
                />
              } />
              <Route path="/trips" element={
                <TripsManagement 
                  trips={trips}
                  vehicles={vehicles}
                  employees={employees}
                  maintenance={maintenance}
                  tripSearch={tripSearch}
                  setTripSearch={setTripSearch}
                  tripStatusFilter={tripStatusFilter}
                  setTripStatusFilter={setTripStatusFilter}
                  tripTypeFilter={tripTypeFilter}
                  setTripTypeFilter={setTripTypeFilter}
                  tripDateStart={tripDateStart}
                  setTripDateStart={setTripDateStart}
                  tripDateEnd={tripDateEnd}
                  setTripDateEnd={setTripDateEnd}
                  onAddTrip={() => {
                    setSelectedTrip(null);
                    setIsTripModalOpen(true);
                  }}
                  onEditTrip={(t) => {
                    setSelectedTrip(t);
                    setIsTripModalOpen(true);
                  }}
                  onDeleteTrip={handleDeleteTrip}
                  onViewOS={(t) => {
                    setSelectedTrip(t);
                    setIsOSModalOpen(true);
                  }}
                  onOpenAttachments={(t) => {
                    setSelectedTripForAttachments(t);
                    setIsAttachmentsModalOpen(true);
                  }}
                  onAddMaintenanceForVehicle={(vehicleId) => {
                    setMaintenanceInitialData({ vehicleId });
                    setIsMaintenanceModalOpen(true);
                  }}
                />
              } />

              <Route path="/reports" element={
                <ReportsView 
                  vehicles={vehicles}
                  employees={employees}
                  fuelLogs={recentFuelLogs}
                  maintenance={maintenance}
                  trips={trips}
                  finance={transactions}
                  onShare={handleShareReport}
                />
              } />

              <Route path="/criador" element={hasPermission(profile?.role, 'criador', profile?.email, profile?.permissions, profile?.displayName) ? <Criador user={profile} /> : <Navigate to="/dashboard" replace />} />

              <Route path="/os" element={
                <ServiceOrders 
                  trips={trips}
                  vehicles={vehicles}
                  employees={employees}
                  maintenance={maintenance}
                  tripSearch={tripSearch}
                  setTripSearch={setTripSearch}
                  onSelectTrip={(t) => {
                    setSelectedTrip(t);
                    setIsOSModalOpen(true);
                  }}
                  onDeleteTrip={handleDeleteTrip}
                />
              } />

              <Route path="/fuel" element={
                <FuelManagement 
                  fuelTanks={fuelTanks}
                  recentFuelLogs={recentFuelLogs}
                  fuelEntries={fuelEntries}
                  vehicles={vehicles}
                  onOpenTankModal={() => setIsTankModalOpen(true)}
                  onOpenRefillModal={() => setIsRefillModalOpen(true)}
                  onOpenExternalFuelModal={() => setIsExternalFuelModalOpen(true)}
                  onOpenFuelModal={() => setIsFuelModalOpen(true)}
                />
              } />

              <Route path="/maintenance" element={<Navigate to="/fleet" replace />} />

              <Route path="/inventory" element={
                <InventoryManagement userRole={profile?.role} />
              } />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

          {/* Bottom padding for mobile fab or spacing */}
          <div className="h-32" />
          </Suspense>
        </div>
      </main>


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
        <EmployeeForm 
          onSubmit={handleSaveEmployee} 
          loading={formLoading} 
          initialData={selectedEmployee} 
          currentUserRole={profile?.role}
          currentUserEmail={user?.email}
        />
      </Modal>

      <Modal 
        isOpen={isMaintenanceModalOpen} 
        onClose={() => {
          setIsMaintenanceModalOpen(false);
          setMaintenanceInitialData(null);
        }}
        title="Nova Ordem de Serviço"
      >
        <MaintenanceForm 
          onSubmit={handleSaveMaintenance} 
          loading={formLoading}
          vehicles={vehicles}
          initialData={maintenanceInitialData}
        />
      </Modal>

      <Modal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
        title={financialType === 'payable' ? 'Novo Lançamento: Contas a Pagar' : 'Novo Lançamento: Contas a Receber'}
      >
        <FinancialForm 
          type={financialType}
          onSubmit={handleFinancialSubmit}
          isLoading={formLoading}
        />
      </Modal>

      <Modal
        isOpen={isAttachmentsModalOpen}
        onClose={() => {
          setIsAttachmentsModalOpen(false);
          setSelectedTripForAttachments(null);
        }}
        title="Documentos e Anexos"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
              <Paperclip size={20} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{selectedTripForAttachments?.title}</h4>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{selectedTripForAttachments?.origin} → {selectedTripForAttachments?.destination}</p>
            </div>
          </div>

          <AttachmentViewer 
            attachments={selectedTripForAttachments?.attachments || []} 
            renderActions={(file) => (
              (file.type === 'image' || file.type === 'pdf') && (
                <button
                  onClick={() => handleSmartExtractFromModal(selectedTripForAttachments!, file)}
                  disabled={isProcessingModalAttachment === file.name}
                  className="p-2.5 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent hover:bg-brand-accent hover:text-zinc-950 rounded-xl transition-all group/ia"
                  title="Importar passageiros deste documento"
                >
                  {isProcessingModalAttachment === file.name ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} className="group-hover/ia:animate-pulse" />
                  )}
                </button>
              )
            )}
          />

          <button
            onClick={() => setIsAttachmentsModalOpen(false)}
            className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:text-white transition-all"
          >
            Fechar Visualização
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isMaintenanceAttachmentsModalOpen}
        onClose={() => {
          setIsMaintenanceAttachmentsModalOpen(false);
          setSelectedMaintenanceForAttachments(null);
        }}
        title="Anexos de Manutenção"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
              <Wrench size={20} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">O.S. de {selectedMaintenanceForAttachments?.description}</h4>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Custo: R$ {selectedMaintenanceForAttachments?.cost.toLocaleString()}</p>
            </div>
          </div>

          <AttachmentViewer attachments={selectedMaintenanceForAttachments?.attachments || []} />

          <button
            onClick={() => setIsMaintenanceAttachmentsModalOpen(false)}
            className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:text-white transition-all"
          >
            Fechar Visualização
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isTripModalOpen}
        onClose={() => {
          setIsTripModalOpen(false);
          setSelectedTrip(null);
          setSharedAttachments([]);
        }}
        title={selectedTrip ? "Editar Viagem" : "Agendar Nova Viagem"}
      >
        <TripForm 
          vehicles={vehicles}
          employees={employees}
          initialData={selectedTrip}
          initialAttachments={sharedAttachments}
          onSubmit={(data) => {
            handleSaveTrip(data);
            setSharedAttachments([]);
          }}
          onCancel={() => {
            setIsTripModalOpen(false);
            setSelectedTrip(null);
            setSharedAttachments([]);
          }}
          loading={formLoading}
          onDelete={selectedTrip ? () => handleDeleteTrip(selectedTrip) : undefined}
        />
      </Modal>

      <Modal
        isOpen={isOSModalOpen}
        onClose={() => setIsOSModalOpen(false)}
        title="Ordem de Serviço"
      >
        {selectedTrip && (
          <TripServiceOrder 
            trip={selectedTrip}
            vehicle={vehicles.find(v => v.id === selectedTrip.vehicleId)}
            driver={employees.find(e => e.id === selectedTrip.driverId)}
            secondDriver={employees.find(e => e.id === selectedTrip.secondDriverId)}
            onDelete={handleDeleteTrip}
          />
        )}
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
            trips={trips}
            onEdit={openEditFromDetail}
            onAddMaintenance={() => {
              setMaintenanceInitialData({ vehicleId: selectedVehicle?.id, odometer: selectedVehicle?.currentOdometer });
              setIsMaintenanceModalOpen(true);
            }}
            onEditMaintenance={(log) => {
              setMaintenanceInitialData(log);
              setIsMaintenanceModalOpen(true);
            }}
            onDeleteMaintenance={handleDeleteMaintenance}
            onPrintOS={handlePrintOS}
            onDelete={() => handleDeleteVehicle(selectedVehicle.id, selectedVehicle.plate)}
          />
        )}
      </Modal>
      <Modal
        isOpen={isMaintenanceRelatorioOpen}
        onClose={() => {
          setIsMaintenanceRelatorioOpen(false);
          setSelectedMaintenance(null);
        }}
        title="Relatório de Manutenção Técnica"
      >
        {selectedMaintenance && (
          <MaintenanceServiceOrder 
            log={selectedMaintenance}
            vehicle={vehicles.find(v => v.id === selectedMaintenance.vehicleId)}
          />
        )}
      </Modal>
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />
    </div>
  );
}

// App component
export default function App() {
  return (
    <AppContent />
  );
}
