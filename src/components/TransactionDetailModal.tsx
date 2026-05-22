import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, User, Trash2, CheckCircle2, Clock, AlertTriangle, Save, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { FinancialTransaction } from '../types';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FinancialTransaction | null;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const [status, setStatus] = useState<'pending' | 'paid' | 'overdue'>('pending');
  const [observations, setObservations] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Synchronize state when the modal opens with a transaction
  useEffect(() => {
    if (transaction) {
      setStatus(transaction.status);
      setObservations(transaction.observations || '');
      setConfirmDelete(false);
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: any = {
        status,
        observations: observations.trim()
      };

      if (status === 'paid') {
        updateData.paymentDate = new Date().toISOString().split('T')[0];
      } else {
        updateData.paymentDate = null;
      }

      await updateDoc(doc(db, 'financial_transactions', transaction.id), updateData);
      toast.success('Lançamento financeiro atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar lançamento:', error);
      toast.error('Erro ao salvar as atualizações do lançamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'financial_transactions', transaction.id));
      toast.success('Lançamento financeiro removido definitivamente!');
      onClose();
    } catch (error) {
      console.error('Erro ao deletar lançamento:', error);
      toast.error('Erro ao excluir lançamento financeiro.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isOverdue = transaction.status !== 'paid' && new Date(transaction.dueDate) < new Date(new Date().setHours(0,0,0,0));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[210] flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-zinc-950 border border-zinc-900 rounded-[2rem] w-full max-w-xl text-left shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              transaction.type === 'payable' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {transaction.type === 'payable' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Editar Histórico</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                {transaction.type === 'payable' ? 'Contas a Pagar / Despesa' : 'Contas a Receber / Receita'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info & Form Content */}
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Card Detalhes Rápidos */}
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h4 className="text-[10px] tracking-widest uppercase font-black text-zinc-500">Descrição do Lançamento</h4>
                <p className="text-sm font-black text-white uppercase mt-0.5">{transaction.description}</p>
              </div>
              <div className="text-right">
                <h4 className="text-[10px] tracking-widest uppercase font-black text-zinc-500">Valor total</h4>
                <p className={`text-lg font-black tracking-tighter mt-0.5 ${
                  transaction.type === 'payable' ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-900">
              <div>
                <span className="flex items-center gap-1.5 text-[8px] tracking-wider uppercase font-black text-zinc-500 mb-1">
                  <User size={10} /> {transaction.type === 'payable' ? 'Fornecedor' : 'Cliente'}
                </span>
                <p className="text-[11px] font-bold text-zinc-200 uppercase truncate">
                  {transaction.supplier || 'Nossos Clientes'}
                </p>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-[8px] tracking-wider uppercase font-black text-zinc-500 mb-1">
                  <Tag size={10} /> Categoria
                </span>
                <p className="text-[11px] font-bold text-zinc-200 uppercase truncate">
                  {transaction.category}
                </p>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-[8px] tracking-wider uppercase font-black text-zinc-500 mb-1">
                  <Calendar size={10} /> Vencimento
                </span>
                <p className="text-[11px] font-mono font-bold text-zinc-200">
                  {new Date(transaction.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-[8px] tracking-wider uppercase font-black text-zinc-500 mb-1">
                  <Clock size={10} /> Situação Atual
                </span>
                <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border mt-0.5 ${
                  transaction.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  isOverdue ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' :
                  'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {transaction.status === 'paid' ? 'LIQUIDADO' : isOverdue ? 'ATRASADO' : 'PENDENTE'}
                </span>
              </div>
            </div>
          </div>

          {/* Seletor de Status (Pago/Não Pago) */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-widest uppercase font-black text-zinc-500 block">Alterar Situação de Pagamento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all ${
                  status === 'pending'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Clock size={16} />
                {(transaction.type === 'payable' ? 'A Pagar (Pendente)' : 'A Receber')}
              </button>
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all ${
                  status === 'paid'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <CheckCircle2 size={16} />
                {(transaction.type === 'payable' ? 'Pago (Liquidado)' : 'Recebido')}
              </button>
            </div>
          </div>

          {/* Campo para Descrever Detalhes e Observações */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-widest uppercase font-black text-zinc-500 block">
              Descrever Histórico e Notas de Liquidação
            </label>
            <textarea
              className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs font-medium text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-brand-accent focus:border-brand-accent transition-all uppercase resize-none"
              placeholder="Ex: pago via pix / em mãos / boleto pago em atraso / recebido com desconto..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          {/* Área de Confirmação de Exclusão Segura */}
          {confirmDelete && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-4 duration-200">
              <div className="flex gap-2.5 items-start text-rose-500">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-wider">Confirmar Exclusão Definitiva?</h5>
                  <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase leading-tight">
                    Esta exclusão é permanente e removerá este registro do fluxo de caixa e relatórios analíticos de BI.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-[9px] font-black text-zinc-400 uppercase tracking-widest rounded-lg hover:text-white"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-all flex items-center gap-1"
                >
                  {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Actions Footer */}
        <div className="p-6 border-t border-zinc-900 flex justify-between items-center gap-3">
          {/* Delete Action button if not already confirming */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-3 bg-zinc-900 hover:bg-rose-600/10 text-zinc-500 hover:text-rose-500 rounded-xl text-xs uppercase tracking-widest border border-zinc-800 font-bold transition-all flex items-center gap-2"
              title="Excluir Lançamento"
            >
              <Trash2 size={14} />
              Apagar
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xs uppercase tracking-widest border border-zinc-800 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-3 bg-brand-accent hover:bg-brand-accent/90 text-zinc-950 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Save size={15} />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
