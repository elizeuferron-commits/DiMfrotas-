import React, { useState, useEffect, memo } from 'react';
import { 
  LayoutDashboard, 
  Bus, 
  Fuel, 
  Wrench, 
  Users,
  Package,
  LogOut,
  Calendar,
  TrendingUp,
  Bell,
  Share2,
  DollarSign,
  Plus,
  FileText,
  Sparkles,
  Bot as BotIcon,
  Route,
  Smartphone,
  SquareCheck,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { toast } from 'sonner';
import { hasPermission } from '../lib/permissions';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
  profile: UserProfile | null;
  logout: () => void;
}

/**
 * Sidebar unificada com item centralizado para Gestão de Frota.
 */
export const Sidebar = ({ 
  isOpen, 
  setIsOpen, 
  activeSection, 
  setActiveSection, 
  profile, 
  logout
}: SidebarProps) => {
  const [runningRoutesCount, setRunningRoutesCount] = useState(0);
  const [fleetAlertsCount, setFleetAlertsCount] = useState(0);
  const [activeTripsCount, setActiveTripsCount] = useState(0);
  const [pendingFinanceCount, setPendingFinanceCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingOSCount, setPendingOSCount] = useState(0);

  useEffect(() => {
    // 1. Fretamento: Active running routes
    const unsubRoutes = onSnapshot(collection(db, 'chartered_routes'), (snapshot) => {
      const running = snapshot.docs.filter(d => d.data().runState === 'running').length;
      setRunningRoutesCount(running);
    }, (err) => console.log('Sidebar counting error (routes):', err));

    // 2. Gestão de Frota: Vehicles in maintenance, overdue licenses, and pending logs
    const activeVehiclesUnsub = onSnapshot(collection(db, 'vehicles'), (vSnapshot) => {
      const today = new Date().toISOString().split('T')[0];
      const vehiclesAlerts = vSnapshot.docs.filter(d => {
        const data = d.data();
        if (data.status === 'maintenance') return true;
        const expirations = [
          data.licenseExpiration,
          data.tourismLicenseExpiration,
          data.cadasturExpiration,
          data.anttExpiration,
          data.detroArtespExpiration,
          data.insuranceExpiration,
          data.tacografoExpiration
        ];
        return expirations.some(exp => exp && exp < today);
      }).length;
      
      const unsubMaint = onSnapshot(collection(db, 'maintenance_logs'), (mSnapshot) => {
        const pendingLogs = mSnapshot.docs.filter(d => d.data().status === 'pending').length;
        setFleetAlertsCount(vehiclesAlerts + pendingLogs);
      }, (err) => console.log('Sidebar counting error (maint logs):', err));

      return () => unsubMaint();
    }, (err) => console.log('Sidebar counting error (vehicles):', err));

    // 3. Viagens & Ordens de Serviço: Active trips and scheduled OS
    const unsubTrips = onSnapshot(collection(db, 'trips'), (snapshot) => {
      const active = snapshot.docs.filter(d => d.data().runState === 'running' || d.data().status === 'active').length;
      const scheduled = snapshot.docs.filter(d => d.data().status === 'scheduled').length;
      setActiveTripsCount(active);
      setPendingOSCount(scheduled);
    }, (err) => console.log('Sidebar counting error (trips):', err));

    // 4. Financeiro: Transactions pending or overdue
    const unsubFinance = onSnapshot(collection(db, 'financial_transactions'), (snapshot) => {
      const pendingOrOverdue = snapshot.docs.filter(d => {
        const data = d.data();
        return data.status === 'pending' || data.status === 'overdue';
      }).length;
      setPendingFinanceCount(pendingOrOverdue);
    }, (err) => console.log('Sidebar counting error (finance):', err));

    // 5. Almoxarifado: Low stock items
    const unsubStock = onSnapshot(collection(db, 'stock_items'), (snapshot) => {
      const low = snapshot.docs.filter(d => {
        const data = d.data();
        const quantity = parseFloat(data.quantity) || 0;
        const minQuantity = parseFloat(data.minQuantity) || 0;
        return quantity <= minQuantity;
      }).length;
      setLowStockCount(low);
    }, (err) => console.log('Sidebar counting error (stock):', err));

    return () => {
      unsubRoutes();
      activeVehiclesUnsub();
      unsubTrips();
      unsubFinance();
      unsubStock();
    };
  }, []);

  const getBadgeInfo = (sectionId: string) => {
    switch (sectionId) {
      case 'fretamento':
        return runningRoutesCount > 0 ? {
          count: runningRoutesCount,
          className: "bg-orange-500/15 text-brand-accent border border-brand-accent/20 animate-pulse font-mono text-[9px] font-black px-2 py-0.5 rounded-full"
        } : null;
      case 'fleet':
        return fleetAlertsCount > 0 ? {
          count: fleetAlertsCount,
          className: "bg-rose-500/15 text-rose-500 border border-rose-500/20 font-mono text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse"
        } : null;
      case 'trips':
        return activeTripsCount > 0 ? {
          count: activeTripsCount,
          className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse"
        } : null;
      case 'os':
        return pendingOSCount > 0 ? {
          count: pendingOSCount,
          className: "bg-sky-500/15 text-sky-400 border border-sky-500/20 font-mono text-[9px] font-black px-2 py-0.5 rounded-full"
        } : null;
      case 'finance':
        return pendingFinanceCount > 0 ? {
          count: pendingFinanceCount,
          className: "bg-amber-500/15 text-amber-500 border border-amber-500/20 font-mono text-[9px] font-black px-2 py-0.5 rounded-full"
        } : null;
      case 'inventory':
        return lowStockCount > 0 ? {
          count: lowStockCount,
          className: "bg-red-500/15 text-red-500 border border-red-500/20 font-mono text-[9px] font-black px-2 py-0.5 rounded-full"
        } : null;
      default:
        return null;
    }
  };

  const allSections = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fretamento', label: 'Fretamento', icon: Route },
    { id: 'fleet', label: 'Gestão de Frota', icon: Bus }, // UNIFICADO: Frota + Vencimentos + Manutenção
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'fuel', label: 'Combustível', icon: Fuel },
    { id: 'criador', label: 'Criador', icon: Sparkles },
    { id: 'trips', label: 'Viagens', icon: TrendingUp },
    { id: 'staff', label: 'Equipe', icon: Users },
    { id: 'os', label: 'Ordens de Serviço', icon: FileText },
    { id: 'inventory', label: 'Almoxarifado', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: Bell },
  ];

  // Filtra as seções com base nas permissões
  const sections = allSections.filter(section => hasPermission(profile?.role, section.id, profile?.email, profile?.permissions, profile?.displayName));

  const handleShareApp = async () => {
    const shareData = {
      title: 'DM Turismo',
      text: 'Gestão Operacional de Alto Desempenho',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(window.location.origin);
        toast.success('Link de acesso copiado!', {
          description: 'O link foi copiado para sua área de transferência.',
          icon: '📋'
        });
      } catch (clipErr) {
        toast.error('Não foi possível compartilhar ou copiar o link.');
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className={cn(
            "fixed lg:sticky top-0 h-screen bg-asphalt-950 border-r border-asphalt-800 z-50 flex flex-col overflow-hidden shadow-2xl transition-all duration-500",
            !isOpen && "border-none"
          )}
        >
          <div 
            className="p-8 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-12 h-12 bg-asphalt-900 border border-white/10 rounded-2xl flex items-center justify-center transform rotate-3 shadow-xl shrink-0 overflow-hidden group-hover:rotate-0 transition-transform">
              <Bus className="w-7 h-7 text-brand-accent transform -rotate-3 group-hover:rotate-0 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white tracking-tighter uppercase whitespace-nowrap leading-none font-display">DM Turismo</span>
              <span className="text-[10px] font-black text-sky-blue uppercase tracking-widest mt-1 opacity-70">Logística Pro</span>
            </div>
          </div>

          <nav className="flex-1 px-6 space-y-2 mt-2 overflow-y-auto custom-scrollbar sidebar-navigation">
            {sections.map((section) => {
              const badge = getBadgeInfo(section.id);
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all text-xs text-left justify-start group relative overflow-hidden",
                    activeSection === section.id 
                      ? "bg-zinc-800 text-brand-accent shadow-lg border border-zinc-700" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  )}
                >
                  <section.icon 
                    size={20} 
                    strokeWidth={2.5} 
                    className={cn(
                      "transition-transform group-hover:scale-110 shrink-0",
                      activeSection === section.id ? "text-brand-accent" : "text-zinc-500 group-hover:text-zinc-300"
                    )} 
                  />
                  <span className="relative z-10 uppercase tracking-wider flex-1 truncate">{section.label}</span>
                  {badge && (
                    <span className={cn("relative z-10 shrink-0 select-none", badge.className)}>
                      {badge.count}
                    </span>
                  )}
                  {activeSection === section.id && (
                    <div className="ml-1 w-1 h-3 bg-brand-accent rounded-full shrink-0" />
                  )}
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-asphalt-800/50" />
          </nav>

          <div className="p-6 bg-asphalt-900/50 backdrop-blur-md border-t border-white/5">
            <div className="flex items-center gap-4 p-4 bg-asphalt-900 border border-white/5 rounded-2xl mb-6 group cursor-pointer hover:bg-asphalt-800 transition-all shadow-sm">
              <img 
                src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
                className="w-10 h-10 rounded-xl border border-white/10 shadow-md grayscale group-hover:grayscale-0 transition-all"
                alt="Avatar"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate leading-none mb-1.5 uppercase tracking-tight">{profile?.displayName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
                  <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.1em]">{profile?.role}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleShareApp}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-asphalt-900 hover:bg-sky-blue text-zinc-500 hover:text-asphalt-950 rounded-2xl font-black text-[9px] transition-all active:scale-95 border border-white/5 hover:border-transparent uppercase tracking-widest group"
              >
                <Share2 size={16} strokeWidth={2.5} />
                ID Digital
              </button>
              <button 
                onClick={logout}
                className="w-16 flex items-center justify-center text-zinc-600 hover:text-rose-500 hover:bg-rose-500/5 bg-asphalt-900 rounded-2xl transition-all active:scale-95 border border-white/5 hover:border-rose-500/30"
                title="Sair"
              >
                <LogOut size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
