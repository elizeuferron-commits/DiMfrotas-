import React from 'react';
import { 
  X, 
  ChevronRight,
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md z-[100]" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-[101] overflow-hidden"
        >
          <div className="px-10 py-8 flex items-center justify-between border-b border-zinc-800/60 bg-zinc-900/50">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{title}</h3>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-2 leading-none">Terminal de Dados</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-xl transition-all active:scale-90 bg-zinc-900 border border-zinc-800 group">
              <X size={20} className="text-zinc-500 group-hover:text-white" />
            </button>
          </div>
          <div className="p-10 max-h-[80vh] overflow-y-auto bg-zinc-900/10 tracking-tight">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export const Input = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-2 mb-6 last:mb-0">
    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block ml-1">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-accent transition-colors" size={18} />}
      <input 
        {...props}
        className={cn(
          "w-full pr-6 py-5 bg-zinc-950 border border-zinc-800 focus:border-brand-accent rounded-2xl font-bold text-white outline-none transition-all placeholder:text-zinc-800 text-sm",
          Icon ? "pl-16" : "pl-6"
        )}
      />
    </div>
  </div>
);

export const Select = ({ label, options, icon: Icon, ...props }: any) => (
  <div className="space-y-2 mb-6 last:mb-0">
    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block ml-1">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-accent pointer-events-none transition-colors" size={18} />}
      <select 
        {...props}
        className={cn(
          "w-full pr-12 py-5 bg-zinc-950 border border-zinc-800 focus:border-brand-accent rounded-2xl font-bold text-white outline-none transition-all appearance-none text-sm",
          Icon ? "pl-16" : "pl-6"
        )}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-700">
        <ChevronRight className="rotate-90" size={18} />
      </div>
    </div>
  </div>
);

export const Button = ({ children, loading, variant = 'primary', ...props }: any) => (
  <button 
    disabled={loading}
    className={cn(
      "w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50",
      variant === 'primary' ? "bg-white text-zinc-950 hover:bg-zinc-100 shadow-xl" : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700"
    )}
    {...props}
  >
    {loading ? <Loader2 className="animate-spin" size={18} /> : children}
  </button>
);
