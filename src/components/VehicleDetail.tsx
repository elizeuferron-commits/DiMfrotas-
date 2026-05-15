import React, { useState, useEffect, memo, useMemo } from 'react';
import { 
  Bus, 
  Wrench, 
  Fuel, 
  Calendar, 
  Users, 
  Hash, 
  Edit3,
  Clock,
  Navigation,
  BarChart3,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Printer,
  Share2,
  Trash2
} from 'lucide-react';
import { Vehicle, MaintenanceLog, FuelLog, Checklist, Employee, OperationType } from '../types';
import { format, parseISO, startOfMonth, differenceInDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { Modal, ConfirmModal } from './UI';
import { ChecklistForm } from './ChecklistDrawer';
import { collection, addDoc, onSnapshot, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area
} from 'recharts';

interface VehicleDetailProps {
  vehicle: Vehicle;
  maintenanceHistory: MaintenanceLog[];
  fuelHistory: FuelLog[];
  employees: Employee[];
  onEdit: () => void;
  onPrintOS: (log: MaintenanceLog) => void;
  onDelete?: () => void;
}

export const VehicleDetail = memo(({ vehicle, maintenanceHistory, fuelHistory, employees, onEdit, onPrintOS, onDelete }: VehicleDetailProps) => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'fuel' | 'charts' | 'checklists'>('checklists');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string, type: 'vehicle' | 'fuel' | 'maintenance' | 'checklist'}>({
    isOpen: false,
    id: '',
    type: 'fuel'
  });

  useEffect(() => {
    const q = query(
      collection(db, 'checklists'),
      where('vehicleId', '==', vehicle.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Checklist[];
      setChecklists(data);
    });

    return () => unsubscribe();
  }, [vehicle.id]);

  const processDelete = async () => {
    const { id, type } = deleteConfirm;
    try {
      if (type === 'vehicle') {
        onDelete?.();
      } else if (type === 'fuel') {
        await deleteDoc(doc(db, 'fuel_logs', id));
        toast.success('Abastecimento removido.');
      } else if (type === 'maintenance') {
        await deleteDoc(doc(db, 'maintenance_history', id));
        toast.success('Manutenção removida.');
      } else if (type === 'checklist') {
        await deleteDoc(doc(db, 'checklists', id));
        toast.success('Checklist removido.');
      }
    } catch (error) {
      toast.error('Erro ao excluir item.');
    } finally {
      setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleDeleteChecklist = (id: string) => {
    setDeleteConfirm({ isOpen: true, id, type: 'checklist' });
  };

  const handleChecklistSubmit = async (data: any) => {
    setIsSubmiting(true);
    try {
      await addDoc(collection(db, 'checklists'), {
        ...data,
        vehicleId: vehicle.id
      });
      toast.success('Checklist realizado com sucesso!');
      setIsChecklistModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar checklist.');
    } finally {
      setIsSubmiting(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Veículo DM Turismo: ${vehicle.plate}`,
      text: `Veículo: ${vehicle.plate}\nModelo: ${vehicle.model}\nKM: ${vehicle.currentOdometer.toLocaleString()}\nStatus: ${vehicle.status === 'available' ? 'Operacional' : 'Em Manutenção'}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
          toast.error('Erro ao compartilhar veículo.');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text}\nLink: ${shareData.url}`);
        toast.success('Detalhes copiados para a área de transferência!');
      } catch (err) {
        toast.error('Erro ao copiar dados do veículo.');
      }
    }
  };

  const vehicleMaintenance = maintenanceHistory
    .filter(m => m.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

  const vehicleFuel = fuelHistory
    .filter(f => f.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Alerts logic
  const alerts = useMemo(() => {
    const list = [];
    const today = new Date();
    const KM_THRESHOLD = 500;
    const DAYS_THRESHOLD = 30;

    // Docs
    const docItems = [
      { id: 'license', label: 'Licenciamento', date: vehicle.licenseExpiration },
      { id: 'tourism', label: 'ANTT/Turismo', date: vehicle.tourismLicenseExpiration },
      { id: 'insurance', label: 'Seguro APP', date: vehicle.insuranceExpiration },
    ];

    docItems.forEach(doc => {
      if (!doc.date) return;
      const expDate = parseISO(doc.date);
      const daysLeft = differenceInDays(expDate, today);
      
      if (daysLeft <= 0) {
        list.push({ type: 'critical', message: `${doc.label} VENCIDO`, sub: `Venceu em ${format(expDate, 'dd/MM/yyyy')}` });
      } else if (daysLeft <= DAYS_THRESHOLD) {
        list.push({ type: 'warning', message: `${doc.label} PRÓXIMO DO VENCIMENTO`, sub: `Vence em ${daysLeft} dias (${format(expDate, 'dd/MM/yyyy')})` });
      }
    });

    // Maintenance by KM
    if (vehicle.nextOilChangeKM) {
      const kmRemaining = vehicle.nextOilChangeKM - vehicle.currentOdometer;
      if (kmRemaining <= 0) {
        list.push({ type: 'critical', message: 'TROCA DE ÓLEO VENCIDA', sub: `Atraso de ${Math.abs(kmRemaining)} KM` });
      } else if (kmRemaining <= KM_THRESHOLD) {
        list.push({ type: 'warning', message: 'TROCA DE ÓLEO PRÓXIMA', sub: `Faltam ${kmRemaining} KM` });
      }
    }

    // Maintenance by Date
    if (vehicle.nextPreventiveMaintenanceDate) {
      const maintDate = parseISO(vehicle.nextPreventiveMaintenanceDate);
      const daysLeft = differenceInDays(maintDate, today);

      if (daysLeft <= 0) {
        list.push({ type: 'critical', message: 'MANUTENÇÃO PREVENTIVA ATRASADA', sub: `Deveria ter ocorrido em ${format(maintDate, 'dd/MM/yyyy')}` });
      } else if (daysLeft <= 15) {
        list.push({ type: 'warning', message: 'MANUTENÇÃO PREVENTIVA PRÓXIMA', sub: `Agendada para ${format(maintDate, 'dd/MM/yyyy')}` });
      }
    }

    return list;
  }, [vehicle]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertCircle size={14} />
            Alertas de Segurança e Vencimentos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert, i) => (
              <div key={i} className={cn(
                "p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.01]",
                alert.type === 'critical' 
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                  : "bg-amber-500/10 border-amber-500/30 text-amber-500"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  alert.type === 'critical' ? "bg-rose-500 text-white" : "bg-amber-500 text-zinc-950"
                )}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight">{alert.message}</p>
                  <p className="text-[10px] font-bold opacity-70 uppercase mt-0.5">{alert.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center border border-zinc-700 shadow-2xl">
            <Bus className="text-brand-accent" size={36} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter tabular-nums">{vehicle.plate}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                vehicle.status === 'available' 
                  ? "bg-emerald-950/30 text-emerald-500 border-emerald-900/40" 
                  : "bg-amber-950/30 text-amber-500 border-amber-900/40"
              )}>
                {vehicle.status === 'available' ? 'Operacional' : 'Em Manutenção'}
              </span>
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{vehicle.model}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-zinc-700 hover:border-zinc-500"
          >
            <Share2 size={16} />
            Compartilhar
          </button>
          <button 
            onClick={onEdit}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-zinc-700 hover:border-zinc-500"
          >
            <Edit3 size={16} />
            Editar Cadastro
          </button>
          {onDelete && (
            <button 
              onClick={() => setDeleteConfirm({ isOpen: true, id: vehicle.id, type: 'vehicle' })}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-rose-500/30 shadow-xl"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Capacidade', value: `${vehicle.capacity} PAX`, icon: Users },
          { label: 'Km Atual', value: `${vehicle.currentOdometer.toLocaleString()} KM`, icon: Navigation },
          { label: 'Ano Fab.', value: vehicle.factoryYear, icon: Calendar },
          { label: 'Tipo', value: vehicle.type === 'van' ? 'VAN' : 'ÔNIBUS', icon: Hash },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <stat.icon size={16} className="text-zinc-600 mb-2" />
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-sm font-black text-white tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Documentação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
           <div className="flex items-center gap-4 mb-4">
            <Calendar size={18} className="text-zinc-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Licenciamento</h3>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data</span>
            <span className="text-sm font-black text-white">{vehicle.licenseExpiration ? format(parseISO(vehicle.licenseExpiration), 'dd/MM/yyyy') : '---'}</span>
          </div>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <Calendar size={18} className="text-zinc-500" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Turismo</h3>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Venc. ANTT</span>
            <span className="text-sm font-black text-white">{vehicle.tourismLicenseExpiration ? format(parseISO(vehicle.tourismLicenseExpiration), 'dd/MM/yyyy') : '---'}</span>
          </div>
        </div>
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <Calendar size={18} className="text-zinc-500" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Seguro Viagem</h3>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">APP</span>
            <span className="text-sm font-black text-white">{vehicle.insuranceExpiration ? format(parseISO(vehicle.insuranceExpiration), 'dd/MM/yyyy') : '---'}</span>
          </div>
        </div>
      </div>

      {/* Histórico de Abastecimento - New Section */}
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Histórico de Abastecimento</h3>
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1">Detalhamento de consumo e custos por viagem</p>
          </div>
          <Fuel className="text-brand-accent/30" size={32} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data / Hora</th>
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Motorista</th>
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Qtd. (L)</th>
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Custo (R$)</th>
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Odômetro (KM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {vehicleFuel.length > 0 ? vehicleFuel.map(f => (
                <tr key={f.id} className="group hover:bg-zinc-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-400 tabular-nums">
                        {format(parseISO(f.timestamp), 'dd/MM/yyyy HH:mm')}
                      </span>
                      {f.isExternal && (
                        <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter mt-0.5">
                          Externo: {f.location}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-[10px] font-black text-white uppercase">
                    {employees.find(e => e.id === f.driverId)?.name || '---'}
                  </td>
                  <td className="py-4 text-[10px] font-black text-brand-accent tabular-nums text-right">
                    {f.quantity.toLocaleString()}
                  </td>
                  <td className="py-4 text-[10px] font-black text-white tabular-nums text-right">
                    R$ {f.cost.toLocaleString()}
                  </td>
                  <td className="py-4 text-[10px] font-black text-zinc-300 tabular-nums text-right">
                    {f.odometer.toLocaleString()}
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <button 
                      onClick={() => setDeleteConfirm({ isOpen: true, id: f.id, type: 'fuel' })}
                      className="p-2 text-zinc-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                    Nenhum abastecimento registrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Tabs */}
      <div className="space-y-6">
        <div className="flex items-center p-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'maintenance' ? "bg-zinc-800 text-brand-accent shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Wrench size={14} />
            Manutenção
          </button>
          <button 
            onClick={() => setActiveTab('checklists')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'checklists' ? "bg-zinc-800 text-brand-accent shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <ClipboardCheck size={14} />
            Checklist
          </button>
          <button 
            onClick={() => setActiveTab('charts')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'charts' ? "bg-zinc-800 text-brand-accent shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <BarChart3 size={14} />
            Desempenho
          </button>
        </div>

        <div className="min-h-[350px]">
          {activeTab === 'maintenance' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Histórico de Oficina</h3>
                <span className="text-[10px] font-black text-zinc-600 uppercase">{vehicleMaintenance.length} Registros</span>
              </div>
              <div className="space-y-3">
                {vehicleMaintenance.length > 0 ? vehicleMaintenance.map(m => (
                  <div key={m.id} className="p-4 bg-zinc-800/30 border border-zinc-800/50 rounded-xl flex justify-between items-center hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-600">
                        <Wrench size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">{m.description}</p>
                        <p className="text-[9px] text-zinc-500 font-black uppercase mt-1">{format(parseISO(m.scheduledDate), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-black text-brand-accent tabular-nums">R$ {m.cost.toLocaleString()}</p>
                        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Custo Total</span>
                      </div>
                      <button 
                        onClick={() => {
                          // Here I need access to handlePrintOS, but it's in App.tsx. 
                          // I'll pass it down as a prop.
                          onPrintOS?.(m);
                        }}
                        className="p-2 bg-zinc-800 hover:bg-white hover:text-zinc-950 text-zinc-500 rounded-lg transition-all"
                        title="Imprimir OS"
                      >
                        <Printer size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm({ isOpen: true, id: m.id, type: 'maintenance' })}
                        className="p-2 bg-zinc-800 hover:bg-rose-500 hover:text-white text-zinc-500 rounded-lg transition-all"
                        title="Excluir Registro"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center bg-zinc-950 rounded-2xl border border-dashed border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sem manutenções registradas</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'checklists' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Checklists Operacionais</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Vistorias periódicas realizadas</p>
                </div>
                <button 
                  onClick={() => setIsChecklistModalOpen(true)}
                  className="px-4 py-2 bg-brand-accent text-zinc-950 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Nova Vistoria
                </button>
              </div>

              <div className="space-y-3">
                {checklists.length > 0 ? checklists.map(c => (
                  <div key={c.id} className="p-5 bg-zinc-800/30 border border-zinc-800/50 rounded-2xl flex justify-between items-center group hover:bg-zinc-800/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-600">
                        <ClipboardCheck size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-white uppercase">{c.responsible}</span>
                      <p className="text-[9px] text-zinc-500 font-black uppercase mt-1">{format(parseISO(c.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-black text-white tabular-nums">{c.odometer.toLocaleString()} KM</p>
                      <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Odômetro</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {c.items.filter(i => i.status === 'issue').length > 0 ? (
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 border border-rose-500/30" title="Avarias encontradas">
                          <AlertCircle size={12} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/30" title="Tudo OK">
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ isOpen: true, id: c.id, type: 'checklist' });
                        }}
                        className="p-2 text-zinc-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir Checklist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                )) : (
                  <div className="p-16 text-center bg-zinc-950 rounded-3xl border border-dashed border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nenhuma vistoria realizada neste veículo</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Consumo Mensal de Diesel</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Análise de volume por período</p>
                </div>
              </div>
              
              <div className="h-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={
                      // Group fuel by month
                      Object.values(vehicleFuel.reduce((acc: any, log) => {
                        if (!log.timestamp) return acc;
                        const month = format(parseISO(log.timestamp), 'MMM', { locale: ptBR });
                        if (!acc[month]) acc[month] = { name: month, volume: 0 };
                        acc[month].volume += log.quantity;
                        return acc;
                      }, {}))
                    }>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} />
                    <Tooltip 
                      contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Bar dataKey="volume" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Relação Litros x Odômetro</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Análise de volume por quilometragem</p>
                </div>
              </div>

              <div className="h-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis 
                      type="number" 
                      dataKey="odometer" 
                      name="Odômetro" 
                      unit="km" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#71717a' }} 
                      domain={['auto', 'auto']}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="quantity" 
                      name="Quantidade" 
                      unit="L" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#71717a' }} 
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Scatter name="Abastecimentos" data={vehicleFuel.map(f => ({ ...f, quantity: f.quantity, odometer: f.odometer }))} fill="#f59e0b" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Abastecido</p>
                  <p className="text-xl font-black text-white tabular-nums">
                    {vehicleFuel.reduce((acc, f) => acc + f.quantity, 0).toLocaleString()} <span className="text-xs text-zinc-500">L</span>
                  </p>
                </div>
                <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Média de Abastecimento</p>
                  <p className="text-xl font-black text-white tabular-nums">
                    {vehicleFuel.length > 0 
                      ? Math.round(vehicleFuel.reduce((acc, f) => acc + f.quantity, 0) / vehicleFuel.length) 
                      : 0} <span className="text-xs text-zinc-500">L</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isChecklistModalOpen} 
        onClose={() => setIsChecklistModalOpen(false)}
        title="Checklist Operacional"
      >
        <ChecklistForm 
          onSubmit={handleChecklistSubmit}
          loading={isSubmiting}
        />
      </Modal>

      <ConfirmModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={processDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este item definitivamente? Esta ação não pode ser revertida."
      />
    </div>
  );
});
