import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export const OfflineSync: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const [statusTimer, setStatusTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 5000);
      setStatusTimer(prev => {
        if (prev) clearTimeout(prev);
        return timer;
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
      setStatusTimer(prev => {
        if (prev) clearTimeout(prev);
        return null;
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      setStatusTimer(prev => {
        if (prev) clearTimeout(prev);
        return null;
      });
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {showStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl border backdrop-blur-xl",
              isOnline 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-500"
            )}
          >
            {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isOnline ? 'Conexão Restaurada' : 'Modo Offline Ativo'}
              </span>
              <span className="text-[8px] font-bold opacity-70 uppercase tracking-tight">
                {isOnline ? 'Sincronização em tempo real ativa' : 'Dados serão salvos localmente'}
              </span>
            </div>
            {isOnline && (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="ml-2"
              >
                <RefreshCw size={14} />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isOnline && !showStatus && (
        <div className="fixed bottom-6 right-6 z-[100]">
           <div className="bg-rose-500 text-white p-3 rounded-full shadow-2xl border-2 border-zinc-950 animate-pulse flex items-center gap-2 pr-4">
              <WifiOff size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Offline</span>
           </div>
        </div>
      )}
    </>
  );
};
