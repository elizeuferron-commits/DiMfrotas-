import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  UploadCloud, 
  Download, 
  Search, 
  Plus, 
  ChevronRight, 
  Info, 
  FileCheck2, 
  Bus,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Folder,
  Eye,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Vehicle } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DocumentVencimento {
  id: string;
  name: string;
  category: 'veiculos' | 'alvaras' | 'seguros' | 'fiscais_contratos' | 'outros';
  dueDate: string; // YYYY-MM-DD
  warningThreshold: number; // in days
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  pdfName: string;
  pdfSize: string;
  pdfData: string; // base64 string
  createdAt: any;
}

interface FinanceDocumentVencimentosProps {
  vehicles: Vehicle[];
  user?: any;
}

export const FinanceDocumentVencimentos = ({ vehicles, user }: FinanceDocumentVencimentosProps) => {
  const [documents, setDocuments] = useState<DocumentVencimento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros e buscas
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | DocumentVencimento['category']>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'regular' | 'warning' | 'expired'>('all');
  
  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentVencimento | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentVencimento | null>(null);

  // Estados do Formulário
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<DocumentVencimento['category']>('veiculos');
  const [formDueDate, setFormDueDate] = useState('');
  const [formThreshold, setFormThreshold] = useState(30);
  const [formVehicleId, setFormVehicleId] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [pdfSize, setPdfSize] = useState('');
  const [pdfData, setPdfData] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isExtractingWithAi, setIsExtractingWithAi] = useState(false);

  // Carregar documentos do Firestore
  useEffect(() => {
    const q = query(collection(db, 'finance_documents'), orderBy('dueDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DocumentVencimento[];
      setDocuments(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'finance_documents');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Extrair dados do PDF com Inteligência Artificial (Gemini)
  const handleExtractData = async (base64Str: string) => {
    if (!base64Str) return;
    setIsExtractingWithAi(true);
    const toastId = toast.loading('Inteligência Artificial lendo e extraindo dados do PDF...');
    try {
      const cleanBase64 = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
      const response = await fetch('/api/finance/scan-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base64Data: cleanBase64,
          mimeType: 'application/pdf'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar PDF.');
      }

      const extractedData = await response.json();
      const fieldsUpdated: string[] = [];

      if (extractedData.description) {
        setFormName(extractedData.description.toUpperCase());
        fieldsUpdated.push('Título');
      } else if (extractedData.packageName) {
        setFormName(extractedData.packageName.toUpperCase());
        fieldsUpdated.push('Título');
      }

      if (extractedData.dueDate) {
        setFormDueDate(extractedData.dueDate);
        fieldsUpdated.push('Vencimento');
      }

      // Tentar associar veículo se houver placa identificada
      if (extractedData.vehiclePlate) {
        const cleanPlate = extractedData.vehiclePlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const matchedVehicle = vehicles.find(v => {
          const vPlate = v.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          return vPlate.includes(cleanPlate) || cleanPlate.includes(vPlate);
        });
        if (matchedVehicle) {
          setFormVehicleId(matchedVehicle.id);
          setFormCategory('veiculos');
          fieldsUpdated.push('Veículo Vinculado');
        }
      }

      // Deduzir categoria com base em palavras-chave se não for veículo
      if (!extractedData.vehiclePlate) {
        const descText = ((extractedData.description || '') + ' ' + (extractedData.packageName || '')).toLowerCase();
        if (descText.includes('seguro') || descText.includes('apólice') || descText.includes('sinistro') || descText.includes('porto') || descText.includes('azul')) {
          setFormCategory('seguros');
          fieldsUpdated.push('Categoria (Seguros)');
        } else if (descText.includes('alvará') || descText.includes('licença') || descText.includes('sanitária') || descText.includes('prefeitura') || descText.includes('alvara') || descText.includes('licenca')) {
          setFormCategory('alvaras');
          fieldsUpdated.push('Categoria (Alvarás)');
        } else if (descText.includes('contrato') || descText.includes('prestação') || descText.includes('fiscal') || descText.includes('imposto') || descText.includes('das') || descText.includes('simples') || descText.includes('nota fiscal')) {
          setFormCategory('fiscais_contratos');
          fieldsUpdated.push('Categoria (Fiscais/Contratos)');
        }
      }

      if (fieldsUpdated.length > 0) {
        toast.success(`Leitura Concluída! Campos atualizados: ${fieldsUpdated.join(', ')}`, { id: toastId });
      } else {
        toast.info('IA leu o PDF, mas nenhum campo pôde ser preenchido automaticamente.', { id: toastId });
      }
    } catch (err: any) {
      console.error('Erro de extração com IA:', err);
      toast.error(`Falha ao ler o PDF com IA: ${err.message || 'Erro inesperado'}`, { id: toastId });
    } finally {
      setIsExtractingWithAi(false);
    }
  };

  // Handler de upload de PDF com conversão para Base64 e validação de tamanho (<800KB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione apenas arquivos de formato PDF.');
      return;
    }

    if (file.size > 800 * 1024) {
      toast.error('O arquivo PDF excede o limite de 800 KB para salvamento em nuvem durável.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      setPdfData(base64String);
      setPdfName(file.name);
      setPdfSize(`${(file.size / 1024).toFixed(1)} KB`);
      setIsUploading(false);
      toast.success('Arquivo PDF anexado com sucesso!');
      
      // Chamar extração de dados automaticamente
      await handleExtractData(base64String);
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo PDF.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Limpar formulário manualmente
  const handleClearForm = () => {
    setFormName('');
    setFormCategory('veiculos');
    setFormDueDate('');
    setFormThreshold(30);
    setFormVehicleId('');
    setPdfName('');
    setPdfSize('');
    setPdfData('');
    toast.success('Campos do formulário limpos!');
  };

  // Enviar novo documento ao Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error('Por favor, preencha o título do documento.');
      return;
    }
    if (!formDueDate) {
      toast.error('Por favor, defina a data de vencimento.');
      return;
    }
    if (!pdfData) {
      toast.error('Por favor, anexe o arquivo PDF do documento.');
      return;
    }

    try {
      let vehiclePlate = '';
      let vehicleModel = '';
      if (formVehicleId) {
        const related = vehicles.find(v => v.id === formVehicleId);
        if (related) {
          vehiclePlate = related.plate;
          vehicleModel = related.model;
        }
      }

      const docPayload = {
        name: formName.trim(),
        category: formCategory,
        dueDate: formDueDate,
        warningThreshold: Number(formThreshold),
        vehicleId: formVehicleId || null,
        vehiclePlate: vehiclePlate || null,
        vehicleModel: vehicleModel || null,
        pdfName,
        pdfSize,
        pdfData,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'finance_documents'), docPayload);
      toast.success('Documento registrado com sucesso!');
      
      // Fechar modal sem limpar os campos para manter as informações salvas para fácil reuso
      setIsNewModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'finance_documents');
    }
  };

  // Excluir documento do Firestore com segurança (evitando window.confirm)
  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    const docId = documentToDelete.id;
    try {
      await deleteDoc(doc(db, 'finance_documents', docId));
      toast.success('Documento removido com sucesso!');
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }
      setDocumentToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'finance_documents');
    }
  };

  // Lógica para processar status e dias restantes de cada documento
  const processedDocuments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mapped = documents.map(doc => {
      const expiryDate = parseISO(doc.dueDate);
      expiryDate.setHours(0, 0, 0, 0);
      
      const daysRemaining = differenceInDays(expiryDate, today);
      
      let status: 'expired' | 'warning' | 'regular' = 'regular';
      if (daysRemaining < 0) {
        status = 'expired';
      } else if (daysRemaining <= doc.warningThreshold) {
        status = 'warning';
      }

      return {
        ...doc,
        daysRemaining,
        status
      };
    });

    // Ordenar por vencimento: o próximo a vencer por primeiro (daysRemaining >= 0, ordem crescente), e consequentemente os já vencidos (daysRemaining < 0)
    return mapped.sort((a, b) => {
      const isExpiredA = a.daysRemaining < 0;
      const isExpiredB = b.daysRemaining < 0;

      // Se ambos não estão vencidos
      if (!isExpiredA && !isExpiredB) {
        return a.daysRemaining - b.daysRemaining; // Menor tempo restante primeiro
      }

      // Se ambos estão vencidos
      if (isExpiredA && isExpiredB) {
        return b.daysRemaining - a.daysRemaining; // Mais recentemente vencido primeiro (ex: -1 antes de -10)
      }

      // Se um está vencido e o outro não, o não vencido (ativo/alerta) vem primeiro
      return isExpiredA ? 1 : -1;
    });
  }, [documents]);

  // Contadores de KPIs
  const kpis = useMemo(() => {
    const expired = processedDocuments.filter(d => d.status === 'expired').length;
    const warning = processedDocuments.filter(d => d.status === 'warning').length;
    const regular = processedDocuments.filter(d => d.status === 'regular').length;
    
    return {
      total: processedDocuments.length,
      expired,
      warning,
      regular
    };
  }, [processedDocuments]);

  // Aplicar filtros e busca
  const filteredDocuments = useMemo(() => {
    return processedDocuments.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                            (doc.vehiclePlate && doc.vehiclePlate.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [processedDocuments, search, selectedCategory, selectedStatus]);

  // Obter ícone correspondente à categoria
  const getCategoryIcon = (category: DocumentVencimento['category']) => {
    switch (category) {
      case 'veiculos':
        return <Bus className="text-blue-400" size={18} />;
      case 'alvaras':
        return <FileCheck2 className="text-amber-400" size={18} />;
      case 'seguros':
        return <ShieldCheck className="text-emerald-400" size={18} />;
      case 'fiscais_contratos':
        return <FileSpreadsheet className="text-purple-400" size={18} />;
      case 'outros':
      default:
        return <Folder className="text-zinc-400" size={18} />;
    }
  };

  const getCategoryLabel = (category: DocumentVencimento['category']) => {
    switch (category) {
      case 'veiculos': return 'Veículos / Frota';
      case 'alvaras': return 'Alvarás & Licenças';
      case 'seguros': return 'Seguros';
      case 'fiscais_contratos': return 'Fiscais & Contratos';
      case 'outros': return 'Outros';
    }
  };

  // Forçar o download do PDF encapsulado
  const downloadPdf = (docItem: DocumentVencimento) => {
    try {
      const link = document.createElement('a');
      link.href = docItem.pdfData;
      link.download = docItem.pdfName || `${docItem.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download do PDF iniciado!');
    } catch (e) {
      toast.error('Erro ao baixar o arquivo PDF.');
    }
  };

  return (
    <div id="vencimentos-container" className="space-y-6">
      
      {/* Header e Botão Novo Documento */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 p-6 rounded-2xl border border-zinc-900">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
            <FileText className="text-[#ff6b00]" size={22} />
            Pasta de Documentos & Controle de Vencimentos
          </h2>
          <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wider">
            Arquivamento seguro de documentos corporativos, controle de alertas de vencimento e auditoria de arquivos PDF.
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-5 py-2.5 bg-[#ff6b00] hover:bg-[#e05e00] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10"
        >
          <Plus size={16} />
          Novo Documento
        </button>
      </div>

      {/* Grid de KPIs Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI Total */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Total de Documentos</p>
            <h3 className="text-2xl font-black text-white mt-1">{kpis.total}</h3>
          </div>
          <div className="p-3 bg-zinc-800/40 rounded-xl text-zinc-400">
            <FileText size={20} />
          </div>
        </div>

        {/* KPI Vencidos */}
        <div className={cn(
          "border p-5 rounded-2xl flex items-center justify-between transition-all",
          kpis.expired > 0 
            ? "bg-red-950/20 border-red-500/20 text-red-500" 
            : "bg-zinc-900/40 border-zinc-800 text-zinc-400"
        )}>
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Vencidos (Crítico)</p>
            <h3 className={cn("text-2xl font-black mt-1", kpis.expired > 0 ? "text-red-500" : "text-white")}>
              {kpis.expired}
            </h3>
          </div>
          <div className={cn("p-3 rounded-xl", kpis.expired > 0 ? "bg-red-500/10 text-red-500" : "bg-zinc-800/40")}>
            <AlertCircle size={20} />
          </div>
        </div>

        {/* KPI Alerta */}
        <div className={cn(
          "border p-5 rounded-2xl flex items-center justify-between transition-all",
          kpis.warning > 0 
            ? "bg-amber-950/20 border-amber-500/20 text-amber-500" 
            : "bg-zinc-900/40 border-zinc-800 text-zinc-400"
        )}>
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Vencendo nos Próximos Dias</p>
            <h3 className={cn("text-2xl font-black mt-1", kpis.warning > 0 ? "text-amber-500" : "text-white")}>
              {kpis.warning}
            </h3>
          </div>
          <div className={cn("p-3 rounded-xl", kpis.warning > 0 ? "bg-amber-500/10 text-amber-500" : "bg-zinc-800/40")}>
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* KPI Em Dia */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Documentos Em Dia</p>
            <h3 className="text-2xl font-black text-white mt-1">{kpis.regular}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Painel Principal de Filtros e Listagem */}
      <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 space-y-6">
        
        {/* Barra de Filtros */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="BUSCAR DOCUMENTO PELO TÍTULO OU PLACA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-950 border border-zinc-855 rounded-xl text-xs uppercase text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff6b00]"
            />
          </div>

          {/* Categoria */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'veiculos', 'alvaras', 'seguros', 'fiscais_contratos', 'outros'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border cursor-pointer",
                  selectedCategory === cat
                    ? "bg-[#ff6b00] border-[#ff6b00] text-white"
                    : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white"
                )}
              >
                {cat === 'all' ? 'TODOS' : getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex gap-2">
            {(['all', 'expired', 'warning', 'regular'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={cn(
                  "px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border cursor-pointer",
                  selectedStatus === st
                    ? "bg-zinc-100 border-zinc-100 text-zinc-950 font-black"
                    : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {st === 'all' ? 'STATUS: TODOS' : st === 'expired' ? '🔴 VENCIDOS' : st === 'warning' ? '🟡 ALERTA' : '🟢 EM DIA'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-zinc-800 border-t-[#ff6b00] rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest animate-pulse">Carregando documentos da nuvem...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          /* Empty State */
          <div className="py-20 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center px-4">
            <FileText className="text-zinc-600 mb-4" size={44} />
            <p className="text-sm text-zinc-300 font-bold uppercase tracking-wider">Nenhum documento encontrado</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm uppercase tracking-wider">
              Nenhum documento coincide com os filtros aplicados ou ainda não há registros nesta categoria.
            </p>
          </div>
        ) : (
          /* Lista de Documentos em Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredDocuments.map((docItem) => {
                const isExpired = docItem.status === 'expired';
                const isWarning = docItem.status === 'warning';

                return (
                  <motion.div
                    key={docItem.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "bg-zinc-950 rounded-2xl border p-5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-md group relative overflow-hidden",
                      isExpired ? "border-red-500/20 hover:border-red-500/40 shadow-red-950/5" : 
                      isWarning ? "border-amber-500/20 hover:border-amber-500/40 shadow-amber-950/5" : 
                      "border-zinc-900"
                    )}
                  >
                    {/* Efeito luminoso de status */}
                    <div className={cn(
                      "absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-2xl opacity-10 pointer-events-none",
                      isExpired ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                    )} />

                    {/* Header do Card */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                          {getCategoryIcon(docItem.category)}
                        </span>
                        
                        {/* Status Badge */}
                        <span className={cn(
                          "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border",
                          isExpired 
                            ? "bg-red-500/10 border-red-500/30 text-red-500" 
                            : isWarning 
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        )}>
                          {isExpired ? 'Vencido' : isWarning ? 'Vencendo em breve' : 'Em Dia'}
                        </span>
                      </div>

                      {/* Título e Detalhes */}
                      <div>
                        <h4 className="text-sm font-black text-white group-hover:text-[#ff6b00] transition-colors line-clamp-1 uppercase">
                          {docItem.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 uppercase mt-0.5 font-bold">
                          {getCategoryLabel(docItem.category)}
                        </p>
                      </div>

                      {/* Veículo Vinculado (Se Houver) */}
                      {docItem.vehicleId && (
                        <div className="flex items-center gap-2 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-850">
                          <Bus size={14} className="text-zinc-500" />
                          <div className="text-[9px] uppercase tracking-wider font-bold">
                            <span className="text-zinc-400">Veículo:</span>{' '}
                            <span className="text-white font-black">{docItem.vehiclePlate}</span>{' '}
                            <span className="text-zinc-500">({docItem.vehicleModel})</span>
                          </div>
                        </div>
                      )}

                      {/* Linha do Vencimento */}
                      <div className="flex items-center gap-2 text-zinc-400 text-xs py-1">
                        <Calendar size={14} className="text-zinc-500" />
                        <div className="text-[10px] uppercase font-bold tracking-wider">
                          Vence em:{' '}
                          <span className="text-zinc-200 font-black">
                            {format(parseISO(docItem.dueDate), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* Countdown de Dias */}
                      <div className={cn(
                        "text-[10px] uppercase font-black tracking-wider p-2.5 rounded-xl border",
                        isExpired 
                          ? "bg-red-500/5 border-red-500/10 text-red-500" 
                          : isWarning 
                          ? "bg-amber-500/5 border-amber-500/10 text-amber-500" 
                          : "bg-emerald-500/5 border-emerald-500/10 text-emerald-500"
                      )}>
                        {isExpired 
                          ? `⚠️ DOCUMENTO EXPIRADO HÁ ${Math.abs(docItem.daysRemaining)} DIAS` 
                          : isWarning 
                          ? `⏱️ ATENÇÃO: VENCE EM ${docItem.daysRemaining} DIAS` 
                          : `✓ OK: RESTAM ${docItem.daysRemaining} DIAS`
                        }
                      </div>
                    </div>

                    {/* Rodapé do Card com Ações */}
                    <div className="flex gap-2 mt-5 border-t border-zinc-900 pt-4">
                      
                      {/* Abrir Ficha do Documento */}
                      <button
                        onClick={() => setSelectedDocument(docItem)}
                        className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 border border-zinc-800 cursor-pointer"
                      >
                        <Eye size={13} className="text-[#ff6b00]" />
                        Ver Ficha
                      </button>

                      {/* Baixar PDF Direto */}
                      <button
                        onClick={() => downloadPdf(docItem)}
                        title="Baixar PDF original"
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Download size={13} />
                      </button>

                      {/* Remover Documento */}
                      <button
                        onClick={() => setDocumentToDelete(docItem)}
                        title="Excluir Documento"
                        className="p-2 bg-zinc-900 hover:bg-red-950/30 border border-zinc-800 hover:border-red-500/30 text-zinc-500 hover:text-red-500 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* MODAL: REGISTRAR NOVO DOCUMENTO */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 border-b border-zinc-900 pb-4 mb-5">
                <FileText className="text-[#ff6b00]" size={20} />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">Lançar Novo Documento</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Título do Documento */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Título do Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: SEGURO OBRIGATÓRIO DPVAT 2026"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 uppercase focus:outline-none focus:border-[#ff6b00]"
                  />
                </div>

                {/* Grid Categoria e Vencimento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Categoria */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Categoria *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff6b00]"
                    >
                      <option value="veiculos">VEÍCULOS / FROTA</option>
                      <option value="alvaras">ALVARÁS & LICENÇAS</option>
                      <option value="seguros">SEGUROS</option>
                      <option value="fiscais_contratos">FISCAIS & CONTRATOS</option>
                      <option value="outros">OUTROS DOCUMENTOS</option>
                    </select>
                  </div>

                  {/* Data de Vencimento */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Data de Vencimento *</label>
                    <input
                      type="date"
                      required
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff6b00]"
                    />
                  </div>
                </div>

                {/* Grid Antecedência de Alerta e Veículo Opcional */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Dias de Alerta */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Antecedência de Alerta (Dias) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={365}
                      value={formThreshold}
                      onChange={(e) => setFormThreshold(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff6b00]"
                    />
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wide">Dias antes para iniciar avisos em amarelo.</p>
                  </div>

                  {/* Veículo Opcional */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Veículo Vinculado (Opcional)</label>
                    <select
                      value={formVehicleId}
                      onChange={(e) => setFormVehicleId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff6b00]"
                    >
                      <option value="">NENHUM VEÍCULO VINCULADO</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.plate.toUpperCase()} - {v.model.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Upload Zone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Anexar Arquivo PDF *</label>
                  
                  <div className={cn(
                    "border-2 border-dashed rounded-2xl p-5 text-center flex flex-col items-center justify-center transition-all relative cursor-pointer",
                    pdfData 
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-400" 
                      : "border-zinc-800 hover:border-[#ff6b00] hover:bg-zinc-900/50 text-zinc-400"
                  )}>
                    {!pdfData && (
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    )}
                    
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-5 h-5 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin"></div>
                        <p className="text-[10px] uppercase text-zinc-500 font-bold">Processando documento...</p>
                      </div>
                    ) : isExtractingWithAi ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-5 h-5 border-2 border-amber-500 border-t-amber-200 rounded-full animate-spin mb-1"></div>
                        <Sparkles className="text-amber-500 animate-pulse" size={24} />
                        <p className="text-[10px] uppercase text-amber-500 font-black tracking-widest animate-pulse">IA EXTRAINDO DADOS...</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold">Lendo título, vencimento e dados do documento</p>
                      </div>
                    ) : pdfData ? (
                      <div className="flex flex-col items-center justify-center space-y-1 w-full">
                        <FileText className="text-emerald-500 mb-1" size={24} />
                        <p className="text-[10px] uppercase font-black text-white max-w-xs truncate">{pdfName}</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold mb-3">Tamanho: {pdfSize}</p>
                        
                        <div className="flex gap-2 w-full max-w-xs justify-center relative z-20">
                          <button
                            type="button"
                            onClick={() => {
                              setPdfData('');
                              setPdfName('');
                              setPdfSize('');
                            }}
                            className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Substituir
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExtractData(pdfData);
                            }}
                            disabled={isExtractingWithAi}
                            className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-500 hover:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Sparkles size={10} className="text-amber-500 animate-pulse" />
                            Análise IA
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1.5">
                        <UploadCloud size={28} className="text-zinc-600 group-hover:text-[#ff6b00]" />
                        <p className="text-[10px] uppercase font-black text-zinc-300">Arraste ou clique para selecionar PDF</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold">Arquivo deve ser menor que 800 KB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações do Formulário */}
                <div className="flex gap-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="px-4 py-2.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    title="Limpar todos os campos do formulário"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#ff6b00] hover:bg-[#e05e00] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10"
                  >
                    Salvar Documento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: FICHA DE DOCUMENTO (DETALHE E LEITOR PDF INTEGRADO) */}
      <AnimatePresence>
        {selectedDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-900 rounded-2xl w-full max-w-4xl p-6 h-[90vh] flex flex-col justify-between shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedDocument(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Header da Ficha */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                    {getCategoryIcon(selectedDocument.category)}
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                      Ficha do Documento: {selectedDocument.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      Categoria: {getCategoryLabel(selectedDocument.category)} • Arquivo: {selectedDocument.pdfName} ({selectedDocument.pdfSize})
                    </p>
                  </div>
                </div>

                {/* Botões rápidos */}
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPdf(selectedDocument)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download size={14} />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setDocumentToDelete(selectedDocument)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-red-950/30 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </div>

              {/* Corpo da Ficha (Meta na lateral e leitor de PDF na direita) */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden py-2">
                
                {/* Coluna Lateral: Dados e Alertas */}
                <div className="space-y-4 overflow-y-auto pr-2">
                  
                  {/* Bloco de Validade */}
                  <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Prazos e Alertas</h4>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-500">Data de Vencimento</span>
                      <p className="text-sm font-black text-white">
                        {format(parseISO(selectedDocument.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-500">Antecedência de Alerta</span>
                      <p className="text-xs text-zinc-300 font-bold uppercase">
                        {selectedDocument.warningThreshold} DIAS ANTES
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-zinc-500">Cadastro do Documento</span>
                      <p className="text-xs text-zinc-300 font-bold uppercase">
                        {selectedDocument.createdAt 
                          ? format(parseISO(selectedDocument.createdAt), "dd/MM/yyyy HH:mm") 
                          : 'HISTÓRICO'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Informações do Veículo */}
                  {selectedDocument.vehicleId && (
                    <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Veículo Vinculado</h4>
                      
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 text-zinc-400">
                          <Bus size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase">{selectedDocument.vehiclePlate}</p>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold">{selectedDocument.vehicleModel}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Histórico e Observações */}
                  <div className="bg-zinc-900/10 border border-zinc-900/40 p-4 rounded-xl text-zinc-500 text-[10px] leading-relaxed uppercase tracking-wide space-y-2">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Info size={12} className="text-[#ff6b00]" />
                      <span className="font-black">Dica de Gestão</span>
                    </div>
                    <p>
                      Mantenha sempre os documentos de frota atualizados. Os alertas são exibidos em laranja {selectedDocument.warningThreshold} dias antes do vencimento cadastrado. Após a expiração, os alertas tornam-se vermelhos.
                    </p>
                  </div>
                </div>

                {/* Coluna Central: Leitor PDF Embutido */}
                <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col overflow-hidden h-full">
                  <div className="bg-zinc-900/40 px-4 py-2 border-b border-zinc-900 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <FileText size={12} className="text-[#ff6b00]" />
                      Visualização Oficial do PDF
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">{selectedDocument.pdfSize}</span>
                  </div>
                  
                  <div className="flex-1 bg-zinc-900/20 relative">
                    {/* Renderizador de PDF via object data ou iframe */}
                    <object
                      data={selectedDocument.pdfData}
                      type="application/pdf"
                      className="w-full h-full min-h-[400px] border-none"
                    >
                      {/* Fallback no caso do browser do container não suportar visualização nativa de PDF embutida */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <FileText className="text-zinc-600 animate-pulse" size={48} />
                        <div>
                          <p className="text-xs font-black text-zinc-300 uppercase">Leitor PDF Embutido Ativo</p>
                          <p className="text-[10px] text-zinc-500 mt-1 max-w-xs uppercase">
                            Se o seu navegador não exibir o arquivo acima de forma automática, faça o download utilizando o link de ação direta abaixo.
                          </p>
                        </div>
                        <button
                          onClick={() => downloadPdf(selectedDocument)}
                          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-zinc-800 flex items-center gap-2 cursor-pointer"
                        >
                          <Download size={14} />
                          Abrir PDF em Nova Aba / Baixar
                        </button>
                      </div>
                    </object>
                  </div>
                </div>
              </div>

              {/* Rodapé da Ficha */}
              <div className="border-t border-zinc-900 pt-4 mt-2 flex justify-end">
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Fechar Ficha
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CONFIRMAR EXCLUSÃO (BLINDADO CONTRA BLOQUEIOS DE IFRAME) */}
      <AnimatePresence>
        {documentToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-red-500/20 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setDocumentToDelete(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 border-b border-zinc-900 pb-4 mb-5">
                <AlertCircle className="text-red-500 animate-bounce" size={22} />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">Confirmar Exclusão</h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-zinc-400 uppercase leading-relaxed font-bold">
                  Deseja realmente remover o documento <span className="text-white font-black">"{documentToDelete.name}"</span>?
                </p>
                <p className="text-[10px] text-red-500/80 uppercase font-black tracking-wider bg-red-950/20 p-3 border border-red-900/30 rounded-xl leading-normal">
                  ⚠️ Esta operação é irreversível e o arquivo PDF anexado será permanentemente desvinculado do banco de dados.
                </p>
              </div>

              <div className="flex gap-3 pt-6 mt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setDocumentToDelete(null)}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/10"
                >
                  <Trash2 size={14} />
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
