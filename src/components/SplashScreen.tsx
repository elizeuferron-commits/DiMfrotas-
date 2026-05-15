import React from 'react';
import { motion } from 'motion/react';
import { Bus, Loader2 } from 'lucide-react';

export const SplashScreen = () => {
  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-[999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        {/* Animated Logo Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-brand-accent/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="w-32 h-32 bg-zinc-900 border-2 border-brand-accent/50 rounded-[40px] flex items-center justify-center shadow-2xl relative overflow-hidden group">
            {/* Glossy Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Bus size={64} className="text-brand-accent drop-shadow-lg" />
          </div>
        </div>

        {/* Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">
            DM <span className="text-brand-accent">Turismo</span>
          </h1>
          <p className="text-zinc-500 font-extrabold text-[10px] uppercase tracking-[0.4em] ml-1">
            Gestão Operacional Pro
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 bg-zinc-900/50 px-6 py-3 rounded-full border border-zinc-800 backdrop-blur-sm">
            <Loader2 className="animate-spin text-brand-accent" size={16} />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Iniciando Terminal...
            </span>
          </div>
          <p className="text-zinc-700 text-[8px] font-bold uppercase tracking-widest">
            Versão 2.5.0 • Powered by Highway OS
          </p>
        </div>
      </motion.div>

      {/* Decorative Bottom Line */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-1 bg-brand-accent/20 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-1/2 h-full bg-brand-accent"
        />
      </div>
    </div>
  );
};
