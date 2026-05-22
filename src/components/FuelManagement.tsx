import React from 'react';
import { 
  Plus, 
  Package, 
  MapPin, 
  Fuel, 
  AlertTriangle 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Card } from './Cards';
import { cn } from '../lib/utils';
import { Vehicle, FuelTank, FuelLog, FuelEntry } from '../types';

interface FuelManagementProps {
  fuelTanks: FuelTank[];
  recentFuelLogs: FuelLog[];
  fuelEntries: FuelEntry[];
  vehicles: Vehicle[];
  onOpenTankModal: () => void;
  onOpenRefillModal: () => void;
  onOpenExternalFuelModal: () => void;
  onOpenFuelModal: () => void;
}

export const FuelManagement: React.FC<FuelManagementProps> = ({
  fuelTanks,
  recentFuelLogs,
  fuelEntries,
  vehicles,
  onOpenTankModal,
  onOpenRefillModal,
  onOpenExternalFuelModal,
  onOpenFuelModal
}) => {
  return (
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
            onClick={onOpenTankModal}
            className="flex items-center gap-3 px-6 py-4 bg-zinc-900 text-zinc-400 rounded-xl font-bold border border-zinc-800 transition-all hover:bg-zinc-800 active:scale-95"
          >
            <Plus size={18} />
            Configurar Tanque
          </button>
          <button 
            onClick={onOpenRefillModal}
            className="flex items-center gap-3 px-6 py-4 bg-zinc-900 text-zinc-400 rounded-xl font-bold border border-zinc-800 transition-all hover:bg-zinc-800 active:scale-95"
          >
            <Package size={18} />
            Carga Refil (Tanque)
          </button>
          <button 
            onClick={onOpenExternalFuelModal}
            className="flex items-center gap-3 px-6 py-4 bg-rose-500/10 text-rose-500 rounded-xl font-bold border border-rose-500/20 transition-all hover:bg-rose-500/20 active:scale-95"
          >
            <MapPin size={18} />
            Abastecimento Externo
          </button>
          <button 
            onClick={onOpenFuelModal}
            className="flex items-center gap-4 px-10 py-5 bg-brand-accent text-zinc-950 rounded-2xl font-black shadow-2xl transition-all active:scale-95 group hover:scale-[1.02] border-2 border-white/10"
          >
            <Plus size={24} className="stroke-[3]" />
            Carregar Abastecimento (Veículo)
          </button>
        </div>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl group hover:border-brand-accent/50 transition-all shadow-lg">
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
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-lg">
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
        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-lg">
           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-6">Economia Operacional</p>
           <div className="flex items-end justify-between">
             <p className="text-4xl font-black text-emerald-500 tabular-nums tracking-tighter leading-none">
               R$ {(recentFuelLogs.reduce((acc, l) => acc + (l.cost || 0), 0) * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        
        {fuelTanks.length === 0 && (
          <div className="col-span-full py-20 bg-zinc-950 rounded-[2rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
              <Fuel size={40} className="text-zinc-700" />
            </div>
            <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em]">Nenhum tanque cadastrado no sistema</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <p className="text-sm font-black text-emerald-500 tabular-nums">+{entry.quantity}L</p>
                    <p className="text-[9px] font-black text-zinc-600 uppercase mt-1 tracking-widest">Carga de Estoque</p>
                  </div>
                </div>
              );
            })}
            {fuelEntries.length === 0 && (
              <div className="py-10 text-center bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-900 text-[10px] font-black text-zinc-700 uppercase tracking-widest">Nenhuma carga registrada</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
