import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Clock,
  Route,
  FileText,
  FileSpreadsheet,
  Trash2,
  User,
  Smartphone,
  X,
  Sparkles,
  Bot,
  Loader2,
  ShieldCheck,
  Globe,
  Map,
  CheckSquare,
  Paperclip,
  Edit3,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
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
import { format, isAfter, isBefore, parseISO, addDays, differenceInDays, subMonths, isSameMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Toaster, toast } from 'sonner';
import * as XLSX from 'xlsx';

import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { cn } from './lib/utils';
import { SplashScreen } from './components/SplashScreen';
import { InstallModal } from './components/InstallModal';
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


// Componentes Modulares
import { Sidebar } from './components/Sidebar';
import { Card, StatCard } from './components/Cards';
import { Modal, ConfirmModal } from './components/UI';
import { VehicleForm, FuelForm, TankForm, TankRefillForm, EmployeeForm, MaintenanceForm } from './components/Forms';

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
import { ReportsView } from './components/ReportsView';
import { JourneyControl } from './components/JourneyControl';
import { CharteredRoutes } from './components/CharteredRoutes';
import { AIConsultant } from './components/AIConsultant';


// Role permissions mapping
const ROLE_PERMISSIONS: Record<string, { label: string, icon: string }[]> = {
  'Dono / Proprietário': [
    { label: 'Dashboard', icon: 'LayoutDashboard' },
    { label: 'Viagens', icon: 'Map' },
    { label: 'Frota', icon: 'Bus' },
    { label: 'Equipe', icon: 'Users' },
    { label: 'Almoxarifado', icon: 'Package' },
    { label: 'Financeiro', icon: 'DollarSign' },
    { label: 'Criação', icon: 'PlusCircle' },
  ],
  'Gestor de Frotas': [
    { label: 'Dashboard', icon: 'LayoutDashboard' },
    { label: 'Frota', icon: 'Bus' },
    { label: 'Almoxarifado', icon: 'Package' },
    { label: 'Criação', icon: 'PlusCircle' },
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

export default function App() {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeSection, setActiveSection] = React.useState('dashboard');
  const [showHistory, setShowHistory] = useState(false);
  const [navStack, setNavStack] = React.useState<string[]>(['dashboard']);

  const handleNavigate = useCallback((sectionId: string) => {
    setActiveSection(prev => {
      if (prev === sectionId) return prev;
      setNavStack(stack => {
        // Limit stack size to 10
        const newStack = [...stack, sectionId].slice(-10);
        return newStack;
      });
      return sectionId;
    });
  }, []);

  const handleBack = useCallback(() => {
    setNavStack(stack => {
      if (stack.length <= 1) return stack;
      const newStack = [...stack];
      newStack.pop();
      const previous = newStack[newStack.length - 1];
      setActiveSection(previous);
      return newStack;
    });
  }, []);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  // Section labels updated
  const sections = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'journey', label: 'Jornada', icon: Clock },
    { id: 'fretamento', label: 'Fretamento', icon: Route },
    { id: 'fleet', label: 'Frota', icon: Bus },
    { id: 'vencimentos', label: 'Vencimentos', icon: Calendar },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'fuel', label: 'Combustível', icon: Fuel },
    { id: 'maintenance', label: 'Manutenções', icon: Wrench },
    { id: 'staff', label: 'Equipe', icon: Users },
    { id: 'trips', label: 'Viagens', icon: TrendingUp },
    { id: 'os', label: 'OS de Viagem', icon: FileText },
    { id: 'inventory', label: 'Almoxarifado', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: Bell },
    { id: 'ai-consultant', label: 'Consultor IA', icon: Bot },
    ...(profile?.email === 'elizeuferron@gmail.com' ? [{ id: 'creacao', label: 'Criação', icon: Sparkles }] : []),
  ];
  
  // Modais
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExternalFuelModalOpen, setIsExternalFuelModalOpen] = useState(false);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
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
  const [journeys, setJourneys] = useState<any[]>([]);
  const [charteredRoutes, setCharteredRoutes] = useState<any[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState<string>('all');
  const [tripTypeFilter, setTripTypeFilter] = useState<string>('all');
  const [tripDateStart, setTripDateStart] = useState<string>('');
  const [tripDateEnd, setTripDateEnd] = useState<string>('');
  const [tripSearch, setTripSearch] = useState('');
  const [sharedAttachments, setSharedAttachments] = useState<{name: string, url: string, type: 'image' | 'pdf' | 'word' | 'excel'}[]>([]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();
    
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      setShowInstallModal(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

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
    const message = `🚀 *DM TURISMO PRO - INSTALADOR APK*%0A%0AOlá ${employee.name}! 👋%0A%0AO seu Portal do Colaborador está pronto para uso offline.%0A%0A📲 *BAIXAR APLICATIVO (APK):* ${shareUrl}%0A%0A*PASSO A PASSO PARA ANDROID:*%0A1. Clique no link acima.%0A2. No Chrome, toque nos *3 PONTINHOS* (Canto superior).%0A3. Escolha *INSTALAR APLICATIVO* ou *ADICIONAR À TELA DE INÍCIO*.%0A4. O ícone aparecerá no seu celular como um APK nativo.%0A%0A_DM Turismo - Desempenho e Tecnologia._`;
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

  const handleExportAPKDigital = () => {
    try {
      const appUrl = window.location.origin;
      const htmlContent = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DM TURISMO - APK DIGITAL</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap" rel="stylesheet">
    <style>
        body { 
          background: #09090b; 
          color: white; 
          font-family: 'Inter', sans-serif; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          height: 100vh; 
          margin: 0; 
          text-align: center;
          background-image: radial-gradient(circle at top right, #ff6b001a, transparent), radial-gradient(circle at bottom left, #00d2ff1a, transparent);
        }
        .card { 
          background: #18181b; 
          padding: 3rem; 
          border-radius: 2.5rem; 
          border: 1px solid rgba(255,255,255,0.05); 
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8); 
          max-width: 380px;
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
        }
        .glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(from 0deg, transparent, #ff6b00, transparent, #00d2ff, transparent);
          animation: rotate 10s linear infinite;
          opacity: 0.1;
          pointer-events: none;
        }
        @keyframes rotate { 100% { transform: rotate(360deg); } }
        .logo-container {
          width: 100px;
          height: 100px;
          background: #ff6b00;
          border-radius: 2rem;
          margin: 0 auto 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 2.5rem;
          color: #0c0c0e;
          transform: rotate(-3deg);
          box-shadow: 0 20px 40px -10px rgba(255,107,0,0.4);
        }
        h1 { margin: 0; font-size: 1.75rem; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; }
        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: rgba(255,107,0,0.1);
          border: 1px solid rgba(255,107,0,0.2);
          border-radius: 100px;
          color: #ff6b00;
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1rem;
          margin-bottom: 1rem;
        }
        p { color: #888; font-size: 0.9rem; margin-top: 1rem; margin-bottom: 2.5rem; line-height: 1.6; font-weight: 500; }
        .btn { 
          background: #ff6b00; 
          color: #000; 
          text-decoration: none; 
          padding: 1.25rem 2.5rem; 
          border-radius: 1.25rem; 
          font-weight: 900; 
          text-transform: uppercase; 
          letter-spacing: 0.05em; 
          display: block; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 15px 30px -10px rgba(255,107,0,0.3);
          font-size: 0.9rem;
        }
        .btn:hover { 
          transform: translateY(-4px) scale(1.02); 
          background: #fff;
          box-shadow: 0 20px 40px -10px rgba(255,255,255,0.2);
        }
        .footer {
          margin-top: 3rem;
          font-size: 0.7rem;
          color: #444;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 0.3em;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="glow"></div>
        <div class="badge">Terminal Corporativo</div>
        <div class="logo-container">DM</div>
        <h1>DM Turismo Pro</h1>
        <p>Iniciando o terminal de logística e viagens em seu dispositivo móvel...</p>
        <a href="${appUrl}" class="btn">Conectar Agora</a>
    </div>
    <div class="footer">DM Turismo • Digital Ecosystem © 2026</div>
    <script>
        setTimeout(() => { window.location.href = "${appUrl}"; }, 4000);
    </script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DM_TURISMO_PRO_APK.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("APK Digital gerado com sucesso!", {
        description: "Envie este arquivo para o Google Drive e compartilhe o link do Drive com sua equipe.",
        duration: 6000,
      });
    } catch (error) {
      console.error("Erro ao gerar APK:", error);
      toast.error("Erro ao processar o terminal digital.");
    }
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
            setProfile(data);
            setLoading(false);
          } else {
            // Profile doesn't exist, create it
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email!,
              displayName: user.displayName || 'Novo Usuário',
              role: user.email === 'elizeuferron@gmail.com' ? 'Dono / Proprietário' : 'Motorista',
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

    const unsubJourneys = onSnapshot(query(collection(db, 'journeys'), orderBy('startTime', 'desc'), limit(500)), (snapshot) => {
      setJourneys(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => handleFirestoreError(error, OperationType.LIST, 'journeys'));

    const unsubRoutes = onSnapshot(collection(db, 'chartered_routes'), (snapshot) => {
      setCharteredRoutes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => handleFirestoreError(error, OperationType.LIST, 'chartered_routes'));

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
      unsubJourneys();
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
          const text = `🚀 *DM PRO - ACESSO ATUALIZADO*%0A%0AOlá ${data.name}! 👋%0A%0ASeu perfil no sistema foi atualizado. Acesse agora a plataforma oficial para melhor performance:%0A%0A🔗 *LINK:*%0A${appUrl}%0A%0A📲 *DICA DE ACESSO:*%0AAbra o link acima e adicione à Tela de Início para ter o ícone no seu celular!`;
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
          const message = `🚀 *DM PRO - ACESSO LIBERADO*%0A%0AOlá ${data.name}! 👋%0A%0ASeu acesso como *${data.role.toUpperCase()}* está pronto. Acesse a plataforma digital DM para melhor performance:%0A%0A🔗 *LINK DE ACESSO:*%0A${appUrl}%0A%0A📲 *DICA DE ACESSO:*%0A1. Abra o link acima%0A2. No menu do seu navegador%0A3. Clique em *"Adicionar à Tela de Início"*%0A%0A_Isso criará o ícone da DM Pro na sua tela inicial!_`;
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
    setSelectedMaintenance(log);
    setIsMaintenanceRelatorioOpen(true);
  };

  const handleFinancialSubmit = async (data: any) => {
    setFormLoading(true);
    try {
      await addDoc(collection(db, 'financial_transactions'), {
        ...data,
        createdAt: new Date().toISOString()
      });
      toast.success('Lançamento realizado com sucesso!');
      setIsFinancialModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'financial_transactions');
    } finally {
      setFormLoading(false);
    }
  };

  const [selectedTripForAttachments, setSelectedTripForAttachments] = useState<Trip | null>(null);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isProcessingModalAttachment, setIsProcessingModalAttachment] = useState<string | null>(null);

  const handleSmartExtractFromModal = async (trip: Trip, attachment: any) => {
    if (attachment.type !== 'image' && attachment.type !== 'pdf') {
      toast.error("Formato não suportado para extração automática.");
      return;
    }

    setIsProcessingModalAttachment(attachment.name);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const [header, base64Data] = attachment.url.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

      const prompt = "Extraia a lista de passageiros deste documento. Retorne um JSON com um array de objetos contendo 'name' (NOME COMPLETO EM MAIÚSCULAS) e 'document' (CPF ou RG). Se não houver documento, use 'S/D'.";

      const result = await (ai as any).models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.text();
      const extractedData = JSON.parse(responseText);

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
        label: 'Certificado Turismo', 
        date: v.tourismLicenseExpiration,
        icon: 'ANTT'
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
    return (
      <div className="min-h-screen travel-gradient flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute inset-0 map-pattern opacity-10" />
        <div className="w-full max-w-md space-y-12 text-center animate-in fade-in zoom-in duration-1000 relative z-10">
          <div className="w-32 h-32 bg-brand-accent rounded-[2.5rem] mx-auto flex items-center justify-center transform rotate-12 shadow-2xl shadow-brand-accent/30 glow-brand">
            <Bus className="w-16 h-16 text-asphalt-950 transform -rotate-12" />
          </div>
          <div className="space-y-6">
            <h1 className="text-6xl font-black text-white tracking-tighter leading-none uppercase font-display">DM Turismo</h1>
            <p className="text-sky-blue font-black tracking-tight px-10 leading-relaxed opacity-80 uppercase text-[10px] tracking-[0.4em]">Logística & Aventuras Premium</p>
          </div>
          <button 
            onClick={login} 
            className="w-full py-6 bg-white hover:bg-zinc-100 text-zinc-950 rounded-[2.5rem] font-black transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 group relative overflow-hidden travel-button"
          >
             <div className="w-8 h-8 bg-zinc-950/10 rounded-xl flex items-center justify-center text-xs font-black group-hover:bg-zinc-950/20 transition-colors">G</div>
             Entrar na Conta Corporativa
          </button>
          <div className="pt-8 space-y-6">
            <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-6">
              <a href="#" className="text-[9px] font-bold text-zinc-500 hover:text-sky-blue uppercase tracking-widest transition-colors">Privacidade</a>
              <a href="#" className="text-[9px] font-bold text-zinc-500 hover:text-sky-blue uppercase tracking-widest transition-colors">Turismo & Rodoviário</a>
            </div>

            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.5em] pt-4">DM Turismo • App Oficial © 2026</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen travel-gradient h-screen overflow-hidden flex font-sans selection:bg-brand-accent/30 selection:text-white text-slate-100 relative">
      <div className="absolute inset-0 map-pattern opacity-5 pointer-events-none" />
      <Toaster theme="dark" position="top-right" expand={false} richColors />
      <OfflineSync />
      
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        activeSection={activeSection} 
        setActiveSection={handleNavigate}
        profile={profile}
        logout={logout}
        isInstallable={!isStandalone}
        onInstall={handleInstallApp}
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
                <Clock size={18} />
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
            {activeSection === 'dashboard' && (
              <Dashboard 
                vehicles={vehicles}
                employees={employees}
                fuelLogs={recentFuelLogs}
                maintenance={maintenance}
                trips={trips}
                user={profile}
                setActiveSection={setActiveSection}
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
            )}

            {activeSection === 'journey' && profile && (
              <JourneyControl employee={profile} journeys={journeys} />
            )}

            {activeSection === 'fretamento' && (
              <CharteredRoutes vehicles={vehicles} employees={employees} routes={charteredRoutes} />
            )}

            {activeSection === 'fleet' && (
              <FleetList 
                vehicles={vehicles}
                onAddVehicle={handleOpenAddVehicle}
                onVehicleClick={handleVehicleClick}
              />
            )}

            {activeSection === 'vencimentos' && (
              <Vencimentos 
                vehicleVencimentos={vehicleVencimentos}
                driverVencimentos={driverVencimentos}
              />
            )}
            
            {activeSection === 'finance' && (
              <Finance 
                transactions={transactions}
                onAddTransaction={openFinancialModal}
                onUpdateStatus={handleUpdateFinanceStatus}
              />
            )}

            {activeSection === 'trips' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Viagens & Fretamento</h1>
                  <p className="text-zinc-300 font-medium tracking-tight mt-1">Escalas de viagem, rotas de turismo e fretamento contínuo.</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedTrip(null);
                    setIsTripModalOpen(true);
                  }}
                  className="px-6 py-3 bg-brand-accent text-zinc-950 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all shadow-lg active:scale-95"
                >
                  Nova Viagem
                </button>
              </div>

              {/* Filters */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="BUSCAR POR TÍTULO, ORIGEM OU DESTINO..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-zinc-600 focus:outline-none focus:border-brand-accent/50 transition-all font-mono text-xs uppercase"
                    value={tripSearch}
                    onChange={(e) => setTripSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      value={tripStatusFilter}
                      onChange={(e) => setTripStatusFilter(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 appearance-none transition-all uppercase text-xs"
                    >
                      <option value="all">TODOS OS STATUS</option>
                      <option value="scheduled">AGENDADA</option>
                      <option value="active">EM CURSO</option>
                      <option value="completed">FINALIZADA</option>
                      <option value="cancelled">CANCELADA</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo de Viagem</label>
                    <select 
                      value={tripTypeFilter}
                      onChange={(e) => setTripTypeFilter(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 appearance-none transition-all uppercase text-xs"
                    >
                      <option value="all">TODOS OS TIPOS</option>
                      <option value="state">ESTADUAL</option>
                      <option value="interstate">INTERESTADUAL</option>
                      <option value="mercosur">MERCOSUL</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-emerald-500">De (Data)</label>
                    <input 
                      type="date"
                      value={tripDateStart}
                      onChange={(e) => setTripDateStart(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 transition-all text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-rose-500">Até (Data)</label>
                    <input 
                      type="date"
                      value={tripDateEnd}
                      onChange={(e) => setTripDateEnd(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 transition-all text-xs"
                    />
                  </div>
                </div>
                
                {(tripStatusFilter !== 'all' || tripTypeFilter !== 'all' || tripDateStart || tripDateEnd || tripSearch) && (
                  <div className="flex justify-start">
                    <button 
                      onClick={() => {
                        setTripStatusFilter('all');
                        setTripTypeFilter('all');
                        setTripDateStart('');
                        setTripDateEnd('');
                        setTripSearch('');
                      }}
                      className="text-[10px] font-black text-brand-accent uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                )}
              </div>

              {filteredTrips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredTrips.map(trip => {
                    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                    return (
                      <Card key={trip.id} className="bg-zinc-900 border-zinc-800 p-6 space-y-4 hover:border-brand-accent/50 transition-all group">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-black uppercase text-zinc-400 group-hover:text-brand-accent transition-colors">
                                  {vehicle?.plate || 'S/ PLACA'}
                                </div>
                                <div className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500">
                                   {trip.tripType === 'mercosur' ? <ShieldCheck size={14} className="text-emerald-500" /> : 
                                    trip.tripType === 'interstate' ? <Globe size={14} className="text-brand-accent" /> : 
                                    <Map size={14} />}
                                </div>
                              </div>
                              <span className={cn(
                                "text-[10px] font-black uppercase px-2 py-1 rounded-md",
                                trip.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                trip.status === 'scheduled' ? 'bg-brand-accent/10 text-brand-accent' :
                                'bg-zinc-800 text-zinc-500'
                              )}>
                                {trip.status === 'active' ? 'Em Curso' : 
                                 trip.status === 'scheduled' ? 'Agendada' : 
                                 trip.status === 'completed' ? 'Finalizada' : 'Cancelada'}
                              </span>
                            </div>
                            
                            <div>
                              <h4 className="font-black text-white uppercase text-lg tracking-tight mb-1">{trip.title}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase">
                                <MapPin size={12} className="text-brand-accent" />
                                {trip.origin} ➔ {trip.destination}
                              </div>
                            </div>

                            {/* Doc Status */}
                            <div className="py-3 px-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <CheckSquare size={14} className={cn(
                                    trip.documentation.every(d => d.checked) ? "text-emerald-500" : "text-amber-500"
                                  )} />
                                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Documentação</span>
                               </div>
                               <span className="text-[9px] font-black text-white">
                                  {trip.documentation.filter(d => d.checked).length} / {trip.documentation.length}
                               </span>
                            </div>

                            {trip.attachments && (trip.attachments as any[]).length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTripForAttachments(trip);
                                  setIsAttachmentsModalOpen(true);
                                }}
                                className="py-2 px-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between hover:bg-emerald-500/20 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2">
                                  <Paperclip size={12} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Documentos Salvos</span>
                                </div>
                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  {(trip.attachments as any[]).length}
                                </span>
                              </button>
                            )}

                            <div className="flex items-center gap-2">
                               <button
                                onClick={() => {
                                  setSelectedTrip(trip);
                                  setIsOSModalOpen(true);
                                }}
                                className="flex-1 py-2.5 bg-zinc-800 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                               >
                                <FileText size={14} className="text-brand-accent" />
                                Ordem de Serviço
                               </button>
                               <button
                                onClick={() => {
                                  setSelectedTrip(trip);
                                  setIsTripModalOpen(true);
                                }}
                                className="w-12 h-10 bg-zinc-800 rounded-xl text-zinc-400 hover:text-brand-accent flex items-center justify-center transition-all"
                               >
                                <Edit3 size={16} />
                               </button>
                               <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTrip(trip);
                                }}
                                className="w-12 h-10 bg-zinc-800 rounded-xl text-zinc-400 hover:text-rose-500 flex items-center justify-center transition-all"
                                title="Excluir Viagem"
                               >
                                <Trash2 size={16} />
                               </button>
                            </div>

                            <div className="pt-4 border-t border-zinc-800/50 flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                  <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest leading-none">Início</p>
                                  <p className="text-[10px] text-zinc-400 font-bold uppercase">{format(new Date(trip.startDate), "HH:mm '•' dd MMM", { locale: ptBR })}</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 rounded-lg text-zinc-400">
                                   <Users size={14} />
                                   <span className="text-[10px] font-black">{trip.passengerCount || 0}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                 <User size={12} className="text-zinc-500" />
                                 <div className="flex flex-wrap gap-x-2">
                                   <span className="text-[9px] font-black text-zinc-400 uppercase">
                                     {employees.find(e => e.id === trip.driverId)?.name.split(' ')[0]}
                                   </span>
                                   {trip.secondDriverId && (
                                     <span className="text-[9px] font-black text-brand-accent uppercase">
                                       + {employees.find(e => e.id === trip.secondDriverId)?.name.split(' ')[0]}
                                     </span>
                                   )}
                                 </div>
                              </div>
                            </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
                  <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-700">
                    <TrendingUp size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase mb-2">
                      {trips.length === 0 ? "Nenhuma viagem agendada" : "Nenhum resultado encontrado"}
                    </h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest max-w-sm">
                      {trips.length === 0 
                        ? "Utilize o módulo de gestão para cadastrar novas rotas de fretamento ou viagens de turismo."
                        : "Tente ajustar os filtros acima para encontrar a viagem desejada."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

            {activeSection === 'reports' && (
              <ReportsView 
                vehicles={vehicles}
                employees={employees}
                fuelLogs={recentFuelLogs}
                maintenance={maintenance}
                trips={trips}
                finance={transactions}
                onShare={handleShareReport}
              />
            )}

            {activeSection === 'ai-consultant' && (
              <AIConsultant />
            )}

            {activeSection === 'creacao' && profile?.email === 'elizeuferron@gmail.com' && (
              <CreationTool />
            )}

          {activeSection === 'os' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent border border-brand-accent/20">
                      <FileText size={24} />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">OS de Viagem</h1>
                  </div>
                  <p className="text-zinc-500 font-medium tracking-tight">Emissão e controle de Ordens de Serviço para escala operacional.</p>
                </div>
                
                <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shadow-xl">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="BUSCAR VIAGEM OU DESTINO..."
                      className="bg-transparent text-[10px] font-black uppercase text-white placeholder:text-zinc-600 pl-12 pr-6 py-4 w-full md:w-80 outline-none tracking-widest"
                      value={tripSearch}
                      onChange={e => setTripSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.filter(t => 
                  t.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
                  t.destination.toLowerCase().includes(tripSearch.toLowerCase())
                ).map(trip => (
                  <ServiceOrderListItem 
                    key={trip.id} 
                    trip={trip} 
                    onSelect={(t) => {
                      setSelectedTrip(t);
                      setIsOSModalOpen(true);
                    }} 
                  />
                ))}
              </div>

              {trips.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 grayscale opacity-30">
                  <FileText size={80} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-6">Nenhuma viagem encontrada para emissão de OS</p>
                </div>
              )}
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

              {/* Maintenance costs chart */}
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-accent/10 rounded-xl">
                      <TrendingUp size={20} className="text-brand-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Análise de Custos operacionais</h3>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight mt-1">Comparativo de gastos em manutenção nos últimos 6 meses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-brand-accent"></div><span className="text-zinc-500">Preventiva</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-zinc-600"></div><span className="text-zinc-500">Corretiva</span></div>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maintenanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="month" stroke="#4b5563" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#4b5563" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 107, 0, 0.05)' }}
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #1f2937', borderRadius: '12px', fontSize: '10px', fontWeight: '800' }}
                        formatter={(v: any) => [`R$ ${v.toLocaleString()}`, '']}
                      />
                      <Bar dataKey="preventive" fill="#ff6b00" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="corrective" fill="#3f3f46" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-black text-white uppercase tracking-tighter font-display">Fichário Operacional</h1>
                  <div className="flex flex-wrap items-center gap-4">
                    <p className="text-zinc-500 font-medium tracking-tight flex items-center gap-2">
                      <Users size={14} />
                      {employees.length} Colaboradores Registrados
                    </p>
                    <button 
                      onClick={handleShareAppLink}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      <Share2 size={12} />
                      Compartilhar Link
                    </button>
                    <button 
                      onClick={handleExportStaffToExcel}
                      className="flex items-center gap-2 px-3 py-1.5 bg-asphalt-900 text-zinc-400 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-asphalt-800 hover:text-white transition-all shadow-lg active:scale-95 border border-white/5"
                    >
                      <FileSpreadsheet size={12} />
                      Excel
                    </button>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleExportAPKDigital}
                        className="flex items-center gap-3 px-4 py-2 bg-brand-accent text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-accent/20 active:scale-95 travel-button"
                      >
                        <Smartphone size={14} />
                        Gerar APK para Drive
                      </button>
                      <div className="hidden group xl:block relative">
                        <div className="p-2 bg-asphalt-900 rounded-full text-zinc-600 border border-white/5 hover:text-white cursor-help">
                          <Bell size={12} />
                        </div>
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 w-48 p-3 bg-asphalt-900 border border-white/5 rounded-xl shadow-2xl text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 invisible group-hover:visible z-50">
                          Instrução: Baixe o arquivo HTML gerado, faça o upload para o Google Drive e compartilhe o link com os funcionários para instalação direta.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Hoje é dia</p>
                  <p className="text-2xl font-black text-brand-accent tracking-tighter uppercase font-display">
                    {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              {/* Team Dashboard Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-1">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total Equipe</span>
                    <span className="text-2xl font-black text-white leading-none">{employees.length}</span>
                 </div>
                 <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-1">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Aniversariantes (Mês)</span>
                    <span className={cn(
                      "text-2xl font-black leading-none",
                      employees.filter(e => e.birthDate && format(parseISO(e.birthDate), 'MM') === format(new Date(), 'MM')).length > 0 ? "text-brand-accent" : "text-zinc-500"
                    )}>
                      {employees.filter(e => e.birthDate && format(parseISO(e.birthDate), 'MM') === format(new Date(), 'MM')).length}
                    </span>
                 </div>
                 <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-1">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">CNH Expirada/Vencendo</span>
                    <span className={cn(
                      "text-2xl font-black leading-none",
                      employees.filter(e => e.licenseExpiration && isBefore(parseISO(e.licenseExpiration), addDays(new Date(), 30))).length > 0 ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {employees.filter(e => e.licenseExpiration && isBefore(parseISO(e.licenseExpiration), addDays(new Date(), 30))).length}
                    </span>
                 </div>
                 <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-1">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Motoristas</span>
                    <span className="text-2xl font-black text-white leading-none">
                      {employees.filter(e => e.role === 'Motorista').length}
                    </span>
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
                  const permissions = (e.permissions && e.permissions.length > 0)
                    ? (e.permissions || []).map(p => {
                        const tool = [
                          { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
                          { id: 'journey', label: 'Jornada', icon: 'Clock' },
                          { id: 'fretamento', label: 'Fretamento', icon: 'Route' },
                          { id: 'fleet', label: 'Frota', icon: 'Bus' },
                          { id: 'vencimentos', label: 'Vencimentos', icon: 'Calendar' },
                          { id: 'finance', label: 'Financeiro', icon: 'DollarSign' },
                          { id: 'fuel', label: 'Combustível', icon: 'Fuel' },
                          { id: 'maintenance', label: 'Manutenção', icon: 'Wrench' },
                          { id: 'staff', label: 'Equipe', icon: 'Users' },
                          { id: 'trips', label: 'Viagens', icon: 'TrendingUp' },
                          { id: 'os', label: 'OS de Viagem', icon: 'FileText' },
                          { id: 'inventory', label: 'Almoxarifado', icon: 'Package' },
                          { id: 'reports', label: 'Relatórios', icon: 'Bell' },
                        ].find(t => t.id === p);
                        return tool || { label: p, icon: 'PlusCircle' };
                      })
                    : (ROLE_PERMISSIONS[e.role] || []);

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
                            "w-12 h-12 bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center text-zinc-500 border border-zinc-700 transition-all",
                            isBirthday && "bg-brand-accent text-zinc-950 border-brand-accent"
                          )}>
                            {e.photoUrl ? (
                              <img src={e.photoUrl} alt={e.name} className="w-full h-full object-cover" />
                            ) : (
                              isBirthday ? <Cake size={24} /> : <Users size={24} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-white uppercase text-sm tracking-tight leading-none mb-1.5">{e.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded uppercase tracking-widest">{e.role}</span>
                              {e.permissions && e.permissions.length > 0 && (
                                <span className="text-[8px] font-black px-1.5 py-0.5 bg-brand-accent/10 text-brand-accent rounded uppercase tracking-widest border border-brand-accent/20">Custom</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={(evt) => {
                            evt.stopPropagation();
                            handleDeleteEmployee(e.id, e.name);
                          }}
                          className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Excluir Funcionário"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Permissions / Tools */}
                      <div className="px-6 py-4 bg-zinc-950/30 border-b border-zinc-800/50">
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-3">Ferramentas Permitidas</p>
                        <div className="flex flex-wrap gap-2">
                          {permissions.map((p: any, idx: number) => (
                            <div 
                              key={idx}
                              className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded flex items-center gap-1.5 group/tool"
                              title={p.label}
                            >
                              <div className="text-zinc-500 group-hover/tool:text-brand-accent transition-colors">
                                {p.icon === 'LayoutDashboard' && <LayoutDashboard size={10} />}
                                {p.icon === 'Bus' && <Bus size={10} />}
                                {p.icon === 'Calendar' && <Calendar size={10} />}
                                {p.icon === 'DollarSign' && <DollarSign size={10} />}
                                {p.icon === 'Fuel' && <Fuel size={10} />}
                                {p.icon === 'Wrench' && <Wrench size={10} />}
                                {p.icon === 'Users' && <Users size={10} />}
                                {p.icon === 'TrendingUp' && <TrendingUp size={10} />}
                                {p.icon === 'FileText' && <FileText size={10} />}
                                {p.icon === 'Package' && <Package size={10} />}
                                {p.icon === 'Bell' && <Bell size={10} />}
                                {p.icon === 'Sparkles' && <Sparkles size={10} />}
                                {p.icon === 'Clock' && <Clock size={10} />}
                                {p.icon === 'Route' && <Route size={10} />}
                              </div>
                              <span className="text-[7px] font-black text-zinc-500 uppercase tracking-tighter">{p.label}</span>
                            </div>
                          ))}
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
                           <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Vencimento CNH</p>
                           <div className={cn(
                             "px-3 py-2 rounded-lg text-[10px] font-bold border mb-2",
                             e.licenseExpiration && isBefore(parseISO(e.licenseExpiration), new Date()) 
                               ? "bg-rose-500/10 border-rose-500 text-rose-500" 
                               : "bg-zinc-950/50 border-zinc-800 text-zinc-400"
                           )}>
                             {e.licenseExpiration ? format(parseISO(e.licenseExpiration), 'dd/MM/yyyy') : 'NÃO INFORMADO'}
                           </div>
                           
                           <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Contato Operacional</p>
                          <div className="flex items-center gap-2">
                             <div className="flex-1 px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-500 font-mono tracking-tighter">
                                {e.phone || 'N/A'}
                             </div>
                             {e.phone && (
                               <>
                                 <button 
                                   onClick={(evt) => {
                                     evt.stopPropagation();
                                     handleShareStaffAccess(e);
                                   }}
                                   className="p-2 bg-emerald-500 text-zinc-950 hover:bg-white rounded-lg transition-all shadow-lg active:scale-90 flex items-center gap-2 group"
                                   title="Compartilhar Instalador APK via WhatsApp"
                                 >
                                   <Smartphone size={14} />
                                     <span className="text-[9px] font-black uppercase tracking-widest">Enviar APK</span>
                                 </button>

                                 <button 
                                   onClick={(evt) => {
                                     evt.stopPropagation();
                                     handleExportEmployeeToExcel(e);
                                   }}
                                   className="p-2 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-lg transition-all shadow-lg active:scale-90 flex items-center gap-2"
                                   title="Exportar Ficha Excel"
                                 >
                                   <FileSpreadsheet size={14} />
                                     <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">Excel</span>
                                 </button>
                               </>
                             )}
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

          <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {selectedTripForAttachments?.attachments?.map((file, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                    file.type === 'pdf' ? "bg-rose-500/10 text-rose-500" : 
                    file.type === 'word' ? "bg-blue-500/10 text-blue-500" :
                    file.type === 'excel' ? "bg-emerald-500/10 text-emerald-500" :
                    "bg-amber-500/10 text-amber-500"
                  )}>
                    {file.type === 'word' || file.type === 'pdf' ? <FileText size={24} /> : 
                     file.type === 'excel' ? <FileText size={24} /> : 
                     <ImageIcon size={24} />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-black text-white uppercase truncate">{file.name}</p>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Tipo: {file.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {(file.type === 'image' || file.type === 'pdf') && (
                    <button
                      onClick={() => handleSmartExtractFromModal(selectedTripForAttachments!, file)}
                      disabled={isProcessingModalAttachment === file.name}
                      className="p-3 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent hover:bg-brand-accent hover:text-zinc-950 rounded-xl transition-all group/ia"
                      title="Importar passageiros deste documento"
                    >
                      {isProcessingModalAttachment === file.name ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} className="group-hover/ia:animate-pulse" />
                      )}
                    </button>
                  )}
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-zinc-800 hover:bg-white hover:text-zinc-950 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Visualizar
                  </a>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIsAttachmentsModalOpen(false)}
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
            onEdit={openEditFromDetail}
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
      
      <InstallModal 
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onInstall={handleInstallApp}
        isInstallable={isInstallable}
      />
    </div>
  );
}
