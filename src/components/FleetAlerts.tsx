import React from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { AlertTriangle, Calendar, ShieldCheck, Wrench, ChevronRight, Plus } from 'lucide-react';
import { Vehicle } from '../types';
import { cn } from '../lib/utils';

interface FleetAlertsProps {
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

export const FleetAlerts: React.FC<FleetAlertsProps> = ({ vehicles, onVehicleClick }) => {
  const alerts = (vehicles || []).flatMap(v => {
    const items = [];
    const today = new Date();

    // 1. Licenciamento
    if (v.licenseExpiration) {
      const days = differenceInDays(parseISO(v.licenseExpiration), today);
      if (days <= 30) {
        items.push({
          id: `${v.id}-lic`,
          vehicle: v,
          type: 'licensing',
          label: 'Licenciamento',
          date: v.licenseExpiration,
          days,
          priority: days <= 7 ? 'high' : 'medium'
        });
      }
    }

    // 1.1 Turismo (ANTT/CADASTUR)
    if (v.tourismLicenseExpiration) {
      const days = differenceInDays(parseISO(v.tourismLicenseExpiration), today);
      if (days <= 30) {
        items.push({
          id: `${v.id}-tour`,
          vehicle: v,
          type: 'licensing',
          label: 'Cert. Turismo',
          date: v.tourismLicenseExpiration,
          days,
          priority: days <= 7 ? 'high' : 'medium'
        });
      }
    }

    // 2. Seguro
    if (v.insuranceExpiration) {
      const days = differenceInDays(parseISO(v.insuranceExpiration), today);
      if (days <= 30) {
        items.push({
          id: `${v.id}-ins`,
          vehicle: v,
          type: 'insurance',
          label: 'Seguro',
          date: v.insuranceExpiration,
          days,
          priority: days <= 7 ? 'high' : 'medium'
        });
      }
    }

    // 3. Manutenção Preventiva (Data)
    if (v.nextPreventiveMaintenanceDate) {
      const days = differenceInDays(parseISO(v.nextPreventiveMaintenanceDate), today);
      if (days <= 15) {
        items.push({
          id: `${v.id}-maint`,
          vehicle: v,
          type: 'maintenance',
          label: 'Manutenção Prev.',
          date: v.nextPreventiveMaintenanceDate,
          days,
          priority: days <= 5 ? 'high' : 'medium'
        });
      }
    }

    return items;
  }).sort((a, b) => a.days - b.days);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-[10px] font-black text-asphalt-700 uppercase tracking-[0.4em] flex items-center gap-3">
          <div className="p-1 bg-brand-accent/10 rounded-md">
            <AlertTriangle size={12} className="text-brand-accent animate-pulse" />
          </div>
          Alertas de Manutenção & Vencimento
        </h2>
        <span className="text-[10px] font-black text-brand-accent shadow-[0_0_15px_rgba(251,191,36,0.3)] bg-brand-accent/10 px-3 py-1 rounded-full uppercase tracking-widest border border-brand-accent/20">
          {alerts.length} {alerts.length === 1 ? 'Alerta Ativo' : 'Alertas Ativos'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {alerts.slice(0, 8).map((alert) => (
          <div 
            key={alert.id}
            onClick={() => onVehicleClick(alert.vehicle)}
            className="group relative highway-card p-6 hover:border-brand-accent/40 transition-all cursor-pointer overflow-hidden"
          >
            {/* Ambient Backlight */}
            <div className={cn(
              "absolute -top-12 -right-12 w-24 h-24 rounded-full blur-[40px] opacity-10 transition-opacity group-hover:opacity-30",
              alert.priority === 'high' ? "bg-rose-500" : "bg-brand-accent"
            )} />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner transition-all group-hover:scale-105",
                     alert.priority === 'high' 
                       ? "bg-rose-500/10 border-rose-500/20 text-rose-500" 
                       : "bg-brand-accent/10 border-brand-accent/20 text-brand-accent"
                   )}>
                     {alert.type === 'licensing' && <Calendar size={20} className="stroke-[2.5]" />}
                     {alert.type === 'insurance' && <ShieldCheck size={20} className="stroke-[2.5]" />}
                     {alert.type === 'maintenance' && <Wrench size={20} className="stroke-[2.5]" />}
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-asphalt-700 uppercase tracking-widest leading-none">
                       {alert.label}
                     </p>
                     <p className="text-base font-black text-white uppercase tracking-tight mt-1.5 flex items-center gap-2">
                       {alert.vehicle.plate}
                       {alert.priority === 'high' && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />}
                     </p>
                   </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5",
                    alert.days <= 0 ? "text-rose-500" : alert.priority === 'high' ? "text-rose-400" : "text-brand-accent"
                  )}>
                    {alert.days < 0 
                      ? "Prazo Vencido [" + Math.abs(alert.days) + "d]"
                      : alert.days === 0 
                        ? "Vencimento Hoje" 
                        : "Vence em " + alert.days + " dias"}
                  </p>
                  <div className="h-[2px] w-12 bg-asphalt-800 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        alert.priority === 'high' ? "bg-rose-500" : "bg-brand-accent"
                      )}
                      style={{ width: `${Math.max(10, Math.min(100, (30 - alert.days) / 30 * 100))}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-asphalt-700 uppercase tracking-widest mt-1">
                    Vence em: {format(parseISO(alert.date), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-asphalt-950 rounded-xl text-asphalt-800 group-hover:text-brand-accent group-hover:bg-brand-accent/5 transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        ))}
        {alerts.length > 8 && (
          <div className="flex flex-col items-center justify-center p-6 bg-asphalt-900/20 border border-dashed border-asphalt-800 rounded-2xl group hover:bg-asphalt-900/40 hover:border-asphalt-700 transition-all cursor-pointer">
            <p className="text-[9px] font-black text-asphalt-800 uppercase tracking-[0.3em] mb-3">Mais {alerts.length - 8} alertas</p>
            <div className="w-10 h-10 bg-asphalt-800 rounded-full flex items-center justify-center text-asphalt-700 group-hover:bg-asphalt-700 group-hover:text-asphalt-600 transition-all shadow-lg">
              <Plus size={20} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
