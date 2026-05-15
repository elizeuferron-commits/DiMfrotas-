import React, { useMemo } from 'react';
import { Card } from './Cards';
import { 
  TrendingUp, 
  Bus, 
  Wrench, 
  AlertTriangle, 
  Package, 
  Share2, 
  FileText, 
  Table as TableIcon,
  Download,
  BarChart as BarChartIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, parseISO, isAfter, addDays, subMonths, isSameMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  vehicles,
  employees,
  fuelLogs,
  maintenance,
  trips,
  finance,
  onShare
}) => {

  const handleExportPDF = (reportType: string) => {
    try {
      const doc = new jsPDF() as any;
      const title = `Relatório DM Turismo - ${reportType}`;
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

      let data = [];
      let columns = [];

      switch (reportType) {
        case 'Financeiro':
          columns = ['Data', 'Descricao', 'Tipo', 'Valor (R$)'];
          data = (finance || []).map(f => [
            f.date ? format(parseISO(f.date), 'dd/MM/yyyy') : '---',
            f.description || '---',
            f.type === 'income' ? 'Entrada' : 'Saída',
            (f.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
          ]);
          break;
        case 'Consumo':
          columns = ['Data', 'Veiculo', 'Litros', 'Local', 'Custo (R$)'];
          data = (fuelLogs || []).map(l => {
            const v = vehicles.find(veh => veh.id === l.vehicleId);
            return [
              l.timestamp ? format(parseISO(l.timestamp), 'dd/MM/yyyy') : '---',
              v?.plate || '---',
              l.quantity || 0,
              l.isExternal ? 'Externo' : 'Interno',
              (l.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            ];
          });
          break;
        case 'Manutenção':
          columns = ['Data', 'Veiculo', 'Tipo', 'Descricao', 'Custo (R$)'];
          data = (maintenance || []).map(m => {
            const v = vehicles.find(veh => veh.id === m.vehicleId);
            return [
              (m.completedAt || m.createdAt) ? format(parseISO(m.completedAt || m.createdAt), 'dd/MM/yyyy') : '---',
              v?.plate || '---',
              m.type === 'preventive' ? 'Prev.' : 'Corr.',
              m.description || '---',
              (m.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            ];
          });
          break;
        default:
          columns = ['Info'];
          data = [['Relatório extendido sob demanda']];
      }

      autoTable(doc, {
        startY: 40,
        head: [columns],
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [255, 107, 0] }
      });

      doc.save(`DM_Turismo_${reportType}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleExportExcel = (reportType: string) => {
    try {
      let data = [];
      switch (reportType) {
        case 'Financeiro':
          data = (finance || []).map(f => ({
            Data: f.date ? format(parseISO(f.date), 'dd/MM/yyyy') : '---',
            Descricao: f.description,
            Tipo: f.type === 'income' ? 'Entrada' : 'Saída',
            Valor: f.amount
          }));
          break;
        case 'Consumo':
          data = (fuelLogs || []).map(l => {
            const v = vehicles.find(veh => veh.id === l.vehicleId);
            return {
              Data: l.timestamp ? format(parseISO(l.timestamp), 'dd/MM/yyyy') : '---',
              Veiculo: v?.plate || '---',
              Litros: l.quantity,
              Origem: l.isExternal ? 'Externo' : 'Interno',
              Custo: l.cost
            };
          });
          break;
        default:
          data = [{ Info: 'Relatório extendido sob demanda' }];
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
      XLSX.writeFile(wb, `DM_Turismo_${reportType}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      toast.success('Relatório Excel gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar Excel');
    }
  };

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

    (maintenance || []).forEach(m => {
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

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Relatórios Gerenciais</h1>
        <p className="text-zinc-500 font-medium tracking-tight">Análise de desempenho, custos e indicadores operacionais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl group hover:border-brand-accent/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-zinc-800 rounded-xl text-zinc-500 group-hover:bg-brand-accent group-hover:text-zinc-950 transition-all">
              <Bus size={20} />
            </div>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Veículos Livres</span>
          </div>
          <p className="text-3xl font-black text-white">{vehicles.filter(v => v.status === 'available').length}</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">Disponíveis agora</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-zinc-800 rounded-xl text-zinc-500 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all">
              <Wrench size={20} />
            </div>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Manutenções</span>
          </div>
          <p className="text-3xl font-black text-white">{maintenance.filter(m => m.status === 'pending').length}</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">Pendentes de execução</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl group hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-zinc-800 rounded-xl text-zinc-500 group-hover:bg-rose-500 group-hover:text-zinc-950 transition-all">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Vencimentos</span>
          </div>
          <p className="text-3xl font-black text-white">
            {vehicles.filter(v => v.licenseExpiration && isAfter(addDays(new Date(), 15), parseISO(v.licenseExpiration))).length}
          </p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">Críticos (Próx. 15 dias)</p>
        </div>

        <div className="bg-brand-accent/5 border border-brand-accent/20 p-6 rounded-3xl group hover:border-brand-accent transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-accent/10 rounded-xl text-brand-accent">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">OS Operacionais</span>
          </div>
          <p className="text-3xl font-black text-white">{trips.filter(t => t.status === 'active').length}</p>
          <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1">Em realização</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {['Financeiro', 'Consumo', 'Manutenção'].map(t => (
           <Card key={t} className="flex flex-col items-center justify-center py-12 gap-6 hover:border-brand-accent transition-all group bg-zinc-900 border-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                {t === 'Financeiro' && <FileText size={120} />}
                {t === 'Consumo' && <TrendingUp size={120} />}
                {t === 'Manutenção' && <Wrench size={120} />}
              </div>

              <div className="p-6 bg-zinc-800 rounded-3xl group-hover:bg-brand-accent transition-all group-hover:text-zinc-950 text-zinc-500 group-hover:scale-110 shadow-xl border border-zinc-700 group-hover:border-transparent z-10">
                {t === 'Financeiro' && <FileText size={40} />}
                {t === 'Consumo' && <TrendingUp size={40} />}
                {t === 'Manutenção' && <Wrench size={40} />}
              </div>
              <div className="text-center z-10">
                <span className="font-black text-white uppercase text-xs tracking-[0.2em]">{t}</span>
                <p className="text-[10px] text-zinc-600 font-bold uppercase mt-2">Relatórios Gerenciais</p>
              </div>
              
              <div className="flex items-center gap-2 z-10 mt-4">
                <button 
                  onClick={() => handleExportPDF(t)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-950 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-zinc-950 transition-all border border-zinc-800"
                >
                  <FileText size={14} />
                  PDF
                </button>
                <button 
                  onClick={() => handleExportExcel(t)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-950 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border border-zinc-800"
                >
                  <TableIcon size={14} />
                  Excel
                </button>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(t);
                }}
                className="absolute top-4 right-4 p-2.5 bg-zinc-800 hover:bg-brand-accent text-zinc-500 hover:text-zinc-950 rounded-xl transition-all border border-zinc-700 hover:border-transparent active:scale-90"
                title="Compartilhar"
              >
                <Share2 size={16} />
              </button>
           </Card>
         ))}
      </div>

      {/* Maintenance Costs Chart */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 p-10 rounded-[3rem] space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded-xl">
              <BarChartIcon className="text-brand-accent" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Custos de Manutenção (6 Meses)</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight mt-1">Comparativo entre preventiva e corretiva</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-brand-accent" />
                <span className="text-[10px] font-black text-zinc-500 uppercase">Preventiva</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-zinc-600" />
                <span className="text-[10px] font-black text-zinc-500 uppercase">Corretiva</span>
             </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={maintenanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
               <XAxis 
                  dataKey="month" 
                  stroke="#4b5563" 
                  fontSize={10} 
                  fontWeight="black" 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
               />
               <YAxis 
                  stroke="#4b5563" 
                  fontSize={10} 
                  fontWeight="black" 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(value) => `R$ ${value}`}
               />
               <Tooltip 
                  cursor={{ fill: 'rgba(255, 107, 0, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#09090b', 
                    border: '1px solid #1f2937', 
                    borderRadius: '16px',
                    fontSize: '10px',
                    fontWeight: '800',
                    textTransform: 'uppercase'
                  }}
                  itemStyle={{
                    color: '#fff'
                  }}
                  formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
               />
               <Bar dataKey="preventive" name="Preventiva" fill="#ff6b00" radius={[6, 6, 0, 0]} barSize={24} />
               <Bar dataKey="corrective" name="Corretiva" fill="#3f3f46" radius={[6, 6, 0, 0]} barSize={24} />
             </BarChart>
           </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-zinc-800/50">
           {maintenanceData.slice(-4).map((m, i) => (
             <div key={i} className="space-y-1">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{m.month}</p>
                <p className="text-xl font-black text-white">R$ {m.total.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
                <div className="flex items-center gap-2">
                   <div className={cn("w-1.5 h-1.5 rounded-full", m.preventive > m.corrective ? "bg-emerald-500" : "bg-brand-accent")} />
                   <span className="text-[8px] font-black text-zinc-500 uppercase">{m.preventive > m.corrective ? 'Gasto Preventivo Maior' : 'Alerta de Corretivas'}</span>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
