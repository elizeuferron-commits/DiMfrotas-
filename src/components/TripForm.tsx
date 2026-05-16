import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Bus, 
  User,
  Hash,
  Info,
  Clock,
  Navigation,
  CheckSquare,
  Globe,
  Map,
  ShieldCheck,
  Plus,
  Trash2,
  ListChecks,
  Edit2,
  Check,
  Paperclip,
  Image as ImageIcon,
  FileText as FileIcon,
  FileSpreadsheet as ExcelIcon,
  X,
  FileText,
  ClipboardPaste,
  Download,
  Copy,
  Sparkles,
  Loader2,
  Eye
} from 'lucide-react';
import { Button, ConfirmModal } from './UI';
import { Vehicle, Employee, Trip, Passenger } from '../types';
import { cn, getApiUrl } from '../lib/utils';
import { toast } from 'sonner';

interface TripFormProps {
  vehicles: Vehicle[];
  employees: Employee[];
  initialData?: Trip | null;
  initialAttachments?: { name: string; url: string; type: 'image' | 'pdf' | 'word' | 'excel' }[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onDelete?: () => void;
  loading?: boolean;
}

const DOCUMENTATION_TEMPLATES = {
  state: [
    "CRLV Digital",
    "CNH do Motorista (EAR)",
    "Lista de Passageiros",
    "Autorização de Viagem (Órgão Estadual)"
  ],
  interstate: [
    "CRLV Digital",
    "CNH do Motorista (EAR)",
    "Lista de Passageiros (ANTT)",
    "Autorização de Viagem ANTT",
    "Seguro de Responsabilidade Civil (APP)"
  ],
  mercosur: [
    "CRLV Digital",
    "CNH Internacional",
    "Passaportes / RG Válidos",
    "Carta Azul (Seguro Mercosul)",
    "Lista de Passageiros Internacional",
    "Autorização Especial de Fronteira"
  ]
};

export const TripForm = ({ vehicles, employees, initialData, initialAttachments, onSubmit, onCancel, onDelete, loading }: TripFormProps) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    vehicleId: initialData?.vehicleId || '',
    driverId: initialData?.driverId || '',
    secondDriverId: initialData?.secondDriverId || '',
    origin: initialData?.origin || '',
    destination: initialData?.destination || '',
    stops: initialData?.stops || [] as Trip['stops'],
    tripType: initialData?.tripType || 'state' as Trip['tripType'],
    startDate: initialData?.startDate || new Date().toISOString().slice(0, 16),
    endDate: initialData?.endDate || '',
    passengers: initialData?.passengers || [] as Passenger[],
    passengerCount: initialData?.passengerCount || 0,
    documentation: initialData?.documentation || [] as { label: string; checked: boolean }[],
    attachments: (initialData?.attachments || initialAttachments || []) as { name: string; url: string; type: 'image' | 'pdf' | 'word' | 'excel' }[],
    notes: initialData?.notes || '',
    status: initialData?.status || 'scheduled' as const,
    osNumber: initialData?.osNumber || `OS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
  });

  const [newPassenger, setNewPassenger] = useState<Passenger>({ name: '', document: '' });
  const [newStop, setNewStop] = useState({ location: '', arrivalTime: '' });
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [newAttachment, setNewAttachment] = useState({ name: '', type: 'image' as 'image' | 'pdf' | 'word' | 'excel', url: '' });
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [smartText, setSmartText] = useState('');
  const [isSmartProcessing, setIsSmartProcessing] = useState(false);
  const [processingAttachmentIndex, setProcessingAttachmentIndex] = useState<number | null>(null);
  const [editingPassengerIndex, setEditingPassengerIndex] = useState<number | null>(null);
  const [editPassengerData, setEditPassengerData] = useState<Passenger>({ name: '', document: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; onConfirm: () => void; title: string; message: string }>({
    isOpen: false,
    onConfirm: () => {},
    title: '',
    message: ''
  });

  const handleSmartExtractFromAttachment = async (attachment: { name: string, url: string, type: string }, index: number) => {
    setProcessingAttachmentIndex(index);
    try {
      // Extract base64 and mimeType
      const [header, base64Data] = attachment.url.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

      const response = await fetch(getApiUrl("/api/extract-passengers"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Data, mimeType }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract passengers");
      }

      const extractedData = await response.json();

      if (extractedData && Array.isArray(extractedData)) {
        const newPassengers = extractedData.map((p: any) => ({
          name: String(p.name || '').toUpperCase(),
          document: String(p.document || 'S/D').toUpperCase()
        }));

        setFormData(prev => ({
          ...prev,
          passengers: [...prev.passengers, ...newPassengers],
          passengerCount: prev.passengers.length + newPassengers.length
        }));

        toast.success(`${newPassengers.length} passageiros extraídos do arquivo!`);
      }
    } catch (error) {
      console.error("AI Attachment Extraction Error:", error);
      toast.error("Erro ao processar arquivo com IA. Verifique se o formato é suportado.");
    } finally {
      setProcessingAttachmentIndex(null);
    }
  };

  useEffect(() => {
    if (!initialData) {
      const template = DOCUMENTATION_TEMPLATES[formData.tripType] || [];
      setFormData(prev => ({
        ...prev,
        documentation: template.map(label => ({ label, checked: false }))
      }));
    }
  }, [formData.tripType, initialData]);

  const toggleDoc = (index: number) => {
    const newDoc = [...formData.documentation];
    newDoc[index].checked = !newDoc[index].checked;
    setFormData({ ...formData, documentation: newDoc });
  };

  const addPassenger = () => {
    if (newPassenger.name) {
      setFormData({
        ...formData,
        passengers: [...formData.passengers, newPassenger],
        passengerCount: formData.passengers.length + 1
      });
      setNewPassenger({ name: '', document: '' });
    }
  };

  const startEditingPassenger = (index: number) => {
    setEditingPassengerIndex(index);
    setEditPassengerData(formData.passengers[index]);
  };

  const saveEditedPassenger = () => {
    if (editingPassengerIndex !== null && editPassengerData.name) {
      const updatedPassengers = [...formData.passengers];
      updatedPassengers[editingPassengerIndex] = editPassengerData;
      setFormData({
        ...formData,
        passengers: updatedPassengers
      });
      setEditingPassengerIndex(null);
    }
  };

  const handlePassengerImport = () => {
    if (!importText.trim()) return;

    const lines = importText.split('\n');
    const importedPassengers: Passenger[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Match CPF or RG-like patterns
      const cpfMatch = trimmedLine.match(/(\d{3}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{2})|(\d{11})/);
      const cpf = cpfMatch ? cpfMatch[0] : '';
      
      let name = trimmedLine.replace(cpf, '').trim();
      name = name.replace(/^[-:.\s]+|[-:.\s]+$/g, '').trim();

      if (name) {
        importedPassengers.push({ 
          name: name.toUpperCase(), 
          document: cpf.replace(/[\s.-]/g, '') || 'S/D' 
        });
      }
    });

    if (importedPassengers.length > 0) {
      setFormData(prev => ({
        ...prev,
        passengers: [...prev.passengers, ...importedPassengers],
        passengerCount: prev.passengers.length + importedPassengers.length
      }));
      setImportText('');
      setIsImporting(false);
    }
  };

  const exportPassengers = () => {
    if (formData.passengers.length === 0) return;

    const headers = ['Nome', 'Documento'];
    const csvContent = [
      headers.join(';'),
      ...formData.passengers.map(p => `${p.name};${p.document}`)
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LISTA_${formData.title.toUpperCase() || 'PASSAGEIROS'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removePassenger = (index: number) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Remover Passageiro',
      message: `Deseja remover ${formData.passengers[index].name} desta viagem?`,
      onConfirm: () => {
        const updatedPassengers = formData.passengers.filter((_, i) => i !== index);
        setFormData({ 
          ...formData, 
          passengers: updatedPassengers,
          passengerCount: updatedPassengers.length 
        });
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const addStop = () => {
    if (newStop.location && newStop.arrivalTime) {
      setFormData({
        ...formData,
        stops: [...formData.stops, newStop]
      });
      setNewStop({ location: '', arrivalTime: '' });
    }
  };

  const removeStop = (index: number) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Remover Parada',
      message: `Deseja remover a parada em ${formData.stops[index].location}?`,
      onConfirm: () => {
        setFormData({
          ...formData,
          stops: formData.stops.filter((_, i) => i !== index)
        });
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const addAttachment = () => {
    if (newAttachment.name && newAttachment.url) {
      setFormData({
        ...formData,
        attachments: [...(formData.attachments || []), newAttachment]
      });
      setNewAttachment({ name: '', type: 'image', url: '' });
      setIsAddingAttachment(false);
    }
  };

  const removeAttachment = (index: number) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Remover Anexo',
      message: `Deseja excluir permanentemente o anexo "${formData.attachments[index].name}"?`,
      onConfirm: () => {
        setFormData({
          ...formData,
          attachments: (formData.attachments || []).filter((_, i) => i !== index)
        });
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      const isWord = file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isExcel = file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'text/csv';
      
      let type: 'image' | 'pdf' | 'word' | 'excel' = 'image';
      if (isPdf) type = 'pdf';
      else if (isWord) type = 'word';
      else if (isExcel) type = 'excel';
      else if (isImage) type = 'image';
      else return; // Unsupported type

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAttachment({
          name: file.name,
          type,
          url: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSmartFill = async () => {
    if (!smartText.trim()) {
      toast.error("Por favor, cole o texto da viagem primeiro.");
      return;
    }

    setIsSmartProcessing(true);
    try {
      const response = await fetch(getApiUrl("/api/smart-fill"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: smartText }),
      });

      if (!response.ok) {
        throw new Error("Failed to smart fill");
      }

      const result = await response.json();
      
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        origin: result.origin || prev.origin,
        destination: result.destination || prev.destination,
        startDate: result.startDate ? result.startDate.slice(0, 16) : prev.startDate,
        endDate: result.endDate ? result.endDate.slice(0, 16) : prev.endDate,
        tripType: result.tripType || prev.tripType,
        notes: result.notes || prev.notes,
        passengers: result.passengers ? [...prev.passengers, ...result.passengers] : prev.passengers,
        passengerCount: (prev.passengers.length) + (result.passengers?.length || 0)
      }));

      toast.success("Informações extraídas com sucesso!");
      setSmartText('');
    } catch (error) {
      console.error("AI Smart Fill Error:", error);
      toast.error("Erro ao processar texto com IA.");
    } finally {
      setIsSmartProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-8 max-h-[80vh] overflow-y-auto px-1">
      {/* AI Smart Fill Section */}
      <div className="bg-gradient-to-br from-brand-accent/10 to-zinc-900 border border-brand-accent/20 rounded-3xl p-6 space-y-4 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Sparkles size={120} />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center text-zinc-950 shadow-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter">Preenchimento Inteligente (IA)</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Cole os detalhes da viagem ou roteiro para preencher os campos automaticamente</p>
          </div>
        </div>

        <div className="relative z-10 space-y-3">
          <textarea
            className="w-full h-32 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 text-xs font-medium text-white placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent/50 transition-all resize-none"
            placeholder="COLE AQUI: ROTEIRO, DATA, LISTA DE PASSAGEIROS, ETC..."
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
          />
          <button
            type="button"
            disabled={isSmartProcessing || !smartText.trim()}
            onClick={handleSmartFill}
            className="w-full py-4 bg-brand-accent text-zinc-950 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSmartProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                ANALISANDO DADOS...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                EXTRAIR DADOS COM IA
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OS Number & Basic Info */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Número da O.S.</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-brand-accent transition-colors">
              <Hash size={18} />
            </div>
            <input
              required
              type="text"
              placeholder="EX: OS-2024001"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/20 transition-all uppercase"
              value={formData.osNumber}
              onChange={e => setFormData({ ...formData, osNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Título da Viagem / Operação</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-brand-accent transition-colors">
              <Navigation size={18} />
            </div>
            <input
              required
              type="text"
              placeholder="EX: TURISMO RIO X BUZIOS"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/20 transition-all uppercase"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
        </div>

        {/* Trip Type Selection */}
        <div className="md:col-span-2 space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Modalidade da Viagem</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'state', label: 'Estadual', icon: Map },
              { id: 'interstate', label: 'Interestadual', icon: Globe },
              { id: 'mercosur', label: 'Mercosul', icon: ShieldCheck }
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, tripType: type.id as any })}
                className={cn(
                  "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                  formData.tripType === type.id 
                    ? "bg-brand-accent/10 border-brand-accent text-brand-accent" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                )}
              >
                <type.icon size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Origin & Destination */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-emerald-500">Origem</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
              <MapPin size={18} />
            </div>
            <input
              required
              type="text"
              placeholder="SAÍDA"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent/50 transition-all uppercase"
              value={formData.origin}
              onChange={e => setFormData({ ...formData, origin: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-rose-500">Destino</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
              <MapPin size={18} />
            </div>
            <input
              required
              type="text"
              placeholder="CHEGADA"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent/50 transition-all uppercase"
              value={formData.destination}
              onChange={e => setFormData({ ...formData, destination: e.target.value })}
            />
          </div>
        </div>

        {/* Stops (Intermediate) */}
        <div className="md:col-span-2 space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Clock size={14} className="text-brand-accent" />
            Paradas Intermediárias (Opcional)
          </label>
          <div className="p-4 bg-zinc-950/30 rounded-2xl border border-zinc-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="LOCAL DA PARADA"
                className="bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs text-white uppercase font-bold"
                value={newStop.location}
                onChange={e => setNewStop({ ...newStop, location: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs text-white font-bold"
                  value={newStop.arrivalTime}
                  onChange={e => setNewStop({ ...newStop, arrivalTime: e.target.value })}
                />
                <button
                  type="button"
                  onClick={addStop}
                  className="w-10 h-10 bg-zinc-800 text-brand-accent rounded-xl flex items-center justify-center hover:bg-zinc-700 transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {formData.stops.length > 0 && (
              <div className="space-y-2">
                {formData.stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">{stop.location}</p>
                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Previsão: {stop.arrivalTime.replace('T', ' ')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(idx)}
                      className="text-zinc-700 hover:text-rose-500 p-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Partida</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
              <Calendar size={18} />
            </div>
            <input
              required
              type="datetime-local"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 transition-all"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Retorno Programado</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
              <Clock size={18} />
            </div>
            <input
              type="datetime-local"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 transition-all"
              value={formData.endDate}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Documentation Checklist */}
        <div className="md:col-span-2 space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            <CheckSquare size={14} className="text-brand-accent" />
            Checklist de Documentação
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800">
            {formData.documentation.map((doc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDoc(idx)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                  doc.checked ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-900/50 text-zinc-500"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                  doc.checked ? "bg-emerald-500 border-emerald-500 text-zinc-950" : "border-zinc-700 text-transparent"
                )}>
                  <CheckSquare size={14} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight">{doc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Attachments Section */}
        <div className="md:col-span-2 space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Paperclip size={14} className="text-brand-accent" />
            Anexos e Documentos Digitalizados (Fotos/PDF)
          </label>
          <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-4">
            {!isAddingAttachment ? (
              <button
                type="button"
                onClick={() => setIsAddingAttachment(true)}
                className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-600 font-black text-[10px] uppercase tracking-widest hover:border-brand-accent/50 hover:text-brand-accent transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar Foto ou PDF de Documento
              </button>
            ) : (
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Novo Anexo</h5>
                  <button type="button" onClick={() => setIsAddingAttachment(false)} className="text-zinc-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Tipo de Arquivo</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewAttachment({ ...newAttachment, type: 'image' })}
                        className={cn(
                          "py-2 px-3 rounded-lg border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2",
                          newAttachment.type === 'image' ? "bg-brand-accent/10 border-brand-accent text-brand-accent" : "bg-zinc-950 border-zinc-800 text-zinc-600"
                        )}
                      >
                        <ImageIcon size={14} /> Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAttachment({ ...newAttachment, type: 'pdf' })}
                        className={cn(
                          "py-2 px-3 rounded-lg border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2",
                          newAttachment.type === 'pdf' ? "bg-rose-500/10 border-rose-500 text-rose-500" : "bg-zinc-950 border-zinc-800 text-zinc-600"
                        )}
                      >
                        <FileIcon size={14} /> PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAttachment({ ...newAttachment, type: 'word' })}
                        className={cn(
                          "py-2 px-3 rounded-lg border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2",
                          newAttachment.type === 'word' ? "bg-blue-500/10 border-blue-500 text-blue-500" : "bg-zinc-950 border-zinc-800 text-zinc-600"
                        )}
                      >
                        <FileIcon size={14} /> Word
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAttachment({ ...newAttachment, type: 'excel' })}
                        className={cn(
                          "py-2 px-3 rounded-lg border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2",
                          newAttachment.type === 'excel' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-zinc-950 border-zinc-800 text-zinc-600"
                        )}
                      >
                        <ExcelIcon size={14} /> Excel
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Upload Local</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept={
                          newAttachment.type === 'pdf' ? 'application/pdf' : 
                          newAttachment.type === 'word' ? '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                          newAttachment.type === 'excel' ? '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv' :
                          'image/*'
                        }
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-4 text-[10px] font-bold text-zinc-400 text-center overflow-hidden whitespace-nowrap text-ellipsis">
                        {newAttachment.name || "Selecionar Arquivo"}
                      </div>
                    </div>
                  </div>
                </div>
                {newAttachment.url && (
                  <button
                    type="button"
                    onClick={addAttachment}
                    className="w-full py-3 bg-brand-accent text-zinc-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all"
                  >
                    Confirmar Anexo
                  </button>
                )}
              </div>
            )}

            {formData.attachments && (formData.attachments as any[]).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(formData.attachments as any[]).map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        file.type === 'pdf' ? "bg-rose-500/10 text-rose-500" : 
                        file.type === 'word' ? "bg-blue-500/10 text-blue-500" :
                        file.type === 'excel' ? "bg-emerald-500/10 text-emerald-500" :
                        "bg-amber-500/10 text-amber-500"
                      )}>
                        {file.type === 'word' || file.type === 'pdf' ? <FileIcon size={16} /> : 
                         file.type === 'excel' ? <ExcelIcon size={16} /> : 
                         <ImageIcon size={16} />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-white uppercase truncate">{file.name}</p>
                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{file.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(file.type === 'image' || file.type === 'pdf') && (
                        <button
                          type="button"
                          onClick={() => handleSmartExtractFromAttachment(file, idx)}
                          disabled={processingAttachmentIndex === idx}
                          className="p-2 text-zinc-500 hover:text-brand-accent transition-all relative group/ia"
                          title="Extrair passageiros com IA"
                        >
                          {processingAttachmentIndex === idx ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Sparkles size={14} className="group-hover/ia:animate-pulse" />
                          )}
                        </button>
                      )}
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-zinc-500 hover:text-white transition-all"
                        title="Visualizar Arquivo"
                      >
                        <Eye size={14} />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-zinc-700 hover:text-rose-500 transition-colors p-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Passengers List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-end pr-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ListChecks size={14} className="text-brand-accent" />
              Lista de Passageiros
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsImporting(!isImporting)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all tracking-widest",
                  isImporting ? "bg-brand-accent text-zinc-950" : "bg-zinc-900 text-zinc-500 hover:text-white"
                )}
                title="Colar Lista"
              >
                <ClipboardPaste size={12} />
                Importar
              </button>
              <button
                type="button"
                onClick={exportPassengers}
                disabled={formData.passengers.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-zinc-500 hover:text-white disabled:opacity-30 rounded-lg text-[8px] font-black uppercase transition-all tracking-widest"
                title="Exportar Lista"
              >
                <Download size={12} />
                Exportar
              </button>
            </div>
          </div>

          <div className="p-6 bg-zinc-950/50 rounded-2xl border border-zinc-800 space-y-6">
            {isImporting ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-zinc-900 p-4 rounded-xl border border-brand-accent/30 space-y-3">
                  <p className="text-[8px] font-black text-brand-accent uppercase tracking-widest leading-relaxed">
                    Cole o texto abaixo (ex: Nome 123.456.789-00). <br/>
                    Cada passageiro em uma nova linha.
                  </p>
                  <textarea
                    className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-[10px] text-zinc-300 font-mono focus:outline-none focus:border-brand-accent transition-all resize-none"
                    placeholder="JOÃO SILVA 123.456.789-00&#10;MARIA OLIVEIRA RG 1234567"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePassengerImport}
                      className="flex-1 py-3 bg-brand-accent text-zinc-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                    >
                      Processar Texto
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsImporting(false)}
                      className="px-6 py-3 bg-zinc-800 text-zinc-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="NOME COMPLETO"
                  className="bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-xs text-white font-bold uppercase focus:border-brand-accent/50 outline-none transition-all"
                  value={newPassenger.name}
                  onChange={e => setNewPassenger({ ...newPassenger, name: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="RG / CPF (OPCIONAL)"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-xs text-white font-bold uppercase focus:border-brand-accent/50 outline-none transition-all"
                    value={newPassenger.document}
                    onChange={e => setNewPassenger({ ...newPassenger, document: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={addPassenger}
                    className="w-14 h-14 bg-brand-accent text-zinc-950 rounded-xl flex items-center justify-center hover:bg-white transition-all shadow-lg active:scale-95"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>
            )}

            {formData.passengers.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {formData.passengers.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-800/50 group">
                    {editingPassengerIndex === idx ? (
                      <div className="flex-1 flex gap-2 mr-2">
                        <input
                          type="text"
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-3 text-[10px] text-white font-bold uppercase"
                          value={editPassengerData.name}
                          onChange={e => setEditPassengerData({ ...editPassengerData, name: e.target.value })}
                          autoFocus
                        />
                        <input
                          type="text"
                          className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-3 text-[10px] text-white font-bold uppercase"
                          value={editPassengerData.document}
                          onChange={e => setEditPassengerData({ ...editPassengerData, document: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white uppercase truncate">{p.name}</p>
                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{p.document}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      {editingPassengerIndex === idx ? (
                        <button
                          type="button"
                          onClick={saveEditedPassenger}
                          className="text-emerald-500 hover:text-emerald-400 p-2"
                        >
                          <Check size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingPassenger(idx)}
                          className="text-zinc-700 hover:text-brand-accent transition-colors p-2"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePassenger(idx)}
                        className="text-zinc-700 hover:text-rose-500 transition-colors p-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest text-center border-t border-zinc-900 pt-4">
              Total: {formData.passengerCount} Passageiros
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Veículo Escalado</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
              <Bus size={18} />
            </div>
            <select
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 appearance-none transition-all uppercase"
              value={formData.vehicleId}
              onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
            >
              <option value="">SELECIONE UM VEÍCULO</option>
              {(vehicles || []).map(v => (
                <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Motorista Principal</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
              <User size={18} />
            </div>
            <select
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 appearance-none transition-all uppercase"
              value={formData.driverId}
              onChange={e => setFormData({ ...formData, driverId: e.target.value })}
            >
              <option value="">SELECIONE O MOTORISTA</option>
              {(employees || []).filter(e => e.role === 'Motorista').map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-zinc-400 italic">Motorista Auxiliar (Opcional)</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
              <User size={18} />
            </div>
            <select
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-brand-accent/50 appearance-none transition-all uppercase"
              value={formData.secondDriverId}
              onChange={e => setFormData({ ...formData, secondDriverId: e.target.value })}
            >
              <option value="">NENHUM MOTORISTA AUXILIAR</option>
              {(employees || []).filter(e => e.role === 'Motorista' && e.id !== formData.driverId).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Observações da Operação</label>
          <div className="relative group">
            <div className="absolute top-4 left-4 pointer-events-none text-zinc-500">
              <Info size={18} />
            </div>
            <textarea
              rows={3}
              placeholder="NOTAS DE VIAGEM, PEDÁGIOS, PARADAS..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent/50 transition-all uppercase"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4 sticky bottom-0 bg-zinc-950 py-4 border-t border-zinc-900 z-10">
        {onDelete && (
          <Button
            type="button"
            onClick={() => {
              setDeleteConfirm({
                isOpen: true,
                title: 'Excluir Viagem',
                message: 'TEM CERTEZA QUE DESEJA EXCLUIR ESTA VIAGEM? TODOS OS DADOS E REGISTROS VINCULADOS SERÃO REMOVIDOS DEFINITIVAMENTE.',
                onConfirm: () => {
                  onDelete();
                  setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                }
              });
            }}
            className="w-14 h-14 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all shadow-lg"
            title="Excluir Viagem"
          >
            <Trash2 size={20} />
          </Button>
        )}
        <Button
          type="button"
          onClick={onCancel}
          className="flex-1 h-14 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 group"
        >
          CANCELAR
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-[2] h-14 shadow-[0_0_20px_rgba(255,107,0,0.2)]"
        >
          SALVAR VIAGEM NO SISTEMA
        </Button>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />
    </form>
  </div>
);
};
