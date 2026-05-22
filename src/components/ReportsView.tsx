import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Bus, 
  Wrench, 
  AlertTriangle, 
  Package, 
  FileText, 
  Table as TableIcon,
  BarChart as BarChartIcon,
  DollarSign,
  Fuel,
  Users,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Gauge,
  Milestone,
  UserCheck,
  AlertCircle,
  ClipboardCheck,
  Activity,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ReportsViewProps {
  vehicles: any[];
  employees: any[];
  fuelLogs: any[];
  maintenance: any[];
  trips: any[];
  finance: any[];
  onShare: (type: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  vehicles = [],
  employees = [],
  fuelLogs = [],
  maintenance = [],
  trips = [],
  finance = [],
  onShare
}) => {
  // Navigation tabs: modules (reformulated filters), vehicle dossier, or driver dossier
  const [activeTab, setActiveTab] = useState<'modules' | 'vehicle' | 'driver'>('modules');

  // Module Category states
  const [selectedCategory, setSelectedCategory] = useState<string>('finance');
  const [reportFormat, setReportFormat] = useState<'summarized' | 'detailed'>('summarized');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Custom Filters (General search criteria)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Subordinated snapshots
  const [charteredRoutes, setCharteredRoutes] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);

  useEffect(() => {
    const unsubRoutes = onSnapshot(collection(db, 'chartered_routes'), (snapshot) => {
      setCharteredRoutes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.log('Fretamento Sync error', err));

    const unsubStock = onSnapshot(collection(db, 'stock_items'), (snapshot) => {
      setStockItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.log('Almoxarifado Sync error', err));

    const unsubJourneys = onSnapshot(collection(db, 'journeys'), (snapshot) => {
      setJourneys(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.log('Ponto Sync error', err));

    return () => {
      unsubRoutes();
      unsubStock();
      unsubJourneys();
    };
  }, []);

  // Helper date checker
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return true;
    try {
      const parsed = parseISO(dateStr.substring(0, 10));
      if (startDate && isBefore(parsed, parseISO(startDate))) return false;
      if (endDate && isBefore(parseISO(endDate), parsed)) return false;
      return true;
    } catch {
      return true;
    }
  };

  // MODULE SHORTCUTS
  const reportShortcuts = [
    { id: 'finance', label: 'Financeiro', desc: 'Contas, parcelas e caixa', icon: DollarSign },
    { id: 'fuel', label: 'Combustível', desc: 'Abastecimentos e Arla 32', icon: Fuel },
    { id: 'maintenance', label: 'Manutenções', desc: 'Reparos e preventivas', icon: Wrench },
    { id: 'trips', label: 'Escalas', desc: 'Históricos de viagens', icon: TrendingUp },
    { id: 'fretamento', label: 'Fretamento', desc: 'Rotas coletivas contratadas', icon: Milestone },
    { id: 'inventory', label: 'Almoxarifado', desc: 'Controle de estoque e peças', icon: Package },
    { id: 'fleet', label: 'Frota Ativa', desc: 'Status operacional geral', icon: Bus },
    { id: 'os', label: 'Ordens Serviço', desc: 'Instruções de serviço', icon: ClipboardCheck },
  ];

  const currentCategoryLabel = useMemo(() => {
    return reportShortcuts.find(r => r.id === selectedCategory)?.label || 'Geral';
  }, [selectedCategory]);

  // Column definitions for module-based list reporting
  const categoryColumns = useMemo(() => ({
    finance: [
      { id: 'dueDate', label: 'Vencimento', getValue: (f: any) => f.dueDate ? format(parseISO(f.dueDate), 'dd/MM/yyyy') : '---' },
      { id: 'description', label: 'Descrição', getValue: (f: any) => String(f.description || '').toUpperCase() },
      { id: 'supplier', label: 'Fornecedor/Cli', getValue: (f: any) => String(f.supplier || 'DM TURISMO').toUpperCase() },
      { id: 'category', label: 'Categoria', getValue: (f: any) => String(f.category || 'GERAL').toUpperCase() },
      { id: 'type', label: 'Fluxo', getValue: (f: any) => f.type === 'income' ? 'ENTRADA' : 'SAÍDA' },
      { id: 'amount', label: 'Valor', getValue: (f: any) => `R$ ${(f.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
    ],
    fuel: [
      { id: 'timestamp', label: 'Data', getValue: (l: any) => l.timestamp ? format(parseISO(l.timestamp), 'dd/MM/yyyy') : '---' },
      { id: 'vehiclePlate', label: 'Placa Veículo', getValue: (l: any) => (vehicles.find(v => v.id === l.vehicleId)?.plate || 'S/PLACA').toUpperCase() },
      { id: 'driverName', label: 'Motorista', getValue: (l: any) => (employees.find(e => e.id === l.driverId)?.name || 'OUTRO').toUpperCase() },
      { id: 'quantity', label: 'Litros', getValue: (l: any) => `${Number(l.quantity || 0).toFixed(1)} L` },
      { id: 'arlaQuantity', label: 'Arla 32', getValue: (l: any) => l.arlaQuantity ? `${Number(l.arlaQuantity).toFixed(1)} L` : '0 L' },
      { id: 'cost', label: 'Custo Total', getValue: (l: any) => `R$ ${(l.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
    ],
    maintenance: [
      { id: 'date', label: 'Data', getValue: (m: any) => (m.completedAt || m.createdAt) ? format(parseISO((m.completedAt || m.createdAt).substring(0, 10)), 'dd/MM/yyyy') : '---' },
      { id: 'vehiclePlate', label: 'Veículo', getValue: (m: any) => (vehicles.find(v => v.id === m.vehicleId)?.plate || 'S/PLACA').toUpperCase() },
      { id: 'description', label: 'Descrição Serviço', getValue: (m: any) => String(m.description || '').toUpperCase() },
      { id: 'type', label: 'Tipo', getValue: (m: any) => m.type === 'preventive' ? 'PREVENTIVA' : 'CORRETIVA' },
      { id: 'status', label: 'Estado', getValue: (m: any) => m.status === 'completed' ? 'CONCLUÍDO' : 'PENDENTE' },
      { id: 'cost', label: 'Custo (R$)', getValue: (m: any) => `R$ ${(m.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
    ],
    trips: [
      { id: 'date', label: 'Data Viagem', getValue: (t: any) => t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '---' },
      { id: 'route', label: 'Itinerário Rota', getValue: (t: any) => String(t.title || t.route || '').toUpperCase() },
      { id: 'vehiclePlate', label: 'Veículo', getValue: (t: any) => (vehicles.find(v => v.id === t.vehicleId)?.plate || 'S/PLACA').toUpperCase() },
      { id: 'driver', label: 'Motorista', getValue: (t: any) => String(t.driverName || 'NÃO DESIGNADO').toUpperCase() },
      { id: 'status', label: 'Escala Status', getValue: (t: any) => String(t.status === 'completed' ? 'FINALIZADA' : 'EM CURSO').toUpperCase() }
    ],
    fretamento: [
      { id: 'name', label: 'Nome da Linha', getValue: (r: any) => String(r.name || '').toUpperCase() },
      { id: 'client', label: 'Cliente Contratante', getValue: (r: any) => String(r.client || 'Geral').toUpperCase() },
      { id: 'vehiclePlate', label: 'Frota Alocada', getValue: (r: any) => (vehicles.find(v => v.id === r.vehicleId)?.plate || 'S/PLACA').toUpperCase() },
      { id: 'schedule', label: 'Horários', getValue: (r: any) => String(r.schedule || 'VERIFICAR').toUpperCase() },
      { id: 'active', label: 'Situação', getValue: (r: any) => r.active !== false ? 'ATIVO' : 'INATIVO' }
    ],
    inventory: [
      { id: 'name', label: 'Item Almoxarifado', getValue: (i: any) => String(i.name || '').toUpperCase() },
      { id: 'category', label: 'Seção Estoque', getValue: (i: any) => String(i.category || 'PEÇAS').toUpperCase() },
      { id: 'quantity', label: 'Estoque Atual', getValue: (i: any) => `${i.quantity || 0} ${i.unit || 'UN'}` },
      { id: 'minQuantity', label: 'Mínimo Alerta', getValue: (i: any) => `${i.minQuantity || 0} ${i.unit || 'UN'}` },
      { id: 'status', label: 'Aprovisionamento', getValue: (i: any) => (i.quantity || 0) <= (i.minQuantity || 0) ? 'REPOSIÇÃO URGENTE' : 'OK' }
    ],
    fleet: [
      { id: 'plate', label: 'Placa', getValue: (v: any) => String(v.plate || '').toUpperCase() },
      { id: 'brandModel', label: 'Marca / Modelo', getValue: (v: any) => `${String(v.brand || '').toUpperCase()} ${String(v.model || '').toUpperCase()}` },
      { id: 'type', label: 'Porte', getValue: (v: any) => String(v.type || 'ÔNIBUS').toUpperCase() },
      { id: 'capacity', label: 'Lotação Max', getValue: (v: any) => `${v.capacity || 0} PASSAGEIROS` },
      { id: 'currentOdometer', label: 'Km Acumulado', getValue: (v: any) => `${(v.currentOdometer || 0).toLocaleString('pt-BR')} KM` },
      { id: 'status', label: 'Atividade Corrente', getValue: (v: any) => v.status === 'available' ? 'OPERANDO COMERCIAL' : v.status === 'maintenance' ? 'RECOLHIDO OFICINA' : 'EM VIAGEM ATIVA' }
    ],
    os: [
      { id: 'osNumber', label: 'Nº OS', getValue: (t: any) => String(t.osNumber || 'S/N').toUpperCase() },
      { id: 'date', label: 'Autorização', getValue: (t: any) => t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '---' },
      { id: 'route', label: 'Serviço', getValue: (t: any) => String(t.title || t.route || '').toUpperCase() },
      { id: 'vehiclePlate', label: 'Equipamento', getValue: (t: any) => (vehicles.find(v => v.id === t.vehicleId)?.plate || 'S/PLACA').toUpperCase() },
      { id: 'driver', label: 'Executor Técnico', getValue: (t: any) => String(t.driverName || 'NÃO DESIGNADO').toUpperCase() }
    ]
  }), [vehicles, employees]);

  // Handle column selection checkboxes
  const [columnSelection, setColumnSelection] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Populate default selection on start
    const initial: Record<string, string[]> = {};
    Object.keys(categoryColumns).forEach(cat => {
      initial[cat] = (categoryColumns as any)[cat].map((col: any) => col.id);
    });
    setColumnSelection(initial);
  }, [categoryColumns]);

  const toggleColumn = (cat: string, colId: string) => {
    const list = columnSelection[cat] || [];
    if (list.includes(colId)) {
      if (list.length > 1) {
        setColumnSelection({ ...columnSelection, [cat]: list.filter(id => id !== colId) });
      } else {
        toast.warning("Mantendo pelo menos uma coluna ativa.");
      }
    } else {
      setColumnSelection({ ...columnSelection, [cat]: [...list, colId] });
    }
  };

  // MAIN FILTERED DATA FOR MODULES VIEW
  const filteredDataRows = useMemo(() => {
    let rawList: any[] = [];
    switch (selectedCategory) {
      case 'finance':
        rawList = [...(finance || [])].filter(f => {
          if (!isDateInRange(f.dueDate)) return false;
          if (selectedStatusFilter === 'paid' && f.status !== 'paid') return false;
          if (selectedStatusFilter === 'pending' && f.status === 'paid') return false;
          return true;
        });
        break;
      case 'fuel':
        rawList = [...(fuelLogs || [])].filter(l => {
          if (!isDateInRange(l.timestamp)) return false;
          if (selectedVehicleId && l.vehicleId !== selectedVehicleId) return false;
          if (selectedEmployeeId && l.driverId !== selectedEmployeeId) return false;
          return true;
        });
        break;
      case 'maintenance':
        rawList = [...(maintenance || [])].filter(m => {
          const mDate = m.completedAt || m.createdAt;
          if (!isDateInRange(mDate)) return false;
          if (selectedVehicleId && m.vehicleId !== selectedVehicleId) return false;
          if (selectedStatusFilter !== 'all' && m.type !== selectedStatusFilter) return false;
          return true;
        });
        break;
      case 'trips':
        rawList = [...(trips || [])].filter(t => {
          if (!isDateInRange(t.date)) return false;
          if (selectedVehicleId && t.vehicleId !== selectedVehicleId) return false;
          if (selectedEmployeeId && t.driverId !== selectedEmployeeId) return false;
          if (selectedStatusFilter !== 'all' && t.status !== selectedStatusFilter) return false;
          return true;
        });
        break;
      case 'fretamento':
        rawList = [...(charteredRoutes || [])].filter(r => {
          if (selectedVehicleId && r.vehicleId !== selectedVehicleId) return false;
          return true;
        });
        break;
      case 'inventory':
        rawList = [...(stockItems || [])].filter(s => {
          if (selectedStatusFilter === 'critic' && (s.quantity || 0) > (s.minQuantity || 0)) return false;
          return true;
        });
        break;
      case 'fleet':
        rawList = [...(vehicles || [])].filter(v => {
          if (selectedStatusFilter !== 'all' && v.status !== selectedStatusFilter) return false;
          return true;
        });
        break;
      case 'os':
        rawList = [...(trips || [])].filter(t => {
          if (!isDateInRange(t.date)) return false;
          if (selectedVehicleId && t.vehicleId !== selectedVehicleId) return false;
          if (selectedEmployeeId && t.driverId !== selectedEmployeeId) return false;
          return true;
        });
        break;
      default:
        rawList = [];
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rawList = rawList.filter(item => {
        const text = `${item.description || ''} ${item.osNumber || ''} ${item.title || ''} ${item.route || ''} ${item.supplier || ''} ${item.category || ''} ${item.plate || ''} ${item.driverName || ''} ${item.name || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    return rawList;
  }, [selectedCategory, startDate, endDate, selectedVehicleId, selectedEmployeeId, selectedStatusFilter, searchTerm, finance, fuelLogs, maintenance, trips, charteredRoutes, stockItems, vehicles]);

  // CHARTS DATA COMPILERS
  const financeChartData = useMemo(() => {
    if (selectedCategory !== 'finance' || activeTab !== 'modules') return [];
    const grp: Record<string, { category: string; Receitas: number; Despesas: number }> = {};
    filteredDataRows.forEach(f => {
      const cat = String(f.category || 'OUTROS').toUpperCase();
      if (!grp[cat]) grp[cat] = { category: cat, Receitas: 0, Despesas: 0 };
      if (f.type === 'income') {
        grp[cat].Receitas += (f.amount || 0);
      } else {
        grp[cat].Despesas += (f.amount || 0);
      }
    });
    return Object.values(grp);
  }, [filteredDataRows, selectedCategory, activeTab]);

  const fuelChartData = useMemo(() => {
    if (selectedCategory !== 'fuel' || activeTab !== 'modules') return [];
    const grp: Record<string, { plate: string; Litros: number; Custo: number }> = {};
    filteredDataRows.forEach(l => {
      const plate = (vehicles.find(v => v.id === l.vehicleId)?.plate || 'S/PLACA').toUpperCase();
      if (!grp[plate]) grp[plate] = { plate, Litros: 0, Custo: 0 };
      grp[plate].Litros += Number(l.quantity || 0);
      grp[plate].Custo += Number(l.cost || 0);
    });
    return Object.values(grp);
  }, [filteredDataRows, selectedCategory, vehicles, activeTab]);

  const maintenanceChartData = useMemo(() => {
    if (selectedCategory !== 'maintenance' || activeTab !== 'modules') return [];
    const stats: Record<string, { type: string; Valor: number; Qtd: number }> = {
      'PREVENTIVA': { type: 'PREVENTIVA', Valor: 0, Qtd: 0 },
      'CORRETIVA': { type: 'CORRETIVA', Valor: 0, Qtd: 0 }
    };
    filteredDataRows.forEach(m => {
      const type = m.type === 'preventive' ? 'PREVENTIVA' : 'CORRETIVA';
      stats[type].Valor += Number(m.cost || 0);
      stats[type].Qtd += 1;
    });
    return Object.values(stats);
  }, [filteredDataRows, selectedCategory, activeTab]);

  const tripsChartData = useMemo(() => {
    if (selectedCategory !== 'trips' && selectedCategory !== 'os' || activeTab !== 'modules') return [];
    const grp: Record<string, { motorista: string; Viagens: number }> = {};
    filteredDataRows.forEach(t => {
      const name = String(t.driverName || 'NÃO DESIGNADO').toUpperCase();
      if (!grp[name]) grp[name] = { motorista: name, Viagens: 0 };
      grp[name].Viagens += 1;
    });
    return Object.values(grp);
  }, [filteredDataRows, selectedCategory, activeTab]);

  // DETAILED REPORTS CHARTS ENGINE
  const renderDetailedCharts = () => {
    switch (selectedCategory) {
      case 'finance':
        return (
          <div className="space-y-6">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Distribuição Financeira por Categoria</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="category" stroke="#71717a" fontSize={8} />
                  <YAxis stroke="#71717a" fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                  <Legend />
                  <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'fuel':
        return (
          <div className="space-y-6">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Volume e Gastos de Abastecimento por Placa</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="plate" stroke="#71717a" fontSize={8} />
                  <YAxis stroke="#71717a" fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                  <Legend wrapperStyle={{ fontSize: '9px' }} />
                  <Bar dataKey="Litros" fill="#ff6b00" name="Volume Total (L)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Custo" fill="#3b82f6" name="Custo Operacional (R$)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'maintenance':
        return (
          <div className="space-y-6">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Custos totais por Tipo de Manutenção</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="type" stroke="#71717a" fontSize={8} />
                  <YAxis stroke="#71717a" fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                  <Legend />
                  <Bar dataKey="Valor" fill="#ec4899" name="Soma R$" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Qtd" fill="#fbbf24" name="Número de OS" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'trips':
      case 'os':
        return (
          <div className="space-y-6">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Soma de Viagens Realizadas por Motorista</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tripsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="motorista" stroke="#71717a" fontSize={8} />
                  <YAxis stroke="#71717a" fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                  <Bar dataKey="Viagens" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-12 text-zinc-500 uppercase font-black text-xs">
            Gráficos adicionais consolidados no Dossiê de Veículos ou Motoristas!
          </div>
        );
    }
  };

  // SUMMARIZED KPIS ENGINE
  const renderSummarizedKPIs = () => {
    switch (selectedCategory) {
      case 'finance': {
        const inc = filteredDataRows.filter(f => f.type === 'income').reduce((s, x) => s + (x.amount || 0), 0);
        const pay = filteredDataRows.filter(f => f.type === 'payable').reduce((s, x) => s + (x.amount || 0), 0);
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Receitas Operacionais</span>
              <p className="text-xl font-black text-emerald-500 mt-1">R$ {inc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Despesas Administrativas</span>
              <p className="text-xl font-black text-rose-500 mt-1">R$ {pay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Resultado Bruto DM</span>
              <p className={cn("text-xl font-black mt-1", (inc - pay) >= 0 ? "text-emerald-400" : "text-rose-450")}>
                R$ {(inc - pay).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        );
      }
      case 'fuel': {
        const liters = filteredDataRows.reduce((sum, l) => sum + Number(l.quantity || 0), 0);
        const val = filteredDataRows.reduce((sum, l) => sum + Number(l.cost || 0), 0);
        const arla = filteredDataRows.reduce((sum, l) => sum + Number(l.arlaQuantity || 0), 0);
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Total Diesel/Gasolina</span>
              <p className="text-xl font-black text-white mt-1">{liters.toLocaleString('pt-BR')} Litros</p>
            </div>
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Gasto Abastecimento</span>
              <p className="text-xl font-black text-brand-accent mt-1">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Gasto de Arla 32</span>
              <p className="text-xl font-black text-white mt-1">{arla.toLocaleString('pt-BR')} Litros</p>
            </div>
          </div>
        );
      }
      case 'maintenance': {
        const cost = filteredDataRows.reduce((sum, m) => sum + Number(m.cost || 0), 0);
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Total de OS Registradas</span>
              <p className="text-xl font-black text-white mt-1">{filteredDataRows.length} Atendimentos</p>
            </div>
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Total Investido Oficinas</span>
              <p className="text-xl font-black text-rose-500 mt-1">R$ {cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Custo Médio por OS</span>
              <p className="text-xl font-black text-white mt-1">
                R$ {(filteredDataRows.length > 0 ? cost / filteredDataRows.length : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        );
      }
      default:
        return (
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 text-center py-6 text-zinc-500 text-[10px] font-black uppercase tracking-wider">
            Total de {filteredDataRows.length} lançamentos operacionais capturados.
          </div>
        );
    }
  };

  // EXCELL EXPORTER
  const triggerExcelExport = () => {
    try {
      let exportList: any[] = [];
      if (reportFormat === 'summarized') {
        exportList = [
          { 'Relatório Consolidado': currentCategoryLabel },
          { 'Data Emissão': format(new Date(), 'dd/MM/yyyy HH:mm:ss') },
          { 'Volume Registros': filteredDataRows.length }
        ];
      } else {
        const columns = (categoryColumns as any)[selectedCategory] || [];
        const checked = columnSelection[selectedCategory] || [];
        const active = columns.filter((c: any) => checked.includes(c.id));
        exportList = filteredDataRows.map((row, idx) => {
          const item: any = {};
          active.forEach((col: any) => {
            item[col.label] = col.getValue(row, idx);
          });
          return item;
        });
      }
      const ws = XLSX.utils.json_to_sheet(exportList);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatório_DM");
      XLSX.writeFile(wb, `Relatorio_DM_${selectedCategory}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      toast.success('Planilha Excel exportada com sucesso.');
    } catch {
      toast.error('Ocorreu um erro ao exportar os dados para o Excel.');
    }
  };

  // PDF CORPORATE EXPORTER WITH A4 Transport Grid layout
  const triggerPDFExport = () => {
    try {
      const doc = new jsPDF() as any;
      doc.setFillColor(24, 24, 27);
      doc.rect(14, 14, 182, 30, 'F');
      
      doc.setDrawColor(255, 107, 0);
      doc.setLineWidth(0.5);
      doc.rect(14, 14, 182, 30, 'D');
      doc.line(74, 14, 74, 44);
      doc.line(144, 14, 144, 44);

      // logo
      doc.setFillColor(255, 107, 0);
      doc.rect(18, 20, 10, 4, 'F');
      doc.rect(18, 26, 14, 4, 'F');
      doc.rect(18, 32, 7, 4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('DM TURISMO', 36, 26);
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text('LOGÍSTICA & FRETAMENTOS', 36, 31);

      // detail
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 107, 0);
      doc.setFontSize(8);
      doc.text('A4 OPERATIONAL ANALYSIS', 78, 21);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`${currentCategoryLabel.toUpperCase()} REPORT`, 78, 28);
      doc.setFontSize(6.5);
      doc.setTextColor(200, 200, 200);
      doc.text(`Filtro: ${startDate || 'Modo Geral'} a ${endDate || 'Modo Geral'}`, 78, 35);
      doc.text(`Format: ${reportFormat.toUpperCase()}`, 78, 40);

      // dates
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 107, 0);
      doc.setFontSize(7.5);
      doc.text('EMISSÃO INTEGRADA', 148, 21);
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(`Emitido: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 148, 27);
      doc.text(`Total: ${filteredDataRows.length} registros`, 148, 32);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('✔ CERTIFICADO DM PRO', 148, 39);

      let curY = 56;
      if (reportFormat === 'summarized') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(24, 24, 27);
        doc.text('CONSIDERAÇÕES OPERACIONAIS GERAIS (KPIs)', 14, curY);
        doc.line(14, curY + 2, 196, curY + 2);
        curY += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.text(`- Volume Geral Filtro: ${filteredDataRows.length} registros computados sob parâmetros ativos.`, 14, curY);
        curY += 8;
        if (selectedCategory === 'finance') {
          const inc = filteredDataRows.filter(f => f.type === 'income').reduce((s, x) => s + (x.amount || 0), 0);
          const pay = filteredDataRows.filter(f => f.type === 'payable').reduce((s, x) => s + (x.amount || 0), 0);
          doc.text(`- Receitas Totais no Período: R$ ${inc.toLocaleString('pt-BR')}`, 14, curY); curY += 8;
          doc.text(`- Despesas Totais no Período: R$ ${pay.toLocaleString('pt-BR')}`, 14, curY); curY += 8;
          doc.text(`- Saldo Final no Período: R$ ${(inc - pay).toLocaleString('pt-BR')}`, 14, curY);
        } else if (selectedCategory === 'fuel') {
          const lts = filteredDataRows.reduce((s, x) => s + Number(x.quantity || 0), 0);
          const cost = filteredDataRows.reduce((s, x) => s + Number(x.cost || 0), 0);
          doc.text(`- Consumo de Óleo Combustível: ${lts.toLocaleString('pt-BR')} Litros`, 14, curY); curY += 8;
          doc.text(`- Despesa Postos Abastecimento: R$ ${cost.toLocaleString('pt-BR')}`, 14, curY);
        } else if (selectedCategory === 'maintenance') {
          const cost = filteredDataRows.reduce((s, x) => s + Number(x.cost || 0), 0);
          doc.text(`- Despesa Total Manutenções: R$ ${cost.toLocaleString('pt-BR')}`, 14, curY); curY += 8;
          doc.text(`- Atendimentos Preventivos / Corretivos: ${filteredDataRows.length} chamados`, 14, curY);
        }
      } else {
        const columns = (categoryColumns as any)[selectedCategory] || [];
        const checked = columnSelection[selectedCategory] || [];
        const active = columns.filter((c: any) => checked.includes(c.id));
        if (active.length === 0) {
          toast.warning("Selecione pelo menos uma coluna.");
          return;
        }
        const heads = [active.map((c: any) => c.label)];
        const rows = filteredDataRows.map((row, idx) => active.map((col: any) => col.getValue(row, idx)));

        autoTable(doc, {
          startY: curY,
          head: heads,
          body: rows,
          theme: 'grid',
          headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
      }
      doc.save(`AutoRelatorio_DM_${selectedCategory}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('Dossiê em formato PDF emitido.');
    } catch (e) {
      console.log(e);
      toast.error('Erro na emissão do arquivo PDF.');
    }
  };

  // ==========================================
  // UNIFIED VEHICLE CONSOLIDATED PANORAMIC DOSSIER
  // ==========================================
  const selectedVehicleData = useMemo(() => {
    if (activeTab !== 'vehicle' || !selectedVehicleId) return null;
    const v = vehicles.find(veh => veh.id === selectedVehicleId);
    if (!v) return null;

    // Fuel logs sorted
    const logs = (fuelLogs || [])
      .filter(l => l.vehicleId === selectedVehicleId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const lastFuel = logs.length > 0 ? logs[logs.length - 1] : null;
    const totalSpentFuel = logs.reduce((sum, l) => sum + Number(l.cost || 0), 0);
    const totalLiters = logs.reduce((sum, l) => sum + Number(l.quantity || 0), 0);
    const totalArla = logs.reduce((sum, l) => sum + Number(l.arlaQuantity || 0), 0);

    // Compute KM/L
    let averageKML = null;
    if (logs.length >= 2) {
      const startOdo = logs[0].odometer;
      const endOdo = logs[logs.length - 1].odometer;
      const totalKM = endOdo - startOdo;
      const litersMinusLast = logs.slice(0, logs.length - 1).reduce((sum, l) => sum + Number(l.quantity || 0), 0);
      if (totalKM > 0 && litersMinusLast > 0) {
        averageKML = totalKM / litersMinusLast;
      }
    }

    // Maintenance list and value
    const vMaint = (maintenance || []).filter(m => m.vehicleId === selectedVehicleId);
    const totalSpentMaint = vMaint.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    const countPreventive = vMaint.filter(m => m.type === 'preventive').length;
    const countCorrective = vMaint.filter(m => m.type === 'corrective').length;

    // Trips list
    const vTrips = (trips || []).filter(t => t.vehicleId === selectedVehicleId);

    return {
      vehicle: v,
      logs,
      lastFuel,
      totalSpentFuel,
      totalLiters,
      totalArla,
      averageKML,
      vMaint,
      totalSpentMaint,
      countPreventive,
      countCorrective,
      vTrips
    };
  }, [activeTab, selectedVehicleId, vehicles, fuelLogs, maintenance, trips]);

  // Export vehicle dossier to PDF format
  const exportVehicleDossierPDF = () => {
    if (!selectedVehicleData) return;
    const { vehicle, lastFuel, totalSpentFuel, totalLiters, totalArla, averageKML, vMaint, totalSpentMaint, vTrips } = selectedVehicleData;
    try {
      const doc = new jsPDF() as any;

      // Header transport style
      doc.setFillColor(24, 24, 27);
      doc.rect(14, 14, 182, 30, 'F');
      doc.setDrawColor(255, 107, 0);
      doc.setLineWidth(0.5);
      doc.rect(14, 14, 182, 30, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('DM TURISMO - DOSSIÊ DE VEÍCULO', 20, 26);
      doc.setFontSize(8.5);
      doc.setTextColor(255, 107, 0);
      doc.text(`PLACA: ${vehicle.plate.toUpperCase()} — MARCA/MODELO: ${vehicle.brand?.toUpperCase() || ''} ${vehicle.model?.toUpperCase() || ''}`, 20, 34);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(7);
      doc.text(`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 148, 23);
      doc.text(`Odômetro Atual: ${(vehicle.currentOdometer || 0).toLocaleString('pt-BR')} KM`, 148, 29);
      doc.text(`Status: ${vehicle.status === 'available' ? 'OPERACIONAL' : 'RECOLHIDO'}`, 148, 35);

      let curY = 54;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(24, 24, 27);
      doc.text('1. MÉTRICAS OPERACIONAIS E CONSUMO', 14, curY);
      doc.setDrawColor(220, 220, 220);
      doc.line(14, curY + 2, 196, curY + 2);
      curY += 8;

      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);
      doc.text(`- Total Abastecido no controle: ${totalLiters.toFixed(1)} L (Combustível) | ${totalArla.toFixed(1)} L (Arla 32)`, 14, curY); curY += 6;
      doc.text(`- Despesas totais de combustível: R$ ${totalSpentFuel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, curY); curY += 6;
      doc.text(`- Consumo Médio Estimado: ${averageKML ? `${averageKML.toFixed(2)} KM/L` : 'Necessita de mais abastecimentos para cálculo'}`, 14, curY); curY += 6;
      
      if (lastFuel) {
        doc.text(`- Último Abastecimento: ${format(parseISO(lastFuel.timestamp.substring(0, 10)), 'dd/MM/yyyy')} | ${lastFuel.quantity}L por R$ ${lastFuel.cost.toLocaleString('pt-BR')} em ${lastFuel.location || 'Posto'}`, 14, curY);
      } else {
        doc.text('- Último Abastecimento: Sem registro cadastrado.', 14, curY);
      }
      curY += 10;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('2. HISTÓRICO DE MANUTENÇÕES', 14, curY);
      doc.line(14, curY + 2, 196, curY + 2);
      curY += 8;

      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);
      doc.text(`- Total gasto em Peças & Oficina: R$ ${totalSpentMaint.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${vMaint.length} ordens de serviço.`, 14, curY);
      curY += 6;

      const maintRows = vMaint.slice(0, 5).map((m: any) => [
        m.completedAt ? format(parseISO(m.completedAt.substring(0, 10)), 'dd/MM/yyyy') : '---',
        String(m.description || '').toUpperCase(),
        m.type === 'preventive' ? 'PREV' : 'CORR',
        m.status === 'completed' ? 'CONCLUÍDO' : 'PENDENTE',
        `R$ ${(m.cost || 0).toLocaleString('pt-BR')}`
      ]);

      if (maintRows.length > 0) {
        autoTable(doc, {
          startY: curY,
          head: [['Data Concl.', 'Descrição do Serviço', 'Tipo', 'Estado', 'Valor R$']],
          body: maintRows,
          theme: 'grid',
          headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
          styles: { fontSize: 7.5 }
        });
        curY = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.text('Sem lançamentos de manutenção encontrados.', 14, curY);
        curY += 10;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('3. PRÓXIMAS ESCALAS DE VIAGEM', 14, curY);
      doc.line(14, curY + 2, 196, curY + 2);
      curY += 8;

      const tripRows = vTrips.slice(0, 5).map((t: any) => [
        t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '---',
        String(t.title || t.route || '').toUpperCase(),
        String(t.driverName || 'OUTRO').toUpperCase(),
        String(t.status || 'CONCLUÍDO').toUpperCase()
      ]);

      if (tripRows.length > 0) {
        autoTable(doc, {
          startY: curY,
          head: [['Data Viagem', 'Roteiro de Escala', 'Motorista Alocado', 'Estado']],
          body: tripRows,
          theme: 'grid',
          headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
          styles: { fontSize: 7.5 }
        });
      } else {
        doc.setFontSize(8.5);
        doc.setTextColor(40, 40, 40);
        doc.text('Sem escalas de viagens vinculadas a essa placa.', 14, curY);
      }

      doc.save(`DOSSIE_VEICULO_${vehicle.plate.toUpperCase()}.pdf`);
      toast.success('Dossiê do veículo exportado em PDF.');
    } catch {
      toast.error('Ocorreu um erro ao emitir o dossiê do veículo.');
    }
  };

  // ==========================================
  // UNIFIED EMPLOYEE/DRIVER CONSOLIDATED PANORAMIC DOSSIER
  // ==========================================
  const selectedDriverData = useMemo(() => {
    if (activeTab !== 'driver' || !selectedEmployeeId) return null;
    const e = employees.find(emp => emp.id === selectedEmployeeId);
    if (!e) return null;

    // Journeys
    const driverJourneys = (journeys || [])
      .filter(j => j.employeeId === selectedEmployeeId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Trips
    const driverTrips = (trips || []).filter(t => t.driverId === selectedEmployeeId);

    // Fueling logs matching driverId
    const driverFuel = (fuelLogs || []).filter(l => l.driverId === selectedEmployeeId);
    const totalFuelLiters = driverFuel.reduce((sum, l) => sum + Number(l.quantity || 0), 0);
    const totalFuelCost = driverFuel.reduce((sum, l) => sum + Number(l.cost || 0), 0);

    return {
      employee: e,
      driverJourneys,
      driverTrips,
      driverFuel,
      totalFuelLiters,
      totalFuelCost
    };
  }, [activeTab, selectedEmployeeId, employees, journeys, trips, fuelLogs]);

  // Export driver dossier to PDF format
  const exportDriverDossierPDF = () => {
    if (!selectedDriverData) return;
    const { employee, driverJourneys, driverTrips, driverFuel, totalFuelLiters } = selectedDriverData;
    try {
      const doc = new jsPDF() as any;

      // Header Swiss style
      doc.setFillColor(24, 24, 27);
      doc.rect(14, 14, 182, 30, 'F');
      doc.setDrawColor(255, 107, 0);
      doc.setLineWidth(0.5);
      doc.rect(14, 14, 182, 30, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('DM TURISMO - DOSSIÊ DO COLABORADOR', 20, 26);
      doc.setFontSize(8.5);
      doc.setTextColor(255, 107, 0);
      doc.text(`COLABORADOR: ${employee.name.toUpperCase()} — CARGO: ${employee.role.toUpperCase()}`, 20, 34);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(7);
      doc.text(`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 148, 23);
      doc.text(`CNH: ${employee.licenseCategory || 'N/A'}`, 148, 29);
      doc.text(`CNH Venc.: ${employee.licenseExpiration ? format(parseISO(employee.licenseExpiration), 'dd/MM/yyyy') : 'N/A'}`, 148, 35);

      let curY = 54;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(24, 24, 27);
      doc.text('1. HISTÓRICO RECENTE DO CARTÃO PONTO', 14, curY);
      doc.setDrawColor(220, 220, 220);
      doc.line(14, curY + 2, 196, curY + 2);
      curY += 8;

      const journeyRows = driverJourneys.slice(0, 10).map((j: any) => [
        j.date ? format(parseISO(j.date), 'dd/MM/yyyy') : '---',
        j.startTime || '---',
        j.lunchStart ? `${j.lunchStart} - ${j.lunchEnd}` : '---',
        j.endTime || '---',
        String(j.entryType || 'NORMAL').toUpperCase(),
        String(j.justification || '').toUpperCase()
      ]);

      if (journeyRows.length > 0) {
        autoTable(doc, {
          startY: curY,
          head: [['Data', 'Início', 'Almoço', 'Fim', 'Tipo de Registro', 'Justificativa']],
          body: journeyRows,
          theme: 'grid',
          headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
          styles: { fontSize: 7 }
        });
        curY = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(8.5);
        doc.text('Sem frequências de ponto no histórico.', 14, curY);
        curY += 10;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. ESCALAS DE VIAGENS ATRIBUÍDAS', 14, curY);
      doc.line(14, curY + 2, 196, curY + 2);
      curY += 8;

      const tripsRows = driverTrips.slice(0, 10).map((t: any) => {
        const v = vehicles.find(veh => veh.id === t.vehicleId);
        return [
          t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '---',
          String(t.title || t.route || '').toUpperCase(),
          v?.plate || '---',
          String(t.status || '').toUpperCase()
        ];
      });

      if (tripsRows.length > 0) {
        autoTable(doc, {
          startY: curY,
          head: [['Data Viagem', 'Itinerário / Descrição', 'Placa Veículo', 'Status']],
          body: tripsRows,
          theme: 'grid',
          headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
          styles: { fontSize: 7 }
        });
        curY = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(8.5);
        doc.text('Sem registro de escalas de viagens para este motorista.', 14, curY);
        curY += 10;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. CONTROLE DE ABASTECIMENTOS POR OPERADOR', 14, curY);
      doc.line(14, curY + 2, 196, curY + 2);
      curY += 8;

      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);
      doc.text(`- Volume abastecido acumulado sob este operador: ${totalFuelLiters.toFixed(1)} Litros em ${driverFuel.length} abastecimentos.`, 14, curY);

      doc.save(`DOSSIE_COLABORADOR_${employee.name.toUpperCase().replace(/\s+/g, '_')}.pdf`);
      toast.success('Dossiê do colaborador exportado em PDF.');
    } catch {
      toast.error('Erro na exportação da ficha consolidada do funcionário.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Gestão e Relatórios Consolidados</h1>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
          Painel central de emissão. Módulos operacionais, dossiês de frota e pronturário técnico de motoristas.
        </p>
      </div>

      {/* DASHBOARD TABS */}
      <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl max-w-lg">
        <button
          onClick={() => setActiveTab('modules')}
          className={cn(
            "flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer",
            activeTab === 'modules' ? "bg-brand-accent text-zinc-950 font-black shadow-md" : "text-zinc-500 hover:text-white"
          )}
        >
          📊 Por Módulo
        </button>
        <button
          onClick={() => {
            setActiveTab('vehicle');
            if (vehicles.length > 0 && !selectedVehicleId) setSelectedVehicleId(vehicles[0].id);
          }}
          className={cn(
            "flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer",
            activeTab === 'vehicle' ? "bg-brand-accent text-zinc-950 font-black shadow-md" : "text-zinc-500 hover:text-white"
          )}
        >
          🚍 Foco Veículo
        </button>
        <button
          onClick={() => {
            setActiveTab('driver');
            if (employees.length > 0 && !selectedEmployeeId) setSelectedEmployeeId(employees[0].id);
          }}
          className={cn(
            "flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl cursor-pointer",
            activeTab === 'driver' ? "bg-brand-accent text-zinc-950 font-black shadow-md" : "text-zinc-500 hover:text-white"
          )}
        >
          👤 Foco Motorista
        </button>
      </div>

      {/* TAB 1: MODULAR REPORTS WITH ADVANCED FILTERS */}
      {activeTab === 'modules' && (
        <div className="space-y-8">
          {/* QUICK SHORTCUTS ATALHOS */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="text-brand-accent" size={13} /> Seleção de Filtro por Categoria de Serviço
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {reportShortcuts.map((sh) => {
                const Icon = sh.icon;
                const isSelected = selectedCategory === sh.id;
                return (
                  <button
                    key={sh.id}
                    onClick={() => {
                      setSelectedCategory(sh.id);
                      toast.info(`Relatório Ajustado para: ${sh.label}`);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 border rounded-xl text-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-brand-accent/[0.04] border-brand-accent text-brand-accent"
                        : "bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                    )}
                  >
                    <Icon size={16} className="mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-tight">{sh.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ADVANCED MULTIPURPOSE FILTER BOARD */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
              <div className="flex items-center gap-2">
                <Filter className="text-brand-accent" size={16} />
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  Configuração de Relatório: {currentCategoryLabel}
                </h2>
              </div>
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setReportFormat('summarized')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    reportFormat === 'summarized' ? "bg-brand-accent text-zinc-950" : "text-zinc-500 hover:text-white"
                  )}
                >
                  📊 Simples (Geral)
                </button>
                <button
                  onClick={() => setReportFormat('detailed')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    reportFormat === 'detailed' ? "bg-brand-accent text-zinc-950" : "text-zinc-500 hover:text-white"
                  )}
                >
                  📝 Completo (Detalhado)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white text-[11px] p-2.5 rounded-xl uppercase outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                  Data de Término
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white text-[11px] p-2.5 rounded-xl uppercase outline-none focus:border-brand-accent"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                  Filtrar por Veículo (Placa)
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white text-[11px] p-2.5 rounded-xl uppercase outline-none focus:border-brand-accent"
                >
                  <option value="">TODOS OS VEÍCULOS</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                  Filtrar por Colaborador
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white text-[11px] p-2.5 rounded-xl uppercase outline-none focus:border-brand-accent"
                >
                  <option value="">TODOS OS COLABORADORES</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SECTOR SEARCH & COLUMN TOGGLE SELECTION */}
            {reportFormat === 'detailed' && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-3">
                <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest block">Selecione as colunas desejadas para visualização & exportações:</span>
                <div className="flex flex-wrap gap-2">
                  {((categoryColumns as any)[selectedCategory] || []).map((col: any) => {
                    const isChecked = (columnSelection[selectedCategory] || []).includes(col.id);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => toggleColumn(selectedCategory, col.id)}
                        className={cn(
                          "px-2.5 py-1.5 border text-[9px] uppercase font-black tracking-tight rounded-lg transition-all cursor-pointer",
                          isChecked 
                            ? "bg-brand-accent text-zinc-950 border-brand-accent" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-650"
                        )}
                      >
                        {col.label} {isChecked ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-zinc-800 pt-4">
              <input
                type="text"
                placeholder="BUSCA DENTRO DO CONJUNTO REGULAR DO RELATÓRIO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white uppercase outline-none focus:border-brand-accent"
              />
              <div className="flex gap-2">
                <button
                  onClick={triggerPDFExport}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-950 hover:bg-brand-accent hover:text-zinc-950 rounded-xl text-[10px] font-black text-brand-accent uppercase border border-brand-accent/20 transition-all cursor-pointer"
                >
                  <FileText size={14} /> Exportar PDF
                </button>
                <button
                  onClick={triggerExcelExport}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-950 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black text-emerald-500 uppercase border border-emerald-500/20 transition-all cursor-pointer"
                >
                  <TableIcon size={14} /> Exportar Excel
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC PRESENTATION: SIMPLES (KPI CARDS) VS COMPLETO (ANALYTICS GRAPHS) */}
          {reportFormat === 'summarized' ? (
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Informações Básicas e Gerais Consolidada</h3>
              {renderSummarizedKPIs()}
            </div>
          ) : (
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Painel e Gráficos do Módulo Selecionado</h3>
              {renderDetailedCharts()}
            </div>
          )}

          {/* PREVIEW TABLE */}
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ficha de Pré-Visualização (Limite 8 registros)</h3>
            {filteredDataRows.length === 0 ? (
              <p className="text-[10px] text-zinc-650 font-black uppercase text-center py-6">Nenhum lançamento no período filtrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 font-extrabold uppercase">
                      {(() => {
                        const cols = (categoryColumns as any)[selectedCategory] || [];
                        const checked = columnSelection[selectedCategory] || [];
                        const active = reportFormat === 'detailed' ? cols.filter((c: any) => checked.includes(c.id)) : cols;
                        return active.map((c: any) => (
                          <th key={c.id} className="p-2.5 tracking-lighter">{c.label}</th>
                        ));
                      })()}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {filteredDataRows.slice(0, 8).map((row, rIdx) => {
                      const cols = (categoryColumns as any)[selectedCategory] || [];
                      const checked = columnSelection[selectedCategory] || [];
                      const active = reportFormat === 'detailed' ? cols.filter((c: any) => checked.includes(c.id)) : cols;
                      return (
                        <tr key={row.id || rIdx} className="hover:bg-zinc-950/20">
                          {active.map((col: any) => (
                            <td key={col.id} className="p-2.5 font-bold uppercase text-zinc-300">{col.getValue(row, rIdx)}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPLETE VEHICLE DOSSIER */}
      {activeTab === 'vehicle' && (
        <div className="space-y-8">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div>
                <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest block">Consolidador Técnico Crítico</span>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Gerador de Relatórios por Veículo (Frotas)</h3>
              </div>
              <div className="flex gap-4">
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-white text-[11px] p-2.5 rounded-xl uppercase outline-none focus:border-brand-accent max-w-sm"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                  ))}
                </select>
                {selectedVehicleData && (
                  <button
                    onClick={exportVehicleDossierPDF}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-accent text-zinc-950 hover:bg-brand-accent/80 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <FileText size={14} /> Exportar Dossiê PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          {selectedVehicleData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* VEHICLE METRIC OVERVIEWS */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* GENERAL CARD */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Ficha Cadastral</span>
                    <span className={cn(
                      "px-2.5 py-1 text-[8px] font-black rounded-lg uppercase",
                      selectedVehicleData.vehicle.status === 'available' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                    )}>
                      {selectedVehicleData.vehicle.status === 'available' ? 'OPERACIONAL' : 'RECOLHIDO'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-black text-white tracking-tighter">{selectedVehicleData.vehicle.plate.toUpperCase()}</p>
                    <p className="text-zinc-400 text-xs font-black uppercase">{selectedVehicleData.vehicle.brand} {selectedVehicleData.vehicle.model}</p>
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                        <span className="text-[7.5px] text-zinc-500 uppercase font-black block">Fabricação / Ano</span>
                        <span className="text-xs text-white font-black">{selectedVehicleData.vehicle.factoryYear || '---'}</span>
                      </div>
                      <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                        <span className="text-[7.5px] text-zinc-500 uppercase font-black block">Lotação Autorizada</span>
                        <span className="text-xs text-white font-black">{selectedVehicleData.vehicle.capacity || '45'} Pass.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FUEL CRITICAL KPIS */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block border-b border-zinc-800 pb-2">Combustível e Consumo</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-black block">Volume Diesel</span>
                      <span className="text-md font-black text-white">{selectedVehicleData.totalLiters.toFixed(1)} L</span>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-black block">Total Inv. Comb.</span>
                      <span className="text-md font-black text-brand-accent">R$ {selectedVehicleData.totalSpentFuel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-black block">Média Consumo</span>
                      <span className="text-md font-black text-white">{selectedVehicleData.averageKML ? `${selectedVehicleData.averageKML.toFixed(2)} KM/L` : 'S/DADOS'}</span>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-black block">Arla 32 Gasto</span>
                      <span className="text-md font-black text-cyan-400">{selectedVehicleData.totalArla.toFixed(1)} L</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VENCIMENTOS & HISTORIC TABLES */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* DOCUMENTS ALERT BOARD */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block">Status de Licenças & Prontuário de Vencimentos</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'CRLV Anual', date: selectedVehicleData.vehicle.licenseExpiration },
                      { label: 'Turismo', date: selectedVehicleData.vehicle.tourismLicenseExpiration },
                      { label: 'ANTT Nacional', date: selectedVehicleData.vehicle.anttExpiration },
                      { label: 'CADASTUR', date: selectedVehicleData.vehicle.cadasturExpiration },
                      { label: 'DETRO/ARTESP', date: selectedVehicleData.vehicle.detroArtespExpiration },
                      { label: 'Municipal', date: selectedVehicleData.vehicle.municipalLicenseExpiration },
                      { label: 'Tacógrafo', date: selectedVehicleData.vehicle.tacografoExpiration },
                      { label: 'Seguro Frota', date: selectedVehicleData.vehicle.insuranceExpiration }
                    ].map((doc, idx) => {
                      const expired = doc.date ? isBefore(parseISO(doc.date), new Date()) : false;
                      const warnings = doc.date ? !expired && isBefore(parseISO(doc.date), addDays(new Date(), 30)) : false;
                      return (
                        <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex flex-col justify-between h-20">
                          <span className="text-[8px] text-zinc-400 font-extrabold uppercase">{doc.label}</span>
                          <span className="text-[9.5px] text-white font-black">{doc.date ? format(parseISO(doc.date), 'dd/MM/yyyy') : 'N/A'}</span>
                          <span className={cn(
                            "text-[7px] font-black uppercase mt-1",
                            expired ? "text-red-500" : warnings ? "text-amber-500" : "text-emerald-500"
                          )}>
                            {expired ? '🚨 Expirado' : warnings ? '⚠ Vence em 30d' : '✔ Regular'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MAINTENANCE BOARD */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">Histórico de Ordens de Oficina</span>
                    <span className="text-[8px] text-zinc-500 font-black">Investido total: R$ {selectedVehicleData.totalSpentMaint.toLocaleString('pt-BR')}</span>
                  </div>
                  {selectedVehicleData.vMaint.length === 0 ? (
                    <p className="text-[9.5px] text-zinc-650 uppercase font-black py-4 text-center">Nenhuma manutenção encontrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedVehicleData.vMaint.slice(-3).reverse().map((m: any) => (
                        <div key={m.id} className="flex justify-between items-center text-[10px] uppercase font-black bg-zinc-950 border border-zinc-850 p-3 rounded-xl">
                          <div className="flex gap-2.5 items-center">
                            <span className={m.type === 'preventive' ? "text-blue-400" : "text-purple-400"}>[{m.type === 'preventive' ? 'Prev' : 'Corr'}]</span>
                            <span className="text-white">{m.description}</span>
                          </div>
                          <span className="text-zinc-400">R$ {(m.cost || 0).toLocaleString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* TRIP REGISTERS */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block border-b border-zinc-800 pb-2">Próximos Itinerários Alocados</span>
                  {selectedVehicleData.vTrips.length === 0 ? (
                    <p className="text-[9.5px] text-zinc-650 uppercase font-black py-4 text-center">Nenhuma escala de fretamento / viagem.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedVehicleData.vTrips.slice(-3).reverse().map((t: any) => (
                        <div key={t.id} className="flex justify-between items-center text-[10px] uppercase font-black bg-zinc-950 border border-zinc-850 p-3 rounded-xl">
                          <div>
                            <p className="text-white">{t.title || t.route}</p>
                            <p className="text-[8px] text-zinc-500 mt-0.5">Executor: {t.driverName}</p>
                          </div>
                          <span className="text-brand-accent">{t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '---'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-zinc-600 text-xs uppercase font-black">
              Nenhum veículo selecionado para cruzamento de dados.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETE EMPLOYEE / DRIVER DOSSIER */}
      {activeTab === 'driver' && (
        <div className="space-y-8">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div>
                <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest block">Prontuário de Motoristas e Equipe</span>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Perfil Analítico de Equipe & Controle de Ponto</h3>
              </div>
              <div className="flex gap-4">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-white text-[11px] p-2.5 rounded-xl uppercase outline-none focus:border-brand-accent max-w-sm"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
                {selectedDriverData && (
                  <button
                    onClick={exportDriverDossierPDF}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-accent text-zinc-950 hover:bg-brand-accent/80 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <FileText size={14} /> Exportar Ficha PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          {selectedDriverData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* MEMBER SPECIFIC INFO SECTION */}
              <div className="lg:col-span-1 space-y-6">
                
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block border-b border-zinc-800 pb-2">Qualificação Técnica</span>
                  <div className="space-y-2">
                    <p className="text-xl font-black text-white tracking-tighter">{selectedDriverData.employee.name.toUpperCase()}</p>
                    <p className="text-zinc-500 text-xs font-black uppercase">{selectedDriverData.employee.role}</p>

                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                        <span className="text-[7.5px] text-zinc-500 uppercase font-black block">Habilitação</span>
                        <span className="text-xs text-white font-black">{selectedDriverData.employee.licenseCategory || '---'}</span>
                      </div>
                      <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                        <span className="text-[7.5px] text-zinc-500 uppercase font-black block">CNH Vencimentos</span>
                        <span className="text-xs text-white font-black">
                          {selectedDriverData.employee.licenseExpiration ? format(parseISO(selectedDriverData.employee.licenseExpiration), 'dd/MM/yyyy') : 'N/C'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block border-b border-zinc-800 pb-2">Parâmetros de Condução</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-black block">Volume Abastecido</span>
                      <span className="text-md font-black text-white">{selectedDriverData.totalFuelLiters.toFixed(1)} L</span>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-black block">Custo Acumulado</span>
                      <span className="text-md font-black text-emerald-400">R$ {selectedDriverData.totalFuelCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* PONTO CARD HISTORIC AND SCALES ROWS */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* CARTÃO PONTO COMPACT SHEET */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block border-b border-zinc-800 pb-2">Frequências e Lançamento de Ponto Recentes</span>
                  {selectedDriverData.driverJourneys.length === 0 ? (
                    <p className="text-[9.5px] text-zinc-650 uppercase font-black py-4 text-center">Nenhum registro de entrada ou saída no ponto.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[9px] border-collapse">
                        <thead>
                          <tr className="text-zinc-500 font-extrabold uppercase border-b border-zinc-850">
                            <th className="p-2">Data</th>
                            <th className="p-2">Entrada</th>
                            <th className="p-2">Almoço</th>
                            <th className="p-2">Saída</th>
                            <th className="p-2">Espécie</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 font-black">
                          {selectedDriverData.driverJourneys.slice(-5).reverse().map((j: any, idx: number) => (
                            <tr key={j.id || idx} className="hover:bg-zinc-950/20 text-zinc-300">
                              <td className="p-2">{j.date ? format(parseISO(j.date), 'dd/MM/yyyy') : '---'}</td>
                              <td className="p-2 text-white">{j.startTime || '---'}</td>
                              <td className="p-2">{j.lunchStart ? `${j.lunchStart} - ${j.lunchEnd}` : '---'}</td>
                              <td className="p-2 text-white">{j.endTime || '---'}</td>
                              <td className="p-2 text-zinc-500">{String(j.entryType || 'NORMAL').toUpperCase()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* TRIP DRIVER HISTORY METRIC */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block border-b border-zinc-800 pb-2">Escalas sob a Direção deste Motorista</span>
                  {selectedDriverData.driverTrips.length === 0 ? (
                    <p className="text-[9.5px] text-zinc-650 uppercase font-black py-4 text-center">Nenhuma viagem em andamento ou escala histórica vinculada.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDriverData.driverTrips.slice(-3).reverse().map((t: any) => (
                        <div key={t.id} className="flex justify-between items-center text-[10px] uppercase font-black bg-zinc-950 border border-zinc-850 p-3 rounded-xl">
                          <div>
                            <p className="text-white">{t.title || t.route}</p>
                            <p className="text-[8px] text-zinc-500 mt-0.5">Executado na data: {t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '---'}</p>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 text-[8px] rounded-lg",
                            t.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
                          )}>
                            {t.status === 'completed' ? 'CONCLUÍDO' : 'EM CURSO'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-zinc-600 text-xs uppercase font-black">
              Por favor, selecione um funcionário no dropdown para exibir.
            </div>
          )}
        </div>
      )}

    </div>
  );
};
