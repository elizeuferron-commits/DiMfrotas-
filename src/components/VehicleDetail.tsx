import React, { useState, useEffect, memo, useMemo } from 'react';
import { 
  Bus, 
  Wrench, 
  Fuel, 
  Calendar, 
  Users, 
  Hash, 
  Edit3,
  Clock,
  Navigation,
  BarChart3,
  DollarSign,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Printer,
  Share2,
  Trash2,
  Camera,
  Plus,
  LayoutDashboard,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  Globe,
  Map as MapIcon
} from 'lucide-react';
import { Vehicle, MaintenanceLog, FuelLog, Checklist, Employee, OperationType, Trip } from '../types';
import { format, parseISO, startOfMonth, differenceInDays, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { Modal, ConfirmModal } from './UI';
import { ChecklistForm } from './ChecklistDrawer';
import { collection, addDoc, onSnapshot, query, where, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getWarrantyStatus = (vehicle: Vehicle) => {
  const currentYear = new Date().getFullYear();
  const factoryYearNum = parseInt(vehicle.factoryYear);
  
  if (isNaN(factoryYearNum)) {
    return {
      status: 'NÃO IDENTIFICADO',
      details: 'Ano de fabricação do veículo inválido ou não cadastrado.',
      color: [161, 161, 170] as [number, number, number] // zinc-400
    };
  }
  
  const age = currentYear - factoryYearNum;
  const warrantyYears = 3;
  
  if (age <= warrantyYears) {
    return {
      status: 'SOB GARANTIA DE FÁBRICA',
      details: `Ativo com ${age} ano(s) de uso. Cobertura original de fábrica ativa (término estimado).`,
      color: [16, 185, 129] as [number, number, number] // emerald-500
    };
  } else if (age <= 5) {
    return {
      status: 'GARANTIA EXPIRADA (CONTROLE PREVENTIVO)',
      details: `Ativo com ${age} anos de uso. Fora do período original. Manutenção preventiva recomendada.`,
      color: [245, 158, 11] as [number, number, number] // amber-500
    };
  } else {
    return {
      status: 'GARANTIA EXPIRADA',
      details: `Ativo com ${age} anos de uso extenso. Exige verificações sistemáticas de segurança estrutural.`,
      color: [239, 68, 68] as [number, number, number] // red-500
    };
  }
};
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area
} from 'recharts';

interface VehicleDetailProps {
  vehicle: Vehicle;
  maintenanceHistory: MaintenanceLog[];
  fuelHistory: FuelLog[];
  employees: Employee[];
  trips?: Trip[];
  onEdit: () => void;
  onAddMaintenance?: () => void;
  onEditMaintenance?: (log: MaintenanceLog) => void;
  onDeleteMaintenance?: (id: string) => void;
  onPrintOS: (log: MaintenanceLog) => void;
  onDelete?: () => void;
}

export const VehicleDetail = memo(({ vehicle, maintenanceHistory, fuelHistory, employees, trips = [], onEdit, onAddMaintenance, onEditMaintenance, onDeleteMaintenance, onPrintOS, onDelete }: VehicleDetailProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'fuel' | 'charts' | 'checklists'>('overview');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string, type: 'vehicle' | 'fuel' | 'maintenance' | 'checklist'}>({
    isOpen: false,
    id: '',
    type: 'fuel'
  });

  useEffect(() => {
    const q = query(
      collection(db, 'checklists'),
      where('vehicleId', '==', vehicle.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Checklist[];
      setChecklists(data);
    });

    return () => unsubscribe();
  }, [vehicle.id]);

  const processDelete = async () => {
    const { id, type } = deleteConfirm;
    try {
      if (type === 'vehicle') {
        onDelete?.();
      } else if (type === 'fuel') {
        await deleteDoc(doc(db, 'fuel_logs', id));
        toast.success('Abastecimento removido.');
      } else if (type === 'maintenance') {
        await deleteDoc(doc(db, 'maintenance_history', id));
        toast.success('Manutenção removida.');
      } else if (type === 'checklist') {
        await deleteDoc(doc(db, 'checklists', id));
        toast.success('Checklist removido.');
      }
    } catch (error) {
      toast.error('Erro ao excluir item.');
    } finally {
      setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleDeleteChecklist = (id: string) => {
    setDeleteConfirm({ isOpen: true, id, type: 'checklist' });
  };

  const handleChecklistSubmit = async (data: any) => {
    setIsSubmiting(true);
    try {
      await addDoc(collection(db, 'checklists'), {
        ...data,
        vehicleId: vehicle.id
      });
      toast.success('Checklist realizado com sucesso!');
      setIsChecklistModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar checklist.');
    } finally {
      setIsSubmiting(false);
    }
  };

  const handleUpdatePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Imagem muito grande. Limite 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await updateDoc(doc(db, 'vehicles', vehicle.id), {
            photoUrl: reader.result as string,
            updatedAt: new Date().toISOString()
          });
          toast.success('Foto do veículo atualizada!');
        } catch (error) {
          toast.error('Erro ao salvar foto.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Veículo DM Turismo: ${vehicle.plate}`,
      text: `Veículo: ${vehicle.plate}\nModelo: ${vehicle.model}\nKM: ${vehicle.currentOdometer.toLocaleString()}\nStatus: ${vehicle.status === 'available' ? 'Operacional' : 'Em Manutenção'}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
          toast.error('Erro ao compartilhar veículo.');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text}\nLink: ${shareData.url}`);
        toast.success('Detalhes copiados para a área de transferência!');
      } catch (err) {
        toast.error('Erro ao copiar dados do veículo.');
      }
    }
  };

  const vehicleMaintenance = maintenanceHistory
    .filter(m => m.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

  const vehicleFuel = fuelHistory
    .filter(f => f.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleDownloadTechnicalMaintenanceReport = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // DM Turismo Branding Header
      doc.setFillColor(24, 24, 27); // Dark zinc/black header bar
      doc.rect(0, 0, 210, 38, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 107, 0); // brand-accent (#ff6b00) - DM Turismo theme
      doc.text('DM TURISMO', 14, 18);
      
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170); // zinc-400
      doc.setFont('helvetica', 'normal');
      doc.text('GESTÃO DE ATIVOS & ENGENHARIA DE FROTA', 14, 24);
      doc.text('Ficha Técnica de Manutenção e Histórico Integrado', 14, 28);
      
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO TÉCNICO', 196, 18, { align: 'right' });
      
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170); // zinc-400
      doc.setFont('helvetica', 'normal');
      doc.text(`PLACA: ${vehicle.plate.toUpperCase()}`, 196, 24, { align: 'right' });
      doc.text(`GERADO EM: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 196, 28, { align: 'right' });
      
      // Orange thin separator under header
      doc.setFillColor(255, 107, 0); // brand-accent
      doc.rect(0, 36, 210, 2, 'F');
      
      // Reset text color to default
      doc.setTextColor(24, 24, 27);
      
      // 1. Dados do Veículo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. DADOS CADASTRAIS DO ATIVO', 14, 48);
      
      const vehicleDetails = [
        ['Modelo / Veículo:', vehicle.model.toUpperCase(), 'Placa:', vehicle.plate.toUpperCase()],
        ['Tipo de Ativo:', vehicle.type === 'bus' ? 'ÔNIBUS' : 'VAN', 'Capacidade:', `${vehicle.capacity || '--'} PASSAGEIROS`],
        ['Odômetro Atual:', `${vehicle.currentOdometer?.toLocaleString() || '0'} KM`, 'Ano Fabricação:', vehicle.factoryYear || 'NÃO CONFIGURADO']
      ];
      
      autoTable(doc, {
        startY: 51,
        body: vehicleDetails,
        theme: 'plain',
        bodyStyles: { fontSize: 8.5, textColor: [39, 39, 42], fontStyle: 'normal' },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 32, textColor: [113, 113, 122] },
          1: { cellWidth: 68 },
          2: { fontStyle: 'bold', cellWidth: 28, textColor: [113, 113, 122] },
          3: { cellWidth: 52 }
        },
        margin: { left: 14, right: 14 }
      });
      
      let nextY = (doc as any).lastAutoTable.finalY + 8;
      
      // 2. Resumo da Garantia & Indicadores Financeiros
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. STATUS DE GARANTIA & INDICADORES FINANCEIROS', 14, nextY);
      
      // Calculate warranty status
      const warranty = getWarrantyStatus(vehicle);
      
      // Calculate statistics
      const totalCosts = vehicleMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
      const preventiveLogs = vehicleMaintenance.filter(m => m.type === 'preventive');
      const correctiveLogs = vehicleMaintenance.filter(m => m.type === 'corrective');
      const pendingLogs = vehicleMaintenance.filter(m => m.status === 'pending');
      const completedLogs = vehicleMaintenance.filter(m => m.status === 'completed');
      
      const financialDetails = [
        ['Status de Garantia:', warranty.status, 'Detalhamento:', warranty.details],
        ['Custos Acumulados:', `R$ ${totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Ordens de Serviço:', `${vehicleMaintenance.length} Registradas (${completedLogs.length} Concluídas, ${pendingLogs.length} Pendentes)`],
        ['Preventivas:', `${preventiveLogs.length} Manutenções`, 'Corretivas:', `${correctiveLogs.length} Manutenções`]
      ];
      
      autoTable(doc, {
        startY: nextY + 3,
        body: financialDetails,
        theme: 'plain',
        bodyStyles: { fontSize: 8.5, textColor: [39, 39, 42] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 32, textColor: [113, 113, 122] },
          1: { cellWidth: 68, fontStyle: 'bold', textColor: warranty.color }, // highlight warranty status
          2: { fontStyle: 'bold', cellWidth: 28, textColor: [113, 113, 122] },
          3: { cellWidth: 52 }
        },
        margin: { left: 14, right: 14 }
      });
      
      nextY = (doc as any).lastAutoTable.finalY + 8;
      
      // 3. Histórico Detalhado de Manutenções
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(24, 24, 27);
      doc.text('3. HISTÓRICO COMPLETO DE OFICINA', 14, nextY);
      
      if (vehicleMaintenance.length > 0) {
        const sortedMaintenance = [...vehicleMaintenance].sort((a, b) => new Date(b.completedAt || b.scheduledDate).getTime() - new Date(a.completedAt || a.scheduledDate).getTime());
        
        const mRows = sortedMaintenance.map((m, idx) => {
          // Format date
          const dateStr = m.completedAt 
            ? format(parseISO(m.completedAt), 'dd/MM/yyyy') 
            : format(parseISO(m.scheduledDate), 'dd/MM/yyyy');
          
          // Map checklist items to display what was done
          let tags = '';
          if (m.checklist) {
            const labelsMap: Record<string, string> = {
              oilChanged: 'Óleo',
              filtersChanged: 'Filtros',
              frontPadsChanged: 'Past. Diant.',
              rearPadsChanged: 'Past. Tras.',
              frontDiscsChanged: 'Disc. Diant.',
              rearDiscsChanged: 'Disc. Tras.',
              airConditioning: 'Ar Cond.',
              tires: 'Pneus',
              suspension: 'Susp.',
              transmission: 'Transm.'
            };
            const checkedItems = Object.entries(m.checklist)
              .filter(([k, v]) => v === true && k !== 'others')
              .map(([k]) => labelsMap[k] || k);
            
            if (checkedItems.length > 0) {
              tags = ` [${checkedItems.join(', ')}]`;
            }
          }
          
          return [
            String(idx + 1).padStart(2, '0'),
            m.description.toUpperCase() + tags,
            m.type === 'preventive' ? 'PREVENTIVA' : 'CORRETIVA',
            m.status === 'completed' ? 'CONCLUÍDA' : 'AGENDADA',
            dateStr,
            m.odometer ? `${m.odometer.toLocaleString()} KM` : '---',
            `R$ ${m.cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
          ];
        });
        
        autoTable(doc, {
          startY: nextY + 3,
          head: [['Nº', 'Descrição dos Serviços', 'Tipo', 'Situação', 'Data', 'Kms', 'Custo Total']],
          body: mRows,
          theme: 'grid',
          headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
          bodyStyles: { fontSize: 7.5, halign: 'center' },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
            1: { halign: 'left', cellWidth: 65 },
            2: { cellWidth: 23, halign: 'center', fontStyle: 'bold' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 22, halign: 'center' },
            6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 14, right: 14 }
        });
        
        nextY = (doc as any).lastAutoTable.finalY + 14;
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(113, 113, 122);
        doc.text('Nenhum registro de manutenção cadastrado para este veículo.', 14, nextY + 4);
        nextY += 15;
      }
      
      // Signatures
      if (nextY > 230) {
        doc.addPage();
        nextY = 40;
      } else {
        nextY = Math.max(nextY, 230);
      }
      
      doc.line(14, nextY, 90, nextY);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(113, 113, 122);
      doc.text('RESPONSÁVEL OPERACIONAL / GESTÃO DE FROTA', 14, nextY + 4);
      doc.text('DM TURISMO - GESTÃO OPERACIONAL', 14, nextY + 8);
      
      doc.line(120, nextY, 196, nextY);
      doc.text('CONTROLE DE QUALIDADE & ENGENHARIA DE FROTA', 120, nextY + 4);
      doc.text('RELAÇÃO DE AUDITORIA MECÂNICA INTEGRADA', 120, nextY + 8);
      
      doc.save(`Ficha_Tecnica_Hist_Manutencao_${vehicle.plate.replace(/\s/g, '_')}.pdf`);
      toast.success('Relatório de manutenção exportado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar relatório técnico em PDF.');
    }
  };

  // Alerts logic
  const alerts = useMemo(() => {
    const list = [];
    const today = new Date();
    const KM_THRESHOLD = 500;
    const DAYS_THRESHOLD = 30;

    // Docs
    const docItems = [
      { id: 'license', label: 'Licenciamento (CRLV)', date: vehicle.licenseExpiration },
      { id: 'insurance', label: 'Seguro APP', date: vehicle.insuranceExpiration },
      { id: 'tacografo', label: 'Cronotacógrafo', date: vehicle.tacografoExpiration },
      { id: 'municipal', label: 'Licença Municipal', date: vehicle.municipalLicenseExpiration },
      { id: 'cadastur', label: 'CADASTUR', date: vehicle.cadasturExpiration },
      { id: 'antt', label: 'ANTT', date: vehicle.anttExpiration },
      { id: 'detroArtesp', label: 'Estado (DETRO/ARTESP)', date: vehicle.detroArtespExpiration },
    ];

    docItems.forEach(doc => {
      if (!doc.date) return;
      const expDate = parseISO(doc.date);
      const daysLeft = differenceInDays(expDate, today);
      
      if (daysLeft <= 0) {
        list.push({ type: 'critical', message: `${doc.label} VENCIDO`, sub: `Venceu em ${format(expDate, 'dd/MM/yyyy')}` });
      } else if (daysLeft <= DAYS_THRESHOLD) {
        list.push({ type: 'warning', message: `${doc.label} PRÓXIMO DO VENCIMENTO`, sub: `Vence em ${daysLeft} dias (${format(expDate, 'dd/MM/yyyy')})` });
      }
    });

    // Maintenance by KM
    if (vehicle.nextOilChangeKM) {
      const kmRemaining = vehicle.nextOilChangeKM - vehicle.currentOdometer;
      if (kmRemaining <= 0) {
        list.push({ type: 'critical', message: 'TROCA DE ÓLEO VENCIDA', sub: `Atraso de ${Math.abs(kmRemaining)} KM` });
      } else if (kmRemaining <= KM_THRESHOLD) {
        list.push({ type: 'warning', message: 'TROCA DE ÓLEO PRÓXIMA', sub: `Faltam ${kmRemaining} KM` });
      }
    }

    // Maintenance by Date
    if (vehicle.nextPreventiveMaintenanceDate) {
      const maintDate = parseISO(vehicle.nextPreventiveMaintenanceDate);
      const daysLeft = differenceInDays(maintDate, today);

      if (daysLeft <= 0) {
        list.push({ type: 'critical', message: 'MANUTENÇÃO PREVENTIVA ATRASADA', sub: `Deveria ter ocorrido em ${format(maintDate, 'dd/MM/yyyy')}` });
      } else if (daysLeft <= 15) {
        list.push({ type: 'warning', message: 'MANUTENÇÃO PREVENTIVA PRÓXIMA', sub: `Agendada para ${format(maintDate, 'dd/MM/yyyy')}` });
      }
    }

    return list;
  }, [vehicle]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <AlertCircle size={14} />
            Alertas de Segurança e Vencimentos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert, i) => (
              <div key={i} className={cn(
                "p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.01]",
                alert.type === 'critical' 
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                  : "bg-amber-500/10 border-amber-500/30 text-amber-500"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  alert.type === 'critical' ? "bg-rose-500 text-white" : "bg-amber-500 text-zinc-950"
                )}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight">{alert.message}</p>
                  <p className="text-[10px] font-bold opacity-70 uppercase mt-0.5">{alert.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="flex items-center gap-6">
          <label className="w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center border border-zinc-700 shadow-2xl relative overflow-hidden group cursor-pointer">
            {vehicle.photoUrl ? (
              <img src={vehicle.photoUrl} alt={vehicle.plate} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <Bus className="text-brand-accent group-hover:scale-110 transition-transform" size={36} />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleUpdatePhoto} />
          </label>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter tabular-nums">{vehicle.plate}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                vehicle.status === 'available' 
                  ? "bg-emerald-950/30 text-emerald-500 border-emerald-900/40" 
                  : "bg-amber-950/30 text-amber-500 border-amber-900/40"
              )}>
                {vehicle.status === 'available' ? 'Operacional' : 'Em Manutenção'}
              </span>
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{vehicle.model}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-zinc-700 hover:border-zinc-500"
          >
            <Share2 size={16} />
            Compartilhar
          </button>
          <button 
            onClick={onEdit}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-zinc-700 hover:border-zinc-500"
          >
            <Edit3 size={16} />
            Editar Cadastro
          </button>
          {onDelete && (
            <button 
              onClick={() => onDelete?.()}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-rose-500/30 shadow-xl"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Capacidade', value: `${vehicle.capacity} PAX`, icon: Users },
          { label: 'Km Atual', value: `${vehicle.currentOdometer.toLocaleString()} KM`, icon: Navigation },
          { label: 'Custo Manut.', value: `R$ ${vehicleMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0).toLocaleString()}`, icon: DollarSign },
          { label: 'Ano Fab.', value: vehicle.factoryYear, icon: Calendar },
          { label: 'Tipo', value: vehicle.type === 'van' ? 'VAN' : 'ÔNIBUS', icon: Hash },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
            <stat.icon size={16} className="text-zinc-600 mb-2" />
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-sm font-black text-white tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Documentação Expandida */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Documentação Base */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
           <div className="flex items-center gap-4">
            <FileSpreadsheet size={18} className="text-brand-accent" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Base Legal</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Licenciamento</span>
              <span className="text-xs font-black text-white tabular-nums">{vehicle.licenseExpiration ? format(parseISO(vehicle.licenseExpiration), 'dd/MM/yyyy') : '---'}</span>
            </div>
            <div className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Seguro APP</span>
              <span className="text-xs font-black text-white tabular-nums">{vehicle.insuranceExpiration ? format(parseISO(vehicle.insuranceExpiration), 'dd/MM/yyyy') : '---'}</span>
            </div>
            <div className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Tacógrafo</span>
              <span className="text-xs font-black text-white tabular-nums">{vehicle.tacografoExpiration ? format(parseISO(vehicle.tacografoExpiration), 'dd/MM/yyyy') : '---'}</span>
            </div>
          </div>
        </div>

        {/* Turismo Nacional/Inter */}
        <div className="p-6 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl space-y-4">
          <div className="flex items-center gap-4">
            <Globe size={18} className="text-emerald-500" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Nacional / Fed.</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-zinc-950/50 p-2 rounded-lg">
              <span className="text-[9px] font-black text-zinc-500 uppercase">CADASTUR</span>
              <span className="text-xs font-black text-white tabular-nums">{vehicle.cadasturExpiration ? format(parseISO(vehicle.cadasturExpiration), 'dd/MM/yyyy') : '---'}</span>
            </div>
            <div className="flex justify-between items-center bg-zinc-950/50 p-2 rounded-lg">
              <span className="text-[9px] font-black text-zinc-500 uppercase">ANTT</span>
              <span className="text-xs font-black text-white tabular-nums">{vehicle.anttExpiration ? format(parseISO(vehicle.anttExpiration), 'dd/MM/yyyy') : '---'}</span>
            </div>
          </div>
        </div>

        {/* Regional / Municipal */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-4">
            <MapIcon size={18} className="text-zinc-500" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Estadual / Mun.</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Estado (D/A)</span>
              <span className="text-xs font-black text-white tabular-nums">{vehicle.detroArtespExpiration ? format(parseISO(vehicle.detroArtespExpiration), 'dd/MM/yyyy') : '---'}</span>
            </div>
            <div className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Mun. / Alvará</span>
              <span className="text-xs font-black text-white tabular-nums">{vehicle.municipalLicenseExpiration ? format(parseISO(vehicle.municipalLicenseExpiration), 'dd/MM/yyyy') : '---'}</span>
            </div>
          </div>
        </div>

        {/* Manutenção Resumo */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-4">
            <Wrench size={18} className="text-zinc-500" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Próx. Prazos</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Revisão</span>
              <span className="text-xs font-black text-white tabular-nums">{vehicle.nextPreventiveMaintenanceDate ? format(parseISO(vehicle.nextPreventiveMaintenanceDate), 'dd/MM/yyyy') : '---'}</span>
            </div>
            <div className="flex justify-between items-center bg-zinc-950 p-2 rounded-lg">
              <span className="text-[9px] font-black text-zinc-500 uppercase">Troca Óleo</span>
              <span className="text-xs font-black text-white tabular-nums">{vehicle.nextOilChangeKM ? `${vehicle.nextOilChangeKM.toLocaleString()} KM` : '---'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Abastecimento - New Section */}
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Histórico de Abastecimento</h3>
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1">Detalhamento de consumo e custos por viagem</p>
          </div>
          <Fuel className="text-brand-accent/30" size={32} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data / Hora</th>
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Motorista</th>
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Qtd. (L)</th>
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Custo (R$)</th>
                <th className="pb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Odômetro (KM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {vehicleFuel.length > 0 ? vehicleFuel.map(f => (
                <tr key={f.id} className="group hover:bg-zinc-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-400 tabular-nums">
                        {format(parseISO(f.timestamp), 'dd/MM/yyyy HH:mm')}
                      </span>
                      {f.isExternal && (
                        <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter mt-0.5">
                          Externo: {f.location}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-[10px] font-black text-white uppercase">
                    {employees.find(e => e.id === f.driverId)?.name || '---'}
                  </td>
                  <td className="py-4 text-[10px] font-black text-brand-accent tabular-nums text-right">
                    {f.quantity.toLocaleString()}
                  </td>
                  <td className="py-4 text-[10px] font-black text-white tabular-nums text-right">
                    R$ {f.cost.toLocaleString()}
                  </td>
                  <td className="py-4 text-[10px] font-black text-zinc-300 tabular-nums text-right">
                    {f.odometer.toLocaleString()}
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <button 
                      onClick={() => setDeleteConfirm({ isOpen: true, id: f.id, type: 'fuel' })}
                      className="p-2 text-zinc-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                    Nenhum abastecimento registrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Tabs */}
      <div className="space-y-6">
        <div className="flex items-center p-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl w-fit overflow-x-auto">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0",
              activeTab === 'overview' ? "bg-zinc-800 text-brand-accent shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <LayoutDashboard size={14} />
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('maintenance')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'maintenance' ? "bg-zinc-800 text-brand-accent shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Wrench size={14} />
            Manutenção
          </button>
          <button 
            onClick={() => setActiveTab('checklists')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'checklists' ? "bg-zinc-800 text-brand-accent shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <ClipboardCheck size={14} />
            Checklist
          </button>
          <button 
            onClick={() => setActiveTab('charts')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'charts' ? "bg-zinc-800 text-brand-accent shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <BarChart3 size={14} />
            Desempenho
          </button>
        </div>

        <div className="min-h-[350px]">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
               {/* Resumo de Manutenção Proativa */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-3">
                      <Wrench size={14} className="text-brand-accent" />
                      Próximas Intervenções
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl relative overflow-hidden group">
                        <div className="flex justify-between items-start relative z-10">
                           <div>
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Troca de Óleo</p>
                              <p className="text-2xl font-black text-white tabular-nums">
                                {vehicle.nextOilChangeKM ? `${vehicle.nextOilChangeKM.toLocaleString()} KM` : '---'}
                              </p>
                           </div>
                           {vehicle.nextOilChangeKM && (
                             <div className="text-right">
                                <p className={cn(
                                  "text-sm font-black italic",
                                  (vehicle.nextOilChangeKM - vehicle.currentOdometer) <= 1000 ? "text-rose-500" : "text-emerald-500"
                                )}>
                                  {vehicle.nextOilChangeKM - vehicle.currentOdometer <= 0 
                                    ? `ATRASADO: ${Math.abs(vehicle.nextOilChangeKM - vehicle.currentOdometer)} KM`
                                    : `FALTAM: ${vehicle.nextOilChangeKM - vehicle.currentOdometer} KM`}
                                </p>
                             </div>
                           )}
                        </div>
                        <div className="mt-4 h-1 bg-zinc-800 rounded-full overflow-hidden">
                           <div 
                             className={cn("h-full transition-all duration-1000", (vehicle.nextOilChangeKM && vehicle.nextOilChangeKM - vehicle.currentOdometer <= 1000) ? "bg-rose-500" : "bg-emerald-500")}
                             style={{ width: vehicle.nextOilChangeKM ? `${Math.max(5, Math.min(100, (1 - (vehicle.nextOilChangeKM - vehicle.currentOdometer) / 10000) * 100))}%` : '0%' }}
                           />
                        </div>
                     </div>

                     <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl relative overflow-hidden group">
                        <div className="flex justify-between items-start relative z-10">
                           <div>
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Preventiva Agendada</p>
                              <p className="text-2xl font-black text-white">
                                {vehicle.nextPreventiveMaintenanceDate ? format(parseISO(vehicle.nextPreventiveMaintenanceDate), 'dd/MM/yyyy') : '---'}
                              </p>
                           </div>
                           {vehicle.nextPreventiveMaintenanceDate && (
                             <div className="text-right">
                                <p className={cn(
                                  "text-sm font-black italic",
                                  differenceInDays(parseISO(vehicle.nextPreventiveMaintenanceDate), new Date()) <= 15 ? "text-rose-500" : "text-emerald-500"
                                )}>
                                  {differenceInDays(parseISO(vehicle.nextPreventiveMaintenanceDate), new Date()) < 0 
                                    ? 'DATA ULTRAPASSADA'
                                    : `EM ${differenceInDays(parseISO(vehicle.nextPreventiveMaintenanceDate), new Date())} DIAS`}
                                </p>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Viagens Recentes/Ativas */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-3">
                      <TrendingUp size={14} className="text-emerald-500" />
                      Atividade Recente
                    </h3>
                    <div className="space-y-2">
                       {trips.filter(t => t.vehicleId === vehicle.id).slice(0, 3).map(trip => (
                         <div key={trip.id} className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-800 flex justify-between items-center group hover:bg-zinc-800 transition-all">
                            <div className="flex items-center gap-4">
                               <div className={cn(
                                 "w-10 h-10 rounded-lg flex items-center justify-center",
                                 trip.status === 'active' ? "bg-emerald-500/20 text-emerald-500" : "bg-zinc-700 text-zinc-400"
                               )}>
                                  <MapPin size={18} />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-white uppercase">{trip.destination}</p>
                                  <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">{format(parseISO(trip.startDate), 'dd/MM/yyyy')}</p>
                               </div>
                            </div>
                            <span className={cn(
                              "px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest",
                              trip.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-950 text-zinc-600"
                            )}>
                              {trip.status === 'active' ? 'EM CURSO' : 'FINALIZADA'}
                            </span>
                         </div>
                       ))}
                       {trips.filter(t => t.vehicleId === vehicle.id).length === 0 && (
                         <p className="text-[10px] font-black text-zinc-700 uppercase p-8 text-center bg-zinc-950 rounded-2xl border border-dashed border-zinc-800">Nenhuma viagem registrada</p>
                       )}
                    </div>
                  </div>
               </div>

               {/* Resumo Financeiro / Eficiência */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-3">
                      <BarChart3 size={14} className="text-blue-500" />
                      Indicadores de Desempenho
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                        <TrendingUp size={24} className="text-emerald-500 mb-4 opacity-50" />
                        <p className="text-2xl font-black text-white tabular-nums">
                          {vehicleFuel.length > 0 ? (vehicleFuel.reduce((acc, f) => acc + f.quantity, 0) / vehicleFuel.length).toFixed(1) : '0'}
                          <span className="text-xs text-zinc-600 ml-1">L/avg</span>
                        </p>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Média Abastecimento</p>
                     </div>
                     <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                        <DollarSign size={24} className="text-blue-500 mb-4 opacity-50" />
                        <p className="text-2xl font-black text-white tabular-nums">
                          {vehicleMaintenance.length > 0 ? (vehicleMaintenance.reduce((acc, m) => acc + (m.cost || 0), 0) / vehicleMaintenance.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0'}
                        </p>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Ticket Médio Oficina</p>
                     </div>
                  </div>

                  <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-[2rem] space-y-4">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
                           <LayoutDashboard size={20} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Saúde Geral do Ativo</p>
                           <p className="text-sm font-black text-white uppercase">Selo de Qualidade DM</p>
                        </div>
                     </div>
                     <div className="h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
                        <div className="h-full bg-zinc-700" style={{ width: '15%' }} />
                     </div>
                     <p className="text-[9px] font-bold text-zinc-600 leading-relaxed italic">
                       Este veículo encontra-se com 85% de conformidade operacional baseado nos últimos checklists e manutenções preventivas.
                     </p>
                  </div>
               </div>
            </div>
          ) : activeTab === 'maintenance' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Resumo de Manutenção e Próximos Passos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wrench size={80} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Calendar size={14} className="text-brand-accent" />
                      Próxima Revisão Preventiva
                    </h3>
                    <div className="flex items-end gap-3">
                      <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                        {vehicle.nextPreventiveMaintenanceDate ? format(parseISO(vehicle.nextPreventiveMaintenanceDate), 'dd/MM/yyyy') : 'NÃO AGENDADA'}
                      </span>
                      {vehicle.nextPreventiveMaintenanceDate && (
                        <span className={cn(
                          "px-2 py-1 rounded text-[8px] font-black uppercase mb-1",
                          differenceInDays(parseISO(vehicle.nextPreventiveMaintenanceDate), new Date()) <= 7 
                            ? "bg-rose-500 text-white" 
                            : "bg-emerald-500 text-black"
                        )}>
                          {differenceInDays(parseISO(vehicle.nextPreventiveMaintenanceDate), new Date())} DIAS
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={80} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Hash size={14} className="text-brand-accent" />
                      Próxima Troca de Óleo
                    </h3>
                    <div className="flex items-end gap-3">
                      <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                        {vehicle.nextOilChangeKM ? `${vehicle.nextOilChangeKM.toLocaleString()} KM` : 'NÃO DEFINIDO'}
                      </span>
                      {vehicle.nextOilChangeKM && (
                        <span className={cn(
                          "px-2 py-1 rounded text-[8px] font-black uppercase mb-1",
                          (vehicle.nextOilChangeKM - vehicle.currentOdometer) <= 1500 
                            ? "bg-rose-500 text-white" 
                            : "bg-emerald-500 text-black"
                        )}>
                          {(vehicle.nextOilChangeKM - vehicle.currentOdometer).toLocaleString()} KM
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Ação Rápida: Registrar Manutenção */}
              <button 
                onClick={onAddMaintenance}
                className="w-full p-8 bg-brand-accent/5 border border-brand-accent/20 rounded-3xl group hover:bg-brand-accent/10 hover:border-brand-accent/40 transition-all flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
              >
                <div className="absolute -right-12 -bottom-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <Wrench size={240} className="text-brand-accent" />
                </div>
                
                <div className="flex items-center gap-6 relative z-10 text-center md:text-left">
                  <div className="p-5 bg-brand-accent text-zinc-950 rounded-2xl shadow-xl shadow-brand-accent/20">
                    <Plus size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Registrar Manutenção</h4>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Clique aqui para abrir a ficha de serviço e cronograma</p>
                  </div>
                </div>

                <div className="relative z-10 bg-brand-accent px-6 py-3 rounded-xl text-zinc-950 text-[10px] font-black uppercase tracking-widest group-hover:px-8 transition-all">
                  Nova Ordem de Serviço
                </div>
              </button>

              <div className="flex items-center justify-between mt-8 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-accent/10 rounded-xl">
                    <Wrench className="text-brand-accent" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Histórico de Oficina</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Gestão de ordens e preventivas</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadTechnicalMaintenanceReport}
                  className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 hover:border-brand-accent hover:text-brand-accent text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                  <FileSpreadsheet size={14} />
                  Exportar Relatório PDF
                </button>
              </div>

              <div className="space-y-4">
                {vehicleMaintenance.length === 0 ? (
                  <div className="p-12 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
                    <Wrench className="mx-auto text-zinc-800 mb-4" size={48} />
                    <p className="text-sm font-black text-zinc-600 uppercase tracking-widest">Nenhuma manutenção encontrada</p>
                  </div>
                ) : (
                  vehicleMaintenance.sort((a, b) => new Date(b.completedAt || b.scheduledDate).getTime() - new Date(a.completedAt || a.scheduledDate).getTime()).map((m) => (
                    <div key={m.id} className="group p-6 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-zinc-700 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "p-4 rounded-2xl shrink-0",
                            m.type === 'preventive' ? "bg-emerald-500/10 text-emerald-500" : m.type === 'corrective' ? "bg-rose-500/10 text-rose-500" : "bg-zinc-800 text-zinc-500"
                          )}>
                            <Wrench size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-sm font-black text-white uppercase tracking-widest">{m.description}</h4>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                                m.type === 'preventive' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              )}>
                                {m.type === 'preventive' ? 'Preventiva' : 'Corretiva'}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                              {m.completedAt 
                                ? `Concluída em ${format(parseISO(m.completedAt), 'dd MMM yyyy')}` 
                                : `Agendada para ${format(parseISO(m.scheduledDate), 'dd MMM yyyy')}`}
                              <span className="mx-2">•</span>
                              KM: {m.odometer?.toLocaleString() || '---'}
                            </p>
                            
                            {(m.nextMaintenanceKM || m.nextPreventiveMaintenanceDate) && (
                              <div className="flex items-center gap-3 p-1.5 px-2 bg-zinc-950/50 border border-zinc-800/50 rounded-lg w-fit">
                                <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Previsão:</span>
                                {m.nextMaintenanceKM && (
                                  <div className="flex items-center gap-1">
                                    <Hash size={8} className="text-brand-accent" />
                                    <span className="text-[8px] font-black text-zinc-300 tabular-nums">{m.nextMaintenanceKM.toLocaleString()} KM</span>
                                  </div>
                                )}
                                {m.nextPreventiveMaintenanceDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar size={8} className="text-brand-accent" />
                                    <span className="text-[8px] font-black text-zinc-300">{format(parseISO(m.nextPreventiveMaintenanceDate), 'dd/MM/yyyy')}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/50">
                          <div className="text-right px-4 border-r border-zinc-800">
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Custo Total</p>
                            <p className="text-lg font-black text-white tabular-nums tracking-tight">R$ {m.cost?.toLocaleString() || '0,00'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                if (window.confirm('Tem certeza que deseja excluir esta manutenção?')) {
                                  onDeleteMaintenance?.(m.id || '');
                                }
                              }}
                              className="p-3 bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-500 text-zinc-500 rounded-xl transition-all"
                              title="Excluir Registro"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button 
                              onClick={() => onPrintOS?.(m)}
                              className="p-3 bg-brand-accent text-zinc-950 rounded-xl transition-all shadow-lg shadow-brand-accent/10"
                              title="Imprimir Ordem de Serviço"
                            >
                              <FileSpreadsheet size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {m.checklist && (
                        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-zinc-800/50">
                          {Object.entries(m.checklist)
                            .filter(([k, v]) => v === true && k !== 'others')
                            .map(([k]) => {
                              const labels: any = {
                                oilChanged: 'Troca de Óleo',
                                filtersChanged: 'Filtros',
                                frontPadsChanged: 'Pastilha Diant.',
                                rearPadsChanged: 'Pastilha Tras.',
                                frontDiscsChanged: 'Disco Diant.',
                                rearDiscsChanged: 'Disco Tras.',
                                airConditioning: 'Ar Condicionado',
                                tires: 'Pneus',
                                suspension: 'Suspensão',
                                transmission: 'Transmissão',
                                bathroom: 'Banheiro',
                                minibar: 'Frigobar',
                                airSuspension: 'Susp. Ar',
                                tachograph: 'Tacógrafo',
                                slidingDoor: 'Porta de Correr',
                                step: 'Estribo',
                                rearSeat: 'Bancos'
                              };
                              return (
                                <span key={k} className="px-2 py-1 bg-zinc-800 text-zinc-500 rounded-md text-[7px] font-black uppercase tracking-widest border border-zinc-700">
                                  {labels[k] || k}
                                </span>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'checklists' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Checklists Operacionais</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Vistorias periódicas realizadas</p>
                </div>
                <button 
                  onClick={() => setIsChecklistModalOpen(true)}
                  className="px-4 py-2 bg-brand-accent text-zinc-950 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Nova Vistoria
                </button>
              </div>

              <div className="space-y-3">
                {checklists.length > 0 ? checklists.map(c => (
                  <div key={c.id} className="p-5 bg-zinc-800/30 border border-zinc-800/50 rounded-2xl flex justify-between items-center group hover:bg-zinc-800/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-600">
                        <ClipboardCheck size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-white uppercase">{c.responsible}</span>
                      <p className="text-[9px] text-zinc-500 font-black uppercase mt-1">{format(parseISO(c.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-black text-white tabular-nums">{c.odometer.toLocaleString()} KM</p>
                      <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Odômetro</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {c.items.filter(i => i.status === 'issue').length > 0 ? (
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 border border-rose-500/30" title="Avarias encontradas">
                          <AlertCircle size={12} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/30" title="Tudo OK">
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ isOpen: true, id: c.id, type: 'checklist' });
                        }}
                        className="p-2 text-zinc-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir Checklist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                )) : (
                  <div className="p-16 text-center bg-zinc-950 rounded-3xl border border-dashed border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nenhuma vistoria realizada neste veículo</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Consumo Mensal de Diesel</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Análise de volume por período</p>
                </div>
              </div>
              
              <div className="h-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={
                      // Group fuel by month
                      Object.values(vehicleFuel.reduce((acc: any, log) => {
                        if (!log.timestamp) return acc;
                        const month = format(parseISO(log.timestamp), 'MMM', { locale: ptBR });
                        if (!acc[month]) acc[month] = { name: month, volume: 0 };
                        acc[month].volume += log.quantity;
                        return acc;
                      }, {}))
                    }>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#71717a' }} />
                    <Tooltip 
                      contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Bar dataKey="volume" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Relação Litros x Odômetro</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Análise de volume por quilometragem</p>
                </div>
              </div>

              <div className="h-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis 
                      type="number" 
                      dataKey="odometer" 
                      name="Odômetro" 
                      unit="km" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#71717a' }} 
                      domain={['auto', 'auto']}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="quantity" 
                      name="Quantidade" 
                      unit="L" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#71717a' }} 
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Scatter name="Abastecimentos" data={vehicleFuel.map(f => ({ ...f, quantity: f.quantity, odometer: f.odometer }))} fill="#f59e0b" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Abastecido</p>
                  <p className="text-xl font-black text-white tabular-nums">
                    {vehicleFuel.reduce((acc, f) => acc + f.quantity, 0).toLocaleString()} <span className="text-xs text-zinc-500">L</span>
                  </p>
                </div>
                <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Média de Abastecimento</p>
                  <p className="text-xl font-black text-white tabular-nums">
                    {vehicleFuel.length > 0 
                      ? Math.round(vehicleFuel.reduce((acc, f) => acc + f.quantity, 0) / vehicleFuel.length) 
                      : 0} <span className="text-xs text-zinc-500">L</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isChecklistModalOpen} 
        onClose={() => setIsChecklistModalOpen(false)}
        title="Checklist Operacional"
      >
        <ChecklistForm 
          onSubmit={handleChecklistSubmit}
          loading={isSubmiting}
        />
      </Modal>

      <ConfirmModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={processDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este item definitivamente? Esta ação não pode ser revertida."
      />
    </div>
  );
});
