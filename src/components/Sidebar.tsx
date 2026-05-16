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
  Clock,
  Route,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { toast } from 'sonner';
import { hasPermission } from '../lib/permissions';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
  profile: UserProfile | null;
  logout: () => void;
  isInstallable?: boolean;
  onInstall?: () => void;
}

export const Sidebar = ({ 
  isOpen, 
  setIsOpen, 
  activeSection, 
  setActiveSection, 
  profile, 
  logout,
  isInstallable,
  onInstall
}: SidebarProps) => {
  const allSections = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journey', label: 'Portaria/Jornada', icon: Clock },
    { id: 'fretamento', label: 'Fretamento', icon: Route },
    { id: 'fleet', label: 'Frota', icon: Bus },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'vencimentos', label: 'Vencimentos', icon: Calendar },
    { id: 'fuel', label: 'Combustível', icon: Fuel },
    { id: 'maintenance', label: 'Manutenção', icon: Wrench },
    { id: 'staff', label: 'Equipe', icon: Users },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'trips', label: 'Viagens', icon: TrendingUp },
    { id: 'os', label: 'OS de Viagem', icon: FileText },
    { id: 'inventory', label: 'Almoxarifado', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: Bell },
    { id: 'ai-consultant', label: 'Consultor IA', icon: BotIcon },
    { id: 'creacao', label: 'Criação', icon: Sparkles },
  ];

  const sections = allSections.filter(section => hasPermission(profile?.role, section.id, profile?.email, profile?.permissions));

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

          <nav className="flex-1 px-6 space-y-2 mt-2 overflow-y-auto">
            {sections.map((section) => (
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
                    "transition-transform group-hover:scale-110",
                    activeSection === section.id ? "text-brand-accent" : "text-zinc-500 group-hover:text-zinc-300"
                  )} 
                />
                <span className="relative z-10 uppercase tracking-wider">{section.label}</span>
                {activeSection === section.id && (
                  <div className="ml-auto w-1 h-4 bg-brand-accent rounded-full" />
                )}
              </button>
            ))}

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
