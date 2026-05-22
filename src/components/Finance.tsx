import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Calendar, 
  Search, 
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Trash2,
  Bell,
  CalendarDays,
  Target,
  Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BoletoModal } from './BoletoModal';
import { TransactionDetailModal } from './TransactionDetailModal';
import { 
  format, 
  parseISO, 
  isAfter, 
  isBefore, 
  isSameMonth, 
  subMonths, 
  eachMonthOfInterval, 
  addDays, 
  startOfDay, 
  endOfDay,
  endOfMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinancialTransaction } from '../types';
import { Card } from './Cards';
import { cn } from '../lib/utils';
import { ConfirmModal } from './UI';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
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

interface FinanceProps {
  transactions: FinancialTransaction[];
  onAddTransaction: (type: 'payable' | 'receivable') => void;
  onUpdateStatus: (id: string, status: 'paid' | 'pending') => void;
}

/**
 * Evolução do módulo financeiro com sistema de lembretes e métricas de vencimento.
 */
export const Finance = ({ transactions, onAddTransaction, onUpdateStatus }: FinanceProps) => {
  const [viewTab, setViewTab] = useState<'active' | 'liquidated'>('active');
  const [liquidatedSubTab, setLiquidatedSubTab] = useState<'all' | 'payable' | 'receivable'>('all');
  const [filterType, setFilterType] = useState<'all' | 'payable' | 'receivable'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string}>({
    isOpen: false,
    id: ''
  });
  const [selectedBoleto, setSelectedBoleto] = useState<{
    description: string;
    amount: number;
    dueDate: string;
    supplier?: string;
  } | null>(null);
  const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState<FinancialTransaction | null>(null);

  const now = startOfDay(new Date());
  const next15Days = addDays(now, 15);

  // Reminders / Filters Counts
  const overdueBills = transactions.filter(t => 
    t.type === 'payable' && 
    t.status !== 'paid' && 
    isBefore(parseISO(t.dueDate), now)
  );

  const billsDueNext15Days = transactions.filter(t => 
    t.type === 'payable' && 
    t.status !== 'paid' && 
    isAfter(parseISO(t.dueDate), now) && 
    isBefore(parseISO(t.dueDate), next15Days)
  );

  const billsDueThisMonth = transactions.filter(t => 
    t.type === 'payable' && 
    t.status !== 'paid' && 
    isSameMonth(parseISO(t.dueDate), now)
  );

  const getDaysDifference = (dateStr: string) => {
    const dDate = startOfDay(parseISO(dateStr));
    const diffTime = dDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleExportRemindersPDF = (type: 'overdue' | 'next15' | 'thisMonth') => {
    let bills: FinancialTransaction[] = [];
    let title = '';
    let filename = '';
    
    if (type === 'overdue') {
      bills = overdueBills;
      title = 'LEMBRETE FINANCEIRO: CONTAS ATRASADAS';
      filename = 'lembrete_contas_atrasadas.pdf';
    } else if (type === 'next15') {
      bills = billsDueNext15Days;
      title = 'LEMBRETE FINANCEIRO: VENCIMENTOS NOS PROXIMOS 15 DIAS';
      filename = 'lembrete_vencimento_15_dias.pdf';
    } else {
      bills = billsDueThisMonth;
      title = 'LEMBRETE FINANCEIRO: CONTAS VENCENDO ESTE MES';
      filename = 'lembrete_contas_este_mes.pdf';
    }

    if (bills.length === 0) {
      toast.info('NÃO HÁ LANÇAMENTOS DE LEMBRETES PARA EXPORTAR PARA ESTA CATEGORIA.');
      return;
    }

    try {
      const doc = new jsPDF() as any;
      
      // Header decorativos estilo DM Turismo (Brand Accent: #FF6B00 ou RGB 255, 107, 0)
      doc.setFillColor(24, 24, 27); // Zinc-900 / Fundo
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 107, 0); // brand-accent #ff6b00
      doc.text('DM TURISMO', 14, 18);
      
      doc.setFontSize(10);
      doc.setTextColor(161, 161, 170); // zinc-400
      doc.text('SISTEMA INTEGRADO DE GESTÃO E OPERAÇÃO — GESTÃO FINANCEIRA', 14, 25);
      doc.text(`EMITIDO EM: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 32);

      // Linha separadora laranja
      doc.setDrawColor(255, 107, 0);
      doc.setLineWidth(1.5);
      doc.line(0, 40, 210, 40);

      // Título principal do relatório
      doc.setFontSize(13);
      doc.setTextColor(24, 24, 27); // Zinc-900
      doc.text(title, 14, 52);

      // Resumo estatístico do KPI
      const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(82, 82, 91); // zinc-600
      
      doc.text(`Total de títulos listados: `, 14, 62);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(24, 24, 27);
      doc.text(`${bills.length} títulos`, 54, 62);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(82, 82, 91);
      doc.text(`Soma total pendente: `, 100, 62);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 107, 0);
      doc.text(`R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 136, 62);

      // Configuração de dados para a tabela
      const tableData = bills.map(b => {
        const dueDateObj = parseISO(b.dueDate);
        const formattedDueDate = format(dueDateObj, 'dd/MM/yyyy');
        
        // Calcular prazo / atraso
        const diffDays = getDaysDifference(b.dueDate);
        let statusDaysText = '';
        if (diffDays < 0) {
          statusDaysText = `${Math.abs(diffDays)} dia(s) atrasado`;
        } else if (diffDays === 0) {
          statusDaysText = 'Vence hoje';
        } else {
          statusDaysText = `Vence em ${diffDays} dia(s)`;
        }

        return [
          formattedDueDate,
          (b.description || '').toUpperCase(),
          (b.supplier || 'NOSSOS CLIENTES').toUpperCase(),
          (b.category || '').toUpperCase(),
          statusDaysText.toUpperCase(),
          `R$ ${b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ];
      });

      // Renderizar o grid da tabela usando o autoTable
      autoTable(doc, {
        startY: 70,
        head: [['VENCIMENTO', 'DESCRIÇÃO', 'FORNECEDOR', 'CATEGORIA', 'SITUAÇÃO', 'VALOR']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [24, 24, 27], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold', 
          halign: 'center',
          fontSize: 8
        },
        bodyStyles: { 
          fontSize: 8, 
          textColor: [39, 39, 42] 
        },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold' },
          1: { halign: 'left' },
          2: { halign: 'left' },
          3: { halign: 'left' },
          4: { halign: 'center', fontStyle: 'bold' },
          5: { halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: { 
          fillColor: [250, 250, 250] 
        },
        margin: { left: 14, right: 14 }
      });

      // Salvar PDF
      doc.save(filename);
      toast.success(`Relatório PDF em formato texto gerado: "${filename}"`);
    } catch (error) {
      console.error('Erro ao gerar relatório de lembretes:', error);
      toast.error('Erro ao gerar o PDF de lembretes da caixa selecionada.');
    }
  };

  const currentMonthTransactions = transactions.filter(t => isSameMonth(parseISO(t.dueDate), now));

  // Prepare chart data for the last 6 months
  const lastMonths = eachMonthOfInterval({
    start: subMonths(now, 5),
    end: now
  });

  const chartData = lastMonths.map(month => {
    const monthTransactions = transactions.filter(t => isSameMonth(parseISO(t.dueDate), month));
    const income = monthTransactions
      .filter(t => t.type === 'receivable')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = monthTransactions
      .filter(t => t.type === 'payable')
      .reduce((acc, t) => acc + t.amount, 0);
    
    return {
      name: format(month, 'MMM', { locale: ptBR }).toUpperCase(),
      receita: income,
      despesa: expenses
    };
  });

  const totalReceivable = currentMonthTransactions
    .filter(t => t.type === 'receivable')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPayable = currentMonthTransactions
    .filter(t => t.type === 'payable')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingPayable = currentMonthTransactions
    .filter(t => t.type === 'payable' && t.status !== 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (t.supplier?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
                         
    if (viewTab === 'active') {
      if (t.status === 'paid') return false;
      const matchesType = filterType === 'all' || t.type === filterType;
      let matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      
      if (filterStatus === 'overdue') {
        matchesStatus = isBefore(parseISO(t.dueDate), now);
      }
      return matchesSearch && matchesType && matchesStatus;
    } else {
      if (t.status !== 'paid') return false;
      const matchesType = liquidatedSubTab === 'all' || t.type === liquidatedSubTab;
      return matchesSearch && matchesType;
    }
  });

  const processDelete = async () => {
    try {
      await deleteDoc(doc(db, 'financial_transactions', deleteConfirm.id));
      toast.success('Lançamento financeiro removido definitivamente!');
    } catch (error) {
      toast.error('Erro ao excluir transação.');
    } finally {
      setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col gap-8 border-b border-zinc-800 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Financeiro</h1>
          <p className="text-zinc-500 font-medium tracking-tight">Gestão de contas a pagar e receber da operação.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => onAddTransaction('payable')}
            className="flex items-center gap-4 px-8 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl font-black shadow-xl transition-all active:scale-95 hover:bg-rose-500 hover:text-white"
          >
            <ArrowDownCircle size={20} className="stroke-[3]" />
            Nova Despesa
          </button>
          <button 
            onClick={() => onAddTransaction('receivable')}
            className="flex items-center gap-4 px-8 py-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl font-black shadow-xl transition-all active:scale-95 hover:bg-emerald-500 hover:text-white"
          >
            <ArrowUpCircle size={20} className="stroke-[3]" />
            Nova Receita
          </button>
        </div>
      </div>

      {/* Modern Financial Reminders Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-3">
           <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
             <Bell size={14} className="text-brand-accent" />
             Painel de Lembretes Financeiros
           </h3>
        </div>
        
        <Card 
          onClick={() => handleExportRemindersPDF('overdue')}
          className="bg-zinc-900 border-zinc-800 hover:border-rose-500/40 hover:bg-zinc-850 cursor-pointer p-6 relative overflow-hidden group transition-all active:scale-[0.98] shadow-lg select-none"
          title="Clique para gerar relatório PDF das contas atrasadas"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-1">Contas Atrasadas</p>
              <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                {overdueBills.length} <span className="text-sm text-zinc-600 font-bold ml-1 uppercase">Títulos</span>
              </p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-2">Valor Total: R$ {overdueBills.reduce((acc, b) => acc + b.amount, 0).toLocaleString('pt-BR')}</p>
              <p className="text-[8px] text-rose-500/80 font-black uppercase tracking-wider group-hover:text-rose-400 mt-3 flex items-center gap-1 transition-colors">
                <Printer size={10} /> Gerar PDF Resumo
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-rose-500/20" />
        </Card>
 
        <Card 
          onClick={() => handleExportRemindersPDF('next15')}
          className="bg-zinc-900 border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-850 cursor-pointer p-6 relative overflow-hidden group transition-all active:scale-[0.98] shadow-lg select-none"
          title="Clique para gerar relatório PDF dos vencimentos dos próximos 15 dias"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">Próximos 15 Dias</p>
              <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                {billsDueNext15Days.length} <span className="text-sm text-zinc-600 font-bold ml-1 uppercase">Títulos</span>
              </p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-2">Valor Total: R$ {billsDueNext15Days.reduce((acc, b) => acc + b.amount, 0).toLocaleString('pt-BR')}</p>
              <p className="text-[8px] text-amber-500/80 font-black uppercase tracking-wider group-hover:text-amber-400 mt-3 flex items-center gap-1 transition-colors">
                <Printer size={10} /> Gerar PDF Resumo
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <CalendarDays size={24} />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-amber-500/20" />
        </Card>
 
        <Card 
          onClick={() => handleExportRemindersPDF('thisMonth')}
          className="bg-zinc-900 border-zinc-800 hover:border-blue-500/40 hover:bg-zinc-850 cursor-pointer p-6 relative overflow-hidden group transition-all active:scale-[0.98] shadow-lg select-none"
          title="Clique para gerar relatório PDF dos vencimentos do mês atual"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Vencimento no Mês</p>
              <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                {billsDueThisMonth.length} <span className="text-sm text-zinc-600 font-bold ml-1 uppercase">Títulos</span>
              </p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-2">Valor Total: R$ {billsDueThisMonth.reduce((acc, b) => acc + b.amount, 0).toLocaleString('pt-BR')}</p>
              <p className="text-[8px] text-blue-500/80 font-black uppercase tracking-wider group-hover:text-blue-400 mt-3 flex items-center gap-1 transition-colors">
                <Printer size={10} /> Gerar PDF Resumo
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <Target size={24} />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-blue-500/20" />
        </Card>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-8 flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Receita (Mês)</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
              R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <ArrowUpCircle size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-8 flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Despesa (Mês)</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
              R$ {totalPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
              <ArrowDownCircle size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-8 flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">A Pagar (Pendente)</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-amber-500 tabular-nums tracking-tighter">
              R$ {pendingPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
              <Clock size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-8 flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Saldo Previsto</p>
          <div className="flex items-end justify-between">
            <p className={cn(
              "text-3xl font-black tabular-nums tracking-tighter",
              (totalReceivable - totalPayable) >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              R$ {(totalReceivable - totalPayable).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              (totalReceivable - totalPayable) >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
              <Wallet size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-brand-accent">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Fluxo de Caixa Mensal</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Comparativo de receitas e despesas (Últimos 6 meses)</p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#09090b', 
                  border: '1px solid #27272a', 
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
                itemStyle={{ padding: '2px 0' }}
                cursor={{ fill: '#18181b', opacity: 0.4 }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ 
                  paddingBottom: '20px', 
                  fontSize: '10px', 
                  fontWeight: 'black', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}
              />
              <Bar 
                dataKey="receita" 
                name="Receitas" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
              <Bar 
                dataKey="despesa" 
                name="Despesas" 
                fill="#f43f5e" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Abas Principais de Visualização: Em Aberto vs Contas Liquidadas */}
      <div className="flex border-b border-zinc-900 pb-px">
        <button
          onClick={() => {
            setViewTab('active');
            setFilterType('all');
            setFilterStatus('all');
          }}
          className={cn(
            "px-8 py-4.5 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2",
            viewTab === 'active' 
              ? "border-brand-accent text-white" 
              : "border-transparent text-zinc-500 hover:text-zinc-350"
          )}
        >
          <Clock size={14} className={viewTab === 'active' ? "text-brand-accent z-10" : ""} />
          Lançamentos em Aberto ({transactions.filter(t => t.status !== 'paid').length})
        </button>
        
        <button
          onClick={() => {
            setViewTab('liquidated');
            setLiquidatedSubTab('all');
          }}
          className={cn(
            "px-8 py-4.5 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2",
            viewTab === 'liquidated' 
              ? "border-brand-accent text-white" 
              : "border-transparent text-zinc-500 hover:text-zinc-350"
          )}
        >
          <CheckCircle2 size={14} className={viewTab === 'liquidated' ? "text-brand-accent z-10" : ""} />
          Contas Liquidadas ({transactions.filter(t => t.status === 'paid').length})
        </button>
      </div>

      {/* Filters & Table */}
      <div className="space-y-6">
        {/* Painel do Resumo de Liquidadas, se aplicável */}
        {viewTab === 'liquidated' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/10 border border-zinc-900 p-5 rounded-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between md:border-r md:border-zinc-900/60 pr-0 md:pr-6 pb-4 md:pb-0">
              <div>
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">Total de Contas Pagas (Despesas)</p>
                <p className="text-xl font-black text-white tracking-tighter mt-1">
                  R$ {transactions.filter(t => t.status === 'paid' && t.type === 'payable').reduce((sum, t) => sum + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <ArrowDownCircle size={18} />
              </div>
            </div>
            <div className="flex items-center justify-between pl-0 md:pl-6 pt-4 md:pt-0">
              <div>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Total de Contas Recebidas (Receitas)</p>
                <p className="text-xl font-black text-white tracking-tighter mt-1">
                  R$ {transactions.filter(t => t.status === 'paid' && t.type === 'receivable').reduce((sum, t) => sum + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ArrowUpCircle size={18} />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl w-full max-w-md">
            <div className="pl-4 text-zinc-500"><Search size={18} /></div>
            <input 
              type="text" 
              placeholder="Buscar por descrição ou fornecedor..." 
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-white w-full placeholder:text-zinc-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {viewTab === 'active' ? (
              <>
                <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterType === 'all' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
                  >Todos</button>
                  <button 
                    onClick={() => setFilterType('payable')}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterType === 'payable' ? "bg-rose-500/20 text-rose-500 shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
                  >Pagar</button>
                  <button 
                    onClick={() => setFilterType('receivable')}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterType === 'receivable' ? "bg-emerald-500/20 text-emerald-500 shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
                  >Receber</button>
                </div>

                <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                  <button 
                    onClick={() => setFilterStatus('all')}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterStatus === 'all' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
                  >Geral</button>
                  <button 
                    onClick={() => setFilterStatus('overdue')}
                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterStatus === 'overdue' ? "bg-rose-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
                  >Atrasados</button>
                </div>
              </>
            ) : (
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                <button 
                  onClick={() => setLiquidatedSubTab('all')}
                  className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", liquidatedSubTab === 'all' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
                >Todos os Liquidados</button>
                <button 
                  onClick={() => setLiquidatedSubTab('payable')}
                  className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", liquidatedSubTab === 'payable' ? "bg-rose-500/20 text-rose-500 shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
                >Contas Pagas</button>
                <button 
                  onClick={() => setLiquidatedSubTab('receivable')}
                  className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", liquidatedSubTab === 'receivable' ? "bg-emerald-500/20 text-emerald-500 shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
                >Contas Recebidas</button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/30 rounded-[2rem] border border-zinc-900 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-950/50">
                <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Vencimento / Status</th>
                <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Descrição / Fornecedor</th>
                <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Valor</th>
                <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredTransactions.map(transaction => {
                const isOverdue = transaction.status !== 'paid' && isBefore(parseISO(transaction.dueDate), now);
                
                return (
                  <tr key={transaction.id} className="group hover:bg-zinc-900/60 transition-all cursor-pointer">
                    <td onClick={() => setSelectedTransactionForEdit(transaction)} className="p-6">
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-black text-zinc-100 tabular-nums">
                          {format(parseISO(transaction.dueDate), 'dd/MM/yyyy')}
                        </p>
                        <span className={cn(
                          "text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest w-fit border",
                          transaction.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          isOverdue ? "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {transaction.status === 'paid' ? 'LIQUIDADO' : 
                           isOverdue ? 'ATRASADO' : 'PENDENTE'}
                        </span>
                      </div>
                    </td>
                    <td onClick={() => setSelectedTransactionForEdit(transaction)} className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {transaction.type === 'payable' ? 
                            <ArrowDownCircle size={14} className="text-rose-500" /> : 
                            <ArrowUpCircle size={14} className="text-emerald-500" />
                          }
                          <p className="text-xs font-black text-white uppercase group-hover:text-brand-accent transition-colors">{transaction.description}</p>
                        </div>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-5">
                          {transaction.supplier ? `${transaction.supplier} • ` : ''}
                          {transaction.category}
                        </p>
                        {transaction.observations && (
                          <p className="text-[9px] text-zinc-500 font-medium italic uppercase tracking-wider ml-5 mt-1 border-l-2 border-brand-accent/30 pl-2">
                            Nota: {transaction.observations}
                          </p>
                        )}
                      </div>
                    </td>
                    <td onClick={() => setSelectedTransactionForEdit(transaction)} className="p-6 text-right">
                      <p className={cn(
                        "text-sm font-black tabular-nums tracking-tighter",
                        transaction.type === 'payable' ? "text-rose-400" : "text-emerald-400"
                      )}>
                        {transaction.type === 'payable' ? '-' : '+'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="p-6 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {transaction.type === 'receivable' && (
                        <button 
                          onClick={() => {
                            setSelectedBoleto({
                              description: transaction.description,
                              amount: transaction.amount,
                              dueDate: transaction.dueDate,
                              supplier: transaction.supplier || 'CLIENTE COBRADO'
                            });
                          }}
                          className="w-10 h-10 bg-zinc-800 hover:bg-brand-accent hover:text-zinc-950 text-zinc-500 rounded-xl transition-all flex items-center justify-center border border-zinc-700 shadow-sm group-hover:border-brand-accent/50"
                          title="Imprimir Carnê / Boleto"
                        >
                          <Printer size={16} />
                        </button>
                      )}
                      {transaction.status !== 'paid' && (
                        <button 
                          onClick={() => onUpdateStatus(transaction.id, 'paid')}
                          className="w-10 h-10 bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-500 rounded-xl transition-all flex items-center justify-center border border-zinc-700 shadow-sm group-hover:border-emerald-500/50"
                          title="Marcar como Pago"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => setDeleteConfirm({ isOpen: true, id: transaction.id })}
                        className="w-10 h-10 bg-zinc-800 hover:bg-rose-500 hover:text-white text-zinc-500 rounded-xl transition-all flex items-center justify-center border border-zinc-700 shadow-sm opacity-0 group-hover:opacity-100"
                        title="Excluir Lançamento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <DollarSign size={40} className="text-zinc-800 mx-auto mb-6" />
                    <p className="text-xs font-black text-zinc-800 uppercase tracking-[0.4em]">Nenhum lançamento financeiro</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={processDelete}
        title="Confirmar Exclusão"
        message="Deseja excluir este lançamento financeiro definitivamente? Esta operação afetará os relatórios e balanço final."
      />

      {/* Boleto Modal for list action */}
      {selectedBoleto && (
        <BoletoModal 
          isOpen={!!selectedBoleto}
          onClose={() => setSelectedBoleto(null)}
          title={`BOLETO COBRANÇA — ${selectedBoleto.description}`}
          boletos={[{
            description: selectedBoleto.description,
            amount: selectedBoleto.amount,
            dueDate: selectedBoleto.dueDate,
            supplier: selectedBoleto.supplier,
            installmentNum: 1,
            totalInstallments: 1
          }]}
        />
      )}

      {/* Transaction Detail & Edit/Delete Modal */}
      <TransactionDetailModal
        isOpen={!!selectedTransactionForEdit}
        onClose={() => setSelectedTransactionForEdit(null)}
        transaction={selectedTransactionForEdit}
      />
    </div>
  );
};
