import React, { useState, memo } from 'react';
import { Bus, Plus, Search, Wrench, Droplets, AlertTriangle, Users } from 'lucide-react';
import { Card } from './Cards';
import { cn } from '../lib/utils';
import { Vehicle } from '../types';
import { format, parseISO, differenceInDays, isAfter, addDays } from 'date-fns';
import { FleetAlerts } from './FleetAlerts';

interface FleetListProps {
  vehicles: Vehicle[];
  onAddVehicle: () => void;
  onVehicleClick: (vehicle: Vehicle) => void;
}

export const FleetList = memo(({ vehicles, onAddVehicle, onVehicleClick }: FleetListProps) => {
  const [search, setSearch] = useState('');

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) || 
    v.model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">DM Turismo</h1>
          <p className="text-zinc-500 font-medium tracking-tight">Gestão de cavalos, vans e ônibus executivos.</p>
        </div>
        <button 
          onClick={onAddVehicle}
          className="flex items-center gap-4 px-10 py-5 bg-brand-accent text-zinc-950 rounded-2xl font-black shadow-2xl transition-all active:scale-95 group hover:scale-[1.02]"
        >
          <Plus size={20} className="stroke-[3]" />
          Novo Ativo
        </button>
      </div>

      <FleetAlerts 
        vehicles={vehicles} 
        onVehicleClick={onVehicleClick} 
      />

      <Card className="p-0 border-zinc-800 bg-zinc-900/20 overflow-hidden">
        <div className="p-10 bg-zinc-900/50 border-b border-zinc-800 flex gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-accent transition-colors" size={24} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-20 pr-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl focus:border-brand-accent outline-none transition-all placeholder:text-zinc-700 font-bold text-white shadow-inner" 
              placeholder="Buscar placa ou prefixo..." 
            />
          </div>
        </div>
        <div className="divide-y divide-zinc-800">
          {filteredVehicles.map(v => {
            const isOilChangeClose = v.nextOilChangeKM && (v.nextOilChangeKM - v.currentOdometer <= 1000);
            const daysToMaintenance = v.nextPreventiveMaintenanceDate ? differenceInDays(parseISO(v.nextPreventiveMaintenanceDate), new Date()) : null;
            const isMaintenanceClose = daysToMaintenance !== null && daysToMaintenance <= 15 && daysToMaintenance >= 0;
            
            const daysToLicense = v.licenseExpiration ? differenceInDays(parseISO(v.licenseExpiration), new Date()) : null;
            const isLicenseClose = daysToLicense !== null && daysToLicense <= 30;
            
            const daysToTourism = v.tourismLicenseExpiration ? differenceInDays(parseISO(v.tourismLicenseExpiration), new Date()) : null;
            const isTourismClose = daysToTourism !== null && daysToTourism <= 30;

            return (
              <div 
                key={v.id} 
                onClick={() => onVehicleClick(v)}
                className="grid grid-cols-1 md:grid-cols-4 p-8 items-center hover:bg-zinc-800/30 transition-all group cursor-pointer relative gap-6 md:gap-0"
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center shadow-lg border transition-all",
                    (isOilChangeClose || isMaintenanceClose || isLicenseClose || isTourismClose) ? "border-amber-500/50 shadow-amber-900/20" : "border-zinc-700 group-hover:border-zinc-500"
                  )}>
                    {isMaintenanceClose ? (
                      <Wrench className="text-amber-500 animate-pulse" size={24} />
                    ) : isOilChangeClose ? (
                      <Droplets className="text-amber-500 animate-pulse" size={24} />
                    ) : (isLicenseClose || isTourismClose) ? (
                      <AlertTriangle className="text-amber-500 animate-pulse" size={24} />
                    ) : (
                      <Bus className="text-zinc-500 group-hover:text-brand-accent transition-colors" size={24} />
                    )}
                  </div>
                  <div>
                    <div className="font-black text-white tabular-nums text-lg uppercase tracking-tight leading-none flex items-center gap-2">
                      {v.plate}
                      {(isOilChangeClose || isMaintenanceClose || isLicenseClose || isTourismClose) && (
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
                    {isLicenseClose && (
                      <p className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">
                        {daysToLicense! <= 0 ? 'Licenciamento Vencido' : `Licenciamento em ${daysToLicense} dias`}
                      </p>
                    )}
                    {isTourismClose && (
                      <p className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">
                        {daysToTourism! <= 0 ? 'Cert. Turismo Vencido' : `Cert. Turismo em ${daysToTourism} dias`}
                      </p>
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

          {filteredVehicles.length === 0 && (
            <div className="p-20 text-center">
              <Bus size={48} className="text-zinc-800 mx-auto mb-6" />
              <p className="text-xs font-black text-zinc-800 uppercase tracking-[0.4em]">Nenhum ativo localizado</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});
