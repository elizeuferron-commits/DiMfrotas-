import React from 'react';
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
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { toast } from 'sonner';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
  profile: UserProfile | null;
  logout: () => void;
}

export const Sidebar = ({ 
  isOpen, 
  setIsOpen, 
  activeSection, 
  setActiveSection, 
  profile, 
  logout 
}: SidebarProps) => {
  const sections = [
    { id: 'fleet', label: 'Frota', icon: Bus },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vencimentos', label: 'Vencimentos', icon: Calendar },
    { id: 'fuel', label: 'Combustível', icon: Fuel },
    { id: 'maintenance', label: 'Manutenção', icon: Wrench },
    { id: 'staff', label: 'Equipe', icon: Users },
    { id: 'trips', label: 'Viagens', icon: TrendingUp },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: Bell },
  ];

  const handleShareApp = async () => {
    const shareData = {
      title: 'DM Frotas Pro',
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
      // Fallback to clipboard for any error or lack of support
      try {
        await navigator.clipboard.writeText(window.location.origin);
        toast.success('Link de acesso copiado!', {
          description: 'O link foi copiado para sua área de transferência.',
          icon: '📋'
        });
      } catch (clipErr) {
        console.error('Clipboard fallback failed:', clipErr);
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
            "fixed lg:sticky top-0 h-screen bg-zinc-950 border-r border-zinc-800 z-50 flex flex-col overflow-hidden shadow-2xl transition-all duration-500",
            !isOpen && "border-none"
          )}
        >
          <div 
            className="p-8 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center transform rotate-3 shadow-xl shrink-0">
              <Bus className="w-7 h-7 text-brand-accent transform -rotate-3" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white tracking-tighter uppercase whitespace-nowrap leading-none">DM Frotas</span>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Gestão Industrial</span>
            </div>
          </div>

          <nav className="flex-1 px-6 space-y-2 mt-8 overflow-y-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all text-xs text-left justify-start group relative overflow-hidden",
                  activeSection === section.id 
                    ? "bg-zinc-800 text-brand-accent shadow-lg border border-zinc-700" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <section.icon 
                  size={20} 
                  strokeWidth={2.5} 
                  className={cn(
                    "transition-transform group-hover:scale-110",
                    activeSection === section.id ? "text-brand-accent" : "text-zinc-600 group-hover:text-zinc-400"
                  )} 
                />
                <span className="relative z-10 uppercase tracking-wider">{section.label}</span>
                {activeSection === section.id && (
                  <div className="ml-auto w-1 h-4 bg-brand-accent rounded-full" />
                )}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-zinc-800">
            <div className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl mb-6 group cursor-pointer hover:bg-zinc-800 transition-all shadow-sm">
              <img 
                src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
                className="w-10 h-10 rounded-lg border border-zinc-700 shadow-md grayscale group-hover:grayscale-0 transition-all"
                alt="Avatar"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-black text-white truncate leading-none mb-1 uppercase tracking-tight">{profile?.displayName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
                  <p className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">{profile?.role}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleShareApp}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-brand-accent text-zinc-500 hover:text-zinc-950 rounded-xl font-black text-[10px] transition-all active:scale-95 border border-zinc-800 hover:border-transparent uppercase tracking-widest group"
              >
                <Share2 size={16} strokeWidth={2.5} />
                Acesso via PC
              </button>
              <button 
                onClick={logout}
                className="w-16 flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:bg-rose-500/5 bg-zinc-900 rounded-xl transition-all active:scale-95 border border-zinc-800 hover:border-rose-500/30"
                title="LogOut"
              >
                <LogOut size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
