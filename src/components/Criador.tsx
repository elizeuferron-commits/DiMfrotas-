import React, { useState } from 'react';
import { Bot as BotIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { AIConsultant } from './AIConsultant';
import { CreationTool } from './CreationTool';

interface CriadorProps {
  user?: any;
}

export default function Criador({ user }: CriadorProps) {
  const [activeTab, setActiveTab] = useState<'consultor' | 'criacao'>('consultor');

  const tabs = [
    { id: 'consultor', label: 'Consultor IA', icon: BotIcon, desc: 'Assistente inteligente e análises preditivas' },
    { id: 'criacao', label: 'Criação', icon: Sparkles, desc: 'Gerenciador de sandbox e shadow modules' }
  ] as const;

  return (
    <div className="space-y-8">
      {/* Header unificado */}
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
          Núcleo <span className="text-brand-accent">Criador</span>
        </h1>
        <p className="text-zinc-500 font-medium tracking-tight">
          Painel de ferramentas avançadas: inteligência artificial e desenvolvimento modular.
        </p>
      </div>

      {/* Seletor de Abas Estilizado no Padrão DM Turismo (rounded-2xl) */}
      <div className="flex flex-wrap gap-3 p-2 bg-zinc-950/80 border border-white/5 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                isActive
                  ? "bg-zinc-800 text-brand-accent shadow-lg border border-zinc-700/50"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              <Icon size={14} className={isActive ? "text-brand-accent" : "text-zinc-600"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Renderização de abas com transição suave */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'consultor' && (
              <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/5 p-6 backdrop-blur-md shadow-2xl">
                <AIConsultant />
              </div>
            )}
            {activeTab === 'criacao' && (
              <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/5 p-6 backdrop-blur-md shadow-2xl">
                <CreationTool />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
