import React, { useState, useRef } from 'react';
import { 
  Bus, 
  Calendar, 
  Hash, 
  Save, 
  Loader2,
  Users,
  Fuel,
  Phone,
  Briefcase,
  MapPin,
  Wrench,
  Share2,
  Camera,
  X,
  Lock,
  Clock,
  FileSpreadsheet,
  Globe,
  Upload
} from 'lucide-react';
import { Input, Select, Button } from './UI';
import { cn } from '../lib/utils';
import { WorkSchedule } from '../types';

export const VehicleForm = ({ onSubmit, loading, initialData }: any) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2">
        <Bus size={14} className="text-brand-accent" />
        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Informações Básicas</h3>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Input label="Placa" placeholder="ABC-1234" icon={Hash} required name="plate" defaultValue={initialData?.plate} />
        <Select 
          label="Tipo de Veículo" 
          icon={Bus} 
          name="type"
          defaultValue={initialData?.type}
          options={[
            { value: 'van', label: 'Van (Executiva)' },
            { value: 'bus', label: 'Ônibus (Turismo)' }
          ]} 
        />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Input label="Modelo/Marca" placeholder="Ex: Mercedes-Benz Sprinter" icon={Bus} required name="model" defaultValue={initialData?.model} />
        <Input label="Ano de Fabr." placeholder="2023" icon={Calendar} required name="factoryYear" defaultValue={initialData?.factoryYear} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Input label="Capacidade (Passageiros)" type="number" placeholder="15" icon={Users} required name="capacity" defaultValue={initialData?.capacity} />
        <Input label="Odômetro Atual (KM)" type="number" placeholder="50.000" icon={Hash} required name="currentOdometer" defaultValue={initialData?.currentOdometer} />
      </div>
    </div>

    <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2">
        <FileSpreadsheet size={14} className="text-brand-accent" />
        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Documentação Obrigatória</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Venc. Licenciamento (CRLV)" type="date" icon={Calendar} required name="licenseExpiration" defaultValue={initialData?.licenseExpiration} />
        <Input label="Venc. Seguro APP (Passageiros)" type="date" icon={Calendar} required name="insuranceExpiration" defaultValue={initialData?.insuranceExpiration} />
        <Input label="Venc. Cronotacógrafo (INMETRO)" type="date" icon={Calendar} name="tacografoExpiration" defaultValue={initialData?.tacografoExpiration} />
        <Input label="Venc. Licença Municipal / Alvará" type="date" icon={Calendar} name="municipalLicenseExpiration" defaultValue={initialData?.municipalLicenseExpiration} />
      </div>
    </div>

    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-2 mb-2">
        <Globe size={14} className="text-emerald-500" />
        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Autorizações de Turismo</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input label="Venc. CADASTUR (Nacional)" type="date" icon={Calendar} name="cadasturExpiration" defaultValue={initialData?.cadasturExpiration} />
        <Input label="Venc. ANTT (Interestadual)" type="date" icon={Calendar} name="anttExpiration" defaultValue={initialData?.anttExpiration} />
        <Input label="Venc. Estadual (DETRO/ARTESP)" type="date" icon={Calendar} name="detroArtespExpiration" defaultValue={initialData?.detroArtespExpiration} />
      </div>
    </div>
    
    <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2">
        <Wrench size={14} className="text-brand-accent" />
        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Controle de Manutenção</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Próxima Revisão Preventiva" type="date" icon={Calendar} name="nextPreventiveMaintenanceDate" defaultValue={initialData?.nextPreventiveMaintenanceDate} />
        <Input label="Próxima Troca de Óleo (KM)" type="number" placeholder="60.000" icon={Hash} name="nextOilChangeKM" defaultValue={initialData?.nextOilChangeKM} />
      </div>
    </div>
    
    <div className="pt-4">
      <Button loading={loading}>
        <Save size={20} />
        {initialData ? 'Atualizar Ativo' : 'Registrar Veículo'}
      </Button>
    </div>
  </form>
);

export const FuelForm = ({ onSubmit, loading, vehicles, tanks, employees, isExternal = false }: any) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Select 
        label="Veículo" 
        icon={Bus} 
        name="vehicleId" 
        required
        options={(vehicles || []).map((v: any) => ({ value: v.id, label: `${v.plate} - ${v.model}` }))}
      />
      <Select 
        label="Motorista" 
        icon={Users} 
        name="driverId" 
        required
        options={(employees || []).map((e: any) => ({ value: e.id, label: e.name }))}
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {isExternal ? (
        <Input label="Localização / Posto" placeholder="Ex: Posto Graal KM 120" icon={MapPin} required name="location" />
      ) : (
        <Select 
          label="Tanque de Origem" 
          icon={Hash} 
          name="fuelTankId" 
          required
          options={(tanks || []).map((t: any) => ({ value: t.id, label: `${t.name} (${t.currentLevel}L)` }))}
        />
      )}
      <div className="space-y-1">
        <Input label="Odômetro Atual" type="number" placeholder="50.000" icon={Hash} required name="odometer" />
        <p className="text-[10px] text-brand-accent/60 font-medium px-1 italic">* O odômetro do veículo será atualizado para este valor.</p>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-1">
        <Input label="Quantidade (Litros)" type="number" step="0.01" placeholder="100.00" icon={Hash} required name="quantity" />
        {!isExternal && <p className="text-[10px] text-rose-500/60 font-medium px-1 italic">* Este volume será subtraído do saldo do tanque.</p>}
      </div>
    </div>

    {!isExternal && (
      <div className="pt-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-brand-accent rounded-full" />
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Opcional: Arla 32</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select 
            label="Tanque de Arla" 
            icon={Hash} 
            name="arlaTankId" 
            options={[
              { value: '', label: 'Não utilizar Arla' },
              ... (tanks || []).filter((t: any) => t.fuelType === 'Arla 32' || t.name.toLowerCase().includes('arla')).map((t: any) => ({ value: t.id, label: `${t.name} (${t.currentLevel}L)` }))
            ]}
          />
          <Input label="Quantidade Arla (Litros)" type="number" step="0.01" placeholder="5.00" icon={Hash} name="arlaQuantity" />
        </div>
      </div>
    )}

    <div className="pt-4">
      <Button loading={loading}>
        <Save size={20} />
        {isExternal ? 'Registrar Abastecimento Externo' : 'Registrar Abastecimento Interno'}
      </Button>
    </div>
    {isExternal && <input type="hidden" name="isExternal" value="true" />}
  </form>
);

export const TankForm = ({ onSubmit, loading }: any) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="space-y-6">
      <Input label="Nome do Tanque" icon={Hash} placeholder="Tanque Principal S10" required name="name" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select 
          label="Tipo de Combustível" 
          icon={Fuel} 
          name="fuelType" 
          required
          options={[
            { value: 'Diesel S10', label: 'Diesel S10' },
            { value: 'Diesel S500', label: 'Diesel S500' },
            { value: 'Arla 32', label: 'Arla 32' },
          ]}
        />
        <Input label="Capacidade Total (Litros)" type="number" placeholder="10000" icon={Hash} required name="capacity" />
      </div>
      <Input label="Nível Atual (Litros)" type="number" placeholder="5000" icon={Hash} required name="currentLevel" />
    </div>

    <div className="pt-4">
      <Button loading={loading}>
        <Save size={20} />
        Salvar Tanque
      </Button>
    </div>
  </form>
);

export const TankRefillForm = ({ onSubmit, loading, tanks }: any) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="space-y-6">
      <Select 
        label="Tanque para Reabastecer" 
        icon={Fuel} 
        name="tankId" 
        required
        options={(tanks || []).map((t: any) => ({ value: t.id, label: `${t.name} (Atual: ${t.currentLevel}L)` }))}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Quantidade Entrada (Litros)" type="number" step="0.01" placeholder="5000.00" icon={Hash} required name="quantity" />
        <Input label="Custo Total (R$)" type="number" step="0.01" placeholder="25000.00" icon={Hash} required name="cost" />
      </div>

      <Input label="Fornecedor / Nota Fiscal" placeholder="Ex: Posto Ipiranga - NF 12345" icon={Users} name="supplier" />
    </div>

    <div className="pt-4">
      <Button loading={loading}>
        <Save size={20} />
        Registrar Entrada de Combustível
      </Button>
    </div>
  </form>
);

export const EmployeeForm = ({ onSubmit, loading, initialData, currentUserRole, currentUserEmail }: any) => {
  const [photo, setPhoto] = useState<string | null>(initialData?.photoUrl || null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialData?.permissions || []);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Work Schedule State (Defaulting to 'Ana Paula' rule: 08-18h with 1h30 break, Sat 08-12h)
  const [schedule, setSchedule] = useState<WorkSchedule>(initialData?.workSchedule || {
    monToFri: {
      morning: { start: '08:00', end: '11:30' },
      afternoon: { start: '13:00', end: '18:00' }
    },
    saturday: { start: '08:00', end: '12:00' },
    sunday: { start: '', end: '' }
  });

  const isSpecialUser = currentUserRole === 'Dono / Proprietário' || currentUserEmail === 'elizeuferron@gmail.com';

  const ALL_TOOLS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'fretamento', label: 'Fretamento' },
    { id: 'fleet', label: 'Gestão de Frotas' },
    { id: 'finance', label: 'Financeiro' },
    { id: 'fuel', label: 'Combustível' },
    { id: 'trips', label: 'Viagens' },
    { id: 'staff', label: 'Equipe' },
    { id: 'os', label: 'Ordens de Serviço' },
    { id: 'inventory', label: 'Almoxarifado' },
    { id: 'reports', label: 'Relatórios' },
  ];

  const handleTogglePermission = (toolId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(toolId) 
        ? prev.filter(p => p !== toolId) 
        : [...prev, toolId]
    );
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Use a small delay to ensure the video element is ready for play()
        // or just call play() and catch the error
        videoRef.current.play().catch(err => {
          if (err.name !== 'AbortError') {
            console.error('Video play error:', err);
          }
        });
      }
    } catch (err) {
      console.error(err);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleShareAccess = () => {
    if (!initialData?.id || !initialData?.phone) return;
    const appUrl = window.location.origin;
    const shareUrl = `${appUrl}/?emp=${initialData.id}`;
    const message = `🚀 *DM TURISMO PRO - ACESSO LIBERADO*%0A%0AOlá ${initialData.name}! 👋%0A%0AO seu acesso ao terminal de operações foi configurado.%0A%0A🔗 *SEU LINK:* ${shareUrl}%0A%0A*INSTRUÇÕES:*%0A1. Abra o link no Chrome ou Safari.%0A2. Adicione à Tela de Início para ter o ícone do App.%0A3. Use sua senha cadastrada para acessar sua jornada e escalas.%0A%0A_Sistema DM Turismo - Desempenho e Tecnologia._`;
    const cleanPhone = initialData.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <form onSubmit={(e: any) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());
      onSubmit({ 
        ...data, 
        photoUrl: photo, 
        permissions: selectedPermissions,
        workSchedule: schedule
      });
    }} className="space-y-6">
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 py-4">
           <div className="relative group">
              <div className="w-32 h-32 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-3xl overflow-hidden flex items-center justify-center">
                 {photo ? (
                   <img src={photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <Users className="text-zinc-700" size={40} />
                 )}
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                 <button 
                   type="button" 
                   onClick={startCamera}
                   className="p-2 bg-brand-accent text-zinc-950 rounded-xl hover:scale-110 transition-transform"
                   title="Usar Câmera"
                 >
                    <Camera size={18} />
                 </button>
                 <label className="p-2 bg-white text-zinc-950 rounded-xl hover:scale-110 transition-transform cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setPhoto(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Upload size={18} />
                 </label>
              </div>
           </div>
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Foto do Colaborador</p>
        </div>

        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden max-w-md w-full relative">
              <video 
                ref={videoRef} 
                playsInline 
                className="w-full aspect-square object-cover bg-black"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="p-6 flex items-center justify-between bg-zinc-900">
                <button 
                  type="button" 
                  onClick={stopCamera}
                  className="p-4 bg-zinc-800 text-white rounded-2xl"
                >
                  <X size={24} />
                </button>
                <button 
                  type="button" 
                  onClick={capturePhoto}
                  className="px-8 py-4 bg-brand-accent text-zinc-950 font-black rounded-2xl"
                >
                  CAPTURAR FOTO
                </button>
              </div>
            </div>
          </div>
        )}

        <Input label="Nome Completo" placeholder="Ex: João Silva" icon={Users} required name="name" defaultValue={initialData?.name} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select 
            label="Função" 
            icon={Briefcase} 
            name="role" 
            required
            defaultValue={initialData?.role}
            options={[
              { value: 'Dono / Proprietário', label: 'Dono / Proprietário' },
              { value: 'Motorista', label: 'Motorista' },
              { value: 'Limpeza / Conservação', label: 'Limpeza / Conservação' },
              { value: 'Administrativo', label: 'Administrativo' },
              { value: 'Gestor de Frotas', label: 'Gestor de Frotas' },
              { value: 'Coordenador Logístico', label: 'Coordenador Logístico' },
            ]}
          />
          <div className="relative group">
            <Input label="Telefone / WhatsApp" placeholder="(21) 98888-8888" icon={Phone} required name="phone" defaultValue={initialData?.phone} />
            {initialData?.phone && (
              <button
                type="button"
                onClick={handleShareAccess}
                className="absolute right-3 bottom-3 p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-md transition-all flex items-center gap-1 text-[8px] font-black uppercase tracking-widest"
                title="Compartilhar Acesso via WhatsApp"
              >
                <Share2 size={12} />
                Enviar Acesso
              </button>
            )}
          </div>
        </div>

        {/* WORK SCHEDULE SECTION */}
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-accent" />
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Escala de Trabalho</h3>
            </div>
          </div>

          <div className="space-y-6">
            {/* Monday to Friday */}
            <div className="space-y-4">
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest block bg-brand-accent/10 w-fit px-2 py-0.5 rounded">Segunda a Sexta</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Período: Manhã</span>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Início" type="time" name="monToFri_morning_start" 
                      value={schedule.monToFri.morning.start}
                      onChange={(e: any) => setSchedule((prev: any) => ({ ...prev, monToFri: { ...prev.monToFri, morning: { ...prev.monToFri.morning, start: e.target.value } } }))}
                    />
                    <Input 
                      label="Fim" type="time" name="monToFri_morning_end" 
                      value={schedule.monToFri.morning.end}
                      onChange={(e: any) => setSchedule((prev: any) => ({ ...prev, monToFri: { ...prev.monToFri, morning: { ...prev.monToFri.morning, end: e.target.value } } }))}
                    />
                  </div>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Período: Tarde</span>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Início" type="time" name="monToFri_afternoon_start" 
                      value={schedule.monToFri.afternoon.start}
                      onChange={(e: any) => setSchedule((prev: any) => ({ ...prev, monToFri: { ...prev.monToFri, afternoon: { ...prev.monToFri.afternoon, start: e.target.value } } }))}
                    />
                    <Input 
                      label="Fim" type="time" name="monToFri_afternoon_end" 
                      value={schedule.monToFri.afternoon.end}
                      onChange={(e: any) => setSchedule((prev: any) => ({ ...prev, monToFri: { ...prev.monToFri, afternoon: { ...prev.monToFri.afternoon, end: e.target.value } } }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Saturday & Sunday Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block bg-zinc-800 w-fit px-2 py-0.5 rounded">Sábado</span>
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Início" type="time" name="saturday_start" 
                      value={schedule.saturday?.start}
                      onChange={(e: any) => setSchedule((prev: any) => ({ ...prev, saturday: { start: e.target.value, end: prev.saturday?.end || '' } }))}
                    />
                    <Input 
                      label="Fim" type="time" name="saturday_end" 
                      value={schedule.saturday?.end}
                      onChange={(e: any) => setSchedule((prev: any) => ({ ...prev, saturday: { start: prev.saturday?.start || '', end: e.target.value } }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block bg-zinc-800 w-fit px-2 py-0.5 rounded">Domingo</span>
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Início" type="time" name="sunday_start" 
                      value={schedule.sunday?.start}
                      onChange={(e: any) => setSchedule((prev: any) => ({ ...prev, sunday: { start: e.target.value, end: prev.sunday?.end || '' } }))}
                    />
                    <Input 
                      label="Fim" type="time" name="sunday_end" 
                      value={schedule.sunday?.end}
                      onChange={(e: any) => setSchedule((prev: any) => ({ ...prev, sunday: { start: prev.sunday?.start || '', end: e.target.value } }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="E-mail (Opcional)" type="email" placeholder="joao@unimult.com.br" icon={Users} name="email" defaultValue={initialData?.email} />
          <Input label="Senha de Acesso (App)" type="password" placeholder="Defina uma senha" icon={Lock} name="password" defaultValue={initialData?.password} />
        </div>
        
        {isSpecialUser && (
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Controle de Permissões</h3>
              <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest px-2 py-0.5 bg-brand-accent/10 rounded-full border border-brand-accent/20">Avançado</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_TOOLS.map(tool => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleTogglePermission(tool.id)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all text-center",
                    selectedPermissions.includes(tool.id)
                      ? "bg-brand-accent border-brand-accent text-zinc-950 shadow-lg shadow-brand-accent/20"
                      : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  {tool.label}
                </button>
              ))}
            </div>
            <p className="text-[8px] font-bold text-zinc-600 uppercase italic">
              * Se nenhuma permissão for marcada, o sistema usará as permissões padrão do cargo selecionado.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Data de Nascimento" type="date" icon={Calendar} name="birthDate" defaultValue={initialData?.birthDate} />
          <Input label="Vencimento CNH" type="date" icon={Calendar} name="licenseExpiration" defaultValue={initialData?.licenseExpiration} />
        </div>
        <Input label="Data de Admissão" type="date" icon={Calendar} name="admissionDate" defaultValue={initialData?.admissionDate} />
      </div>

      <div className="pt-4 flex gap-4">
        <Button loading={loading} className="flex-1">
          <Save size={20} />
          {initialData ? 'Atualizar Funcionário' : 'Salvar Funcionário'}
        </Button>
      </div>
    </form>
  );
};

// MaintenanceForm has been moved to its own file.

