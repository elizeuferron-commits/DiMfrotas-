import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Bus, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  FileText,
  ShieldCheck,
  Navigation,
  Check,
  Share2,
  FileDown,
  Type,
  FileCode,
  Loader2,
  Info
} from 'lucide-react';
import { Trip, Vehicle, Employee } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from './UI';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { cn } from '../lib/utils';

interface TripServiceOrderProps {
  trip: Trip;
  vehicle?: Vehicle;
  driver?: Employee;
  secondDriver?: Employee;
}

export const TripServiceOrder = ({ trip, vehicle, driver, secondDriver }: TripServiceOrderProps) => {
  const [checkedPassengers, setCheckedPassengers] = useState<Record<number, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const orderRef = useRef<HTMLDivElement>(null);

  const togglePassenger = (idx: number) => {
    setCheckedPassengers(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Improved PDF Generation using jsPDF + html2canvas for visual fidelity
  const handleDownloadPDF = async () => {
    if (!orderRef.current) return;
    setIsGenerating(true);
    try {
      const osNum = trip.osNumber || trip.id.slice(-6).toUpperCase();
      const canvas = await html2canvas(orderRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`OS_LAYOUT_${osNum}.pdf`);
      toast.success('PDF (Layout) gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF (Layout)');
    } finally {
      setIsGenerating(false);
    }
  };

  // Selectable Text PDF using jspdf + autotable
  const handleDownloadTextPDF = () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF();
      const osNum = trip.osNumber || trip.id.slice(-6).toUpperCase();
      const margin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();
      let currentY = 20;

      // Header (Only on first page)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(30, 30, 30);
      pdf.text("DM TURISMO", margin, currentY);
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text("LOGÍSTICA & TRANSPORTE DE ALTO DESEMPENHO", margin, currentY + 7);
      
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(`OS: ${osNum}`, pageWidth - margin - 40, currentY + 5);
      
      currentY += 20;
      pdf.setDrawColor(240, 240, 240);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      // Trip Title
      pdf.setFontSize(16);
      pdf.text(trip.title.toUpperCase(), margin, currentY);
      currentY += 10;

      // Basic Info Table
      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin },
        head: [['INFORMAÇÕES DA VIAGEM', 'DETALHES']],
        body: [
          ['Origem', trip.origin],
          ['Destino', trip.destination],
          ['Data de Início', format(parseISO(trip.startDate), "dd/MM/yyyy HH:mm")],
          ['Previsão Retorno', trip.endDate ? format(parseISO(trip.endDate), "dd/MM/yyyy HH:mm") : '---'],
          ['Tipo de Viagem', trip.tripType.toUpperCase()],
          ['Status', trip.status.toUpperCase()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40] },
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;

      // Vehicle & Driver Info
      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin },
        head: [['RECURSOS', 'DETALHES']],
        body: [
          ['Veículo (Placa)', vehicle?.plate || '---'],
          ['Modelo', vehicle?.model || '---'],
          ['Motorista Titular', driver?.name || '---'],
          ['Motorista Auxiliar', secondDriver?.name || '---'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [60, 60, 60] },
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;

      // Passengers Table
      if (trip.passengers.length > 0) {
        pdf.setFontSize(12);
        pdf.text("MANIFESTO DE PASSAGEIROS", margin, currentY);
        currentY += 5;

        autoTable(pdf, {
          startY: currentY,
          margin: { left: margin },
          head: [['Nº', 'NOME COMPLETO', 'DOCUMENTO']],
          body: trip.passengers.map((p, i) => [i + 1, p.name.toUpperCase(), p.document]),
          theme: 'grid',
          headStyles: { fillColor: [20, 20, 20] },
        });
        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }

      // Notes
      if (trip.notes) {
        if (currentY > 250) {
          pdf.addPage();
          currentY = 20;
        }
        pdf.setFontSize(12);
        pdf.text("OBSERVAÇÕES", margin, currentY);
        currentY += 7;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const splitNotes = pdf.splitTextToSize(trip.notes, pageWidth - (2 * margin));
        pdf.text(splitNotes, margin, currentY);
        currentY += (splitNotes.length * 5) + 10;
      }

      // Documentation
      if (trip.documentation.length > 0) {
        if (currentY > 250) {
          pdf.addPage();
          currentY = 20;
        }
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("CHECKLIST DE DOCUMENTAÇÃO", margin, currentY);
        currentY += 7;
        
        trip.documentation.forEach(doc => {
            pdf.setFont("helvetica", doc.checked ? "bold" : "normal");
            pdf.text(`[${doc.checked ? 'X' : ' '}] ${doc.label}`, margin + 5, currentY);
            currentY += 6;
        });
      }

      pdf.save(`OS_TEXTO_${osNum}.pdf`);
      toast.success('PDF (Texto) gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF (Texto)');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadWord = async () => {
    setIsGenerating(true);
    try {
        const osNum = trip.osNumber || trip.id.slice(-6).toUpperCase();
        
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "DM TURISMO",
                                bold: true,
                                size: 48,
                                color: "1E1E1E",
                            }),
                        ],
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "LOGÍSTICA & TRANSPORTE DE ALTO DESEMPENHO",
                                size: 20,
                                color: "646464",
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    new Paragraph({
                        text: `ORDEM DE SERVIÇO: ${osNum}`,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { after: 300 },
                    }),
                    new Paragraph({
                        text: trip.title.toUpperCase(),
                        heading: HeadingLevel.HEADING_3,
                        spacing: { after: 300 },
                    }),
                    
                    // Information Table
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ITEM", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DESCRIÇÃO", bold: true })] })] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("ORIGEM")] }),
                                    new TableCell({ children: [new Paragraph(trip.origin)] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("DESTINO")] }),
                                    new TableCell({ children: [new Paragraph(trip.destination)] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("INÍCIO")] }),
                                    new TableCell({ children: [new Paragraph(format(parseISO(trip.startDate), "dd/MM/yyyy HH:mm"))] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("VEÍCULO")] }),
                                    new TableCell({ children: [new Paragraph(`${vehicle?.plate || ''} - ${vehicle?.model || ''}`)] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("MOTORISTA")] }),
                                    new TableCell({ children: [new Paragraph(driver?.name || "NÃO ATRIBUÍDO")] }),
                                ]
                            }),
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),
                    new Paragraph({ 
                        text: "MANIFESTO DE PASSAGEIROS", 
                        heading: HeadingLevel.HEADING_3,
                        spacing: { after: 200 }
                    }),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nº", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "NOME COMPLETO", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DOCUMENTO", bold: true })] })] }),
                                ]
                            }),
                            ...trip.passengers.map((p, i) => new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph(String(i + 1))] }),
                                    new TableCell({ children: [new Paragraph(p.name.toUpperCase())] }),
                                    new TableCell({ children: [new Paragraph(p.document)] }),
                                ]
                            }))
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),
                    new Paragraph({ 
                        text: "OBSERVAÇÕES", 
                        heading: HeadingLevel.HEADING_3,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({ text: trip.notes || "Sem observações adicionais.", spacing: { after: 400 } }),

                    new Paragraph({ text: "", spacing: { before: 800 } }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: "_______________________________________",
                                color: "000000",
                            }),
                            new TextRun({
                                text: "\nASSINATURA DO RESPONSÁVEL",
                                size: 16,
                                bold: true,
                                break: 1,
                            })
                        ]
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `OS_${osNum}.docx`);
        toast.success('Arquivo Word gerado com sucesso!');
    } catch (error) {
        console.error(error);
        toast.error('Erro ao gerar arquivo Word');
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 no-print p-4 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
        <div className="flex-1 flex items-center gap-4 px-4 border-r border-zinc-800">
          <div className="w-10 h-10 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <Info size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Visualização de OS</p>
            <p className="text-sm font-black text-white uppercase tracking-tight">Otimizado para Impressão A4</p>
          </div>
        </div>

        <Button 
          variant="secondary"
          onClick={handleDownloadTextPDF} 
          disabled={isGenerating}
          className="gap-2 bg-asphalt-800 text-zinc-400 hover:text-white border-asphalt-700 h-12 px-6 rounded-2xl"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Type size={18} />}
          PDF (TEXTO)
        </Button>

        <Button 
          variant="secondary"
          onClick={handleDownloadWord} 
          disabled={isGenerating}
          className="gap-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border-blue-500/20 h-12 px-6 rounded-2xl"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <FileCode size={18} />}
          WORD
        </Button>

        <Button 
          variant="secondary"
          onClick={handleDownloadPDF} 
          disabled={isGenerating}
          className="gap-2 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-zinc-200 h-12 px-6 rounded-2xl"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
          PDF (LAYOUT)
        </Button>

        <Button onClick={handlePrint} disabled={isGenerating} className="gap-2 h-12 px-6 rounded-2xl bg-brand-accent text-zinc-950 hover:bg-white border-brand-accent transition-all font-black">
          <Printer size={18} />
          IMPRIMIR
        </Button>
      </div>

      {/* Document Container */}
      <div 
        ref={orderRef}
        id="service-order" 
        className="bg-white text-zinc-900 mx-auto rounded-none border shadow-2xl font-sans w-full max-w-[210mm] min-h-[297mm] print:p-0 print:m-0 print:shadow-none print:border-0 relative overflow-hidden"
      >
        {/* Ribbon - Modern Badge */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-zinc-900" />
        
        {/* Padding for content */}
        <div className="p-12">
          {/* Header Section */}
          <div className="grid grid-cols-2 gap-10 border-b-2 border-zinc-100 pb-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-brand-accent shadow-xl">
                  <Bus size={32} strokeWidth={2.5} />
                </div>
                <div>
                   <h1 className="text-3xl font-black uppercase tracking-tighter leading-tight text-zinc-900">DM TURISMO</h1>
                   <div className="flex items-center gap-2">
                     <div className="h-[2px] w-4 bg-brand-accent" />
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Logística de Alto Desempenho</p>
                   </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Endereço Operacional</p>
                <p className="text-xs font-bold text-zinc-700 uppercase">Av. Logística Industrial, 5000 • CD 01</p>
                <p className="text-xs font-bold text-zinc-700 uppercase">WhatsApp: (XX) XXXXX-XXXX</p>
              </div>
            </div>

            <div className="flex flex-col items-end justify-start">
              <div className="bg-zinc-50 border-2 border-zinc-100 p-6 rounded-3xl min-w-[200px] text-right shadow-sm group">
                <div className="flex items-center justify-end gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status do Documento</p>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] leading-none mb-2 text-zinc-400">Ordem de Serviço</p>
                <p className="text-3xl font-black tabular-nums text-zinc-900 group-hover:text-brand-accent transition-colors">
                  {trip.osNumber || `#${trip.id.slice(-6).toUpperCase()}`}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Clock size={12} className="text-zinc-300" />
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Emissão: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-12">
            {/* Left Column - 7/12 */}
            <div className="col-span-12 lg:col-span-7 space-y-12">
              {/* Trip Title & Type Section */}
              <div className="relative">
                <div className="absolute -left-12 top-0 bottom-0 w-2 bg-brand-accent" />
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mb-4 inline-block",
                  trip.tripType === 'mercosur' ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                  trip.tripType === 'interstate' ? "bg-amber-50 border-amber-100 text-amber-600" :
                  "bg-emerald-50 border-emerald-100 text-emerald-600"
                )}>
                  Operação {trip.tripType === 'state' ? 'Estadual' : trip.tripType === 'interstate' ? 'Interestadual' : 'Mercosul'}
                </span>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 leading-[0.95]" contentEditable suppressContentEditableWarning>
                  {trip.title}
                </h2>
              </div>

              {/* Visual Timeline Itinerary */}
              <div className="bg-zinc-50 rounded-[40px] p-10 border border-zinc-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                    <Navigation size={18} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Plano de Rota & Itinerário</h3>
                </div>

                <div className="relative pl-10 space-y-10">
                  {/* Timeline Line */}
                  <div className="absolute left-[13px] top-2 bottom-2 w-1 bg-zinc-200" />
                  
                  {/* Origin */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-zinc-900 border-4 border-white shadow-lg flex items-center justify-center z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Ponto de Partida</p>
                      <p className="text-xl font-black uppercase text-zinc-900 tracking-tight" contentEditable suppressContentEditableWarning>{trip.origin}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar size={12} className="text-zinc-300" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{format(parseISO(trip.startDate), "dd/MM/yyyy • HH:mm")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stops */}
                  {trip.stops && trip.stops.length > 0 && trip.stops.map((stop, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[32px] top-2 w-4 h-4 rounded-full bg-zinc-100 border-2 border-zinc-300 z-10" />
                      <div className="flex items-center justify-between group">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Escala Operacional {idx + 1}</p>
                          <p className="text-base font-black uppercase text-zinc-700" contentEditable suppressContentEditableWarning>{stop.location}</p>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-zinc-200 flex items-center gap-2 shadow-sm">
                          <Clock size={12} className="text-brand-accent" />
                          <span className="text-[11px] font-black tabular-nums text-zinc-900">{stop.arrivalTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Destination */}
                  <div className="relative pt-4">
                    <div className="absolute -left-[35px] top-6 w-6 h-6 rounded-full bg-brand-accent border-4 border-white shadow-lg flex items-center justify-center z-10">
                      <MapPin size={12} className="text-zinc-900" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Destino Final</p>
                      <p className="text-xl font-black uppercase text-zinc-900 tracking-tight" contentEditable suppressContentEditableWarning>{trip.destination}</p>
                      {trip.endDate && (
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar size={12} className="text-zinc-300" />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Previsão Retorno: {format(parseISO(trip.endDate), "dd/MM/yyyy • HH:mm")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section with improved styling */}
              {trip.notes && (
                <div className="p-10 border-2 border-zinc-100 rounded-[40px] relative overflow-hidden bg-zinc-50/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                      <FileText size={18} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Observações Operacionais</h3>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                    <p className="text-[13px] text-zinc-600 leading-relaxed font-medium italic" contentEditable suppressContentEditableWarning>
                      {trip.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - 5/12 */}
            <div className="col-span-12 lg:col-span-5 space-y-12">
              {/* Resources & Team - High density cards */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900">Equipe & Recursos</h3>
                   <div className="px-3 py-1 bg-zinc-900 text-brand-accent text-[8px] font-black rounded-lg uppercase tracking-widest">Ativos</div>
                </div>

                <div className="space-y-4">
                  {/* Vehicle Card */}
                  <div className="p-6 bg-zinc-900 rounded-[35px] text-white shadow-xl group transition-all hover:scale-[1.02]">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-brand-accent">
                        <Bus size={24} />
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Placa Mercosul</p>
                        <p className="text-lg font-black tracking-tight" contentEditable suppressContentEditableWarning>{vehicle?.plate || '---'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Equipamento / Modelo</p>
                        <p className="text-sm font-black uppercase tracking-tight" contentEditable suppressContentEditableWarning>{vehicle?.model || 'Equipamento não vinculado'}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
                         <span className="uppercase tracking-widest">Capacidade Nominal</span>
                         <span className="text-white font-black">{vehicle?.capacity || 0} Passageiros</span>
                      </div>
                    </div>
                  </div>

                  {/* Driver Card */}
                  <div className="p-6 bg-white border-2 border-zinc-100 rounded-[35px] shadow-sm transform transition-all hover:-translate-y-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Condutor Escalado</p>
                        <p className="text-lg font-black uppercase text-zinc-900 leading-tight" contentEditable suppressContentEditableWarning>
                          {driver?.name || 'Condutor a definir'}
                        </p>
                      </div>
                    </div>
                    {secondDriver && (
                      <div className="pt-4 border-t border-zinc-50 space-y-1">
                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Condutor Auxiliar</p>
                        <p className="text-sm font-black uppercase text-zinc-700" contentEditable suppressContentEditableWarning>{secondDriver.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documentation Checklist */}
              <div className="p-10 bg-zinc-50 rounded-[40px] border border-zinc-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
                    <ShieldCheck size={18} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Documentação</h3>
                </div>
                
                <div className="space-y-4">
                  {(trip.documentation || []).map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm transition-all hover:border-brand-accent/30 group">
                      <span className="text-[11px] font-black text-zinc-700 uppercase tracking-tight" contentEditable suppressContentEditableWarning>{doc.label}</span>
                      <div className={cn(
                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                        doc.checked 
                          ? "bg-zinc-900 border-zinc-900 text-brand-accent" 
                          : "border-zinc-200 bg-white"
                      )}>
                        {doc.checked && <Check size={12} strokeWidth={4} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Manifest - High End Table */}
          <div className="mt-16 bg-zinc-900 rounded-[50px] p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Visual background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 relative z-10">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 flex items-center gap-4">
                   Manifesto de Passageiros
                   <div className="px-4 py-1.5 rounded-2xl bg-white/10 border border-white/10 text-brand-accent text-sm font-black tabular-nums">
                     {String(trip.passengers.length).padStart(2, '0')}
                   </div>
                </h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Ocupantes registrados para esta operação</p>
              </div>
              <div className="flex items-center gap-4 no-print">
                <Users size={20} className="text-brand-accent" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Conferência no embarque</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-white/5 relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 w-20">Nº</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome Completo do Passageiro</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Documento de Identidade</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center no-print w-24">Visto</th>
                  </tr>
                </thead>
                <tbody>
                  {(trip.passengers || []).map((p, idx) => (
                    <tr 
                      key={idx} 
                      className={cn(
                        "group transition-all border-b border-white/[0.02]",
                        checkedPassengers[idx] ? "bg-white/[0.03]" : "hover:bg-white/[0.01]"
                      )}
                    >
                      <td className="px-8 py-4 text-[13px] font-black tabular-nums text-zinc-600 group-hover:text-brand-accent transition-colors">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="px-8 py-4 text-sm font-black uppercase tracking-tight text-zinc-200" contentEditable suppressContentEditableWarning>
                        {p.name}
                      </td>
                      <td className="px-8 py-4 text-sm font-bold tracking-widest text-zinc-500 tabular-nums uppercase" contentEditable suppressContentEditableWarning>
                        {p.document}
                      </td>
                      <td className="px-8 py-4 text-center no-print">
                        <button
                          onClick={() => togglePassenger(idx)}
                          className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border-2",
                            checkedPassengers[idx] 
                              ? "bg-brand-accent border-brand-accent text-zinc-900 shadow-[0_0_15px_rgba(255,107,0,0.3)]" 
                              : "bg-transparent border-white/10 text-white/10 hover:border-brand-accent/50 hover:text-brand-accent"
                          )}
                        >
                          <Check size={18} strokeWidth={4} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attachments & Receipts Section */}
          {trip.attachments && trip.attachments.length > 0 && (
            <div className="mt-16 bg-zinc-50 rounded-[40px] p-12 border border-zinc-100 no-print">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-brand-accent shadow-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Documentos & Comprovantes</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Arquivos anexados a esta viagem</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {(trip.attachments || []).map((file, idx) => (
                  <div key={idx} className="group bg-white p-6 rounded-[35px] border border-zinc-100 shadow-sm hover:shadow-xl hover:border-brand-accent/20 transition-all flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                        file.type === 'pdf' ? "bg-rose-50 text-rose-500" :
                        file.type === 'word' ? "bg-blue-50 text-blue-500" :
                        file.type === 'excel' ? "bg-emerald-50 text-emerald-500" :
                        "bg-brand-accent/10 text-brand-accent"
                      )}>
                        {file.type === 'pdf' || file.type === 'word' ? <FileText size={24} /> :
                         file.type === 'excel' ? <FileCode size={24} /> :
                         <Printer size={24} />}
                      </div>
                      <a 
                        href={file.url} 
                        download={file.name}
                        className="p-3 bg-zinc-900 text-white rounded-2xl hover:bg-brand-accent hover:text-zinc-950 transition-all active:scale-90"
                      >
                        <FileDown size={18} />
                      </a>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-black text-zinc-900 uppercase truncate mb-1">{file.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-[8px] font-black text-zinc-500 uppercase tracking-widest">{file.type}</span>
                        {file.type === 'image' && (
                          <button 
                            onClick={() => window.open(file.url, '_blank')}
                            className="text-[9px] font-bold text-brand-accent uppercase hover:underline"
                          >
                            Visualizar
                          </button>
                        )}
                      </div>
                    </div>

                    {file.type === 'image' && (
                      <div className="mt-2 rounded-2xl overflow-hidden border border-zinc-100 aspect-video bg-zinc-50">
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer - Signatures & Legal */}
          <div className="mt-20">
            <div className="grid grid-cols-2 gap-20 items-end mb-16">
              <div className="text-center group">
                <div className="w-full h-[2px] bg-zinc-200 mb-6 relative overflow-hidden">
                   <div className="absolute inset-0 bg-zinc-900 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                </div>
                <p className="text-[11px] font-black uppercase text-zinc-900 tracking-widest mb-1 italic">Condutor Titular</p>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-[0.2em] underline underline-offset-4 decoration-zinc-100">Assinatura do Profissional Responsável</p>
              </div>
              
              <div className="text-center group">
                <div className="w-full h-[2px] bg-zinc-200 mb-6 relative overflow-hidden">
                   <div className="absolute inset-0 bg-zinc-900 transform translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                </div>
                <p className="text-[11px] font-black uppercase text-zinc-900 tracking-widest mb-1 italic">Fiscalização / Despacho</p>
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-[0.2em] underline underline-offset-4 decoration-zinc-100">Validação Interna DM Turismo</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 pt-10 border-t-2 border-zinc-50">
               <div className="flex items-center gap-8">
                 <div className="flex items-center gap-2">
                   <Check size={14} className="text-emerald-500" />
                   <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Documento Digital Auditado</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <Check size={14} className="text-emerald-500" />
                   <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Válido para Trânsito Nacional</p>
                 </div>
               </div>
               <p className="text-[7px] font-bold text-zinc-300 uppercase tracking-[0.5em] text-center max-w-xl leading-relaxed">
                 ESTA ORDEM DE SERVIÇO É UM DOCUMENTO INTERNO DE USO EXCLUSIVO DA DM TURISMO. A REPRODUÇÃO NÃO AUTORIZADA PODE RESULTAR EM SANÇÕES ADMINISTRATIVAS. AS INFORMAÇÕES AQUI CONTIDAS SÃO PROTEGIDAS PELA LGPD.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
