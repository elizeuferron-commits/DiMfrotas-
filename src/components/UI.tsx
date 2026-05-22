import React from 'react';
import { 
  X, 
  ChevronRight,
  Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
          className="fixed inset-0 bg-asphalt-950/70 backdrop-blur-lg z-[100]" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-asphalt-900 border border-asphalt-800 rounded-3xl shadow-2xl z-[101] overflow-hidden"
        >
          <div className="px-10 py-8 flex items-center justify-between border-b border-asphalt-800/40 bg-asphalt-900/50">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{title}</h3>
              <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mt-2 leading-none">Terminal de Operações</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-asphalt-800 rounded-xl transition-all active:scale-90 bg-asphalt-900 border border-asphalt-800 group">
              <X size={20} className="text-asphalt-700 group-hover:text-white" />
            </button>
          </div>
          <div className="p-10 max-h-[80vh] overflow-y-auto bg-asphalt-900/20 tracking-tight">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export const Input = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-2 mb-6 last:mb-0">
    <label className="text-[10px] font-black text-asphalt-700 uppercase tracking-[0.2em] block ml-1">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-asphalt-700 group-focus-within:text-brand-accent transition-colors" size={18} />}
      <input 
        {...props}
        className={cn(
          "w-full pr-6 py-5 bg-asphalt-950 border border-asphalt-800 focus:border-brand-accent rounded-2xl font-bold text-white outline-none transition-all placeholder:text-asphalt-800 text-sm shadow-inner",
          Icon ? "pl-16" : "pl-6"
        )}
      />
    </div>
  </div>
);

export const Select = ({ label, options, icon: Icon, ...props }: any) => (
  <div className="space-y-2 mb-6 last:mb-0">
    <label className="text-[10px] font-black text-asphalt-700 uppercase tracking-[0.2em] block ml-1">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-asphalt-700 group-focus-within:text-brand-accent pointer-events-none transition-colors" size={18} />}
      <select 
        {...props}
        className={cn(
          "w-full pr-12 py-5 bg-asphalt-950 border border-asphalt-800 focus:border-brand-accent rounded-2xl font-bold text-white outline-none transition-all appearance-none text-sm",
          Icon ? "pl-16" : "pl-6"
        )}
      >
        {(options || []).map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-asphalt-900">{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-asphalt-700">
        <ChevronRight className="rotate-90" size={18} />
      </div>
    </div>
  </div>
);

export const Textarea = ({ label, ...props }: any) => (
  <div className="space-y-2 mb-6 last:mb-0">
    <label className="text-[10px] font-black text-asphalt-700 uppercase tracking-[0.2em] block ml-1">{label}</label>
    <textarea 
      {...props}
      rows={4}
      className="w-full px-6 py-5 bg-asphalt-950 border border-asphalt-800 focus:border-brand-accent rounded-2xl font-bold text-white outline-none transition-all placeholder:text-asphalt-800 text-sm resize-none"
    />
  </div>
);

export const Button = ({ children, loading, variant = 'primary', ...props }: any) => (
  <button 
    disabled={loading}
    className={cn(
      "w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50",
      variant === 'primary' ? "bg-white text-asphalt-950 hover:bg-zinc-100 shadow-xl" : "bg-asphalt-800 text-zinc-100 hover:bg-asphalt-700 border border-asphalt-700"
    )}
    {...props}
  >
    {loading ? <Loader2 className="animate-spin" size={18} /> : children}
  </button>
);

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <div className="space-y-6">
      <p className="text-zinc-400 font-medium leading-relaxed">{message}</p>
      <div className="flex gap-4">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-black uppercase"
        >
          Confirmar Exclusão
        </Button>
      </div>
    </div>
  </Modal>
);
