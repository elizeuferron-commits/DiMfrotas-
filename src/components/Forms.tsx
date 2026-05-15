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
  Lock
} from 'lucide-react';
import { Input, Select, Button } from './UI';
import { cn } from '../lib/utils';

export const VehicleForm = ({ onSubmit, loading, initialData }: any) => (
  <form onSubmit={onSubmit} className="space-y-2">
    <div className="grid grid-cols-2 gap-6">
      <Input label="Placa" placeholder="ABC-1234" icon={Hash} required name="plate" defaultValue={initialData?.plate} />
      <Select 
        label="Tipo" 
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
      <Input label="Capacidade (Pax)" type="number" placeholder="15" icon={Users} required name="capacity" defaultValue={initialData?.capacity} />
      <Input label="Odômetro (KM)" type="number" placeholder="50.000" icon={Hash} required name="currentOdometer" defaultValue={initialData?.currentOdometer} />
    </div>
    <div className="grid grid-cols-2 gap-6">
      <Input label="Venc. Licenciamento" type="date" icon={Calendar} required name="licenseExpiration" defaultValue={initialData?.licenseExpiration} />
      <Input label="Venc. Turismo (ANTT/CADASTUR)" type="date" icon={Calendar} required name="tourismLicenseExpiration" defaultValue={initialData?.tourismLicenseExpiration} />
    </div>
    <div className="grid grid-cols-2 gap-6">
      <Input label="Venc. Seguro Passageiros" type="date" icon={Calendar} required name="insuranceExpiration" defaultValue={initialData?.insuranceExpiration} />
      <Input label="Próxima Revisão Preventiva" type="date" icon={Calendar} name="nextPreventiveMaintenanceDate" defaultValue={initialData?.nextPreventiveMaintenanceDate} />
    </div>
    
    <div className="grid grid-cols-1 gap-6">
      <Input label="Próxima Troca de Óleo (Km)" type="number" placeholder="60.000" icon={Hash} name="nextOilChangeKM" defaultValue={initialData?.nextOilChangeKM} />
    </div>
    
    <div className="pt-8">
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

  const isSpecialUser = currentUserRole === 'Dono / Proprietário' || currentUserEmail === 'elizeuferron@gmail.com';

  const ALL_TOOLS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'journey', label: 'Jornada' },
    { id: 'fretamento', label: 'Fretamento' },
    { id: 'fleet', label: 'Frota' },
    { id: 'vencimentos', label: 'Vencimentos' },
    { id: 'finance', label: 'Financeiro' },
    { id: 'fuel', label: 'Combustível' },
    { id: 'maintenance', label: 'Manutenção' },
    { id: 'staff', label: 'Equipe' },
    { id: 'trips', label: 'Viagens' },
    { id: 'os', label: 'OS de Viagem' },
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
      onSubmit({ ...data, photoUrl: photo, permissions: selectedPermissions });
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
                    <Save size={18} />
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
                autoPlay 
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

export const MaintenanceForm = ({ onSubmit, loading, vehicles }: any) => (
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
        label="Tipo de Manutenção" 
        icon={Wrench} 
        name="type" 
        required
        options={[
          { value: 'preventive', label: 'Preventiva' },
          { value: 'corrective', label: 'Corretiva' }
        ]}
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Select 
        label="Serviço / Descrição" 
        icon={Briefcase} 
        name="description" 
        required
        options={[
          { value: 'Troca de Óleo (Motor) e Filtros', label: 'Troca de Óleo (Motor) e Filtros' },
          { value: 'Pneu Dianteiro Esquerdo (Troca/Rodízio)', label: 'Pneu Dianteiro Esquerdo (Troca/Rodízio)' },
          { value: 'Pneu Dianteiro Direito (Troca/Rodízio)', label: 'Pneu Dianteiro Direito (Troca/Rodízio)' },
          { value: 'Pneu Traseiro Esquerdo (Troca/Rodízio)', label: 'Pneu Traseiro Esquerdo (Troca/Rodízio)' },
          { value: 'Pneu Traseiro Direito (Troca/Rodízio)', label: 'Pneu Traseiro Direito (Troca/Rodízio)' },
          { value: 'Freios Dianteiros (Pastilhas/Discos/Lado Esq)', label: 'Freios Dianteiros (Pastilhas/Discos/Lado Esq)' },
          { value: 'Freios Dianteiros (Pastilhas/Discos/Lado Dir)', label: 'Freios Dianteiros (Pastilhas/Discos/Lado Dir)' },
          { value: 'Freios Traseiros (Sapatas/Tambores/Lado Esq)', label: 'Freios Traseiros (Sapatas/Tambores/Lado Esq)' },
          { value: 'Freios Traseiros (Sapatas/Tambores/Lado Dir)', label: 'Freios Traseiros (Sapatas/Tambores/Lado Dir)' },
          { value: 'Cubo e Rolamento (Dianteiro Esquerdo)', label: 'Cubo e Rolamento (Dianteiro Esquerdo)' },
          { value: 'Cubo e Rolamento (Dianteiro Direito)', label: 'Cubo e Rolamento (Dianteiro Direito)' },
          { value: 'Cubo e Rolamento (Traseiro Esquerdo)', label: 'Cubo e Rolamento (Traseiro Esquerdo)' },
          { value: 'Cubo e Rolamento (Traseiro Direito)', label: 'Cubo e Rolamento (Traseiro Direito)' },
          { value: 'Engraxamento Geral de Chassi', label: 'Engraxamento Geral de Chassi' },
          { value: 'Suspensão (Amortecedores/Buchas/Pivôs)', label: 'Suspensão (Amortecedores/Buchas/Pivôs)' },
          { value: 'Alinhamento e Balanceamento 3D', label: 'Alinhamento e Balanceamento 3D' },
          { value: 'Ar Condicionado (Gás/Higienização/Filtros)', label: 'Ar Condicionado (Gás/Higienização/Filtros)' },
          { value: 'Motor (Correias/Tensores/Vazamentos)', label: 'Motor (Correias/Tensores/Vazamentos)' },
          { value: 'Sistema de Arrefecimento (Limpeza/Aditivo)', label: 'Sistema de Arrefecimento (Limpeza/Aditivo)' },
          { value: 'Embreagem e Atuadores', label: 'Embreagem e Atuadores' },
          { value: 'Injeção Eletrônica e Bicos', label: 'Injeção Eletrônica e Bicos' },
          { value: 'Parte Elétrica e Baterias', label: 'Parte Elétrica e Baterias' },
          { value: 'Tacógrafo (Aferição/Reparo)', label: 'Tacógrafo (Aferição/Reparo)' },
          { value: 'Sistema Arla 32 (Filtros/Sensores)', label: 'Sistema Arla 32 (Filtros/Sensores)' },
          { value: 'Itens de Salão / Acessibilidade', label: 'Itens de Salão / Acessibilidade' },
          { value: 'Higienização e Lavagem Técnica', label: 'Higienização e Lavagem Técnica' },
          { value: 'Outros', label: 'Outros (Especificar na Observação)' },
        ]}
      />
      <Input label="Custo Total (R$)" type="number" step="0.01" placeholder="1500.00" icon={Hash} name="cost" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-zinc-800">
      <Input label="Próxima Data (Prevista)" type="date" icon={Calendar} name="nextPreventiveMaintenanceDate" />
      <Input label="Próximo KM (Previsto)" type="number" icon={Hash} name="nextMaintenanceKM" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Input label="Data da Manutenção" type="date" icon={Calendar} required name="completedAt" />
      <Input label="Odômetro na Manutenção (KM)" type="number" icon={Hash} required name="odometer" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Select 
        label="Status" 
        icon={Hash} 
        name="status"
        defaultValue="completed"
        options={[
          { value: 'completed', label: 'Concluída' },
          { value: 'pending', label: 'Pendente / Agendada' }
        ]}
      />
      <div className="flex items-center justify-center p-4 bg-zinc-950/20 border border-zinc-800/50 rounded-xl">
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center italic">A data e KM informados atualizarão o fichário do veículo.</p>
      </div>
    </div>

    <div className="pt-4">
      <Button loading={loading}>
        <Save size={20} />
        Registrar Manutenção
      </Button>
    </div>
  </form>
);
