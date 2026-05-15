import React, { useState } from 'react';
import { 
  Route, 
  Users, 
  Calendar, 
  Clock, 
  Search, 
  MapPin, 
  Plus, 
  Building2,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { Button, Input, Select, ConfirmModal } from './UI';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface CharteredRoute {
  id: string;
  name: string;
  client: string;
  type: 'factory' | 'school' | 'other';
  daysOfWeek: number[]; // 0-6
  schedules: { departureTime: string; returnTime: string }[];
  fixedVehicleId?: string;
  fixedDriverId?: string;
  passengerCount: number;
  status: 'active' | 'inactive';
}

export const CharteredRoutes = ({ vehicles, employees, routes }: { vehicles: any[], employees: any[], routes: CharteredRoute[] }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    client: '',
    type: 'factory' as const,
    daysOfWeek: [1, 2, 3, 4, 5],
    schedules: [{ departureTime: '', returnTime: '' }],
    locationUrl: '',
    passengerCount: 0
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; onConfirm: () => void; title: string; message: string }>({
    isOpen: false,
    onConfirm: () => {},
    title: '',
    message: ''
  });

  const handleDeleteRoute = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Excluir Fretamento',
      message: `Tem certeza que deseja excluir permanentemente a rota "${name}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'chartered_routes', id));
          toast.success('Rota de fretamento excluída.');
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'chartered_routes');
        }
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleImportLocation = () => {
    if (!newRoute.locationUrl.includes('google.com/maps') && !newRoute.locationUrl.includes('maps.app.goo.gl')) {
      toast.error('Link do Google Maps inválido.');
      return;
    }
    toast.success('Localização importada com sucesso!');
  };

  const handleAddRoute = async () => {
    if (!newRoute.name || !newRoute.client) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    
    try {
      await addDoc(collection(db, 'chartered_routes'), {
        ...newRoute,
        status: 'active',
        createdAt: serverTimestamp()
      });
      setShowAddForm(false);
      setNewRoute({
        name: '',
        client: '',
        type: 'factory',
        daysOfWeek: [1, 2, 3, 4, 5],
        schedules: [{ departureTime: '', returnTime: '' }],
        locationUrl: '',
        passengerCount: 0
      });
      toast.success('Nova rota de fretamento cadastrada!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chartered_routes');
    }
  };

  const toggleRouteStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'chartered_routes', id), {
        status: currentStatus === 'active' ? 'inactive' : 'active'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chartered_routes');
    }
  };

  const getDayLabel = (day: number) => {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return labels[day];
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Gestão de Fretamento</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 italic">Operação de Rotas Fixas e Contratos Mensais</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-accent transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar contrato ou rota..." 
              className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-10 pr-4 text-zinc-300 text-xs focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none w-full md:w-64 transition-all"
            />
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-brand-accent text-zinc-950 px-6 font-black rounded-2xl">
            <Plus size={20} />
            NOVA ROTA
          </Button>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Rotas Ativas</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-black text-white">{routes.filter(r => r.status === 'active').length}</p>
            <Route size={20} className="text-brand-accent/40" />
          </div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Passageiros/Dia</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-black text-white">{routes.reduce((acc, r) => acc + r.passengerCount, 0)}</p>
            <Users size={20} className="text-emerald-500/40" />
          </div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Veículos Alocados</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-black text-white">{routes.filter(r => r.fixedVehicleId).length}</p>
            <Building2 size={20} className="text-blue-500/40" />
          </div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Faturamento Previsto</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-black text-emerald-500">R$ --</p>
            <Clock size={20} className="text-emerald-500/40" />
          </div>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map((route) => (
          <div key={route.id} className="bg-zinc-900 border border-zinc-800 rounded-[32px] overflow-hidden group hover:border-brand-accent/30 transition-all duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                      route.type === 'factory' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    )}>
                      {route.type === 'factory' ? 'INDÚSTRIA' : 'ESCOLAR'}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all cursor-pointer hover:scale-105 active:scale-95",
                      route.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700"
                    )}
                    onClick={() => toggleRouteStatus(route.id, route.status)}
                    title={route.status === 'active' ? 'Clique para desativar' : 'Clique para ativar'}
                    >
                      {route.status === 'active' ? 'ATIVA' : 'INATIVA'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{route.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase mt-1">
                    <Building2 size={12} className="text-brand-accent" />
                    {route.client}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-xl hover:text-white transition-colors">
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteRoute(route.id, route.name)}
                    className="p-2 bg-zinc-950 border border-zinc-800 text-rose-500 rounded-xl hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-3">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Dias de Operação</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 0].map(d => (
                      <span key={d} className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black transition-all",
                        route.daysOfWeek.includes(d) ? "bg-brand-accent text-zinc-950" : "bg-zinc-900 text-zinc-700 border border-zinc-800"
                      )}>
                        {getDayLabel(d).charAt(0)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-3">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Horários</p>
                  <div className="space-y-1">
                    {(route.schedules || []).map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] font-black text-white">
                        <Clock size={10} className="text-brand-accent" />
                        ID: {s.departureTime} | VOLTA: {s.returnTime}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-brand-accent border border-zinc-800">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">{route.passengerCount} Passageiros</p>
                      <p className="text-[8px] text-zinc-600 font-bold uppercase">Lista Fixa de Controle</p>
                    </div>
                  </div>
                  <button className="text-[8px] font-black text-brand-accent uppercase tracking-widest hover:underline flex items-center gap-1">
                    <Smartphone size={10} />
                    Ver Lista
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-brand-accent border border-zinc-800">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">Recursos Alocados</p>
                      <p className="text-[8px] text-zinc-600 font-bold uppercase">V: {route.fixedVehicleId || 'Não fixo'} | M: {route.fixedDriverId || 'Não fixo'}</p>
                    </div>
                  </div>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State / Add Route */}
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-zinc-950/20 border-2 border-dashed border-zinc-800 rounded-[32px] flex flex-col items-center justify-center min-h-[300px] hover:border-brand-accent/50 hover:bg-zinc-900/30 transition-all group"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus size={32} className="text-zinc-500 group-hover:text-brand-accent" />
          </div>
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest group-hover:text-white">Cadastrar Novo Contrato</p>
          <p className="text-[10px] text-zinc-700 font-bold uppercase mt-1 italic tracking-tight">Defina rotas, dias e passageiros fixos</p>
        </button>
      </div>

      {/* Integration Tip */}
      <div className="p-6 bg-brand-accent/5 border border-brand-accent/10 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-brand-accent/10 rounded-2xl text-brand-accent">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="text-xs font-black text-brand-accent uppercase tracking-widest mb-1">Dica de Operação</h4>
          <p className="text-[10px] text-zinc-500 font-bold leading-relaxed italic">
            Para Fretados, recomendamos gerar mensalmente o PDF da Lista de Passageiros Fixa. 
            Todas as viagens realizadas nestas rotas podem ser conciliadas no Financeiro via "Receita Recorrente - Contrato".
          </p>
        </div>
      </div>

      {/* Modal de Nova Rota */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Cadastrar Fretamento</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Configuração de Rota e Contrato</p>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome da Rota</label>
                  <Input 
                    placeholder="Ex: Turno Noturno - Fábrica X" 
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cliente / Empresa</label>
                  <Input 
                    placeholder="Nome do cliente/contratante" 
                    value={newRoute.client}
                    onChange={(e) => setNewRoute({...newRoute, client: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} />
                    Localização (Google Maps)
                  </label>
                  <span className="text-[9px] text-zinc-600 font-bold uppercase italic">Importação Instantânea</span>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Cole o link do Google Maps aqui..." 
                    className="flex-1"
                    value={newRoute.locationUrl}
                    onChange={(e) => setNewRoute({...newRoute, locationUrl: e.target.value})}
                  />
                  <Button 
                    onClick={handleImportLocation}
                    className="bg-zinc-800 text-white px-4 border border-zinc-700 hover:bg-zinc-700 font-bold text-[10px] uppercase"
                  >
                    Importar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tipo de Serviço</label>
                  <Select 
                    value={newRoute.type}
                    onChange={(e) => setNewRoute({...newRoute, type: e.target.value as any})}
                  >
                    <option value="factory">Industrial / Fábrica</option>
                    <option value="school">Escolar / Universitário</option>
                    <option value="other">Outros / Eventos</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Qtd. Passageiros</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={newRoute.passengerCount}
                    onChange={(e) => setNewRoute({...newRoute, passengerCount: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-3">
              <Button 
                onClick={() => setShowAddForm(false)}
                className="bg-transparent border border-zinc-800 text-zinc-500 hover:bg-zinc-800"
              >
                CANCELAR
              </Button>
              <Button 
                onClick={handleAddRoute}
                className="bg-brand-accent text-zinc-950 px-10 font-black"
              >
                SALVAR ROTA
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />
    </div>
  );
};
