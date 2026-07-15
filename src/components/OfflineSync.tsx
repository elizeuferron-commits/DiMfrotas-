import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { offlineQueue, OfflineQueueItem } from '../services/offlineQueue';
import { toast } from 'sonner';

export const OfflineSync: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const [statusTimer, setStatusTimer] = useState<NodeJS.Timeout | null>(null);
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>(() => offlineQueue.getQueue());
  const [isSyncing, setIsSyncing] = useState(false);

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

    // Listen to offline queue updates
    const handleQueueChange = (e: Event) => {
      const customEvent = e as CustomEvent<OfflineQueueItem[]>;
      setQueueItems(customEvent.detail || offlineQueue.getQueue());
    };
    window.addEventListener('offline-queue-changed', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-changed', handleQueueChange);
      setStatusTimer(prev => {
        if (prev) clearTimeout(prev);
        return null;
      });
    };
  }, []);

  // Automatic background queue processing loop when online
  useEffect(() => {
    const pendingItems = queueItems.filter(item => item.status === 'pending' || item.status === 'failed');
    
    if (isOnline && pendingItems.length > 0 && !isSyncing) {
      const sync = async () => {
        setIsSyncing(true);
        const toastId = toast.loading('Sincronizando registros offline acumulados...');
        
        try {
          const { success, failed } = await offlineQueue.processQueue();
          toast.dismiss(toastId);
          
          if (success > 0) {
            toast.success(`${success} ${success === 1 ? 'registro sincronizado' : 'registros sincronizados'} com sucesso!`, {
              description: 'O estado global do aplicativo foi restabelecido.'
            });
          }
          if (failed > 0) {
            toast.warning(`Não foi possível sincronizar ${failed} registros. Tentando novamente mais tarde.`);
          }
        } catch (err) {
          toast.dismiss(toastId);
          console.error('Error during background offline sync:', err);
        } finally {
          setIsSyncing(false);
        }
      };

      // Gentle timeout to allow connection stability before firing database requests
      const timer = setTimeout(sync, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queueItems, isSyncing]);

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
            {(isOnline || isSyncing) && (
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

      {/* Persistent UI indicators for offline mode and pending items */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2 pointer-events-none">
        {queueItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-950/90 border border-amber-500/30 text-amber-500 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md pointer-events-auto"
          >
            <Smartphone size={14} className="text-amber-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                {queueItems.length} {queueItems.length === 1 ? 'Pendente' : 'Pendentes'}
              </span>
              <span className="text-[7px] text-zinc-500 font-bold uppercase mt-0.5">
                {isOnline ? 'Enviando ao servidor...' : 'Aguardando Conexão'}
              </span>
            </div>
            {isSyncing && (
              <RefreshCw size={10} className="animate-spin text-amber-500 ml-1" />
            )}
          </motion.div>
        )}

        {!isOnline && !showStatus && (
          <div className="bg-rose-500 text-zinc-950 px-4 py-3 rounded-2xl shadow-2xl border-2 border-zinc-950 flex items-center gap-2 pointer-events-auto">
            <WifiOff size={16} className="text-zinc-950" />
            <span className="text-[9px] font-black uppercase tracking-widest">Offline</span>
          </div>
        )}
      </div>
    </>
  );
};
