import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { PhotoGallery } from './PhotoGallery';
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
  DollarSign,
  Share2,
  Camera,
  X,
  Lock,
  Clock,
  FileSpreadsheet,
  Globe,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Bot,
  FileText
} from 'lucide-react';
import { Input, Select, Button } from './UI';
import { cn } from '../lib/utils';
import { WorkSchedule } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, runTransaction } from 'firebase/firestore';

export const VehicleForm = ({ onSubmit, initialData }: any) => {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    await onSubmit(e);
    setLoading(false);
  };
  return (
  <form onSubmit={handleSubmit} className="space-y-4">
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
            { value: 'microbus', label: 'Micro-ônibus (Executivo)' },
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
      <div className="pt-3 border-t border-zinc-800/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 shrink-0">
            <Wrench size={16} />
          </div>
          <div>
            <span className="text-xs font-black text-white block uppercase tracking-tight">Sinalizar Prioridade de Inspeção (Destaque)</span>
            <span className="text-[9px] text-zinc-500 font-bold block uppercase mt-0.5">Ativa borda dourada pulsante no veículo</span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input 
            type="checkbox" 
            name="featured"
            defaultChecked={initialData?.featured}
            value="on"
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500 peer-checked:after:bg-zinc-950"></div>
        </label>
      </div>
    </div>
    
    {initialData?.id && (
      <div className="pt-6 border-t border-white/5">
        <PhotoGallery collectionName="vehicles" documentId={initialData.id} />
      </div>
    )}
    
    <div className="pt-4">
      <Button loading={loading}>
        <Save size={20} />
        {initialData ? 'Atualizar Ativo' : 'Registrar Veículo'}
      </Button>
    </div>
  </form>
  )
};

export const FuelForm = ({ onSubmit, vehicles, tanks, employees, isExternal = false, initialVehicleId }: any) => {
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [scanMode, setScanMode] = useState<'single' | 'batch'>('single');
  const [batchEntries, setBatchEntries] = useState<any[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId || '');
  const [typedOdometer, setTypedOdometer] = useState<string>('');

  React.useEffect(() => {
    if (initialVehicleId) {
      setSelectedVehicleId(initialVehicleId);
    }
  }, [initialVehicleId]);

  const saveBatchFuelEntry = async (entry: any) => {
    const {
      vehicleId,
      driverId,
      fuelTankId,
      isExternal: isEntryExternal,
      location,
      quantity,
      odometer,
      cost,
      timestamp,
      pricePerLiter
    } = entry;

    let finalCost = Number(cost || 0);
    if (finalCost === 0) {
      if (isEntryExternal && pricePerLiter > 0 && quantity > 0) {
        finalCost = Number((pricePerLiter * quantity).toFixed(2));
      } else if (quantity > 0) {
        finalCost = Number((quantity * 5.90).toFixed(2));
      }
    }

    await runTransaction(db, async (transaction) => {
      // 1. Get vehicle reference
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      const vehicleSnapshot = await transaction.get(vehicleRef);
      if (!vehicleSnapshot.exists()) throw new Error(`Veículo não encontrado para o ID: ${vehicleId}`);
      const vehicle = vehicleSnapshot.data();

      // 2. Get tank reference (only if internal AND quantity > 0)
      let tankSnapshot = null;
      let tankRef = null;
      if (!isEntryExternal && quantity > 0 && fuelTankId) {
        tankRef = doc(db, 'fuel_tanks', fuelTankId);
        tankSnapshot = await transaction.get(tankRef);
        if (!tankSnapshot.exists()) throw new Error(`Tanque não encontrado para o ID: ${fuelTankId}`);
        const tank = tankSnapshot.data();

        if (tank.currentLevel < quantity) {
          throw new Error(`Saldo insuficiente no tanque ${tank.name} (${tank.currentLevel}L disponível, necessita de ${quantity}L)`);
        }
      }

      // 3. Register Fuel Log
      const logRef = doc(collection(db, 'fuel_logs'));
      transaction.set(logRef, {
        vehicleId,
        driverId,
        fuelTankId: isEntryExternal ? '' : (fuelTankId || ''),
        isExternal: isEntryExternal || false,
        location: location || (isEntryExternal ? '' : 'Interno'),
        quantity,
        arlaQuantity: 0,
        arlaTankId: '',
        odometer,
        cost: finalCost,
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
      });

      // 4. Update Tank Level (only if internal and quantity > 0)
      if (!isEntryExternal && quantity > 0 && tankSnapshot && tankRef) {
        const tank = tankSnapshot.data();
        transaction.update(tankRef, {
          currentLevel: tank.currentLevel - quantity,
          updatedAt: new Date().toISOString()
        });
      }

      // 5. Update Vehicle Odometer (ONLY IF HIGHER)
      const vehicleUpdates: any = {
         lastFuel: {
           timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
           quantity: quantity,
           cost: finalCost
         },
         updatedAt: new Date().toISOString()
      };
      
      if (odometer > (vehicle.currentOdometer || 0)) {
         vehicleUpdates.currentOdometer = odometer;
      }
      transaction.update(vehicleRef, vehicleUpdates);

      // 6. Generate corresponding paid Financial Transaction (Despesa / Conta a pagar)
      const finRef = doc(collection(db, 'financial_transactions'));
      const vehiclePlate = vehicle.plate || 'S/D';
      transaction.set(finRef, {
        type: 'payable',
        category: 'Combustível',
        description: `Abastecimento - Placa ${vehiclePlate} (${quantity}L ${isEntryExternal ? 'Externo' : 'Interno'})`,
        amount: finalCost,
        dueDate: (timestamp || new Date().toISOString()).slice(0, 10),
        paymentDate: (timestamp || new Date().toISOString()).slice(0, 10),
        status: 'paid',
        refId: logRef.id,
        refType: 'fuel',
        observations: location || (isEntryExternal ? 'Abastecimento Externo' : 'Abastecimento Interno'),
        createdAt: new Date().toISOString()
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(e);
    setLoading(false);
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading(scanMode === 'batch' ? "Analisando ficha de abastecimento em lote com IA..." : "Analisando cupom/recibo com IA...");

    try {
      // 1. Convert to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64String = reader.result?.toString().split(',')[1];
          if (base64String) resolve(base64String);
          else reject(new Error("Erro ao codificar imagem"));
        };
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      if (scanMode === 'batch') {
        const response = await fetch("/api/fuel/scan-batch-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Data,
            mimeType: file.type
          })
        });

        if (!response.ok) {
          throw new Error("Erro na análise em lote do servidor");
        }

        const result = await response.json();
        
        if (result && result.entries && Array.isArray(result.entries)) {
          const parsedEntries = result.entries.map((entry: any) => {
            // Find matching vehicle
            let matchedVehicleId = 'outros';
            if (entry.placa) {
              const cleanedPlaca = entry.placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
              const matched = (vehicles || []).find((v: any) => {
                const vCleaned = v.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                return vCleaned.includes(cleanedPlaca) || cleanedPlaca.includes(vCleaned);
              });
              if (matched) matchedVehicleId = matched.id;
            }

            // Find matching driver
            let matchedDriverId = '';
            if (entry.motorista) {
              const cleanedDriver = entry.motorista.toLowerCase();
              const matched = (employees || []).find((e: any) => {
                const eName = e.name.toLowerCase();
                return eName.includes(cleanedDriver) || cleanedDriver.includes(eName);
              });
              if (matched) matchedDriverId = matched.id;
            } else if (employees && employees.length > 0) {
              matchedDriverId = employees[0].id;
            }

            // Default Tank
            let defaultTankId = '';
            const dieselTanks = (tanks || []).filter((t: any) => t.fuelType?.toLowerCase().includes('diesel') || t.name?.toLowerCase().includes('diesel') || t.fuelType === 'S10' || t.fuelType === 'S500');
            if (dieselTanks.length > 0) {
              defaultTankId = dieselTanks[0].id;
            } else if (tanks && tanks.length > 0) {
              defaultTankId = tanks[0].id;
            }

            return {
              id: Math.random().toString(36).substring(2, 9),
              vehicleId: matchedVehicleId,
              driverId: matchedDriverId,
              quantity: Number(entry.volume || 0),
              odometer: Number(entry.odometro || 0),
              cost: Number(entry.custo || 0),
              pricePerLiter: 5.90,
              fuelTankId: defaultTankId,
              isExternal: false,
              location: entry.observacao || 'Interno',
              timestamp: new Date().toISOString().slice(0, 16)
            };
          });

          setBatchEntries((prev: any[]) => [...prev, ...parsedEntries]);
          toast.success(`Ficha processada! Encontrados ${parsedEntries.length} lançamentos.`, { id: toastId });
        } else {
          toast.success("Ficha processada, mas nenhum lançamento estruturado foi detectado.", { id: toastId });
        }
      } else {
        // 2. Call our backend endpoint for single scan
        const response = await fetch("/api/fuel/scan-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Data,
            mimeType: file.type
          })
        });

        if (!response.ok) {
          throw new Error("Erro na análise do servidor");
        }

        const result = await response.json();

        // 3. Fill form elements via direct DOM access (fast, uncontrolled, and matches form.reset)
        const form = formRef.current;
        if (form && result) {
          let filledFields: string[] = [];

          // Odometer
          if (result.odometro) {
            const odoInput = form.querySelector('input[name="odometer"]') as HTMLInputElement;
            if (odoInput) {
              odoInput.value = String(result.odometro);
              setTypedOdometer(String(result.odometro));
              filledFields.push("Odômetro");
            }
          }

          // Quantity (Diesel or Arla)
          if (result.volume) {
            if (result.combustivel === 'arla') {
              const arlaQtyInput = form.querySelector('input[name="arlaQuantity"]') as HTMLInputElement;
              if (arlaQtyInput) {
                arlaQtyInput.value = String(result.volume);
                filledFields.push("Qtd Arla");
              }

              // Select matching Arla Tank
              const arlaTankSelect = form.querySelector('select[name="arlaTankId"]') as HTMLSelectElement;
              if (arlaTankSelect && tanks) {
                const defaultArlaTank = tanks.find((t: any) => t.fuelType === 'Arla 32' || t.name.toLowerCase().includes('arla'));
                if (defaultArlaTank) {
                  arlaTankSelect.value = defaultArlaTank.id;
                  filledFields.push("Tanque Arla");
                }
              }
            } else {
              const qtyInput = form.querySelector('input[name="quantity"]') as HTMLInputElement;
              if (qtyInput) {
                qtyInput.value = String(result.volume);
                filledFields.push("Litragem");
              }
            }
          }

          // Match vehicle
          if (result.placa) {
            const cleanedPlaca = result.placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            const matchedVehicle = (vehicles || []).find((v: any) => {
              const vCleaned = v.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
              return vCleaned.includes(cleanedPlaca) || cleanedPlaca.includes(vCleaned);
            });
            const vehicleSelect = form.querySelector('select[name="vehicleId"]') as HTMLSelectElement;
            if (vehicleSelect) {
              if (matchedVehicle) {
                vehicleSelect.value = matchedVehicle.id;
                setSelectedVehicleId(matchedVehicle.id);
                filledFields.push(`Veículo (${matchedVehicle.plate})`);
              } else {
                vehicleSelect.value = 'outros';
                setSelectedVehicleId('outros');
                filledFields.push("Veículo OUTROS");
              }
            }
          }

          // Match driver
          if (result.motorista) {
            const cleanedDriver = result.motorista.toLowerCase();
            const matchedDriver = (employees || []).find((e: any) => {
              const eName = e.name.toLowerCase();
              return eName.includes(cleanedDriver) || cleanedDriver.includes(eName);
            });
            const driverSelect = form.querySelector('select[name="driverId"]') as HTMLSelectElement;
            if (driverSelect && matchedDriver) {
              driverSelect.value = matchedDriver.id;
              filledFields.push(`Motorista (${matchedDriver.name})`);
            }
          }

          // Location (if external)
          if (result.observacao && isExternal) {
            const locInput = form.querySelector('input[name="location"]') as HTMLInputElement;
            if (locInput) {
              locInput.value = result.observacao;
              filledFields.push("Localização");
            }
          }

          // Notes and Cost
          let obs = '';
          if (result.observacao) obs += result.observacao;
          if (result.custo) obs += `${obs ? ' | ' : ''}Custo: R$ ${result.custo}`;
          if (obs) {
            const obsInput = form.querySelector('input[name="observacao"]') as HTMLInputElement;
            if (obsInput) {
              obsInput.value = obs;
              filledFields.push("Observação");
            }
          }

          if (filledFields.length > 0) {
            toast.success(`Leitura concluída! Preenchidos: ${filledFields.join(", ")}`, { id: toastId });
          } else {
            toast.success("Comprovante processado! Nenhum dado correspondente encontrado.", { id: toastId });
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Falha ao analisar o comprovante: " + (err.message || "Erro desconhecido"), { id: toastId });
    } finally {
      setIsScanning(false);
      if (e.target) e.target.value = ''; // Reset input to allow scanning the same file again
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector of scanning modes */}
      <div className="flex bg-zinc-950/80 p-1 rounded-2xl border border-zinc-800 w-full max-w-sm">
        <button
          type="button"
          onClick={() => setScanMode('single')}
          className={cn(
            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
            scanMode === 'single' ? "bg-white text-zinc-950 shadow-md" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Cupom Único
        </button>
        <button
          type="button"
          onClick={() => setScanMode('batch')}
          className={cn(
            "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
            scanMode === 'batch' ? "bg-white text-zinc-950 shadow-md" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Ficha em Lote
        </button>
      </div>

      {/* Seção de Importação de Imagem com IA */}
      <div className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-3xl relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl text-brand-accent">
              <Camera size={20} className={cn(isScanning && "animate-pulse")} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider leading-none">
                {scanMode === 'batch' ? 'Escanear Ficha em Lote com IA' : 'Preenchimento com IA'}
              </h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-none font-medium">
                {scanMode === 'batch' ? 'Envie a foto da ficha com múltiplos abastecimentos' : 'Tire foto ou anexe o cupom do abastecimento'}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            disabled={isScanning}
            onClick={handleScanClick}
            className={cn(
              "px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border transition-all active:scale-95 disabled:opacity-50 cursor-pointer",
              isScanning 
                ? "bg-zinc-900 text-zinc-400 border-zinc-800" 
                : "bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent border-brand-accent/20"
            )}
          >
            {isScanning ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Lendo cupom...
              </>
            ) : (
              <>
                <Upload size={12} />
                Selecionar Imagem
              </>
            )}
          </button>
        </div>
        
        {/* Hidden input for camera/upload */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden" 
        />
      </div>

      {scanMode === 'single' ? (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Data e Hora" type="datetime-local" icon={Clock} required name="timestamp" defaultValue={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} />
            <Select 
              label="Veículo" 
              icon={Bus} 
              name="vehicleId" 
              required
              value={selectedVehicleId}
              onChange={(e: any) => setSelectedVehicleId(e.target.value)}
              options={[
                ...(vehicles || [])
                  .sort((a, b) => a.plate.localeCompare(b.plate))
                  .map((v: any) => ({ value: v.id, label: `${v.plate} - ${v.model}` })),
                { value: 'outros', label: 'OUTROS' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Input 
                label="Odômetro Atual" 
                type="number" 
                placeholder="50.000" 
                icon={Hash} 
                required 
                name="odometer" 
                value={typedOdometer}
                onChange={(e: any) => setTypedOdometer(e.target.value)}
              />
              <p className="text-[10px] text-brand-accent/60 font-medium px-1 italic">* O odômetro do veículo será atualizado para este valor.</p>
              
              {/* Odometer Corrector & Verification Box */}
              {(() => {
                const selectedVehicle = (vehicles || []).find((v: any) => v.id === selectedVehicleId);
                if (!selectedVehicle || selectedVehicleId === 'outros') return null;
                const vehicleOdometer = selectedVehicle.currentOdometer || 0;
                const odoNumber = Number(typedOdometer);
                const odometerDiff = odoNumber ? odoNumber - vehicleOdometer : 0;
                
                return (
                  <div className="mt-2 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-zinc-400 uppercase tracking-wider font-mono">Km Atual de Referência:</span>
                      <span className="text-brand-accent font-black tracking-tight">{vehicleOdometer.toLocaleString('pt-BR')} KM</span>
                    </div>
                    {typedOdometer !== '' && !isNaN(odoNumber) && (
                      <div className="pt-1.5 border-t border-zinc-800/60 mt-1.5">
                        {odometerDiff < 0 ? (
                          <div className="text-[10px] font-semibold text-rose-500 flex flex-col gap-1">
                            <span className="font-bold uppercase tracking-wide">⚠️ Km digitado menor que o atual!</span>
                            <p className="leading-tight text-zinc-300">
                              O Km digitado ({odoNumber.toLocaleString('pt-BR')} KM) é menor que o Km atual do veículo ({vehicleOdometer.toLocaleString('pt-BR')} KM).
                            </p>
                            <p className="text-[9px] text-zinc-400 font-medium">
                              Se o Km do veículo estiver errado devido a um lançamento incorreto anterior, por favor corrija primeiro o Km atual na ferramenta de Edição do Veículo.
                            </p>
                          </div>
                        ) : odometerDiff > 5000 ? (
                          <div className="text-[10px] font-semibold text-yellow-500 flex flex-col gap-1">
                            <span className="font-bold uppercase tracking-wide">⚠️ Alta diferença de Km!</span>
                            <p className="leading-tight text-zinc-300">
                              A diferença é de <span className="font-bold font-mono text-yellow-400">+{odometerDiff.toLocaleString('pt-BR')} KM</span> desde a última referência. Certifique-se de que não há nenhum dígito digitado incorretamente.
                            </p>
                          </div>
                        ) : (
                          <div className="text-[10px] font-semibold text-emerald-500 flex flex-col gap-1">
                            <span className="font-bold uppercase tracking-wide">✅ Diferença Coerente</span>
                            <p className="leading-tight text-zinc-300">
                              Diferença de <span className="font-bold font-mono text-emerald-400">+{odometerDiff.toLocaleString('pt-BR')} KM</span>. Tudo certo para salvar!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="space-y-1">
              <Input label="Quantidade (Litros)" type="number" step="0.01" placeholder="100.00" icon={Hash} name="quantity" />
              {!isExternal && <p className="text-[10px] text-rose-500/60 font-medium px-1 italic">* Este volume será subtraído do saldo do tanque.</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select 
              label="Motorista" 
              icon={Users} 
              name="driverId" 
              required
              options={(employees || []).map((e: any) => ({ value: e.id, label: e.name }))}
            />
            {isExternal ? (
              <div className="space-y-4">
                <Input label="Localização / Posto" placeholder="Ex: Posto Graal KM 120" icon={MapPin} required name="location" />
                <Select
                  label="Tipo de Bomba"
                  icon={Fuel}
                  name="pumpType"
                  required
                  options={[
                    { value: 'interna', label: 'Interna' },
                    { value: 'externa', label: 'Externa' }
                  ]}
                />
                <Input label="Valor do Litro (R$)" type="number" step="0.01" placeholder="5.50" icon={DollarSign} required name="pricePerLiter" />
              </div>
            ) : (
              <Select 
                label="Tanque de Origem" 
                icon={Hash} 
                name="fuelTankId" 
                required
                options={(tanks || []).map((t: any) => ({ value: t.id, label: `${t.name} (${t.currentLevel}L)` }))}
              />
            )}
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
              {isExternal ? 'Registrar Abastecimento Externo' : 'SALVAR'}
            </Button>
          </div>
          {isExternal && <input type="hidden" name="isExternal" value="true" />}
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Registros da Ficha ({batchEntries.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                let defaultTankId = '';
                const dieselTanks = (tanks || []).filter((t: any) => t.fuelType?.toLowerCase().includes('diesel') || t.name?.toLowerCase().includes('diesel') || t.fuelType === 'S10' || t.fuelType === 'S500');
                if (dieselTanks.length > 0) {
                  defaultTankId = dieselTanks[0].id;
                } else if (tanks && tanks.length > 0) {
                  defaultTankId = tanks[0].id;
                }
                setBatchEntries(prev => [
                  ...prev,
                  {
                    id: Math.random().toString(36).substring(2, 9),
                    vehicleId: vehicles && vehicles.length > 0 ? vehicles[0].id : '',
                    driverId: employees && employees.length > 0 ? employees[0].id : '',
                    quantity: 0,
                    odometer: 0,
                    cost: 0,
                    pricePerLiter: 5.90,
                    fuelTankId: defaultTankId,
                    isExternal: false,
                    location: 'Interno',
                    timestamp: new Date().toISOString().slice(0, 16)
                  }
                ]);
              }}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-all active:scale-95 animate-fade-in"
            >
              <Plus size={10} /> Adicionar Linha
            </button>
          </div>

          {batchEntries.length === 0 ? (
            <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Nenhum lançamento extraído</p>
              <p className="text-[9px] text-zinc-600 mt-1 uppercase font-medium">Selecione uma imagem de ficha de abastecimento acima para ler com IA</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {batchEntries.map((entry, index) => (
                <div key={entry.id} className="p-4 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl relative space-y-4 group">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchEntries(prev => prev.filter(e => e.id !== entry.id));
                    }}
                    className="absolute top-3 right-3 text-zinc-600 hover:text-rose-500 transition-colors"
                  >
                    <X size={14} />
                  </button>

                  <div className="text-[9px] font-black text-brand-accent uppercase tracking-widest">
                    Lançamento #{index + 1}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Vehicle select */}
                    <div>
                      <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 font-mono">VEÍCULO</label>
                      <select
                        value={entry.vehicleId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBatchEntries(prev => prev.map(item => item.id === entry.id ? { ...item, vehicleId: val } : item));
                        }}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-150 focus:border-white focus:outline-none"
                      >
                        <option value="">Selecione...</option>
                        {(vehicles || [])
                          .sort((a: any, b: any) => a.plate.localeCompare(b.plate))
                          .map((v: any) => (
                            <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                          ))}
                        <option value="outros">OUTROS</option>
                      </select>
                    </div>

                    {/* Driver select */}
                    <div>
                      <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 font-mono">MOTORISTA</label>
                      <select
                        value={entry.driverId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBatchEntries(prev => prev.map(item => item.id === entry.id ? { ...item, driverId: val } : item));
                        }}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-150 focus:border-white focus:outline-none"
                      >
                        <option value="">Selecione...</option>
                        {(employees || []).map((emp: any) => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Fuel Type / Pump Location Type */}
                    <div>
                      <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 font-mono">TIPO DE BOMBA</label>
                      <select
                        value={entry.isExternal ? 'externa' : 'interna'}
                        onChange={(e) => {
                          const val = e.target.value === 'externa';
                          setBatchEntries(prev => prev.map(item => item.id === entry.id ? { ...item, isExternal: val, location: val ? '' : 'Interno' } : item));
                        }}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-150 focus:border-white focus:outline-none"
                      >
                        <option value="interna">Interna (Tanque Próprio)</option>
                        <option value="externa">Externa (Posto de Rua)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Liters */}
                    <div>
                      <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 font-mono">LITROS</label>
                      <input
                        type="number"
                        step="0.01"
                        value={entry.quantity || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setBatchEntries(prev => prev.map(item => item.id === entry.id ? { ...item, quantity: val } : item));
                        }}
                        placeholder="0.00"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-150 focus:border-white focus:outline-none"
                      />
                    </div>

                    {/* Odometer */}
                    <div>
                      <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 font-mono">HODÔMETRO</label>
                      <input
                        type="number"
                        value={entry.odometer || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setBatchEntries(prev => prev.map(item => item.id === entry.id ? { ...item, odometer: val } : item));
                        }}
                        placeholder="0"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-150 focus:border-white focus:outline-none"
                      />
                    </div>

                    {/* Cost / Total Paid */}
                    <div>
                      <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 font-mono">CUSTO (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={entry.cost || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setBatchEntries(prev => prev.map(item => item.id === entry.id ? { ...item, cost: val } : item));
                        }}
                        placeholder="Auto"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-150 focus:border-white focus:outline-none"
                      />
                    </div>

                    {/* Tank or Location depending on pump type */}
                    {entry.isExternal ? (
                      <div>
                        <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 font-mono">LOCAL/POSTO</label>
                        <input
                          type="text"
                          value={entry.location === 'Interno' ? '' : entry.location}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBatchEntries(prev => prev.map(item => item.id === entry.id ? { ...item, location: val } : item));
                          }}
                          placeholder="Posto..."
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-150 focus:border-white focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 font-mono">TANQUE ORIGEM</label>
                        <select
                          value={entry.fuelTankId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBatchEntries(prev => prev.map(item => item.id === entry.id ? { ...item, fuelTankId: val } : item));
                          }}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-150 focus:border-white focus:outline-none"
                        >
                          <option value="">Selecione...</option>
                          {(tanks || []).map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.currentLevel}L)</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {batchEntries.length > 0 && (
            <div className="pt-6 border-t border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                Lote: <span className="text-white">{batchEntries.length} itens</span> |{' '}
                <span className="text-white">
                  {batchEntries.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0).toFixed(2)}L
                </span>{' '}
                |{' '}
                <span className="text-white">
                  R${' '}
                  {batchEntries
                    .reduce((acc, curr) => {
                      let c = Number(curr.cost || 0);
                      if (c === 0 && curr.quantity > 0) {
                        c = Number((curr.quantity * 5.9).toFixed(2));
                      }
                      return acc + c;
                    }, 0)
                    .toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                disabled={loading || batchEntries.length === 0}
                onClick={async () => {
                  setLoading(true);
                  const toastId = toast.loading("Lançando lote de abastecimentos no sistema...");
                  let successCount = 0;
                  try {
                    for (const entry of batchEntries) {
                      if (!entry.vehicleId) {
                        throw new Error("Há lançamentos sem veículo selecionado.");
                      }
                      if (!entry.isExternal && !entry.fuelTankId) {
                        throw new Error("Abastecimentos internos requerem tanque de origem.");
                      }
                      if (isNaN(entry.quantity) || entry.quantity <= 0) {
                        throw new Error("Todos os abastecimentos devem ter quantidade em litros positiva.");
                      }
                      if (isNaN(entry.odometer) || entry.odometer <= 0) {
                        throw new Error("Todos os abastecimentos devem ter hodômetro válido.");
                      }
                    }

                    for (const entry of batchEntries) {
                      await saveBatchFuelEntry(entry);
                      successCount++;
                    }

                    toast.success(`Lote concluído! ${successCount} abastecimentos gravados com sucesso.`, { id: toastId });
                    setBatchEntries([]);
                    onSubmit(null); // Triggers parent update & modal closing
                  } catch (err: any) {
                    console.error("Erro ao salvar lote de abastecimento:", err);
                    toast.error("Falha no lançamento: " + (err.message || "Erro desconhecido"), { id: toastId });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-6 py-3 bg-white text-zinc-950 hover:bg-zinc-200 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 disabled:opacity-50 transition duration-300 shadow cursor-pointer self-end"
              >
                {loading ? 'Lançando...' : 'LANÇAR TODOS COM IA'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TankForm = ({ onSubmit }: any) => {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    await onSubmit(e);
    setLoading(false);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
};

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
  const [name, setName] = useState(initialData?.name || '');
  const [role, setRole] = useState(initialData?.role || 'Motorista');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [cpf, setCpf] = useState(initialData?.cpf || '');
  const [rg, setRg] = useState(initialData?.rg || '');
  const [licenseNumber, setLicenseNumber] = useState(initialData?.licenseNumber || '');
  const [licenseCategory, setLicenseCategory] = useState(initialData?.licenseCategory || '');
  const [licenseExpiration, setLicenseExpiration] = useState(initialData?.licenseExpiration || '');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || '');
  const [admissionDate, setAdmissionDate] = useState(initialData?.admissionDate || '');
  const [status, setStatus] = useState(initialData?.status || 'active');

  const [photo, setPhoto] = useState<string | null>(initialData?.photoUrl || null);
  const [email, setEmail] = useState(initialData?.email || '');
  const [loadingProfilePhoto, setLoadingProfilePhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState(initialData?.photoUrl && initialData?.photoUrl.startsWith('http') ? initialData.photoUrl : '');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialData?.permissions || []);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // AI Driver Extraction States
  const [aiDriverLoading, setAiDriverLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiFileBase64, setAiFileBase64] = useState<string | null>(null);
  const [aiFileMimeType, setAiFileMimeType] = useState<string | null>(null);
  const [aiFileBlobUrl, setAiFileBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    setName(initialData?.name || '');
    setRole(initialData?.role || 'Motorista');
    setPhone(initialData?.phone || '');
    setCpf(initialData?.cpf || '');
    setRg(initialData?.rg || '');
    setLicenseNumber(initialData?.licenseNumber || '');
    setLicenseCategory(initialData?.licenseCategory || '');
    setLicenseExpiration(initialData?.licenseExpiration || '');
    setBirthDate(initialData?.birthDate || '');
    setAdmissionDate(initialData?.admissionDate || '');
    setStatus(initialData?.status || 'active');
    setPhoto(initialData?.photoUrl || null);
    setEmail(initialData?.email || '');
    setPhotoUrlInput(initialData?.photoUrl && initialData?.photoUrl.startsWith('http') ? initialData.photoUrl : '');
    setSelectedPermissions(initialData?.permissions || []);
    if (initialData?.workSchedule) {
      setSchedule(initialData.workSchedule);
    }
  }, [initialData]);

  const handleAIFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiFileMimeType(file.type);
    setAiFileBlobUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setAiFileBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAIDriverExtraction = async () => {
    if (!aiText && !aiFileBase64) {
      toast.error("Por favor, cole um texto ou anexe uma foto/documento da CNH/RG.");
      return;
    }

    setAiDriverLoading(true);
    try {
      const res = await fetch("/api/extract-driver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          base64Data: aiFileBase64,
          mimeType: aiFileMimeType,
          textPrompt: aiText
        })
      });

      if (!res.ok) {
        throw new Error("Erro na análise da IA.");
      }

      const data = await res.json();

      // Update Form States
      if (data.name) setName(data.name.toUpperCase());
      if (data.phone) setPhone(data.phone);
      if (data.cpf) setCpf(data.cpf);
      if (data.rg) setRg(data.rg);
      if (data.licenseNumber) setLicenseNumber(data.licenseNumber);
      if (data.licenseCategory) setLicenseCategory(data.licenseCategory.toUpperCase());
      if (data.licenseExpiration) setLicenseExpiration(data.licenseExpiration);
      if (data.birthDate) setBirthDate(data.birthDate);

      toast.success("Informações do motorista extraídas com sucesso!");
      // Reset AI section
      setAiText('');
      setAiFileBase64(null);
      setAiFileMimeType(null);
      setAiFileBlobUrl(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao extrair dados do motorista: " + err.message);
    } finally {
      setAiDriverLoading(false);
    }
  };

  // Sincronizar foto do perfil do usuário correspondente por e-mail
  const handleFetchUserProfilePhoto = async () => {
    if (!email || !email.trim()) {
      alert('Por favor, informe primeiro o e-mail do colaborador para buscar a foto de perfil correspondente.');
      return;
    }
    setLoadingProfilePhoto(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        alert(`Nenhum usuário cadastrado com o e-mail "${email}" para copiar a foto.`);
      } else {
        const userData = querySnapshot.docs[0].data();
        if (userData.photoURL) {
          setPhoto(userData.photoURL);
          setPhotoUrlInput(userData.photoURL);
          alert('Foto de perfil importada com sucesso!');
        } else {
          alert('Este usuário correspondente existe, mas ainda não cadastrou nenhuma foto de perfil.');
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      alert('Erro ao buscar foto do perfil no banco de dados.');
    } finally {
      setLoadingProfilePhoto(false);
    }
  };

  // Work Schedule State (Defaulting to 'Ana Paula' rule: 08-18h with 1h30 break, Sat 08-12h)
  const [schedule, setSchedule] = useState<WorkSchedule>(initialData?.workSchedule || {
    monToFri: {
      morning: { start: '08:00', end: '11:30' },
      afternoon: { start: '13:00', end: '18:00' }
    },
    saturday: { start: '08:00', end: '12:00' },
    sunday: { start: '', end: '' }
  });

  const isSpecialUser = currentUserRole === 'Dono / Proprietário' || 
                        currentUserRole === 'Dono' || 
                        currentUserRole === 'Proprietário' || 
                        currentUserRole === 'Administrativo' ||
                        currentUserEmail === 'elizeuferron@gmail.com';

  const ALL_TOOLS = [
    { id: 'dashboard', label: 'Painel' },
    { id: 'trips', label: 'Trabalhos' },
    { id: 'fleet', label: 'Gestão de Frotas' },
    { id: 'finance', label: 'Financeiros' },
    { id: 'fuel', label: 'Abastecimento' },
    { id: 'inventory', label: 'Almoxarifado' },
    { id: 'gabinete', label: 'Gabinete' }
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
    
    let permissionText = "Permissões padrão de " + (initialData.role || "Funcionário");
    if (selectedPermissions && selectedPermissions.length > 0) {
      const labels: Record<string, string> = {
        dashboard: "Painel",
        trips: "Trabalhos",
        fleet: "Gestão de Frotas",
        finance: "Financeiros",
        fuel: "Abastecimento",
        inventory: "Almoxarifado",
        gabinete: "Gabinete"
      };
      permissionText = selectedPermissions.map((p: string) => labels[p] || p).join(", ");
    }

    const message = `🚀 *DM TURISMO PRO - TERMINAL DE OPERAÇÕES*%0A%0AOlá *${initialData.name}*! 👋%0A%0AO seu acesso personalizado para o aplicativo da DM Turismo foi pré-estabelecido com as suas credenciais e permissões.%0A%0A💼 *CARGO:* ${initialData.role || "Colaborador"}%0A🔑 *AUTORIZAÇÕES:* ${permissionText}%0A%0A🔗 *SEU LINK EXCLUSIVO:*%0A${shareUrl}%0A%0A*COMO INSTALAR / UTILIZAR:*%0A1. Abra o link acima no seu smartphone.%0A2. No menu do navegador, clique em "Adicionar à Tela de Início" (para obter o ícone de Aplicativo PWA).%0A3. Todo o seu painel de relatórios, escalas de trabalho e jornadas estará acessível sem necessidade de novas configurações!%0A%0A_DM Turismo - prazer em viajar bem._`;
    const cleanPhone = initialData.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <form onSubmit={(e: any) => {
      e.preventDefault();
      onSubmit({ 
        name,
        role,
        phone,
        cpf,
        rg,
        licenseNumber,
        licenseCategory,
        licenseExpiration,
        birthDate,
        admissionDate,
        status,
        email,
        password: e.currentTarget.password?.value || initialData?.password || '',
        photoUrl: photo, 
        permissions: selectedPermissions,
        workSchedule: schedule
      });
    }} className="space-y-6">
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3 py-4 bg-zinc-950/20 border border-white/5 rounded-[2.5rem] p-6 w-full">
           <div className="relative group">
              <div className="w-32 h-32 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-3xl overflow-hidden flex items-center justify-center">
                 {photo ? (
                   <img src={photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <Users className="text-zinc-700" size={40} />
                 )}
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-3xl">
                 <button 
                   type="button" 
                   onClick={startCamera}
                   className="p-2 bg-brand-accent text-zinc-950 rounded-xl hover:scale-110 transition-transform cursor-pointer"
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
                          reader.onloadend = () => {
                            setPhoto(reader.result as string);
                            setPhotoUrlInput('');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Upload size={18} />
                 </label>
              </div>
           </div>
           
           <div className="text-center">
             <p className="text-[10px] font-black text-white uppercase tracking-widest">Foto do Colaborador</p>
             <p className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">Mural de Aniversários e Perfil</p>
           </div>

           {/* Opções de origem: Foto externa ou Buscar do perfil do usuário */}
           <div className="w-full max-w-sm space-y-3 pt-3 border-t border-white/5">
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest text-left">URL Externa ou Foto Pronta</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cole o link direto da foto/card aqui..."
                    value={photoUrlInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhotoUrlInput(val);
                      if (val.trim()) {
                        setPhoto(val.trim());
                      } else {
                        setPhoto(initialData?.photoUrl || null);
                      }
                    }}
                    className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:border-brand-accent/60 outline-none transition-all font-bold"
                  />
                  {photoUrlInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrlInput('');
                        setPhoto(null);
                      }}
                      className="px-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-colors border border-rose-500/20"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleFetchUserProfilePhoto}
                disabled={loadingProfilePhoto}
                className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-950 hover:bg-brand-accent/10 border border-white/5 hover:border-brand-accent/20 rounded-xl text-[9px] font-black text-zinc-300 hover:text-brand-accent uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingProfilePhoto ? (
                  <Loader2 className="animate-spin" size={12} />
                ) : (
                  <Globe size={12} />
                )}
                Usar Foto de Perfil do Usuário correspondente
              </button>
           </div>
        </div>

        {/* ASSISTENTE IA: EXTRAÇÃO DE DOCUMENTO */}
        <div className="p-6 bg-zinc-900 border border-brand-accent/25 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-brand-accent">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Preenchimento Rápido com IA (CNH / RG)</h3>
          </div>
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wide leading-relaxed">
            Arraste ou selecione a foto/PDF da CNH ou RG, ou cole o texto copiado do documento. Nossa IA preencherá o formulário automaticamente com precisão de dados.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest">Foto / Documento</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 hover:border-brand-accent/40 bg-zinc-950/40 rounded-2xl p-4 cursor-pointer transition-all min-h-[5rem]">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleAIFileChange}
                  />
                  {aiFileBlobUrl ? (
                    <div className="w-full h-16 relative rounded-lg overflow-hidden">
                      <img src={aiFileBlobUrl} className="w-full h-full object-cover" alt="Document Preview" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-[8px] font-black uppercase text-brand-accent tracking-widest">Alterar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <FileText className="text-zinc-600 mb-1" size={16} />
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Anexar Documento</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest">Ou cole o texto copiado</label>
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="Cole aqui as informações textuais do documento..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl px-3 py-2 text-[10px] font-bold text-white placeholder-zinc-700 focus:border-brand-accent/60 outline-none transition-all resize-none h-[5rem]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAIDriverExtraction}
            disabled={aiDriverLoading || (!aiFileBase64 && !aiText)}
            className="w-full py-3 bg-brand-accent hover:bg-white text-zinc-950 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-brand-accent/5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {aiDriverLoading ? (
              <Loader2 className="animate-spin text-zinc-950" size={14} />
            ) : (
              <Bot size={14} />
            )}
            {aiDriverLoading ? "Extraindo Informações..." : "Analisar e Preencher com IA"}
          </button>
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

        <Input 
          label="Nome Completo" 
          placeholder="Ex: João Silva" 
          icon={Users} 
          required 
          name="name" 
          value={name}
          onChange={(e: any) => setName(e.target.value)}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select 
            label="Função" 
            icon={Briefcase} 
            name="role" 
            required
            value={role}
            onChange={(e: any) => setRole(e.target.value)}
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
            <Input 
              label="Telefone / WhatsApp" 
              placeholder="(21) 98888-8888" 
              icon={Phone} 
              required 
              name="phone" 
              value={phone}
              onChange={(e: any) => setPhone(e.target.value)}
            />
            {initialData?.phone && (
              <button
                type="button"
                onClick={handleShareAccess}
                className="absolute right-3 bottom-2.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider cursor-pointer"
                title="Compartilhar Acesso via WhatsApp"
              >
                <Share2 size={12} className="text-emerald-400 shrink-0" />
                <span>Enviar Acesso</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="CPF" 
            placeholder="000.000.000-00" 
            icon={FileText} 
            name="cpf" 
            value={cpf}
            onChange={(e: any) => setCpf(e.target.value)}
          />
          <Input 
            label="RG" 
            placeholder="00.000.000-0" 
            icon={FileText} 
            name="rg" 
            value={rg}
            onChange={(e: any) => setRg(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Número de Registro CNH" 
            placeholder="Ex: 00000000000" 
            icon={FileText} 
            name="licenseNumber" 
            value={licenseNumber}
            onChange={(e: any) => setLicenseNumber(e.target.value)}
          />
          <Input 
            label="Categoria CNH" 
            placeholder="Ex: D, E, D/E" 
            icon={Briefcase} 
            name="licenseCategory" 
            value={licenseCategory}
            onChange={(e: any) => setLicenseCategory(e.target.value)}
          />
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
          <Input 
            label="E-mail (Opcional)" 
            type="email" 
            placeholder="joao@unimult.com.br" 
            icon={Users} 
            name="email" 
            value={email}
            onChange={(e: any) => setEmail(e.target.value)} 
          />
          <Input label="Senha de Acesso (App)" type="password" placeholder="Defina uma senha" icon={Lock} name="password" defaultValue={initialData?.password} />
        </div>
        
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Lista de Permissões por Funcionário</h3>
            <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest px-2 py-0.5 bg-brand-accent/10 rounded-full border border-brand-accent/20 font-bold">Personalizado</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_TOOLS.map(tool => (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleTogglePermission(tool.id)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all text-center cursor-pointer",
                  selectedPermissions.includes(tool.id)
                    ? "bg-brand-accent border-brand-accent text-zinc-950 shadow-lg shadow-brand-accent/20 font-black"
                    : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                )}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <p className="text-[8px] font-bold text-zinc-600 uppercase italic">
            * Se nenhuma permissão for marcada, o funcionário herdará as permissões padrão de seu cargo de forma automática.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Data de Nascimento" 
            type="date" 
            icon={Calendar} 
            name="birthDate" 
            value={birthDate}
            onChange={(e: any) => setBirthDate(e.target.value)}
          />
          <Input 
            label="Vencimento CNH" 
            type="date" 
            icon={Calendar} 
            name="licenseExpiration" 
            value={licenseExpiration}
            onChange={(e: any) => setLicenseExpiration(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Data de Admissão" 
            type="date" 
            icon={Calendar} 
            name="admissionDate" 
            value={admissionDate}
            onChange={(e: any) => setAdmissionDate(e.target.value)}
          />
          <Select 
            label="Status do Colaborador" 
            name="status" 
            value={status}
            onChange={(e: any) => setStatus(e.target.value)}
            options={[
              { value: 'active', label: 'Ativo / Operando' },
              { value: 'inactive', label: 'Inativo / Desativado' },
            ]}
          />
        </div>
      </div>

      {initialData?.id && (
        <div className="pt-6 border-t border-white/5">
          <PhotoGallery collectionName="employees" documentId={initialData.id} />
        </div>
      )}

      <div className="pt-4 flex gap-4">
        <Button loading={loading} className="flex-1">
          <Save size={20} />
          SALVAR
        </Button>
      </div>
    </form>
  );
};

// MaintenanceForm has been moved to its own file.

