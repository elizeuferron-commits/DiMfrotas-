import React, { useState } from 'react';
import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Plus, 
  Calendar, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  ArrowRight,
  TrendingUp,
  Trash2
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth, isSameMonth, subMonths, eachMonthOfInterval } from 'date-fns';
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

export const Finance = ({ transactions, onAddTransaction, onUpdateStatus }: FinanceProps) => {
  const [filterType, setFilterType] = useState<'all' | 'payable' | 'receivable'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string}>({
    isOpen: false,
    id: ''
  });

  const now = new Date();
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
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const processDelete = async () => {
    try {
      await deleteDoc(doc(db, 'financial_transactions', deleteConfirm.id));
      toast.success('Lançamento financeiro removido definitivamente!');
    } catch (error) {
      toast.error('Erro ao excluir transação.');
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

        <Card className="bg-brand-accent border-transparent p-8 flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase text-zinc-950 tracking-widest mb-1">Saldo Previsto</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-black text-zinc-950 tabular-nums tracking-tighter">
              R$ {(totalReceivable - totalPayable).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="w-10 h-10 bg-zinc-950/10 rounded-xl flex items-center justify-center text-zinc-950">
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

      {/* Filters & Table */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl w-full max-w-md">
            <div className="pl-4 text-zinc-500"><Search size={18} /></div>
            <input 
              type="text" 
              placeholder="Buscar por descrição ou categoria..." 
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-white w-full placeholder:text-zinc-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button 
                onClick={() => setFilterType('all')}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterType === 'all' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
              >Todos</button>
              <button 
                onClick={() => setFilterType('payable')}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterType === 'payable' ? "bg-rose-500/20 text-rose-500 shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
              >Contas a Pagar</button>
              <button 
                onClick={() => setFilterType('receivable')}
                className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filterType === 'receivable' ? "bg-emerald-500/20 text-emerald-500 shadow-lg" : "text-zinc-600 hover:text-zinc-400")}
              >Contas a Receber</button>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/30 rounded-[2rem] border border-zinc-900 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-950/50">
                <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Vencimento / Status</th>
                <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Descrição / Categoria</th>
                <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Valor</th>
                <th className="p-6 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="group hover:bg-zinc-900/60 transition-all">
                  <td className="p-6">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-black text-zinc-100 tabular-nums">
                        {format(parseISO(transaction.dueDate), 'dd/MM/yyyy')}
                      </p>
                      <span className={cn(
                        "text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest w-fit border",
                        transaction.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        transaction.status === 'overdue' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}>
                        {transaction.status === 'paid' ? 'LIQUIDADO' : 
                         transaction.status === 'overdue' ? 'ATRASADO' : 'PENDENTE'}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {transaction.type === 'payable' ? 
                          <ArrowDownCircle size={14} className="text-rose-500" /> : 
                          <ArrowUpCircle size={14} className="text-emerald-500" />
                        }
                        <p className="text-xs font-black text-white uppercase group-hover:text-brand-accent transition-colors">{transaction.description}</p>
                      </div>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-5">{transaction.category}</p>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <p className={cn(
                      "text-sm font-black tabular-nums tracking-tighter",
                      transaction.type === 'payable' ? "text-rose-400" : "text-emerald-400"
                    )}>
                      {transaction.type === 'payable' ? '-' : '+'} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </td>
                  <td className="p-6 text-right flex items-center justify-end gap-2">
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
              ))}
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
    </div>
  );
};
