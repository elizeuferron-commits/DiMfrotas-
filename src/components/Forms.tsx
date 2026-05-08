import React from 'react';
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
  Wrench
} from 'lucide-react';
import { Input, Select, Button } from './UI';

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
        options={vehicles.map((v: any) => ({ value: v.id, label: `${v.plate} - ${v.model}` }))}
      />
      <Select 
        label="Motorista" 
        icon={Users} 
        name="driverId" 
        required
        options={employees.map((e: any) => ({ value: e.id, label: e.name }))}
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
          options={tanks.map((t: any) => ({ value: t.id, label: `${t.name} (${t.currentLevel}L)` }))}
        />
      )}
      <div className="space-y-1">
        <Input label="Odômetro Atual" type="number" placeholder="50.000" icon={Hash} required name="odometer" />
        <p className="text-[10px] text-brand-accent/60 font-medium px-1 italic">* O odômetro do veículo será atualizado para este valor.</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-1">
        <Input label="Quantidade (Litros)" type="number" step="0.01" placeholder="100.00" icon={Hash} required name="quantity" />
        {!isExternal && <p className="text-[10px] text-rose-500/60 font-medium px-1 italic">* Este volume será subtraído do saldo do tanque.</p>}
      </div>
      <Input label="Custo (R$)" type="number" step="0.01" placeholder="500.00" icon={Hash} required name="cost" />
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
              ...tanks.filter((t: any) => t.fuelType === 'Arla 32' || t.name.toLowerCase().includes('arla')).map((t: any) => ({ value: t.id, label: `${t.name} (${t.currentLevel}L)` }))
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
        options={tanks.map((t: any) => ({ value: t.id, label: `${t.name} (Atual: ${t.currentLevel}L)` }))}
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

export const EmployeeForm = ({ onSubmit, loading, initialData }: any) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="space-y-6">
      <Input label="Nome Completo" placeholder="Ex: João Silva" icon={Users} required name="name" defaultValue={initialData?.name} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select 
          label="Função" 
          icon={Briefcase} 
          name="role" 
          required
          defaultValue={initialData?.role}
          options={[
            { value: 'Motorista', label: 'Motorista' },
            { value: 'Mecânico', label: 'Mecânico' },
            { value: 'Auxiliar', label: 'Auxiliar' },
            { value: 'Administrativo', label: 'Administrativo' },
            { value: 'Coordenador Logístico', label: 'Coordenador Logístico' },
            { value: 'Gestor de Frotas', label: 'Gestor de Frotas' },
            { value: 'Dono / Proprietário', label: 'Dono ou Proprietário' },
            { value: 'Limpeza', label: 'Limpeza / Conservação' },
          ]}
        />
        <Input label="Telefone / WhatsApp" placeholder="(21) 98888-8888" icon={Phone} required name="phone" defaultValue={initialData?.phone} />
      </div>

      <Input label="E-mail (Opcional)" type="email" placeholder="joao@unimult.com.br" icon={Users} name="email" defaultValue={initialData?.email} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Data de Nascimento" type="date" icon={Calendar} name="birthDate" defaultValue={initialData?.birthDate} />
        <Input label="Data de Admissão" type="date" icon={Calendar} name="admissionDate" defaultValue={initialData?.admissionDate} />
      </div>
    </div>

    <div className="pt-4">
      <Button loading={loading}>
        <Save size={20} />
        {initialData ? 'Atualizar Funcionário' : 'Salvar Funcionário'}
      </Button>
    </div>
  </form>
);

export const MaintenanceForm = ({ onSubmit, loading, vehicles }: any) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Select 
        label="Veículo" 
        icon={Bus} 
        name="vehicleId" 
        required
        options={vehicles.map((v: any) => ({ value: v.id, label: `${v.plate} - ${v.model}` }))}
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
