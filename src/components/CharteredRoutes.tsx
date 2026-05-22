import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface Passenger {
  name: string;
  phone?: string;
  locationUrl?: string;
  boardingTime?: string;
}

const getMapsDirUrl = (locationUrl?: string, fallbackQuery?: string): string => {
  if (!locationUrl || locationUrl.trim() === '') {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fallbackQuery || '')}`;
  }

  const urlStr = locationUrl.trim();

  // Try to find coordinates (-xx.xxxx, -yy.yyyy or xx.xxxx, yy.yyyy)
  // Matching format like @-23.12345,-46.12345 or q=-23.12345,-46.12345 or just -23.12345,-46.12345
  const coordRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
  const match = urlStr.match(coordRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
  }

  // If it's pure address text (does not start with http/https), turn it into directions route
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(urlStr)}`;
  }

  // If it is a full web URL but doesn't have coordinates, we can try to wrap it if it represents an address
  // Otherwise, return it as can be (short url, maps.app.goo.gl link etc).
  return urlStr;
};

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
  locationUrl?: string;
  passengerName?: string;
  passengerPhone?: string;
  runState?: 'idle' | 'running';
  runStartedAt?: string | null;
  passengers?: Passenger[];
}

export const CharteredRoutes = ({ vehicles, employees, routes }: { vehicles: any[], employees: any[], routes: CharteredRoute[] }) => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingPassengersRoute, setViewingPassengersRoute] = useState<CharteredRoute | null>(null);
  const [isFloatingNavDismissed, setIsFloatingNavDismissed] = useState(false);

  const [navIndexes, setNavIndexes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('active_route_nav_')) {
          const routeId = key.replace('active_route_nav_', '');
          const val = parseInt(localStorage.getItem(key) || '0', 10);
          initial[routeId] = val;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initial;
  });

  const [newRoute, setNewRoute] = useState({
    name: '',
    client: '',
    type: 'factory' as const,
    daysOfWeek: [1, 2, 3, 4, 5],
    schedules: [{ departureTime: '', returnTime: '' }],
    locationUrl: '',
    passengerCount: 0,
    fixedVehicleId: '',
    fixedDriverId: '',
    passengerName: '',
    passengerPhone: '',
    runState: 'idle' as const,
    passengers: [] as Passenger[]
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

  const handleImportLocation = (url: string) => {
    if (!url) {
      toast.error('Informe um link do Google Maps.');
      return;
    }
    if (!url.includes('google.com/maps') && !url.includes('maps.app.goo.gl')) {
      toast.error('Link do Google Maps inválido.');
      return;
    }
    toast.success('Localização reconhecida e importada com sucesso!');
  };

  const handleAddRoute = async () => {
    if (!newRoute.name || !newRoute.client) {
      toast.error('Preencha os campos obrigatórios (Nome e Cliente).');
      return;
    }
    
    try {
      const dataToSave = {
        ...newRoute,
        passengerCount: newRoute.passengers?.length || 0,
        status: 'active',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'chartered_routes'), dataToSave);
      setShowAddForm(false);
      setNewRoute({
        name: '',
        client: '',
        type: 'factory',
        daysOfWeek: [1, 2, 3, 4, 5],
        schedules: [{ departureTime: '', returnTime: '' }],
        locationUrl: '',
        passengerCount: 0,
        fixedVehicleId: '',
        fixedDriverId: '',
        passengerName: '',
        passengerPhone: '',
        runState: 'idle',
        passengers: []
      });
      toast.success('Nova rota de fretamento cadastrada com os passageiros!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chartered_routes');
    }
  };

  const handleOpenEdit = (route: CharteredRoute) => {
    setEditingRoute({
      id: route.id,
      name: route.name || '',
      client: route.client || '',
      type: route.type || 'factory',
      daysOfWeek: route.daysOfWeek || [1, 2, 3, 4, 5],
      schedules: route.schedules?.length ? route.schedules : [{ departureTime: '', returnTime: '' }],
      locationUrl: route.locationUrl || '',
      passengerCount: route.passengerCount || 0,
      fixedVehicleId: route.fixedVehicleId || '',
      fixedDriverId: route.fixedDriverId || '',
      passengerName: route.passengerName || '',
      passengerPhone: route.passengerPhone || '',
      status: route.status || 'active',
      runState: route.runState || 'idle',
      passengers: route.passengers || []
    });
    setShowEditForm(true);
  };

  const handleUpdateRoute = async () => {
    if (!editingRoute.name || !editingRoute.client) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    try {
      const { id, ...dataToSave } = editingRoute;
      await updateDoc(doc(db, 'chartered_routes', id), {
        ...dataToSave,
        passengerCount: editingRoute.passengers?.length || 0,
        updatedAt: serverTimestamp()
      });
      setShowEditForm(false);
      setEditingRoute(null);
      toast.success('Fretamento atualizado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chartered_routes');
    }
  };

  const handleToggleRunRoute = async (route: CharteredRoute) => {
    const isStarting = route.runState !== 'running';
    try {
      await updateDoc(doc(db, 'chartered_routes', route.id), {
        runState: isStarting ? 'running' : 'idle',
        runStartedAt: isStarting ? new Date().toISOString() : null
      });
      
      if (isStarting) {
        setIsFloatingNavDismissed(false);
        toast.info(`Fretamento ${route.name.toUpperCase()} iniciado! Boa viagem!`);
        
        // Reset the navigation index for this route to 0 on start
        setNavIndexes(prev => {
          const updated = { ...prev, [route.id]: 0 };
          localStorage.setItem('active_route_nav_' + route.id, '0');
          return updated;
        });

        // Sequences up to 20 passenger locations
        const navPassengers = (route.passengers || []).slice(0, 20);
        const firstPassenger = navPassengers[0];
        
        // Prioritize the first passenger's departure location with directions query initialized
        const mapsUrl = getMapsDirUrl(
          firstPassenger?.locationUrl, 
          firstPassenger?.name ? `${firstPassenger.name} ${route.client}` : `${route.name} ${route.client}`
        );

        getMapsDirUrl(firstPassenger?.locationUrl, firstPassenger?.name ? `${firstPassenger.name} ${route.client}` : `${route.name} ${route.client}`);

        if (mapsUrl) {
          window.open(mapsUrl, '_blank');
        } else {
          // General maps query fallback using route info with dir api
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(route.name + ' ' + route.client)}`, '_blank');
        }

        if (firstPassenger?.phone) {
          const cleanPhone = firstPassenger.phone.replace(/\D/g, '');
          if (cleanPhone) {
            const passengerMsg = encodeURIComponent(`Olá ${firstPassenger.name}, seu transporte DM Turismo iniciou a rota e está a caminho do seu ponto de embarque.`);
            window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${passengerMsg}`, '_blank');
          }
        } else if (route.passengerPhone) {
          const cleanPhone = route.passengerPhone.replace(/\D/g, '');
          if (cleanPhone) {
            const passengerMsg = encodeURIComponent(`Olá ${route.passengerName || 'cliente'}, o seu fretamento contratado da DM Turismo acaba de iniciar a rota e está a caminho.`);
            window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${passengerMsg}`, '_blank');
          }
        }
      } else {
        toast.success(`Fretamento ${route.name.toUpperCase()} concluído e registrado.`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chartered_routes');
    }
  };

  const handleGoToNextPassenger = (route: CharteredRoute, totalLength: number) => {
    const currentIndex = navIndexes[route.id] || 0;
    if (currentIndex < totalLength - 1) {
      const nextIndex = currentIndex + 1;
      setNavIndexes(prev => {
        const updated = { ...prev, [route.id]: nextIndex };
        localStorage.setItem('active_route_nav_' + route.id, String(nextIndex));
        return updated;
      });

      const navPassengers = (route.passengers || []).slice(0, 20);
      const nextPassenger = navPassengers[nextIndex];
      const mapsUrl = getMapsDirUrl(
        nextPassenger?.locationUrl, 
        nextPassenger?.name ? `${nextPassenger.name} ${route.client}` : `${route.name} ${route.client}`
      );

      if (mapsUrl) {
        window.open(mapsUrl, '_blank');
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((nextPassenger?.name || '') + ' ' + route.client)}`, '_blank');
      }

      if (nextPassenger?.phone) {
        const cleanPhone = nextPassenger.phone.replace(/\D/g, '');
        if (cleanPhone) {
          const passengerMsg = encodeURIComponent(`Olá ${nextPassenger.name}, o transporte da DM Turismo está a caminho do seu ponto de embarque.`);
          window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${passengerMsg}`, '_blank');
        }
      }
      toast.success(`Avançado para o passageiro ${nextIndex + 1}: ${nextPassenger?.name || 'Sem nome'}`);
    } else {
      // Final step -> Concluir rota!
      handleToggleRunRoute(route);
    }
  };

  const handleGoToPrevPassenger = (route: CharteredRoute) => {
    const currentIndex = navIndexes[route.id] || 0;
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setNavIndexes(prev => {
        const updated = { ...prev, [route.id]: prevIndex };
        localStorage.setItem('active_route_nav_' + route.id, String(prevIndex));
        return updated;
      });

      const navPassengers = (route.passengers || []).slice(0, 20);
      const prevPassenger = navPassengers[prevIndex];
      const mapsUrl = getMapsDirUrl(
        prevPassenger?.locationUrl, 
        prevPassenger?.name ? `${prevPassenger.name} ${route.client}` : `${route.name} ${route.client}`
      );

      if (mapsUrl) {
        window.open(mapsUrl, '_blank');
      }

      toast.info(`Retornado para o passageiro ${prevIndex + 1}: ${prevPassenger?.name || 'Sem nome'}`);
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

  const handleAddPassenger = (state: any, setState: any) => {
    const currentPassengers = state.passengers || [];
    if (currentPassengers.length >= 30) {
      toast.warning('Limite máximo de 30 passageiros atingido.');
      return;
    }
    const updated = [
      ...currentPassengers,
      { name: '', phone: '', locationUrl: '', boardingTime: '' }
    ];
    setState({ ...state, passengers: updated, passengerCount: updated.length });
  };

  const handleRemovePassenger = (state: any, setState: any, index: number) => {
    const currentPassengers = state.passengers || [];
    const updated = currentPassengers.filter((_: any, i: number) => i !== index);
    setState({ ...state, passengers: updated, passengerCount: updated.length });
  };

  const handleUpdatePassenger = (state: any, setState: any, index: number, field: string, value: string) => {
    const currentPassengers = state.passengers || [];
    const updated = currentPassengers.map((p: any, i: number) => {
      if (i === index) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setState({ ...state, passengers: updated });
  };

  const renderPassengersSection = (state: any, setState: any) => {
    const list = state.passengers || [];
    return (
      <div className="space-y-4 bg-zinc-950 p-5 rounded-3xl border border-zinc-850">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-850">
          <div>
            <label className="text-xs font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
              <Users size={14} />
              Lista de Passageiros ({list.length}/30)
            </label>
            <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Cadastre até 30 passageiros com contato, horário e local de embarque</p>
          </div>
          <button
            type="button"
            onClick={() => handleAddPassenger(state, setState)}
            disabled={list.length >= 30}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer",
              list.length >= 30
                ? "bg-zinc-900 text-zinc-650 border border-zinc-800 cursor-not-allowed"
                : "bg-brand-accent text-zinc-950 hover:bg-white border border-brand-accent active:scale-95"
            )}
          >
            <Plus size={12} />
            ADICIONAR PASSAGEIRO
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {list.length === 0 ? (
            <div className="text-center py-8 text-zinc-650 text-[10px] font-bold uppercase italic flex flex-col items-center justify-center gap-2">
              <Users size={24} className="text-zinc-800" />
              Nenhum passageiro individual cadastrado nesta rota.
            </div>
          ) : (
            list.map((passenger: any, idx: number) => (
              <div key={idx} className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl space-y-3 relative group/item">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    #{(idx + 1).toString().padStart(2, '0')} - Passageiro
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePassenger(state, setState, idx)}
                    className="text-rose-500 hover:text-white text-[9px] font-black uppercase tracking-widest cursor-pointer px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-all"
                  >
                    Excluir
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome / Ponto</label>
                    <Input
                      placeholder="Ex: Carlos Silva"
                      className="text-xs h-9 bg-zinc-950"
                      value={passenger.name || ''}
                      onChange={(e) => handleUpdatePassenger(state, setState, idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Horário Est.</label>
                    <Input
                      placeholder="Ex: 06:30"
                      className="text-xs h-9 bg-zinc-950"
                      value={passenger.boardingTime || ''}
                      onChange={(e) => handleUpdatePassenger(state, setState, idx, 'boardingTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">WhatsApp (DDD+Nº)</label>
                    <Input
                      placeholder="Ex: 11999999999"
                      className="text-xs h-9 bg-zinc-950"
                      value={passenger.phone || ''}
                      onChange={(e) => handleUpdatePassenger(state, setState, idx, 'phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Maps Embarque</label>
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="Link do Google Maps..."
                        className="text-xs h-9 bg-zinc-950 flex-1"
                        value={passenger.locationUrl || ''}
                        onChange={(e) => handleUpdatePassenger(state, setState, idx, 'locationUrl', e.target.value)}
                      />
                      {passenger.locationUrl && (
                        <button
                          type="button"
                          onClick={() => handleImportLocation(passenger.locationUrl)}
                          className="px-2 h-9 bg-zinc-900 border border-zinc-800 text-[8px] text-zinc-400 hover:text-white rounded-lg font-black uppercase hover:border-brand-accent transition-colors shrink-0"
                          title="Testar Link"
                        >
                          TESTAR
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const getDayLabel = (day: number) => {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return labels[day];
  };

  const filteredRoutes = routes.filter(route => 
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (route.passengerName && route.passengerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const employeesDrivers = employees.sort((a, b) => a.name.localeCompare(b.name));
  const vehiclesOrdered = vehicles.sort((a, b) => (a.plate || '').localeCompare(b.plate || ''));

  const renderDaysSelector = (state: any, setState: any) => {
    const toggleDay = (day: number) => {
      const current = state.daysOfWeek || [];
      const updated = current.includes(day)
        ? current.filter((d: number) => d !== day)
        : [...current, day].sort((a, b) => a - b);
      setState({ ...state, daysOfWeek: updated });
    };

    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 0].map(d => {
          const isActive = (state.daysOfWeek || []).includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={cn(
                "w-12 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all active:scale-95 border cursor-pointer",
                isActive 
                  ? "bg-brand-accent text-zinc-950 border-brand-accent shadow" 
                  : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white"
              )}
            >
              {getDayLabel(d)}
            </button>
          );
        })}
      </div>
    );
  };

  const renderSchedulesSelector = (state: any, setState: any) => {
    const currentSchedule = state.schedules?.[0] || { departureTime: '', returnTime: '' };
    return (
      <div className="grid grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Horário de Início (Ida)</label>
          <Input 
            type="time"
            value={currentSchedule.departureTime || ''}
            onChange={(e) => {
              const updated = [{ departureTime: e.target.value, returnTime: currentSchedule.returnTime }];
              setState({ ...state, schedules: updated });
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Horário de Término (Volta)</label>
          <Input 
            type="time"
            value={currentSchedule.returnTime || ''}
            onChange={(e) => {
              const updated = [{ departureTime: currentSchedule.departureTime, returnTime: e.target.value }];
              setState({ ...state, schedules: updated });
            }}
          />
        </div>
      </div>
    );
  };

  const renderLocationAndPassengerFields = (state: any, setState: any) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
            <MapPin size={14} />
            Configuração de Localização e Contato
          </label>
          <span className="text-[9px] text-zinc-650 font-bold uppercase italic">Integração Maps + WhatsApp</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-850">
          <div className="space-y-1 md:col-span-1">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Localização (Google Maps)</label>
            <div className="flex gap-1.5">
              <Input 
                placeholder="Link do Google Maps..." 
                className="flex-1 text-xs"
                value={state.locationUrl || ''}
                onChange={(e) => setState({...state, locationUrl: e.target.value})}
              />
              <button
                type="button"
                onClick={() => handleImportLocation(state.locationUrl)}
                className="px-3 bg-zinc-900 hover:bg-zinc-800 text-[9px] font-black uppercase text-zinc-400 border border-zinc-800 rounded-xl transition-all"
                title="Verificar Link"
              >
                TESTAR
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Passageiro Principal</label>
            <Input 
              placeholder="Nome do passageiro..." 
              className="text-xs"
              value={state.passengerName || ''}
              onChange={(e) => setState({...state, passengerName: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">WhatsApp do Passageiro</label>
            <Input 
              placeholder="EX: 11999999999" 
              className="text-xs"
              value={state.passengerPhone || ''}
              onChange={(e) => setState({...state, passengerPhone: e.target.value})}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderResourceAllocationFields = (state: any, setState: any) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-850">
        <div className="space-y-1">
          <Select
            label="Motorista Alocado"
            value={state.fixedDriverId || ''}
            onChange={(e: any) => setState({ ...state, fixedDriverId: e.target.value })}
            options={[
              { value: '', label: 'NENHUM MOTORISTA ALOCADO' },
              ...employeesDrivers.map((e: any) => ({
                value: e.id,
                label: `${e.name.toUpperCase()} (${e.role?.toUpperCase() || 'EQUIPE'})`
              })),
              { value: 'other', label: 'OUTROS' }
            ]}
          />
        </div>
        <div className="space-y-1">
          <Select
            label="Veículo Alocado"
            value={state.fixedVehicleId || ''}
            onChange={(e: any) => setState({ ...state, fixedVehicleId: e.target.value })}
            options={[
              { value: '', label: 'NENHUM VEÍCULO ALOCADO' },
              ...vehiclesOrdered.map((v: any) => ({
                value: v.id,
                label: `${v.plate?.toUpperCase()} - ${v.model?.toUpperCase()} (${v.type?.toUpperCase() || 'VEÍCULO'})`
              })),
              { value: 'other', label: 'OUTROS' }
            ]}
          />
        </div>
      </div>
    );
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
              placeholder="Pesquisar contrato, rota ou passageiro..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <p className="text-xl font-black text-white">{filteredRoutes.filter(r => r.status === 'active').length}</p>
            <Route size={20} className="text-brand-accent/40" />
          </div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Passageiros/Dia</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-black text-white">{filteredRoutes.reduce((acc, r) => acc + (r.passengerCount || 0), 0)}</p>
            <Users size={20} className="text-emerald-500/40" />
          </div>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Veículos Alocados</p>
          <div className="flex items-end justify-between">
            <p className="text-xl font-black text-white">{filteredRoutes.filter(r => r.fixedVehicleId).length}</p>
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
        {filteredRoutes.map((route) => {
          const allocatedVehicle = vehicles.find(v => v.id === route.fixedVehicleId);
          const allocatedDriver = employees.find(e => e.id === route.fixedDriverId);

          return (
            <div key={route.id} className={cn(
              "bg-zinc-900 border rounded-[32px] overflow-hidden group transition-all duration-300 relative",
              route.runState === 'running' 
                ? "border-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-rose-500/30" 
                : "border-zinc-800 hover:border-brand-accent/30"
            )}>
              {/* Pulse animation banner for running routes */}
              {route.runState === 'running' && (
                <div className="bg-rose-950/40 border-b border-rose-900 px-6 py-2 flex items-center justify-between text-rose-500">
                  <span className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Rota em Curso Ativo
                  </span>
                  {route.runStartedAt && (
                    <span className="text-[8px] font-bold text-rose-400">
                      Início: {format(new Date(route.runStartedAt), 'dd/MM, HH:mm')}
                    </span>
                  )}
                </div>
              )}

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                        route.type === 'factory' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      )}>
                        {route.type === 'factory' ? 'INDÚSTRIA' : route.type === 'school' ? 'ESCOLAR' : 'OUTROS'}
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
                    <button 
                      onClick={() => handleOpenEdit(route)}
                      className="p-2 bg-zinc-950 border border-zinc-850 text-brand-accent rounded-xl hover:text-white hover:bg-brand-accent/10 transition-colors cursor-pointer"
                      title="Editar Informações Completas"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteRoute(route.id, route.name)}
                      className="p-2 bg-zinc-950 border border-zinc-850 text-rose-500 rounded-xl hover:bg-rose-500/10 transition-colors pointer-events-auto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-3">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Dias de Operação</p>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 0].map(d => (
                        <span key={d} className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black transition-all",
                          route.daysOfWeek.includes(d) ? "bg-brand-accent text-zinc-950" : "bg-zinc-900 text-zinc-750 border border-zinc-850"
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
                        <div key={i} className="flex items-center gap-1.5 text-[10px] font-black text-white">
                          <Clock size={10} className="text-brand-accent animate-pulse" />
                          IDA: {s.departureTime || '--:--'} | VOLTA: {s.returnTime || '--:--'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-850 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-brand-accent border border-zinc-800">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-tight">{route.passengerCount || 0} Passageiros</p>
                        <p className="text-[8px] text-zinc-600 font-bold uppercase">Lista Fixa de Controle</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setViewingPassengersRoute(route)}
                      className="text-[8px] font-black text-brand-accent uppercase tracking-widest hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Smartphone size={10} />
                      Ver Lista
                    </button>
                  </div>

                  {/* Allocated Driver/Vehicle names rather than database IDs */}
                  <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-850 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-brand-accent border border-zinc-800">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-tight">Recursos Alocados</p>
                        <p className="text-[8px] text-zinc-500 font-black uppercase">
                          V: {allocatedVehicle ? `${allocatedVehicle.plate.toUpperCase()} (${allocatedVehicle.model})` : 'NÃO FIXO'}
                        </p>
                        <p className="text-[8px] text-zinc-500 font-black uppercase">
                          M: {allocatedDriver ? allocatedDriver.name.toUpperCase() : 'NÃO FIXO'}
                        </p>
                      </div>
                    </div>
                    {allocatedDriver || allocatedVehicle ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <span className="text-[7px] font-bold text-zinc-650 tracking-widest uppercase">Pendente</span>
                    )}
                  </div>

                  {/* Passenger and Whatsapp Contact directly list/card preview */}
                  {(route.passengerName || route.passengerPhone) && (
                    <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-emerald-500 border border-zinc-800">
                          <Smartphone size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-tight">Passageiro de Contato</p>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase truncate max-w-[170px]">
                            {route.passengerName ? route.passengerName.toUpperCase() : 'NÃO INFORMADO'}
                          </p>
                          {route.passengerPhone && (
                            <p className="text-[8px] text-zinc-600 font-mono">{route.passengerPhone}</p>
                          )}
                        </div>
                      </div>
                      {route.passengerPhone && (
                        <a 
                          href={`https://wa.me/55${route.passengerPhone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900/40 text-emerald-400 hover:text-white rounded-xl transition-all text-[8px] font-black uppercase tracking-wider block"
                          title="Iniciar conversa no WhatsApp"
                        >
                          ZAP
                        </a>
                      )}
                    </div>
                  )}

                  {/* Google Maps Shortcut Action */}
                  {route.locationUrl && (
                    <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-brand-accent border border-zinc-800">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-tight">Rota Google Maps</p>
                          <p className="text-[8px] text-zinc-550 font-bold uppercase">Localização Configurada</p>
                        </div>
                      </div>
                      <a 
                        href={route.locationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 text-brand-accent hover:border-brand-accent rounded-xl transition-all text-[8px] font-black uppercase tracking-wider block"
                        title="Abrir GPS no Google Maps"
                      >
                        Navegar
                      </a>
                    </div>
                  )}
                </div>

                {/* Iniciar Rota Button - Beautifully stateful */}
                <button 
                  onClick={() => handleToggleRunRoute(route)}
                  className={cn(
                    "w-full py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer border shadow",
                    route.runState === 'running'
                      ? "bg-rose-950/40 text-rose-500 border-rose-900/60 hover:bg-rose-900/80 hover:text-white"
                      : "bg-brand-accent text-zinc-950 border-brand-accent hover:bg-white"
                  )}
                >
                  {route.runState === 'running' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      CONCLUIR ROTA
                    </>
                  ) : (
                    <>
                      <Route size={14} className="animate-bounce" />
                      INICIAR ROTA
                    </>
                  )}
                </button>

                {route.runState === 'running' && isFloatingNavDismissed && (
                  <button 
                    onClick={() => {
                      setIsFloatingNavDismissed(false);
                      toast.info("Painel de navegação reativado!");
                    }}
                    type="button"
                    className="w-full py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-900/40 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all mt-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone size={11} className="animate-pulse" />
                    REABRIR PAINEL DE NAVEGAÇÃO
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State / Add Route */}
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-zinc-950/20 border-2 border-dashed border-zinc-800 rounded-[32px] flex flex-col items-center justify-center min-h-[350px] hover:border-brand-accent/50 hover:bg-zinc-900/40 transition-all group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus size={32} className="text-zinc-500 group-hover:text-brand-accent" />
          </div>
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest group-hover:text-white">Cadastrar Novo Contrato</p>
          <p className="text-[10px] text-zinc-750 font-bold uppercase mt-1 italic tracking-tight">Defina rotas, dias, contatos e recursos</p>
        </button>
      </div>

      {/* Integration Tip */}
      <div className="p-6 bg-brand-accent/5 border border-brand-accent/10 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-brand-accent/10 rounded-2xl text-brand-accent">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="text-xs font-black text-brand-accent uppercase tracking-widest mb-1">Dica de Operação</h4>
          <p className="text-[10px] text-zinc-550 font-bold leading-relaxed italic">
            Para Fretados, recomendamos gerar mensalmente o PDF da Lista de Passageiros Fixa. 
            Todas as viagens realizadas nestas rotas podem ser conciliadas no Financeiro via "Receita Recorrente - Contrato".
          </p>
        </div>
      </div>

      {/* Modal de Nova Rota */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Cadastrar Fretamento</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Configuração de Rota e Contrato</p>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-zinc-805 rounded-xl transition-colors text-zinc-500"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[65vh] overflow-y-auto space-y-6">
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

              {/* Days of week */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Dias de Operação na Semana</label>
                {renderDaysSelector(newRoute, setNewRoute)}
              </div>

              {/* Schedules Início e Término */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Horários de Operação</label>
                {renderSchedulesSelector(newRoute, setNewRoute)}
              </div>

              {/* Driver and Vehicle selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-accent uppercase tracking-widest ml-1">Escale operacional Fixa (Recursos)</label>
                {renderResourceAllocationFields(newRoute, setNewRoute)}
              </div>

              {/* Location and Passenger Info Side-by-Side row */}
              {renderLocationAndPassengerFields(newRoute, setNewRoute)}

              {/* Seção de Passageiros (Até 30) */}
              {renderPassengersSection(newRoute, setNewRoute)}

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
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Qtd. Passageiros (Sincronizado)</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    disabled
                    value={newRoute.passengers?.length || 0}
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

      {/* Modal de Edição de Rota */}
      {showEditForm && editingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Editar Fretamento</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Atualização dos Parâmetros e Escalas</p>
              </div>
              <button 
                onClick={() => {
                  setShowEditForm(false);
                  setEditingRoute(null);
                }}
                className="p-2 hover:bg-zinc-805 rounded-xl transition-colors text-zinc-500"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[65vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome da Rota</label>
                  <Input 
                    placeholder="Ex: Turno Noturno - Fábrica X" 
                    value={editingRoute.name}
                    onChange={(e) => setEditingRoute({...editingRoute, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cliente / Empresa</label>
                  <Input 
                    placeholder="Nome do cliente/contratante" 
                    value={editingRoute.client}
                    onChange={(e) => setEditingRoute({...editingRoute, client: e.target.value})}
                  />
                </div>
              </div>

              {/* Days of week */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Dias de Operação na Semana</label>
                {renderDaysSelector(editingRoute, setEditingRoute)}
              </div>

              {/* Schedules Início e Término */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Horários de Operação</label>
                {renderSchedulesSelector(editingRoute, setEditingRoute)}
              </div>

              {/* Driver and Vehicle selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-accent uppercase tracking-widest ml-1">Escale operacional Fixa (Recursos)</label>
                {renderResourceAllocationFields(editingRoute, setEditingRoute)}
              </div>

              {/* Location and Passenger Info Side-by-Side row */}
              {renderLocationAndPassengerFields(editingRoute, setEditingRoute)}

              {/* Seção de Passageiros (Até 30) */}
              {renderPassengersSection(editingRoute, setEditingRoute)}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tipo de Serviço</label>
                  <Select 
                    value={editingRoute.type}
                    onChange={(e) => setEditingRoute({...editingRoute, type: e.target.value as any})}
                  >
                    <option value="factory">Industrial / Fábrica</option>
                    <option value="school">Escolar / Universitário</option>
                    <option value="other">Outros / Eventos</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Qtd. Passageiros (Sincronizado)</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    disabled
                    value={editingRoute.passengers?.length || 0}
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-3">
              <Button 
                onClick={() => {
                  setShowEditForm(false);
                  setEditingRoute(null);
                }}
                className="bg-transparent border border-zinc-800 text-zinc-500 hover:bg-zinc-800"
              >
                CANCELAR
              </Button>
              <Button 
                onClick={handleUpdateRoute}
                className="bg-brand-accent text-zinc-950 px-10 font-black"
              >
                SALVAR ALTERAÇÕES
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes dos Passageiros "Ver Lista" */}
      {viewingPassengersRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Lista de Passageiros</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  Rota: {viewingPassengersRoute.name.toUpperCase()} ({viewingPassengersRoute.client.toUpperCase()})
                </p>
              </div>
              <button 
                onClick={() => setViewingPassengersRoute(null)}
                className="p-2 hover:bg-zinc-850 rounded-xl transition-colors text-zinc-500"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-850 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Users className="text-brand-accent h-5 w-5" />
                  <div>
                    <p className="text-xs font-black text-white uppercase">Lista Fixa Informativa</p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">{viewingPassengersRoute.passengers?.length || 0} de 30 Passageiros Ativos</p>
                  </div>
                </div>
                {viewingPassengersRoute.runState === 'running' ? (
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                    EM CURSO ATIVO
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-zinc-800 text-zinc-500 border border-zinc-700 rounded-full text-[8px] font-black uppercase tracking-widest">
                    EM ESPERA / LATENTE
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {!viewingPassengersRoute.passengers || viewingPassengersRoute.passengers.length === 0 ? (
                  <div className="text-center py-12 text-zinc-650 text-[10px] font-bold uppercase italic bg-zinc-950 rounded-2xl border border-zinc-850">
                    Nenhum passageiro individual cadastrado nesta rota. Utilize "Editar" para cadastrar passageiros.
                  </div>
                ) : (
                  viewingPassengersRoute.passengers.map((passenger, idx) => (
                    <div key={idx} className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-xs text-brand-accent">
                          {(idx + 1).toString().padStart(2, '0')}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase">{passenger.name || 'Sem Nome'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {passenger.boardingTime && (
                              <p className="text-[9px] font-mono text-brand-accent font-black bg-brand-accent/10 px-1.5 py-0.5 rounded">
                                {passenger.boardingTime}
                              </p>
                            )}
                            {passenger.phone && (
                              <p className="text-[9px] font-mono text-zinc-500">{passenger.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end sm:self-auto">
                        {passenger.phone && (
                          <a 
                            href={`https://api.whatsapp.com/send?phone=55${passenger.phone.replace(/\D/g, '')}&text=${encodeURIComponent(`Olá ${passenger.name}, DM Turismo informa: seu embarque da rota ${viewingPassengersRoute.name} está confirmado.`)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900/40 text-emerald-400 hover:text-white rounded-xl transition-all text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1"
                          >
                            WhatsApp
                          </a>
                        )}
                        {passenger.locationUrl && (
                          <a 
                            href={passenger.locationUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-zinc-900 border border-zinc-805 text-brand-accent hover:border-brand-accent rounded-xl transition-all text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1"
                          >
                            Local Embarque
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-8 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
              <Button 
                onClick={() => setViewingPassengersRoute(null)}
                className="bg-brand-accent text-zinc-950 px-8 font-black"
              >
                FECHAR LISTA
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Active Route Navigation Box */}
      {(() => {
        const runningRoute = routes.find(r => r.runState === 'running');
        if (!runningRoute || isFloatingNavDismissed) return null;

        const navPassengers = (runningRoute.passengers || []).slice(0, 20);
        const activeIndex = navIndexes[runningRoute.id] || 0;
        const currentNavPassenger = navPassengers[activeIndex];

        return (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm w-[92vw] sm:w-[380px] bg-zinc-950/95 border border-brand-accent/40 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md text-white animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative border border-brand-accent/30 rounded-full">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-accent"></span>
                </span>
                <span className="text-[9px] font-black text-brand-accent tracking-widest uppercase">ROTA EM CURSO ATIVA</span>
              </div>
              <button 
                onClick={() => handleToggleRunRoute(runningRoute)}
                className="text-[8px] font-black px-2.5 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all uppercase tracking-wider cursor-pointer"
              >
                FINALIZAR ROTA
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-tight truncate">{runningRoute.name}</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">{runningRoute.client}</p>
              </div>

              {/* Rota Resumida (Itinerário com nomes/pontos e horários) */}
              {navPassengers.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Rota Resumida (Selecione a parada)</span>
                    <span className="text-[9px] text-brand-accent font-mono font-black">{activeIndex + 1} / {navPassengers.length}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 bg-zinc-900/50 p-2.5 rounded-2xl border border-zinc-850/60 max-h-[140px] overflow-y-auto custom-scrollbar">
                    {navPassengers.map((passenger, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setNavIndexes(prev => {
                            const updated = { ...prev, [runningRoute.id]: idx };
                            localStorage.setItem('active_route_nav_' + runningRoute.id, String(idx));
                            return updated;
                          });
                          const mapsUrl = getMapsDirUrl(
                            passenger.locationUrl, 
                            passenger.name ? `${passenger.name} ${runningRoute.client}` : `${runningRoute.name} ${runningRoute.client}`
                          );
                          if (mapsUrl) {
                            window.open(mapsUrl, '_blank');
                          }
                          toast.info(`Selecionada parada ${idx + 1}: ${passenger.name || 'Sem nome'}`);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-xl border text-[10px] cursor-pointer transition-all select-none hover:bg-zinc-850",
                          idx === activeIndex
                            ? "bg-brand-accent/10 border-brand-accent/50 text-white font-black"
                            : idx < activeIndex
                              ? "bg-emerald-950/20 border-zinc-900/40 text-emerald-400 font-medium"
                              : "bg-zinc-950/40 border-zinc-900/30 text-zinc-400"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={cn(
                            "w-5 h-5 flex items-center justify-center rounded-lg text-[9px] font-mono font-black shrink-0 border",
                            idx === activeIndex
                              ? "bg-brand-accent text-zinc-950 border-brand-accent"
                              : idx < activeIndex
                                ? "bg-emerald-950/50 text-emerald-400 border-emerald-950"
                                : "bg-zinc-900 text-zinc-550 border-zinc-800"
                          )}>
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <span className="truncate uppercase font-bold tracking-tight text-[10px]">
                            {passenger.name || `Ponto / Parada ${idx + 1}`}
                          </span>
                        </div>
                        {passenger.boardingTime ? (
                          <div className={cn(
                            "flex items-center gap-1 text-[9px] font-mono shrink-0 px-2 py-0.5 rounded-md ml-2 border",
                            idx === activeIndex
                              ? "bg-brand-accent/20 text-brand-accent border-brand-accent/30 font-black animate-pulse"
                              : idx < activeIndex
                                ? "bg-emerald-950/25 text-emerald-400 border-emerald-950"
                                : "bg-zinc-900 text-zinc-550 border-zinc-800"
                          )}>
                            <Clock size={8} />
                            {passenger.boardingTime}
                          </div>
                        ) : (
                          <span className="text-[8px] text-zinc-650 italic lowercase pr-1">sem hora</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-3 bg-zinc-900/40 text-[9px] font-bold uppercase text-zinc-600 italic text-center rounded-2xl border border-zinc-850">
                  Nenhum passageiro individual cadastrado para o tour.
                </div>
              )}

              {/* Passageiro Atual Detalhado */}
              {currentNavPassenger ? (
                <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Próximo Passageiro de Embarque</p>
                      <div className="text-xs font-black text-white uppercase truncate">
                        {currentNavPassenger.name || 'Sem Nome Cadastrado'}
                      </div>
                      {currentNavPassenger.boardingTime && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-brand-accent mt-1 uppercase">
                          <Clock size={10} />
                          Passagem Prevista: {currentNavPassenger.boardingTime}
                        </div>
                      )}
                      {currentNavPassenger.phone && (
                        <p className="text-[9px] font-mono text-zinc-500 mt-1">{currentNavPassenger.phone}</p>
                      )}
                    </div>
                    <span className="w-5 h-5 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-black text-[9px] shrink-0 select-none">
                      {activeIndex + 1}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-zinc-850/50">
                    {currentNavPassenger.phone && (
                      <button
                        onClick={() => {
                          const cleanPhone = currentNavPassenger.phone!.replace(/\D/g, '');
                          if (cleanPhone) {
                            const msg = encodeURIComponent(`Olá ${currentNavPassenger.name}, o seu transporte DM Turismo começou a rota e está a caminho da sua localização de embarque!`);
                            window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${msg}`, '_blank');
                          }
                        }}
                        className="flex-1 py-2 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900/40 text-emerald-400 hover:text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Smartphone size={10} />
                        WHATSAPP
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        const mapsUrl = getMapsDirUrl(
                          currentNavPassenger.locationUrl, 
                          currentNavPassenger.name ? `${currentNavPassenger.name} ${runningRoute.client}` : `${runningRoute.name} ${runningRoute.client}`
                        );
                        if (mapsUrl) {
                          window.open(mapsUrl, '_blank');
                        } else {
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentNavPassenger.name + ' ' + runningRoute.client)}`, '_blank');
                        }
                      }}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-805 text-brand-accent hover:text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <MapPin size={10} />
                      ABRIR GPS
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl text-[9px] text-zinc-500 italic font-bold uppercase text-center leading-relaxed">
                  Sem informações adicionais. Toque abaixo para abrir o mapa geral da rota:
                  {runningRoute.locationUrl && (
                    <button 
                      onClick={() => window.open(getMapsDirUrl(runningRoute.locationUrl, runningRoute.name), '_blank')}
                      className="mt-2 text-brand-accent hover:underline block mx-auto font-black cursor-pointer"
                    >
                      ABRIR MAPS GERAL
                    </button>
                  )}
                </div>
              )}

              {/* Controles de Sequenciador */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGoToPrevPassenger(runningRoute)}
                    disabled={activeIndex === 0}
                    type="button"
                    className={cn(
                      "px-4.5 py-2.5 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                      activeIndex === 0
                        ? "bg-zinc-900/30 border-zinc-900 text-zinc-700 cursor-not-allowed select-none"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer"
                    )}
                  >
                    ANTERIOR
                  </button>
                  
                  <button
                    onClick={() => handleGoToNextPassenger(runningRoute, navPassengers.length)}
                    type="button"
                    className="flex-1 py-2.5 bg-brand-accent text-zinc-950 hover:bg-white rounded-xl text-[9.5px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-brand-accent/25 active:scale-95"
                  >
                    {activeIndex >= navPassengers.length - 1 ? "CONCLUIR ROTA" : "PRÓXIMA PARADA"}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setViewingPassengersRoute(null);
                    setShowAddForm(false);
                    setShowEditForm(false);
                    setEditingRoute(null);
                    setIsFloatingNavDismissed(true);
                    navigate('/fretamento');
                    toast.info("Retornando para a tela principal de fretados!");
                  }}
                  type="button"
                  className="w-full py-2 bg-zinc-900/80 hover:bg-zinc-850 text-zinc-450 hover:text-white border border-zinc-850 hover:border-zinc-750 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  VOLTAR AO PAINEL PRINCIPAL
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
