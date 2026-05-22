import React, { useState } from 'react';
import { 
  Bus, 
  Calendar, 
  Wrench, 
  Plus, 
  AlertTriangle,
  TrendingUp,
  Droplets,
  Printer,
  Hash,
  CheckCircle,
  FileText,
  Paperclip,
  Zap,
  User,
  Users,
  Phone,
  Star,
  Trash2,
  Edit,
  CheckSquare,
  Square
} from 'lucide-react';
import { FleetList } from './FleetList';
import { Vencimentos } from './Vencimentos';
import { FleetAlerts } from './FleetAlerts';
import { Card, StatCard } from './Cards';
import { cn } from '../lib/utils';
import { Vehicle, MaintenanceLog, Employee, Trip } from '../types';
import { format, parseISO, differenceInDays, isSameWeek, isSameMonth, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttachmentViewer } from './AttachmentViewer';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';

interface UnifiedFleetManagementProps {
  vehicles: Vehicle[];
  maintenance: MaintenanceLog[];
  employees: Employee[];
  trips?: Trip[];
  vehicleVencimentos: any[];
  driverVencimentos: Employee[];
  maintenanceData: any[];
  onAddVehicle: () => void;
  onVehicleClick: (vehicle: Vehicle) => void;
  onAddMaintenance: () => void;
  onPrintOS: (log: MaintenanceLog) => void;
  onPrintBatchOS?: (scope: 'week' | 'month') => void;
  onOpenMaintenanceAttachments?: (log: MaintenanceLog) => void;
}

/**
 * 🌑 COMPONENTE EM MODO SOMBRA
 * Unificação das ferramentas de Frota, Vencimentos e Manutenção.
 */
export const FixedDriversList = ({ employees }: { employees: Employee[] }) => {
  const fixedDrivers = employees.filter(e => e.role === 'Motorista');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fixedDrivers.map(d => (
        <div key={d.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
           {d.photoUrl ? <img src={d.photoUrl} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500"><User /></div>}
           <div>
             <p className="text-sm font-black text-white uppercase">{d.name}</p>
             <p className="text-[10px] text-zinc-500 font-bold uppercase">{d.phone}</p>
           </div>
        </div>
      ))}
    </div>
  );
};

export const DiaristasManager = () => {
  const [diaristas, setDiaristas] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('dm_turismo_diaristas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDiarista, setNewDiarista] = useState({ name: '', phone: '', experience: 1 });
  const [showInviteModal, setShowInviteModal] = useState<any>(null);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [inviteDateTime, setInviteDateTime] = useState('');
  const [inviteDestination, setInviteDestination] = useState('');

  const handleAddDiarista = () => {
    let updated: any[] = [];
    if (editingId) {
      updated = diaristas.map(d => d.id === editingId ? { ...newDiarista, id: editingId } : d);
      setDiaristas(updated);
      setEditingId(null);
      toast.success('Diarista atualizado!');
    } else {
      updated = [...diaristas, { ...newDiarista, id: Date.now().toString() }];
      setDiaristas(updated);
      toast.success('Diarista cadastrado!');
    }
    localStorage.setItem('dm_turismo_diaristas', JSON.stringify(updated));
    setNewDiarista({ name: '', phone: '', experience: 1 });
    setShowForm(false);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = (id: string) => {
    const updated = diaristas.filter(d => d.id !== id);
    setDiaristas(updated);
    localStorage.setItem('dm_turismo_diaristas', JSON.stringify(updated));
    setSelectedIds(prev => prev.filter(i => i !== id));
    toast.success('Diarista excluído!');
  };

  const handleEdit = (d: any) => {
    setEditingId(d.id);
    setNewDiarista({ name: d.name, phone: d.phone, experience: d.experience });
    setShowForm(true);
  };

  const handleSendInvite = () => {
      const driversToInvite = showBulkInviteModal
          ? diaristas.filter(d => selectedIds.includes(d.id))
          : [showInviteModal];

      driversToInvite.forEach(d => {
          const message = `Olá ${d.name}, você foi convidado para um trabalho.\nData/Hora: ${inviteDateTime}\nDestino: ${inviteDestination}`;
          const url = `https://wa.me/${d.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
      });
      toast.success('Convites abertos no WhatsApp!');
      setShowInviteModal(null);
      setShowBulkInviteModal(false);
      setInviteDateTime('');
      setInviteDestination('');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
          <button onClick={() => { setShowForm(true); setEditingId(null); setNewDiarista({ name: '', phone: '', experience: 1 }); }} className="flex items-center gap-2 bg-brand-accent text-zinc-950 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest">
            <Plus size={14} /> Cadastrar Diarista
          </button>
          {selectedIds.length > 0 && (
              <button onClick={() => setShowBulkInviteModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest">
                <Calendar size={14} /> Convidar Selecionados ({selectedIds.length})
              </button>
          )}
      </div>
      
      {showForm && (
        <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4">
          <input placeholder="Nome" value={newDiarista.name} onChange={e => setNewDiarista({...newDiarista, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-white" />
          <input placeholder="WhatsApp" value={newDiarista.phone} onChange={e => setNewDiarista({...newDiarista, phone: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-white" />
          <div className="flex gap-2 text-zinc-500">
             {[1,2,3,4,5].map(star => <Star key={star} onClick={() => setNewDiarista({...newDiarista, experience: star})} className={cn("cursor-pointer", newDiarista.experience >= star ? "text-brand-accent fill-brand-accent" : "")} />)}
          </div>
          <button onClick={handleAddDiarista} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">Salvar</button>
        </div>
      )}

      {diaristas.map(d => (
        <div key={d.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
           <div className="flex items-center gap-4">
               <button onClick={() => handleToggleSelect(d.id)} className="text-zinc-600">
                   {selectedIds.includes(d.id) ? <CheckSquare className="text-brand-accent" /> : <Square />}
               </button>
               <div>
                 <p className="font-black text-white">{d.name}</p>
                 <p className="text-[10px] text-zinc-500">{d.phone} | EXP: {d.experience} estrelas</p>
               </div>
           </div>
           <div className="flex gap-2">
               <button onClick={() => handleEdit(d)} className="bg-zinc-800 text-white p-2 rounded-xl"><Edit size={14} /></button>
               <button onClick={() => handleDelete(d.id)} className="bg-red-900/20 text-red-500 p-2 rounded-xl"><Trash2 size={14} /></button>
               <button onClick={() => setShowInviteModal(d)} className="bg-zinc-800 text-brand-accent px-4 py-2 rounded-xl text-[10px] font-black uppercase">Convite</button>
           </div>
        </div>
      ))}
      
      {(showInviteModal || showBulkInviteModal) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 w-full max-w-sm space-y-4">
            <h3 className="font-black text-white uppercase">
                {showBulkInviteModal ? `Convidar ${selectedIds.length} Diaristas` : `Convidar ${showInviteModal.name}`}
            </h3>
            <input type="datetime-local" value={inviteDateTime} onChange={e => setInviteDateTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-white" />
            <input type="text" placeholder="Destino" value={inviteDestination} onChange={e => setInviteDestination(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-white" />
            <button onClick={handleSendInvite} className="w-full bg-brand-accent text-zinc-950 py-3 rounded-xl font-black uppercase">Enviar Convite</button>
            <button onClick={() => {setShowInviteModal(null); setShowBulkInviteModal(false);}} className="w-full bg-zinc-800 text-white py-3 rounded-xl font-black uppercase">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 🌑 COMPONENTE EM MODO SOMBRA
 * Unificação das ferramentas de Frota, Vencimentos e Manutenção.
 */
export const UnifiedFleetManagement: React.FC<UnifiedFleetManagementProps> = ({
  vehicles,
  maintenance,
  employees,
  trips = [],
  vehicleVencimentos,
  driverVencimentos,
  maintenanceData,
  onAddVehicle,
  onVehicleClick,
  onAddMaintenance,
  onPrintOS,
  onPrintBatchOS,
  onOpenMaintenanceAttachments
}) => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'vencimentos' | 'maintenance' | 'drivers'>('fleet');
  const [driverCategory, setDriverCategory] = useState<'fixo' | 'diarista'>('fixo');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAutoGenerateOS = async (scope: 'week' | 'month') => {
    setIsGenerating(true);
    const today = startOfToday();
    let createdCount = 0;
    const kmThreshold = scope === 'week' ? 1500 : 3000;

    try {
      for (const vehicle of vehicles) {
        const needsMaintenance = [];
        
        // Check by Date
        if (vehicle.nextPreventiveMaintenanceDate) {
          const mDate = parseISO(vehicle.nextPreventiveMaintenanceDate);
          const daysToVenc = differenceInDays(mDate, today);
          const isDateMatch = scope === 'week' 
            ? (daysToVenc <= 7 && daysToVenc >= 0) 
            : isSameMonth(mDate, today);

          if (isDateMatch) {
            needsMaintenance.push(`Preventiva Automática (${scope === 'week' ? 'Próximos 7 dias' : 'Mês'}) (Data: ${format(mDate, 'dd/MM/yyyy')})`);
          }
        }

        // Check by KM (Within requested threshold)
        if (vehicle.nextMaintenanceKM) {
          const kmDiff = vehicle.nextMaintenanceKM - vehicle.currentOdometer;
          if (kmDiff <= kmThreshold) {
            needsMaintenance.push(`Preventiva Automática (< ${kmThreshold}KM) (KM: ${vehicle.nextMaintenanceKM.toLocaleString()})`);
          }
        }

        if (vehicle.nextOilChangeKM) {
          const kmDiff = vehicle.nextOilChangeKM - vehicle.currentOdometer;
          const oilThreshold = scope === 'week' ? 1500 : kmThreshold;
          if (kmDiff <= oilThreshold) {
            needsMaintenance.push(`Troca de Óleo Automática (< ${oilThreshold}KM) (KM: ${vehicle.nextOilChangeKM.toLocaleString()})`);
          }
        }

        // Only create if there's no PENDING maintenance for this vehicle already covering this
        const hasPending = maintenance.some(m => m.vehicleId === vehicle.id && m.status === 'pending');

        if (needsMaintenance.length > 0 && !hasPending) {
          await addDoc(collection(db, 'maintenance_logs'), {
            vehicleId: vehicle.id,
            description: needsMaintenance.join(' | '),
            type: 'preventive',
            status: 'pending',
            cost: 0,
            odometer: vehicle.currentOdometer,
            scheduledDate: vehicle.nextPreventiveMaintenanceDate || new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
          createdCount++;
        }
      }

      if (createdCount > 0) {
        toast.success(`${createdCount} Ordens de Serviço geradas automaticamente para o período de ${scope === 'week' ? 'uma semana' : 'um mês'}!`);
      } else {
        toast.info('Nenhuma manutenção pendente identificada para as condições selecionadas.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar ordens automáticas.');
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { id: 'fleet', label: 'Ativos', icon: Bus },
    { id: 'vencimentos', label: 'Documentação', icon: Calendar },
    { id: 'maintenance', label: 'Manutenção', icon: Wrench },
    { id: 'drivers', label: 'Motoristas', icon: Users },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Unificado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-800 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-zinc-900 border border-brand-accent/20 rounded-2xl flex items-center justify-center text-brand-accent">
               <Bus size={24} />
             </div>
             <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Gestão de Frota</h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight">Controle centralizado de ativos, legalização e conservação técnica.</p>
        </div>

        <div className="flex items-center p-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id
                  ? "bg-zinc-800 text-brand-accent shadow-lg" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      <div className="min-h-[600px]">
        {activeTab === 'fleet' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <FleetList 
              vehicles={vehicles}
              onAddVehicle={onAddVehicle}
              onVehicleClick={onVehicleClick}
            />
          </div>
        )}

        {activeTab === 'vencimentos' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <FleetAlerts 
              vehicles={vehicles}
              onVehicleClick={onVehicleClick}
              filter="vencimentos"
            />
            <Vencimentos 
              vehicleVencimentos={vehicleVencimentos}
              driverVencimentos={driverVencimentos}
            />
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex gap-2">
                <button
                  onClick={() => setDriverCategory('fixo')}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                    driverCategory === 'fixo' ? "bg-brand-accent text-zinc-950 shadow-lg" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  FIXOS
                </button>
                <button
                  onClick={() => setDriverCategory('diarista')}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                    driverCategory === 'diarista' ? "bg-brand-accent text-zinc-950 shadow-lg" : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  DIARISTAS
                </button>
             </div>
             {driverCategory === 'fixo' ? (
               <FixedDriversList employees={employees} />
             ) : (
               <DiaristasManager />
             )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800/50">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-brand-accent/10 rounded-xl text-brand-accent">
                   <TrendingUp size={20} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Dashboard Oficina</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight mt-2">Visão consolidada de produtividade e custos.</p>
                 </div>
               </div>
               <div className="flex flex-wrap gap-4">
                  <div className="relative group/print">
                    <button 
                      className="flex items-center gap-4 px-6 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black shadow-xl transition-all active:scale-95 hover:bg-zinc-700"
                      title="Imprimir Relatórios"
                    >
                      <Printer size={16} className="stroke-[3]" />
                      Imprimir
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl invisible group-hover/print:visible opacity-0 group-hover/print:opacity-100 transition-all z-50 p-2">
                       <button 
                         onClick={() => onPrintBatchOS?.('week')}
                         className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-colors"
                       >
                         <Calendar size={14} className="text-emerald-500" />
                         OS da Semana
                       </button>
                       <button 
                         onClick={() => onPrintBatchOS?.('month')}
                         className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-colors"
                       >
                         <Zap size={14} className="text-brand-accent" />
                         OS do Mês
                       </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleAutoGenerateOS('week')}
                    disabled={isGenerating}
                    className="flex items-center gap-4 px-6 py-4 bg-zinc-800 text-emerald-500 rounded-2xl font-black shadow-xl transition-all active:scale-95 hover:bg-emerald-500/10 disabled:opacity-50"
                    title="Gera OS para manutenções da semana ou próximas de 1500km"
                  >
                    <Calendar size={16} className={cn("stroke-[3]", isGenerating && "animate-pulse")} />
                    O.S. Semana
                  </button>
                  <button 
                    onClick={() => handleAutoGenerateOS('month')}
                    disabled={isGenerating}
                    className="flex items-center gap-4 px-6 py-4 bg-zinc-800 text-brand-accent rounded-2xl font-black shadow-xl transition-all active:scale-95 hover:bg-brand-accent/10 disabled:opacity-50"
                    title="Gera OS para manutenções do mês ou próximas de 3000km"
                  >
                    <Zap size={16} className={cn("stroke-[3]", isGenerating && "animate-pulse")} />
                    O.S. Mês
                  </button>
                  <button 
                    onClick={onAddMaintenance}
                    className="flex items-center gap-4 px-8 py-4 bg-brand-accent text-zinc-950 rounded-2xl font-black shadow-xl transition-all active:scale-95 hover:scale-[1.02]"
                  >
                    <Plus size={16} className="stroke-[3]" />
                    Nova O.S.
                  </button>
               </div>
            </div>

            {/* Re-implementing the Maintenance Stats from App.tsx */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Ordens Pendentes" 
                value={maintenance.filter(m => m.status === 'pending').length} 
                icon={Wrench}
                color="amber"
              />
              <StatCard 
                title="Alertas de Manutenção" 
                value={vehicles.filter(v => 
                  (v.nextOilChangeKM && v.nextOilChangeKM - v.currentOdometer <= 2000) || 
                  (v.nextMaintenanceKM && v.nextMaintenanceKM - v.currentOdometer <= 3000) ||
                  (v.nextPreventiveMaintenanceDate && differenceInDays(parseISO(v.nextPreventiveMaintenanceDate), new Date()) <= 30)
                ).length} 
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
                    {vehicles.length > 0 ? Math.round((vehicles.filter(v => v.status === 'available').length / vehicles.length) * 100) : 0}%
                  </p>
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                    <Bus size={20} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Alertas Proativos de Manutenção */}
            <div className="space-y-6">
              <FleetAlerts 
                vehicles={vehicles}
                onVehicleClick={onVehicleClick}
                filter="maintenance"
              />
            </div>

            {/* Maintenance Chart */}
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em]">Comparativo Mensal</h3>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand-accent"></div><span className="text-[9px] font-black text-zinc-600 uppercase">Preventiva</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-600"></div><span className="text-[9px] font-black text-zinc-600 uppercase">Corretiva</span></div>
                  </div>
               </div>
               <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maintenanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="month" stroke="#4b5563" fontSize={10} fontWeight="800" axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#4b5563" fontSize={10} fontWeight="800" axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(255, 107, 0, 0.05)' }}
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #1f2937', borderRadius: '16px', fontSize: '10px', color: '#fff', fontWeight: '900' }}
                        itemStyle={{ color: '#ff6b00' }}
                      />
                      <Bar dataKey="preventive" fill="#ff6b00" radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="corrective" fill="#3f3f46" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Maintenance History Table */}
            <div className="space-y-6">
               <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <FileText size={16} className="text-zinc-600" /> Histórico de O.S. (Últimos 30 dias)
                  </h3>
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
                        .slice(0, 15)
                        .map(log => {
                          const vehicle = vehicles.find(v => v.id === log.vehicleId);
                          return (
                            <tr key={log.id} className="group hover:bg-zinc-900/60 transition-all">
                              <td className="p-6">
                                <div className="flex flex-col gap-2">
                                  <p className="text-xs font-black text-zinc-100 tabular-nums">
                                    {log.completedAt ? format(parseISO(log.completedAt), 'dd/MM/yyyy') : format(parseISO(log.createdAt), 'dd/MM/yyyy')}
                                  </p>
                                  <span className={cn(
                                    "text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest w-fit border",
                                    log.status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  )}>
                                    {log.status === 'pending' ? 'EM ABERTO' : 'CONCLUÍDA'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex flex-col gap-2">
                                  <p className="text-xs font-black text-white uppercase group-hover:text-brand-accent transition-colors">{vehicle?.plate || '---'}</p>
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
                                <div className="flex items-center justify-end gap-3">
                                  <div className="text-right">
                                    <p className="text-sm font-black text-white tabular-nums tracking-tighter">R$ {log.cost.toLocaleString()}</p>
                                    <p className="text-[8px] text-zinc-600 font-black uppercase mt-1">Total Pago</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5">
                                    {log.attachments && log.attachments.length > 0 && (
                                      <button 
                                        onClick={() => onOpenMaintenanceAttachments?.(log)}
                                        className="w-10 h-10 bg-emerald-500/10 hover:bg-emerald-500 hover:text-asphalt-950 text-emerald-500 rounded-xl transition-all flex items-center justify-center border border-emerald-500/20 relative group"
                                        title="Ver Anexos"
                                      >
                                        <Paperclip size={16} />
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-asphalt-950 text-[8px] font-black rounded-full flex items-center justify-center border-2 border-asphalt-900">
                                          {log.attachments.length}
                                        </span>
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => onPrintOS(log)}
                                      className="w-10 h-10 bg-zinc-800 hover:bg-white hover:text-zinc-950 text-zinc-500 rounded-xl transition-all flex items-center justify-center border border-zinc-700"
                                      title="Imprimir O.S."
                                    >
                                      <Printer size={16} />
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {maintenance.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-20 text-center">
                            <Wrench size={40} className="text-zinc-800 mx-auto mb-6 opacity-20" />
                            <p className="text-xs font-black text-zinc-800 uppercase tracking-[0.4em]">Nenhum histórico disponível</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
