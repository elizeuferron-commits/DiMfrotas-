import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  User, 
  Trash2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './Cards';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Message {
  role: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export const AIConsultant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      text: 'Olá! Sou o assistente inteligente da DM Turismo. Como posso ajudar com a operação hoje?', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const speak = (text: string) => {
    if (!isVoiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (overrideText?: string) => {
    const text = overrideText || input;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await geminiService.generateText(text);
      const aiMsg: Message = { role: 'ai', text: responseText || 'Sem resposta.', timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      speak(aiMsg.text);
    } catch (error) {
      toast.error('Erro ao conectar com a IA');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Navegador não suporta voz.');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.onresult = (e: any) => {
        const t = e.results[0][0].transcript;
        setInput(t);
        handleSend(t);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }

    recognitionRef.current.start();
    setIsListening(true);
  };

  return (
    <div className={cn(
      "flex flex-col gap-6 transition-all duration-500",
      isMaximized ? "fixed inset-0 z-[60] bg-zinc-950 p-6 md:p-10" : "h-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.1)]">
            <Bot className="text-brand-accent w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
              Consultor <span className="text-brand-accent">IA</span> DM Pro
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Motor Gemini 3.0 Flash Ativo</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={cn(
              "p-2.5 rounded-xl transition-all border",
              isVoiceEnabled ? "bg-brand-accent text-zinc-950 border-brand-accent" : "bg-zinc-900 text-zinc-500 border-zinc-800"
            )}
          >
            {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button 
            onClick={() => setMessages([{ role: 'ai', text: 'Chat reiniciado. Como posso ajudar?', timestamp: new Date() }])}
            className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-500 rounded-xl transition-all"
          >
            <Trash2 size={18} />
          </button>
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all"
          >
            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 bg-zinc-900/30 border-zinc-800 p-0 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Sparkles size={200} className="text-brand-accent" />
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar"
        >
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={cn(
                "flex gap-4 max-w-[85%] md:max-w-[70%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                msg.role === 'ai' ? "bg-brand-accent text-zinc-950" : "bg-zinc-800 text-white border border-zinc-700"
              )}>
                {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={cn(
                "p-5 rounded-3xl text-xs md:text-sm leading-relaxed",
                msg.role === 'ai' 
                  ? "bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 text-zinc-100 rounded-tl-none glow-yellow" 
                  : "bg-brand-accent text-zinc-950 font-bold rounded-tr-none shadow-xl shadow-brand-accent/10"
              )}>
                {msg.text.split('\n').map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-3" : ""}>{line}</p>
                ))}
                <span className={cn(
                  "block text-[8px] mt-2 font-black uppercase opacity-50",
                  msg.role === 'user' ? "text-right" : ""
                )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-accent text-zinc-950 flex items-center justify-center animate-pulse">
                <Bot size={20} />
              </div>
              <div className="bg-zinc-800/80 p-5 rounded-3xl rounded-tl-none flex gap-1.5 items-center border border-zinc-700">
                <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-8 bg-zinc-950/50 border-t border-zinc-800">
          <div className="relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte sobre escalas, legislação ou gestão da frota..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-brand-accent rounded-2xl py-6 pl-8 pr-32 text-sm font-bold text-white transition-all outline-none placeholder:text-zinc-600 shadow-inner"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button 
                onClick={toggleMicrophone}
                className={cn(
                  "p-3 rounded-xl transition-all",
                  isListening ? "bg-rose-500 text-white animate-pulse" : "bg-zinc-800 text-zinc-500 hover:text-white"
                )}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-brand-accent text-zinc-950 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-accent/20 disabled:opacity-50 disabled:scale-100"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
              <Info size={12} />
              Proteção de Dados Ativa
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
              <RefreshCw size={12} className="animate-spin-slow" />
              Sincronização Cloud
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
