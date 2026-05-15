import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Smartphone, 
  Monitor, 
  Download, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Apple, 
  Chrome,
  ExternalLink,
  SmartphoneIcon
} from 'lucide-react';
import { Button } from './UI';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  isInstallable: boolean;
}

export const InstallModal = ({ isOpen, onClose, onInstall, isInstallable }: InstallModalProps) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const isDesktop = !isIOS && !isAndroid;

  const downloadShortcut = () => {
    const appUrl = window.location.origin;
    const shortcutContent = `[InternetShortcut]\nURL=${appUrl}\nIDList=\nIconIndex=0\nIconFile=${appUrl}/logo_dm.svg`;
    const blob = new Blob([shortcutContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DM_Turismo_Pro.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-accent/10 rounded-2xl flex items-center justify-center border border-brand-accent/20">
                  <SmartphoneIcon className="text-brand-accent" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Instalar App Pro</h3>
                  <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em] mt-1">Terminal Executável (APK Mode)</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all"
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Context Summary */}
              <div className="bg-brand-accent/5 p-4 rounded-2xl border border-brand-accent/10">
                <p className="text-[10px] font-medium text-brand-accent uppercase tracking-widest text-center leading-relaxed">
                  Transforme o sistema em um aplicativo nativo no seu dispositivo. 
                  Sem barra de endereço, com ícone na tela e inicialização instantânea.
                </p>
              </div>

              {/* Option 1: Native Installation */}
              {isInstallable ? (
                <div className="bg-zinc-800/50 p-6 rounded-3xl border border-zinc-700/50 space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <span className="text-sm font-black text-white uppercase tracking-wider">Instalação Direta</span>
                  </div>
                  <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                    Seu sistema operacional suporta a instalação direta como Aplicativo Executável (Versão APK Digital).
                  </p>
                  <Button onClick={onInstall} className="bg-white text-zinc-950 w-full flex items-center justify-center gap-3 py-6 rounded-2xl group transition-all active:scale-95 shadow-xl hover:shadow-white/5">
                    <Download size={20} className="group-hover:animate-bounce" />
                    <span className="text-sm font-black uppercase">Baixar e Instalar APK Digital</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Option: Mobile Instructions */}
                  <div className="bg-zinc-800/50 p-6 rounded-3xl border border-zinc-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                        {isIOS ? <Apple size={16} /> : <Smartphone size={16} />}
                        {isIOS ? 'iPhone / iPad (App Store)' : 'Android (APK Digital)'}
                      </h4>
                      <span className="px-2 py-0.5 bg-brand-accent/10 text-[8px] font-black text-brand-accent rounded uppercase">Passo a Passo</span>
                    </div>
                    
                    <div className="space-y-4">
                      {isIOS ? (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800">
                             <Share size={18} className="text-brand-accent" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-black text-white uppercase tracking-tight">1. Baixar Estrutura</p>
                            <p className="text-[10px] font-medium text-zinc-500 leading-snug">Toque em Compartilhar no Safari para iniciar o download do atalho.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800">
                             <div className="flex flex-col gap-0.5">
                               {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-brand-accent rounded-full" />)}
                             </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-black text-white uppercase tracking-tight">1. Menu de Download</p>
                            <p className="text-[10px] font-medium text-zinc-500 leading-snug">Toque nos 3 pontos verticais do Chrome (Canto Superior).</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800">
                           <PlusSquare size={18} className="text-brand-accent" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-white uppercase tracking-tight">2. Criar Atalho Logo DM</p>
                          <p className="text-[10px] font-medium text-zinc-500 leading-snug">
                            Selecione <span className="text-white">"Adicionar à Tela de Início"</span>. O atalho aparecerá dinamicamente com o logo oficial da DM Turismo.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Windows/Desktop Instructions if not installable */}
                  {isDesktop && (
                    <div className="bg-zinc-800/30 p-6 rounded-3xl border border-dashed border-zinc-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Monitor size={16} />
                          <span className="text-xs font-black uppercase tracking-widest">Atalho Windows</span>
                        </div>
                        <span className="px-2 py-0.5 bg-zinc-800 text-[8px] font-black text-zinc-500 rounded uppercase">Alternativo</span>
                      </div>
                      <p className="text-zinc-500 text-[10px] font-medium leading-relaxed mb-4">
                        Se a instalação direta não estiver disponível, baixe o atalho executável para sua área de trabalho.
                      </p>
                      <Button onClick={downloadShortcut} variant="secondary" className="w-full border-zinc-700 hover:border-zinc-500 py-3 rounded-2xl flex items-center justify-center gap-2">
                        <Download size={14} />
                        <span className="text-xs">Baixar Atalho .URL</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Security Badge */}
              <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950 rounded-2xl border border-zinc-800/50">
                <Monitor size={16} className="text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-white uppercase tracking-wider">Multiplataforma</span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Windows • Android • iPhone</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-zinc-950/50 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                 Versão Digital Segura • DM Turismo Pro
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
