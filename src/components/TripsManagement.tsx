import React, { useMemo } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Globe, 
  Map, 
  SquareCheck, 
  Paperclip, 
  FileText, 
  Edit3, 
  Trash2, 
  Users, 
  User, 
  TrendingUp,
  Download,
  Wrench
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from './Cards';
import { cn } from '../lib/utils';
import { Trip, Vehicle, Employee, MaintenanceLog } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface TripsManagementProps {
  trips: Trip[];
  vehicles: Vehicle[];
  employees: Employee[];
  maintenance?: MaintenanceLog[];
  tripSearch: string;
  setTripSearch: (v: string) => void;
  tripStatusFilter: string;
  setTripStatusFilter: (v: string) => void;
  tripTypeFilter: string;
  setTripTypeFilter: (v: string) => void;
  tripDateStart: string;
  setTripDateStart: (v: string) => void;
  tripDateEnd: string;
  setTripDateEnd: (v: string) => void;
  onAddTrip: () => void;
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
  onViewOS: (trip: Trip) => void;
  onOpenAttachments: (trip: Trip) => void;
  onAddMaintenanceForVehicle?: (vehicleId: string) => void;
}

export const TripsManagement: React.FC<TripsManagementProps> = ({
  trips,
  vehicles,
  employees,
  maintenance = [],
  tripSearch,
  setTripSearch,
  tripStatusFilter,
  setTripStatusFilter,
  tripTypeFilter,
  setTripTypeFilter,
  tripDateStart,
  setTripDateStart,
  tripDateEnd,
  setTripDateEnd,
  onAddTrip,
  onEditTrip,
  onDeleteTrip,
  onViewOS,
  onOpenAttachments,
  onAddMaintenanceForVehicle
}) => {
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const matchesSearch = !tripSearch || 
        t.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.origin.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.destination.toLowerCase().includes(tripSearch.toLowerCase());
      
      const matchesStatus = tripStatusFilter === 'all' || t.status === tripStatusFilter;
      const matchesType = tripTypeFilter === 'all' || t.tripType === tripTypeFilter;
      
      let matchesDate = true;
      if (tripDateStart) {
        matchesDate = matchesDate && isAfter(parseISO(t.startDate), addDays(parseISO(tripDateStart), -1));
      }
      if (tripDateEnd) {
        matchesDate = matchesDate && isBefore(parseISO(t.startDate), addDays(parseISO(tripDateEnd), 1));
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [trips, tripSearch, tripStatusFilter, tripTypeFilter, tripDateStart, tripDateEnd]);

  // Fast PDF summary generation for clean, corporate itinerary documentation
  const handleDownloadItinerarySummary = (trip: Trip) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      const vehicle = vehicles.find(v => v.id === trip.vehicleId);
      const driver = employees.find(e => e.id === trip.driverId);
      const secondDriver = trip.secondDriverId ? employees.find(e => e.id === trip.secondDriverId) : null;
      
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
      doc.text('TRANSPORTE E FRETAMENTO DE ALTO PADRÃO', 14, 24);
      doc.text('Garagem Principal - DM Turismo', 14, 28);
      
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO DE ITINERÁRIO', 196, 18, { align: 'right' });
      
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170); // zinc-400
      doc.setFont('helvetica', 'normal');
      doc.text(`CÓDIGO: ${trip.osNumber || trip.id.slice(-6).toUpperCase()}`, 196, 24, { align: 'right' });
      doc.text(`GERADO EM: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 196, 28, { align: 'right' });
      
      // Orange thin separator under header
      doc.setFillColor(255, 107, 0); // brand-accent
      doc.rect(0, 36, 210, 2, 'F');
      
      // Reset text color to default
      doc.setTextColor(24, 24, 27);
      
      // 1. Dados da Viagem
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. INFORMAÇÕES GERAIS DA VIAGEM', 14, 48);
      
      const tripDetails = [
        ['Título da Viagem:', trip.title.toUpperCase(), 'Status:', trip.status === 'active' ? 'EM CURSO' : trip.status === 'scheduled' ? 'AGENDADA' : trip.status === 'completed' ? 'FINALIZADA' : 'CANCELADA'],
        ['Origem:', trip.origin.toUpperCase(), 'Destino:', trip.destination.toUpperCase()],
        ['Data de Partida:', format(new Date(trip.startDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }), 'Tipo:', trip.tripType === 'mercosur' ? 'MERCOSUL' : trip.tripType === 'interstate' ? 'INTERESTADUAL' : 'ESTADUAL']
      ];
      
      autoTable(doc, {
        startY: 51,
        body: tripDetails,
        theme: 'plain',
        bodyStyles: { fontSize: 8.5, textColor: [39, 39, 42], fontStyle: 'normal' },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 28, textColor: [113, 113, 122] },
          1: { cellWidth: 72 },
          2: { fontStyle: 'bold', cellWidth: 18, textColor: [113, 113, 122] },
          3: { cellWidth: 62 }
        },
        margin: { left: 14, right: 14 }
      });
      
      let nextY = (doc as any).lastAutoTable.finalY + 8;
      
      // 2. Dados de Escala (Veículo e Motoristas)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(24, 24, 27);
      doc.text('2. ESCALA OPERACIONAL (VEÍCULO & MOTORISTAS)', 14, nextY);
      
      const scaleDetails = [
        ['Veículo Escalado:', `${vehicle?.model?.toUpperCase() || 'NÃO CONFIGURADO'} (${vehicle?.plate?.toUpperCase() || 'SEM PLACA'})`, 'Capacidade:', `${vehicle?.capacity || '--'} PASSAGEIROS`],
        ['Motorista Principal:', driver ? `${driver.name.toUpperCase()} (CPF: ${driver.cpf || '--'})` : 'NÃO DEFINIDO', 'Telefone:', driver?.phone || '--'],
        ['Segundo Motorista:', secondDriver ? `${secondDriver.name.toUpperCase()} (CPF: ${secondDriver.cpf || '--'})` : 'NÃO SE APLICA', 'Telefone:', secondDriver?.phone || '--']
      ];
      
      autoTable(doc, {
        startY: nextY + 3,
        body: scaleDetails,
        theme: 'plain',
        bodyStyles: { fontSize: 8.5, textColor: [39, 39, 42] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 33, textColor: [113, 113, 122] },
          1: { cellWidth: 67 },
          2: { fontStyle: 'bold', cellWidth: 22, textColor: [113, 113, 122] },
          3: { cellWidth: 58 }
        },
        margin: { left: 14, right: 14 }
      });
      
      nextY = (doc as any).lastAutoTable.finalY + 8;
      
      // 3. Itinerário e Paradas
      if (trip.stops && trip.stops.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('3. CRONOGRAMA DE PARADAS E ITINERÁRIO', 14, nextY);
        
        const stopRows = trip.stops.map((stop, index) => [
          `${index + 1}ª PARADA`,
          stop.location.toUpperCase(),
          stop.arrivalTime ? stop.arrivalTime : '--:--'
        ]);
        
        autoTable(doc, {
          startY: nextY + 3,
          head: [['Ordem', 'Ponto / Localização', 'Horário Previsto']],
          body: stopRows,
          theme: 'grid',
          headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
          bodyStyles: { fontSize: 8, halign: 'center' },
          columnStyles: {
            0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
            1: { halign: 'left' },
            2: { cellWidth: 35, halign: 'center' }
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 14, right: 14 }
        });
        
        nextY = (doc as any).lastAutoTable.finalY + 8;
      }
      
      // 4. Lista de Passageiros Cadastrados
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`4. LISTAGEM OFICIAL DE PASSAGEIROS (${trip.passengers?.length || 0} TOTAL)`, 14, nextY);
      
      if (trip.passengers && trip.passengers.length > 0) {
        const passengerRows = trip.passengers.map((p, idx) => [
          String(idx + 1).padStart(2, '0'),
          p.name.toUpperCase(),
          p.document || '---'
        ]);
        
        autoTable(doc, {
          startY: nextY + 3,
          head: [['Nº', 'Nome Completo do Passageiro', 'Documento (RG / CPF)']],
          body: passengerRows,
          theme: 'grid',
          headStyles: { fillColor: [255, 107, 0], textColor: [24, 24, 27], fontStyle: 'bold', halign: 'center', fontSize: 8 },
          bodyStyles: { fontSize: 8, halign: 'left' },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
            1: { halign: 'left' },
            2: { cellWidth: 50, halign: 'left' }
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 14, right: 14 }
        });
        
        nextY = (doc as any).lastAutoTable.finalY + 12;
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(113, 113, 122);
        doc.text('Nenhum passageiro cadastrado nesta viagem.', 14, nextY + 4);
        nextY += 12;
      }
      
      // Notes or Observations Section
      if (trip.notes) {
        if (nextY > 240) {
          doc.addPage();
          nextY = 20;
        }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(24, 24, 27);
        doc.text('OBSERVAÇÕES ADICIONAIS:', 14, nextY);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(63, 63, 70);
        
        const splitNotes = doc.splitTextToSize(trip.notes, 182);
        doc.text(splitNotes, 14, nextY + 4);
        
        nextY += (splitNotes.length * 4) + 12;
      }
      
      // Compliance Signatures
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
      doc.text('ASSINATURA DO MOTORISTA RESPONSÁVEL', 14, nextY + 4);
      doc.text(driver ? driver.name.toUpperCase() : 'NOME DO MOTORISTA', 14, nextY + 8);
      
      doc.line(120, nextY, 196, nextY);
      doc.setTextColor(113, 113, 122);
      doc.text('RESPONSÁVEL OPERACIONAL - DM TURISMO', 120, nextY + 4);
      doc.text('DIRETORIA DE LOGÍSTICA', 120, nextY + 8);
      
      doc.save(`Resumo_Itinerario_${trip.title.replace(/\s/g, '_')}_${trip.osNumber || trip.id.slice(-6).toUpperCase()}.pdf`);
      toast.success('Itinerário PDF exportado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar resumo de itinerário em PDF.');
    }
  };

  const getWarrantyStatusText = (vehicle?: Vehicle) => {
    if (!vehicle) return 'NÃO CONFIGURADO';
    const currentYear = new Date().getFullYear();
    const factoryYearNum = parseInt(vehicle.factoryYear);
    if (isNaN(factoryYearNum)) return 'NÃO CONFIGURADO';
    const age = currentYear - factoryYearNum;
    return age <= 3 ? 'ATIVO (SOB GARANTIA DE FÁBRICA)' : 'EXPIRADA';
  };

  const getWarrantyStatus = (vehicle?: Vehicle) => {
    const currentYear = new Date().getFullYear();
    const factoryYearNum = vehicle ? parseInt(vehicle.factoryYear) : NaN;
    
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

  const handleDownloadTechnicalDossier = (trip: Trip) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const vehicle = vehicles.find(v => v.id === trip.vehicleId);
      const vehicleMaint = (maintenance || []).filter(m => m.vehicleId === trip.vehicleId);

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
      doc.text('ENGENHARIA E MANUTENÇÃO ATIVA DE FROTA', 14, 24);
      doc.text('Dossiê Técnico do Ativo Escalado', 14, 28);
      
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('DOSSIÊ TÉCNICO', 196, 18, { align: 'right' });
      
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170); // zinc-400
      doc.setFont('helvetica', 'normal');
      doc.text(`PLACA: ${vehicle?.plate?.toUpperCase() || 'S/ PLACA'}`, 196, 24, { align: 'right' });
      doc.text(`GERADO EM: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 196, 28, { align: 'right' });
      
      // Orange thin separator under header
      doc.setFillColor(255, 107, 0); // brand-accent
      doc.rect(0, 36, 210, 2, 'F');
      
      // Reset text color to default
      doc.setTextColor(24, 24, 27);
      
      // 1. Dados do Veículo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. ESPECIFICAÇÕES DO ATIVO ESCALADO', 14, 48);
      
      const vehicleDetails = [
        ['Modelo do Veículo:', vehicle?.model?.toUpperCase() || 'NÃO CONFIGURADO', 'Placa do Veículo:', vehicle?.plate?.toUpperCase() || 'NÃO CONFIGURADO'],
        ['Tipo de Ativo:', vehicle?.type === 'bus' ? 'ÔNIBUS' : 'VAN', 'Capacidade Operacional:', `${vehicle?.capacity || '--'} PASSAGEIROS`],
        ['Odômetro Atual:', `${vehicle?.currentOdometer?.toLocaleString() || '0'} KM`, 'Ano Fabricação:', vehicle?.factoryYear || 'NÃO CONFIGURADO']
      ];
      
      autoTable(doc, {
        startY: 51,
        body: vehicleDetails,
        theme: 'plain',
        bodyStyles: { fontSize: 8.5, textColor: [39, 39, 42], fontStyle: 'normal' },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 32, textColor: [113, 113, 122] },
          1: { cellWidth: 68 },
          2: { fontStyle: 'bold', cellWidth: 35, textColor: [113, 113, 122] },
          3: { cellWidth: 45 }
        },
        margin: { left: 14, right: 14 }
      });
      
      let nextY = (doc as any).lastAutoTable.finalY + 8;
      
      // Calculate Preventive vs Corrective metrics
      const totalCosts = vehicleMaint.reduce((sum, m) => sum + (m.cost || 0), 0);
      const preventiveLogs = vehicleMaint.filter(m => m.type === 'preventive');
      const correctiveLogs = vehicleMaint.filter(m => m.type === 'corrective');
      const prevCost = preventiveLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
      const corrCost = correctiveLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
      
      const prevPercentage = totalCosts > 0 ? ((prevCost / totalCosts) * 100).toFixed(1) : '100';
      const corrPercentage = totalCosts > 0 ? ((corrCost / totalCosts) * 100).toFixed(1) : '0';

      // 2. Status da Garantia & Indicadores Financeiros
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. STATUS DE GARANTIA & MIGRATIVOS DE CUSTEIO', 14, nextY);

      const warranty = getWarrantyStatus(vehicle);

      const metricsTable = [
        ['Status da Garantia:', warranty.status, 'Detalhamento:', warranty.details],
        ['Custo Total Acumulado:', `R$ ${totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Preventivas:', `${preventiveLogs.length} ordens (${prevPercentage}% do custo)`],
        ['Corretivas Totais:', `${correctiveLogs.length} ordens (${corrPercentage}% do custo)`, 'Custos Diferenciados:', `Prev: R$ ${prevCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Corr: R$ ${corrCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
      ];

      autoTable(doc, {
        startY: nextY + 3,
        body: metricsTable,
        theme: 'plain',
        bodyStyles: { fontSize: 8.5, textColor: [39, 39, 42] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 35, textColor: [113, 113, 122] },
          1: { cellWidth: 65, fontStyle: 'bold', textColor: warranty.color },
          2: { fontStyle: 'bold', cellWidth: 32, textColor: [113, 113, 122] },
          3: { cellWidth: 48 }
        },
        margin: { left: 14, right: 14 }
      });

      nextY = (doc as any).lastAutoTable.finalY + 8;

      // 3. Histórico de Peças e Componentes Aplicados
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('3. DETALHAMENTO DE PEÇAS E FLUIDOS APLICADOS', 14, nextY);

      // Collect parts from checklist
      const appliedParts: Array<[string, string, string, string, string]> = [];
      const checklistLabelMap: Record<string, string> = {
        oilChanged: 'Óleo Lubricante Motor',
        filtersChanged: 'Filtros (Ar/Óleo/Cabine)',
        frontPadsChanged: 'Pastilhas Freio Dianteiras',
        rearPadsChanged: 'Pastilhas Freio Traseiras',
        frontDiscsChanged: 'Discos Freio Dianteiros',
        rearDiscsChanged: 'Discos Freio Traseiros',
        airConditioning: 'Ar Condicionado (Gás)',
        tires: 'Pneus / Rodagem',
        suspension: 'Componentes de Suspensão',
        transmission: 'Óleo da Transmissão'
      };

      vehicleMaint.forEach(m => {
        const dateStr = m.completedAt 
          ? format(parseISO(m.completedAt), 'dd/MM/yyyy') 
          : format(parseISO(m.scheduledDate), 'dd/MM/yyyy');

        if (m.checklist) {
          Object.entries(m.checklist).forEach(([key, val]) => {
            if (val === true && key !== 'others') {
              appliedParts.push([
                dateStr,
                m.type === 'preventive' ? 'PREVENTIVA' : 'CORRETIVA',
                checklistLabelMap[key] || key,
                m.odometer ? `${m.odometer.toLocaleString()} KM` : '---',
                m.status === 'completed' ? 'SUBSTITUÍDO' : 'PENDENTE'
              ]);
            }
          });
          if (m.checklist.others && Array.isArray(m.checklist.others)) {
            m.checklist.others.forEach(otherItem => {
              if (otherItem && otherItem.trim()) {
                appliedParts.push([
                  dateStr,
                  m.type === 'preventive' ? 'PREVENTIVA' : 'CORRETIVA',
                  `Outros: ${otherItem.trim().toUpperCase()}`,
                  m.odometer ? `${m.odometer.toLocaleString()} KM` : '---',
                  m.status === 'completed' ? 'CONCLUÍDO' : 'PENDENTE'
                ]);
              }
            });
          }
        }
      });

      // Sort by date (descending)
      appliedParts.sort((a, b) => {
        const dateA = a[0].split('/').reverse().join('-');
        const dateB = b[0].split('/').reverse().join('-');
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      if (appliedParts.length > 0) {
        autoTable(doc, {
          startY: nextY + 3,
          head: [['Data', 'Classificação', 'Peça / Componente Aplicado', 'Odômetro', 'Status']],
          body: appliedParts,
          theme: 'grid',
          headStyles: { fillColor: [255, 107, 0], textColor: [24, 24, 27], fontStyle: 'bold', halign: 'center', fontSize: 8 },
          bodyStyles: { fontSize: 7.5, halign: 'center' },
          columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
            2: { halign: 'left' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 35, halign: 'center' }
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 14, right: 14 }
        });
        nextY = (doc as any).lastAutoTable.finalY + 12;
      } else {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(113, 113, 122);
        doc.text('Nenhum detalhamento de peças aplicadas registrado nos checklists mecânicos do veículo.', 14, nextY + 4);
        nextY += 12;
      }

      // Add a section for recent maintenance timeline summary
      if (nextY > 230) {
        doc.addPage();
        nextY = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(24, 24, 27);
      doc.text('4. ÚLTIMOS REGISTROS DE ORDEM DE SERVIÇO', 14, nextY);

      const recentInterventions = vehicleMaint
        .slice(0, 4)
        .map((m, idx) => [
          String(idx + 1).padStart(2, '0'),
          m.description.toUpperCase(),
          m.type === 'preventive' ? 'PREVENTIVA' : 'CORRETIVA',
          m.completedAt ? format(parseISO(m.completedAt), 'dd/MM/yyyy') : format(parseISO(m.scheduledDate), 'dd/MM/yyyy'),
          `R$ ${m.cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`
        ]);

      if (recentInterventions.length > 0) {
        autoTable(doc, {
          startY: nextY + 3,
          head: [['Ordem', 'Descrição da Atividade', 'Tipo', 'Data Conclusão', 'Custo Total']],
          body: recentInterventions,
          theme: 'grid',
          headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
          bodyStyles: { fontSize: 7.5, halign: 'center' },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { halign: 'left' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
          },
          alternateRowStyles: { fillColor: [250, 250, 250] },
          margin: { left: 14, right: 14 }
        });
        nextY = (doc as any).lastAutoTable.finalY + 14;
      } else {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(113, 113, 122);
        doc.text('Sem histórico de ordens de serviço adicionais a exibir.', 14, nextY + 4);
        nextY += 15;
      }

      // Add signatures block
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
      doc.text('ENGENHARIA E CONSERVAÇÃO - DM TURISMO', 14, nextY + 4);
      doc.text('RESPONSÁVEL OPERACIONAL', 14, nextY + 8);
      
      doc.line(120, nextY, 196, nextY);
      doc.text('AUDITORIA SISTÊMICA DE ATIVOS', 120, nextY + 4);
      doc.text('CERTIFICAÇÃO MECÂNICA INTEGRADA', 120, nextY + 8);

      doc.save(`Dossie_Tecnico_Frota_${vehicle?.plate?.replace(/\s/g, '_') || 'Veiculo'}.pdf`);
      toast.success('Dossiê Técnico exportado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar Dossiê Técnico do veículo.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Viagens & Fretamento</h1>
          <p className="text-zinc-300 font-medium tracking-tight mt-1">Escalas de viagem, rotas de turismo e fretamento contínuo.</p>
        </div>
        <button 
          onClick={onAddTrip}
          className="px-6 py-3 bg-brand-accent text-zinc-950 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all shadow-lg active:scale-95"
        >
          Nova Viagem
        </button>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="BUSCAR POR TÍTULO, ORIGEM OU DESTINO..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-zinc-600 focus:outline-none focus:border-brand-accent/50 transition-all font-mono text-xs uppercase"
            value={tripSearch}
            onChange={(e) => setTripSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status</label>
            <select 
              value={tripStatusFilter}
              onChange={(e) => setTripStatusFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 appearance-none transition-all uppercase text-xs"
            >
              <option value="all">TODOS OS STATUS</option>
              <option value="scheduled">AGENDADA</option>
              <option value="active">EM CURSO</option>
              <option value="completed">FINALIZADA</option>
              <option value="cancelled">CANCELADA</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo de Viagem</label>
            <select 
              value={tripTypeFilter}
              onChange={(e) => setTripTypeFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 appearance-none transition-all uppercase text-xs"
            >
              <option value="all">TODOS OS TIPOS</option>
              <option value="state">ESTADUAL</option>
              <option value="interstate">INTERESTADUAL</option>
              <option value="mercosur">MERCOSUL</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-emerald-500">De (Data)</label>
            <input 
              type="date"
              value={tripDateStart}
              onChange={(e) => setTripDateStart(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 transition-all text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-rose-500">Até (Data)</label>
            <input 
              type="date"
              value={tripDateEnd}
              onChange={(e) => setTripDateEnd(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 transition-all text-xs"
            />
          </div>
        </div>
        
        {(tripStatusFilter !== 'all' || tripTypeFilter !== 'all' || tripDateStart || tripDateEnd || tripSearch) && (
          <div className="flex justify-start">
            <button 
              onClick={() => {
                setTripStatusFilter('all');
                setTripTypeFilter('all');
                setTripDateStart('');
                setTripDateEnd('');
                setTripSearch('');
              }}
              className="text-[10px] font-black text-brand-accent uppercase tracking-widest hover:text-white transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTrips.map(trip => {
            const vehicle = vehicles.find(v => v.id === trip.vehicleId);
            return (
              <Card key={trip.id} className={cn("highway-card bg-zinc-900 border-zinc-800 p-6 space-y-4 hover:border-brand-accent/50 transition-all group", trip.status === 'active' && 'is-active')}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-black uppercase text-zinc-400 group-hover:text-brand-accent transition-colors">
                          {vehicle?.plate || 'S/ PLACA'}
                        </div>
                        <div className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500">
                           {trip.tripType === 'mercosur' ? <ShieldCheck size={14} className="text-emerald-500" /> : 
                            trip.tripType === 'interstate' ? <Globe size={14} className="text-brand-accent" /> : 
                            <Map size={14} />}
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-md",
                        trip.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        trip.status === 'scheduled' ? 'bg-brand-accent/10 text-brand-accent' :
                        'bg-zinc-800 text-zinc-500'
                      )}>
                        {trip.status === 'active' ? 'Em Curso' : 
                         trip.status === 'scheduled' ? 'Agendada' : 
                         trip.status === 'completed' ? 'Finalizada' : 'Cancelada'}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-black text-white uppercase text-lg tracking-tight mb-1">{trip.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase">
                        <MapPin size={12} className="text-brand-accent" />
                        {trip.origin} ➔ {trip.destination}
                      </div>
                    </div>

                    <div className="py-3 px-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <SquareCheck size={14} className={cn(
                            trip.documentation.every(d => d.checked) ? "text-emerald-500" : "text-amber-500"
                          )} />
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Documentação</span>
                       </div>
                       <span className="text-[9px] font-black text-white">
                          {trip.documentation.filter(d => d.checked).length} / {trip.documentation.length}
                       </span>
                    </div>

                    {trip.attachments && (trip.attachments as any[]).length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAttachments(trip);
                        }}
                        className="py-2 px-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between hover:bg-emerald-500/20 transition-all cursor-pointer group w-full"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip size={12} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Documentos Salvos</span>
                        </div>
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {(trip.attachments as any[]).length}
                        </span>
                      </button>
                    )}

                    {trip.status === 'active' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadTechnicalDossier(trip);
                          }}
                          className="py-2.5 px-4 bg-zinc-950 hover:bg-zinc-900 border border-brand-accent/20 hover:border-brand-accent text-brand-accent hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl flex items-center justify-between transition-all cursor-pointer w-full group"
                        >
                          <div className="flex items-center gap-1.5">
                            <Wrench size={12} className="text-brand-accent group-hover:-rotate-45 transition-all duration-300" />
                            <span>Exportar Dossiê Técnico</span>
                          </div>
                          <Download size={12} />
                        </button>

                        {onAddMaintenanceForVehicle && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddMaintenanceForVehicle(trip.vehicleId);
                            }}
                            className="py-2.5 px-4 bg-zinc-950 hover:bg-zinc-900 border border-brand-accent/20 hover:border-brand-accent text-brand-accent hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl flex items-center justify-between transition-all cursor-pointer w-full group"
                          >
                            <div className="flex items-center gap-1.5">
                              <Wrench size={12} className="text-brand-accent group-hover:rotate-45 transition-all duration-300" />
                              <span>Atalho de Manutenção</span>
                            </div>
                            <Wrench size={12} className="text-brand-accent" />
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                       <button
                        onClick={() => onViewOS(trip)}
                        className="flex-1 py-2.5 bg-zinc-800 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                        title="Ver Ordem de Serviço"
                       >
                        <FileText size={14} className="text-brand-accent" />
                        O.S.
                       </button>
                       <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadItinerarySummary(trip);
                        }}
                        className="w-12 h-10 bg-zinc-800 rounded-xl text-zinc-400 hover:text-brand-accent flex items-center justify-center transition-all"
                        title="Exportar Itinerário Simplificado PDF"
                       >
                        <Download size={16} />
                       </button>
                       <button
                        onClick={() => onEditTrip(trip)}
                        className="w-12 h-10 bg-zinc-800 rounded-xl text-zinc-400 hover:text-brand-accent flex items-center justify-center transition-all"
                        title="Editar Viagem"
                       >
                        <Edit3 size={16} />
                       </button>
                       <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTrip(trip);
                        }}
                        className="w-12 h-10 bg-zinc-800 rounded-xl text-zinc-400 hover:text-rose-500 flex items-center justify-center transition-all"
                        title="Excluir Viagem"
                       >
                        <Trash2 size={16} />
                       </button>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/50 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest leading-none">Início</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase">{format(new Date(trip.startDate), "HH:mm '•' dd MMM", { locale: ptBR })}</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 rounded-lg text-zinc-400">
                           <Users size={14} />
                           <span className="text-[10px] font-black">{trip.passengerCount || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         <User size={12} className="text-zinc-500" />
                         <div className="flex flex-wrap gap-x-2">
                           <span className="text-[9px] font-black text-zinc-400 uppercase">
                             {employees.find(e => e.id === trip.driverId)?.name.split(' ')[0]}
                           </span>
                           {trip.secondDriverId && (
                             <span className="text-[9px] font-black text-brand-accent uppercase">
                               + {employees.find(e => e.id === trip.secondDriverId)?.name.split(' ')[0]}
                             </span>
                           )}
                         </div>
                      </div>
                    </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
            <TrendingUp size={40} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase mb-2">
              {trips.length === 0 ? "Nenhuma viagem agendada" : "Nenhum resultado encontrado"}
            </h3>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest max-w-sm">
              {trips.length === 0 
                ? "Utilize o módulo de gestão para cadastrar novas rotas de fretamento ou viagens de turismo."
                : "Tente ajustar os filtros acima para encontrar a viagem desejada."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
