import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Tag, FileText, Hash, Barcode, Scan, Building, Layers, Eye, Printer } from 'lucide-react';
import { Input, Select, Textarea } from './UI';
import { DocumentScanner } from './DocumentScanner';
import { BoletoModal } from './BoletoModal';

interface FinancialFormProps {
  type: 'payable' | 'receivable';
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

/**
 * Helper to add months to date string safely, keeping the closest calendar day.
 */
const addMonthsToDateStr = (dateStr: string, monthsToAdd: number): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  const currentDay = date.getDate();
  date.setMonth(date.getMonth() + monthsToAdd);
  if (date.getDate() !== currentDay) {
    date.setDate(0); // Rollback to last day of previous month helper
  }
  return date.toISOString().split('T')[0];
};

/**
 * Helper to format barcode as Brazilian Banco Central standard (47 digits "linha digitável"):
 * 00000.00000 00000.000000 00000.000000 0 00000000000000 (47 numeric digits)
 */
const formatBoletoBarcode = (value: string): string => {
  const nums = value.replace(/\D/g, '').slice(0, 47);
  
  const part1_1 = nums.slice(0, 5);
  const part1_2 = nums.slice(5, 10);
  const part2_1 = nums.slice(10, 15);
  const part2_2 = nums.slice(15, 21);
  const part3_1 = nums.slice(21, 26);
  const part3_2 = nums.slice(26, 32);
  const part4   = nums.slice(32, 33);
  const part5   = nums.slice(33, 47);

  let formatted = '';

  if (nums.length > 0) {
    formatted += part1_1;
  }
  if (nums.length > 5) {
    formatted += '.' + part1_2;
  }
  if (nums.length > 10) {
    formatted += ' ' + part2_1;
  }
  if (nums.length > 15) {
    formatted += '.' + part2_2;
  }
  if (nums.length > 21) {
    formatted += ' ' + part3_1;
  }
  if (nums.length > 26) {
    formatted += '.' + part3_2;
  }
  if (nums.length > 32) {
    formatted += ' ' + part4;
  }
  if (nums.length > 33) {
    formatted += ' ' + part5;
  }

  return formatted;
};

/**
 * Formulário financeiro avançado com suporte a parcelas de contas a pagar e contas a receber,
 * além de gerador/impressor de carnê de boletos com código de barras, scanner OCR e código de barras.
 */
export const FinancialForm: React.FC<FinancialFormProps> = ({ type, onSubmit, isLoading }) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBoletoOpen, setIsBoletoOpen] = useState(false);
  
  // Estados para os campos controlados (necessário para preenchimento automático via scanner)
  const [formData, setFormData] = useState({
    description: '',
    supplier: '',
    category: '',
    amount: '',
    dueDate: '',
    barcode: '',
    observations: ''
  });

  // Estados extras para o controle robusto de parcelas (contas a pagar e receber)
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(3);
  const [showPreview, setShowPreview] = useState(true);
  
  const [installments, setInstallments] = useState<Array<{
    installmentNum: number;
    amount: string;
    dueDate: string;
  }>>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'barcode') {
      setFormData(prev => ({ ...prev, [name]: formatBoletoBarcode(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleInstallmentCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value || '1', 10);
    setInstallmentsCount(val);
  };

  // Gerar / recalcular as parcelas dinamicamente
  useEffect(() => {
    if (!isInstallment || !formData.amount) {
      setInstallments([]);
      return;
    }

    const count = Math.max(2, installmentsCount);
    const totalVal = parseFloat(formData.amount || '0');
    
    // Valor inicial dividido igualmente
    const baseInstallmentAmount = (totalVal / count).toFixed(2);
    
    // Distribuir dízimas com ajuste centesimal na última parcela
    const list = Array.from({ length: count }, (_, i) => {
      const instNum = i + 1;
      const computedDueDate = addMonthsToDateStr(formData.dueDate || new Date().toISOString().split('T')[0], i);
      
      let amt = baseInstallmentAmount;
      if (instNum === count) {
        // Ajuste de arredondamento
        const subTotalPrev = parseFloat(baseInstallmentAmount) * (count - 1);
        const difference = totalVal - subTotalPrev;
        amt = difference.toFixed(2);
      }

      return {
        installmentNum: instNum,
        amount: amt,
        dueDate: computedDueDate
      };
    });

    setInstallments(list);
  }, [isInstallment, formData.amount, formData.dueDate, installmentsCount, type]);

  const updateIndividualInstallmentAmount = (index: number, val: string) => {
    setInstallments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], amount: val };
      return updated;
    });
  };

  const updateIndividualInstallmentDueDate = (index: number, val: string) => {
    setInstallments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], dueDate: val };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isInstallment && installments.length > 0) {
      // Submissão parcelada: Retorna um array de novos registros independentes para o core handleFinancialSubmit
      const records = installments.map(inst => ({
        description: `${formData.description.toUpperCase()} (${inst.installmentNum}/${installmentsCount})`,
        supplier: (formData.supplier || 'N/A').toUpperCase(),
        category: formData.category,
        amount: parseFloat(inst.amount || '0'),
        dueDate: inst.dueDate,
        barcode: formData.barcode || '',
        observations: formData.observations 
          ? `${formData.observations} | Parcela ${inst.installmentNum}/${installmentsCount}`
          : `Parcela ${inst.installmentNum}/${installmentsCount}`,
        type,
        status: 'pending'
      }));
      onSubmit(records);
    } else {
      // Submissão simplificada tradicional de parcela única
      const data = {
        ...formData,
        description: formData.description.toUpperCase(),
        supplier: (formData.supplier || 'N/A').toUpperCase(),
        type,
        amount: parseFloat(formData.amount || '0'),
        status: 'pending'
      };
      onSubmit(data);
    }
  };

  const handleScanComplete = (scannedData: any) => {
    setFormData(prev => ({
      ...prev,
      description: scannedData.description || prev.description,
      supplier: scannedData.supplier || prev.supplier,
      amount: scannedData.amount?.toString() || prev.amount,
      dueDate: scannedData.dueDate || prev.dueDate,
      barcode: scannedData.barcode ? formatBoletoBarcode(scannedData.barcode) : prev.barcode
    }));
    setIsScannerOpen(false);
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

  // Dados mapeados para visualização do boleto
  const boletosData = installments.map(inst => ({
    description: formData.description || 'CONTRATO DE TURISMO',
    amount: parseFloat(inst.amount || '0'),
    dueDate: inst.dueDate,
    installmentNum: inst.installmentNum,
    totalInstallments: installmentsCount,
    supplier: formData.supplier || 'CLIENTE COBRADO'
  }));

  return (
    <div className="relative">
      {type === 'payable' && (
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-2xl flex items-center justify-center gap-3 text-brand-accent font-bold transition-all active:scale-[0.98] group"
          >
            <Scan size={20} className="group-hover:scale-110 transition-transform" />
            <span className="uppercase text-xs tracking-widest">Escanear Boleto / Documento</span>
          </button>
        </div>
      )}

      {isScannerOpen && (
        <DocumentScanner 
          onScanComplete={handleScanComplete} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            id="fin-description"
            label="Descrição" 
            name="description" 
            value={formData.description}
            onChange={handleChange}
            placeholder={type === 'payable' ? "Ex: Pagamento Mecânica Silva" : "Ex: Recebimento Viagem SP x RJ"} 
            required 
            icon={FileText} 
          />
          
          <Input 
            id="fin-supplier"
            label={type === 'payable' ? "Fornecedor / Emissor" : "Cliente / Pagador"} 
            name="supplier" 
            value={formData.supplier}
            onChange={handleChange}
            placeholder={type === 'payable' ? "Ex: Auto Posto Shell" : "Ex: João Silva de Souza"} 
            icon={Building} 
          />

          <Select 
            id="fin-category"
            label="Categoria" 
            name="category" 
            value={formData.category}
            onChange={handleChange}
            required 
            options={categories} 
            icon={Tag} 
          />

          <Input 
            id="fin-amount"
            label="Valor Total (R$)" 
            name="amount" 
            type="number" 
            step="0.01" 
            value={formData.amount}
            onChange={handleChange}
            placeholder="0,00" 
            required 
            icon={Hash} 
          />

          {/* Se não for parcelado, exibe vencimento geral */}
          {!isInstallment && (
            <Input 
              id="fin-duedate"
              label="Vencimento" 
              name="dueDate" 
              type="date" 
              value={formData.dueDate}
              onChange={handleChange}
              required 
              icon={Calendar} 
            />
          )}

          {type === 'payable' && !isInstallment && (
            <Input 
              id="fin-barcode"
              label="Código de Barras" 
              name="barcode" 
              value={formData.barcode}
              onChange={handleChange}
              placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
              maxLength={54}
              icon={Barcode} 
            />
          )}
        </div>

        {/* MÓDULO DE PARCELAMENTO */}
        {(type === 'payable' || type === 'receivable') && (
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-3xl p-6 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
                  <Layers size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Lançamento Parcelado</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                    {type === 'payable' ? 'Dividir despesa em parcelas' : 'Dividir recebimento em parcelas'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isInstallment}
                  onChange={(e) => setIsInstallment(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent peer-checked:after:bg-zinc-950"></div>
              </label>
            </div>

            {/* Configurações do parcelamento ativo */}
            {isInstallment && (
              <div className="space-y-6 pt-3 border-t border-zinc-800/60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    id="fin-installmentsCount"
                    label="Quantidade de Parcelas" 
                    name="installmentsCount"
                    type="number"
                    min="2"
                    max="72"
                    value={installmentsCount.toString()}
                    onChange={handleInstallmentCountChange}
                    required
                    icon={Layers}
                  />

                  <Input 
                    id="fin-firstDueDate"
                    label="Vencimento 1ª Parcela (Referência)" 
                    name="dueDate" 
                    type="date" 
                    value={formData.dueDate}
                    onChange={handleChange}
                    required 
                    icon={Calendar} 
                  />
                </div>

                {formData.dueDate && formData.amount && showPreview && (
                  <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Cronograma de Parcelas</span>
                      
                      <div className="flex items-center gap-3">
                        {type === 'receivable' && (
                          <button
                            type="button"
                            onClick={() => setIsBoletoOpen(true)}
                            className="px-3 py-1 bg-brand-accent/25 hover:bg-brand-accent/35 text-brand-accent rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                          >
                            <Printer size={11} strokeWidth={2.5} />
                            Gerar e Imprimir Carnê
                          </button>
                        )}
                        <span className="text-[9px] font-bold text-brand-accent bg-brand-accent/5 px-2 py-0.5 rounded-md uppercase">
                          Soma: R$ {installments.reduce((sum, inst) => sum + parseFloat(inst.amount || '0'), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {installments.map((inst, index) => (
                        <div 
                          key={inst.installmentNum} 
                          className="bg-zinc-900 border border-zinc-850 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-zinc-950 rounded-lg text-xs font-black text-brand-accent flex items-center justify-center border border-zinc-800">
                              {inst.installmentNum}x
                            </span>
                            <div>
                              <p className="text-[10px] font-black uppercase text-white tracking-widest">Parcela {inst.installmentNum} de {installmentsCount}</p>
                              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight">
                                {type === 'payable' ? 'Inserido como conta a pagar' : 'Inserido como conta a receber'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 items-center sm:w-2/3">
                            {/* Valor de cada parcela */}
                            <div className="w-full">
                              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Valor Parcela (R$)</label>
                              <input 
                                type="number" 
                                step="0.01"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white text-xs font-bold font-mono focus:outline-none focus:border-brand-accent/50"
                                value={inst.amount}
                                onChange={(e) => updateIndividualInstallmentAmount(index, e.target.value)}
                              />
                            </div>

                            {/* Vencimento de cada parcela */}
                            <div className="w-full">
                              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest pl-1">Dia / Mês Vencimento</label>
                              <input 
                                type="date" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white text-xs font-bold focus:outline-none focus:border-brand-accent/50"
                                value={inst.dueDate}
                                onChange={(e) => updateIndividualInstallmentDueDate(index, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Textarea 
          id="fin-observations"
          label="Observações" 
          name="observations" 
          value={formData.observations}
          onChange={handleChange}
          placeholder="Detalhes adicionais sobre o lançamento..." 
        />

        <button
          id="fin-submit-btn"
          type="submit"
          disabled={isLoading}
          className="w-full py-5 bg-brand-accent text-zinc-950 rounded-2xl font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <DollarSign size={18} strokeWidth={3} />
              {isInstallment ? `Lançar ${installmentsCount} Parcelas` : 'Confirmar Lançamento'}
            </>
          )}
        </button>
      </form>

      {/* Carnê de Boletos Modal */}
      {type === 'receivable' && (
        <BoletoModal 
          isOpen={isBoletoOpen} 
          onClose={() => setIsBoletoOpen(false)} 
          boletos={boletosData} 
          title={`CARNÊ DE COBRANÇA — ${formData.description.toUpperCase() || 'RECEBIMENTOS'}`}
        />
      )}
    </div>
  );
};
