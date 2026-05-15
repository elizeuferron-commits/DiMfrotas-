import React from 'react';
import { DollarSign, Calendar, Tag, FileText, Hash } from 'lucide-react';
import { Input, Select, Textarea } from './UI';

interface FinancialFormProps {
  type: 'payable' | 'receivable';
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const FinancialForm = ({ type, onSubmit, isLoading }: FinancialFormProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      type,
      description: formData.get('description'),
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount') as string),
      dueDate: formData.get('dueDate'),
      observations: formData.get('observations'),
      status: 'pending'
    };
    onSubmit(data);
  };

  const categories = type === 'payable' ? [
    { value: 'Manutenção', label: 'Manutenção' },
    { value: 'Combustível', label: 'Combustível' },
    { value: 'Peças / Estoque', label: 'Peças / Estoque' },
    { value: 'Salários / Encargos', label: 'Salários / Encargos' },
    { value: 'Impostos / Taxas', label: 'Impostos / Taxas' },
    { value: 'Seguro', label: 'Seguro' },
    { value: 'Administrativo', label: 'Administrativo' },
    { value: 'Outros', label: 'Outros' },
  ] : [
    { value: 'Viagem / Frete', label: 'Viagem / Frete' },
    { value: 'Serviço Agregado', label: 'Serviço Agregado' },
    { value: 'Reembolso', label: 'Reembolso' },
    { value: 'Venda de Ativos', label: 'Venda de Ativos' },
    { value: 'Outros', label: 'Outros' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="Descrição" 
          name="description" 
          placeholder={type === 'payable' ? "Ex: Pagamento Mecânica Silva" : "Ex: Recebimento Viagem SP x RJ"} 
          required 
          icon={FileText} 
        />
        <Select 
          label="Categoria" 
          name="category" 
          required 
          options={categories} 
          icon={Tag} 
        />
        <Input 
          label="Valor (R$)" 
          name="amount" 
          type="number" 
          step="0.01" 
          placeholder="0,00" 
          required 
          icon={Hash} 
        />
        <Input 
          label="Vencimento" 
          name="dueDate" 
          type="date" 
          required 
          icon={Calendar} 
        />
      </div>

      <Textarea 
        label="Observações" 
        name="observations" 
        placeholder="Detalhes adicionais sobre o lançamento..." 
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-5 bg-brand-accent text-zinc-950 rounded-2xl font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <DollarSign size={18} strokeWidth={3} />
            Confirmar Lançamento
          </>
        )}
      </button>
    </form>
  );
};
