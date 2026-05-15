import React from 'react';
import { Card } from './Cards';
import { AlertTriangle, Calendar } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';
import { Vehicle, Employee } from '../types';

interface VencimentosProps {
  vehicleVencimentos: any[];
  driverVencimentos: Employee[];
}

export const Vencimentos = React.memo(({ vehicleVencimentos, driverVencimentos }: VencimentosProps) => {
  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Vencimentos & Documentação</h1>
        <p className="text-zinc-300 font-medium tracking-tight">Monitoramento crítico de licenças, seguros e documentação de turismo.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="border-zinc-800 bg-rose-950/10">
          <h3 className="text-sm font-black uppercase text-rose-500 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center border border-zinc-800 text-rose-500">
              <AlertTriangle size={20} />
            </div> 
            Licenciamento & Turismo (Próximos)
          </h3>
          <div className="space-y-4">
            {(vehicleVencimentos || []).map(item => {
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
                      <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">
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
            <div className="w-12 h-12 bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center border border-zinc-800 text-amber-500">
              <Calendar size={20} />
            </div> 
            Vencimento CNH Motoristas
          </h3>
          <div className="space-y-4">
            {(driverVencimentos || []).map(e => {
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
                      <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">{e.role}</div>
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
  );
});
