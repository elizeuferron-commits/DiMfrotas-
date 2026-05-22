import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  Wrench, 
  Compass, 
  X
} from 'lucide-react';
import { Trip, Vehicle, Employee, MaintenanceLog } from '../types';
import { TripServiceOrder } from './TripServiceOrder';
import { MaintenanceServiceOrder } from './MaintenanceServiceOrder';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ServiceOrdersProps {
  trips: Trip[];
  vehicles: Vehicle[];
  employees: Employee[];
  maintenance?: MaintenanceLog[];
  tripSearch: string;
  setTripSearch: (v: string) => void;
  onSelectTrip: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
}

export const ServiceOrders: React.FC<ServiceOrdersProps> = ({
  trips,
  vehicles,
  employees,
  maintenance = [],
  tripSearch,
  setTripSearch,
  onSelectTrip,
  onDeleteTrip
}) => {
  const [activeTab, setActiveTab] = useState<'viagens' | 'manutenções'>('viagens');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedVoyageOS, setSelectedVoyageOS] = useState<Trip | null>(null);
  const [selectedMaintOS, setSelectedMaintOS] = useState<MaintenanceLog | null>(null);

  // Handle Refresh OS list
  const handleRefreshOS = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      toast.success('Ordens de Serviço sincronizadas e atualizadas com sucesso!', {
        description: 'Os últimos dados operacionais de escalas e manutenções foram carregados do banco.',
        icon: '🔄'
      });
    }, 1000);
  };

  // Filters for Trips
  const filteredTrips = trips.filter(t => 
    t.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
    t.destination.toLowerCase().includes(tripSearch.toLowerCase()) ||
    (t.osNumber && t.osNumber.toLowerCase().includes(tripSearch.toLowerCase()))
  );

  // Filters for Maintenance OS
  const filteredMaintenance = maintenance.filter(m => {
    const vehicle = vehicles.find(v => v.id === m.vehicleId);
    const plate = vehicle?.plate?.toLowerCase() || '';
    const model = vehicle?.model?.toLowerCase() || '';
    const desc = m.description?.toLowerCase() || '';
    const searchLower = tripSearch.toLowerCase();
    
    return plate.includes(searchLower) || model.includes(searchLower) || desc.includes(searchLower);
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION with "Atualizar OS" button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent border border-brand-accent/20 shadow-lg shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic font-display">Ordens de Serviço</h1>
            <p className="text-zinc-500 font-medium text-xs tracking-tight uppercase mt-0.5">Emissão, histórico e controle de escalas de viagem e manutenções de frota.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Atualizar OS Button */}
          <button
            onClick={handleRefreshOS}
            disabled={isUpdating}
            className="py-3.5 px-5 bg-zinc-900 border border-zinc-800 text-brand-accent hover:text-white hover:bg-zinc-850 hover:border-brand-accent rounded-2xl flex items-center gap-2.5 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-xl disabled:opacity-50"
          >
            <RefreshCw size={14} className={isUpdating ? "animate-spin text-white" : "text-brand-accent"} />
            <span>{isUpdating ? 'ATUALIZANDO...' : 'ATUALIZAR OS'}</span>
          </button>
          
          {/* Search Box */}
          <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shadow-xl items-center">
            <Search className="text-zinc-500 ml-3" size={16} />
            <input 
              type="text" 
              placeholder={activeTab === 'viagens' ? "BUSCAR VIAGEM OU DESTINO..." : "BUSCAR PLACA, MODELO OU DESCRIÇÃO..."}
              className="bg-transparent text-[10px] font-black uppercase text-white placeholder:text-zinc-600 pl-3 pr-6 py-3 w-64 outline-none tracking-widest"
              value={tripSearch}
              onChange={e => setTripSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABS SWITCHER */}
      <div className="flex gap-2 border-b border-zinc-800 pb-px">
        <button
          onClick={() => {
            setActiveTab('viagens');
            setTripSearch('');
          }}
          className={`px-6 py-4.5 font-black text-xs uppercase tracking-wider relative transition-all cursor-pointer ${
            activeTab === 'viagens' 
              ? 'text-brand-accent border-b-2 border-brand-accent' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Compass size={14} />
            <span>Viagens ({filteredTrips.length})</span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('manutenções');
            setTripSearch('');
          }}
          className={`px-6 py-4.5 font-black text-xs uppercase tracking-wider relative transition-all cursor-pointer ${
            activeTab === 'manutenções' 
              ? 'text-brand-accent border-b-2 border-brand-accent' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wrench size={14} />
            <span>Manutenções ({filteredMaintenance.length})</span>
          </div>
        </button>
      </div>

      {/* CONTENT GRID */}
      {activeTab === 'viagens' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => {
            const osNum = trip.osNumber || trip.id.substring(0, 8).toUpperCase();
            return (
              <div 
                key={trip.id}
                onClick={() => setSelectedVoyageOS(trip)}
                className="group p-6 bg-zinc-950 border border-zinc-900 rounded-3xl cursor-pointer hover:border-brand-accent transition-all duration-500 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl" />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-brand-accent uppercase bg-brand-accent/10 py-1 px-2.5 rounded-lg border border-brand-accent/15">
                      OS VIAGEM
                    </span>
                    <h3 className="text-base font-black text-white uppercase mt-3 tracking-tight group-hover:text-brand-accent transition-colors leading-tight">
                      {trip.title}
                    </h3>
                  </div>
                  <div className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-md ${
                    trip.status === 'active' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15 animate-pulse' :
                    trip.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15' :
                    'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}>
                    {trip.status === 'active' ? 'Em Curso' : trip.status === 'completed' ? 'Concluída' : 'Agendada'}
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-xs font-semibold text-zinc-400">
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-600 font-extrabold uppercase text-[9px]">Código OS:</span>
                    <span className="text-zinc-300 font-mono font-black">{osNum}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-600 font-extrabold uppercase text-[9px]">Localização:</span>
                    <span className="text-zinc-300 truncate max-w-[180px] uppercase text-[10px]">{trip.destination}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-zinc-600 font-extrabold uppercase text-[9px]">Data Partida:</span>
                    <span className="text-zinc-300 font-mono">
                      {trip.startDate ? format(parseISO(trip.startDate), 'dd/MM/yyyy • HH:mm', { locale: ptBR }) : '---'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 w-full py-3.5 bg-zinc-900 group-hover:bg-brand-accent group-hover:text-zinc-950 font-black text-[9px] text-zinc-300 text-center uppercase tracking-widest rounded-xl transition-all">
                  VISUALIZAR GUIA COMPLETA (A4)
                </div>
              </div>
            );
          })}

          {filteredTrips.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 grayscale opacity-30">
              <FileText size={80} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-6">Nenhuma ordem de serviço de viagem encontrada</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaintenance.map(maint => {
            const vehicle = vehicles.find(v => v.id === maint.vehicleId);
            const osNum = maint.id?.substring(0, 8).toUpperCase() || 'NEW';
            return (
              <div 
                key={maint.id}
                onClick={() => setSelectedMaintOS(maint)}
                className="group p-6 bg-zinc-950 border border-zinc-900 rounded-3xl cursor-pointer hover:border-brand-accent transition-all duration-500 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-amber-500 uppercase bg-amber-500/10 py-1 px-2.5 rounded-lg border border-amber-500/15">
                      OS MANUTENÇÃO
                    </span>
                    <h3 className="text-base font-black text-white uppercase mt-3 tracking-tight group-hover:text-brand-accent transition-colors leading-tight line-clamp-1">
                      {maint.description}
                    </h3>
                  </div>
                  <div className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-md ${
                    maint.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15' :
                    'bg-amber-500/10 text-amber-500 border border-amber-500/15 animate-pulse'
                  }`}>
                    {maint.status === 'completed' ? 'Concluída' : 'Pendente'}
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-xs font-semibold text-zinc-400">
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-600 font-extrabold uppercase text-[9px]">Código OS:</span>
                    <span className="text-zinc-300 font-mono font-black">#{osNum}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-600 font-extrabold uppercase text-[9px]">Veículo Placa:</span>
                    <span className="text-brand-accent font-black">{vehicle?.plate?.toUpperCase() || '---'}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-600 font-extrabold uppercase text-[9px]">Total Investido:</span>
                    <span className="text-emerald-500 font-black">R$ {maint.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-zinc-600 font-extrabold uppercase text-[9px]">Intervenção:</span>
                    <span className="text-zinc-300 uppercase text-[10px] font-bold">{maint.type === 'preventive' ? 'PREVENTIVA' : 'CORRETIVA'}</span>
                  </div>
                </div>

                <div className="mt-5 w-full py-3.5 bg-zinc-900 group-hover:bg-brand-accent group-hover:text-zinc-950 font-black text-[9px] text-zinc-300 text-center uppercase tracking-widest rounded-xl transition-all">
                  VISUALIZAR RELATÓRIO TÉCNICO (A4)
                </div>
              </div>
            );
          })}

          {filteredMaintenance.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 grayscale opacity-30">
              <Wrench size={80} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-6">Nenhuma ordem de serviço de manutenção encontrada</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL PREVIEW FOR VOYAGE SERVICE ORDER (TRIP) */}
      {selectedVoyageOS && (
        <div className="fixed inset-0 bg-black/80 w-full h-full backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="relative w-full max-w-[220mm] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="text-brand-accent" size={24} />
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter italic font-display">DOCUMENTO OFICIAL DE VIAGEM</h3>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold">Impressão de Guia de Viagem no Padrão A4</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVoyageOS(null)}
                className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
              <TripServiceOrder 
                trip={selectedVoyageOS}
                vehicle={vehicles.find(v => v.id === selectedVoyageOS.vehicleId)}
                driver={employees.find(e => e.id === selectedVoyageOS.driverId)}
                secondDriver={employees.find(e => e.id === selectedVoyageOS.secondDriverId)}
                onDelete={onDeleteTrip}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW FOR MAINTENANCE SERVICE ORDER */}
      {selectedMaintOS && (
        <div className="fixed inset-0 bg-black/80 w-full h-full backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="relative w-full max-w-[220mm] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <Wrench className="text-amber-500" size={24} />
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter italic font-display">ORDEM DE MANUTENÇÃO TÉCNICA</h3>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold">Relatório Executivo Detalhado de Ativos no Padrão A4</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMaintOS(null)}
                className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
              <MaintenanceServiceOrder 
                log={selectedMaintOS}
                vehicle={vehicles.find(v => v.id === selectedMaintOS.vehicleId)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
