// DM Turismo Dashboard Component
import React, { useState, useEffect, useMemo, memo } from 'react';
import { 
  Cake, 
  MessageSquare, 
  Bell, 
  TrendingUp, 
  Bus, 
  Fuel, 
  Wrench,
  AlertTriangle,
  ChevronRight,
  Send,
  Clock,
  User as UserIcon,
  Plus,
  Sparkles,
  Share2,
  Camera,
  Upload,
  Newspaper,
  Maximize2,
  Trash2,
  Facebook,
  Instagram,
  Ghost,
  Bot as BotIcon,
  Smartphone,
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, isAfter, isBefore, parseISO, addDays, differenceInDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, StatCard } from './Cards';
import { cn } from '../lib/utils';
import { Employee, Vehicle, FuelLog, MaintenanceLog, Trip } from '../types';
import { ConfirmModal } from './UI';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, orderBy, limit, where, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';
import { generateAPKDigital, shareAppDirectly } from '../services/apkService';

interface DashboardProps {
  vehicles: Vehicle[];
  employees: Employee[];
  fuelLogs: FuelLog[];
  maintenance: MaintenanceLog[];
  trips: Trip[];
  user: any;
  setActiveSection: (id: string) => void;
  onViewTrip: (trip: Trip) => void;
  onShowInstall?: () => void;
  onUpdateEmployeePhoto?: (id: string, photoUrl: string) => Promise<void>;
}

export const Dashboard = ({ 
  vehicles, 
  employees, 
  fuelLogs, 
  maintenance, 
  trips,
  user,
  setActiveSection,
  onViewTrip,
  onShowInstall,
  onUpdateEmployeePhoto
}: DashboardProps) => {
  const [boardMessage, setBoardMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<{id: string, text: string, sender: string, timestamp: any}[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [mediaShares, setMediaShares] = useState<{id: string, url: string, type: 'image' | 'video', caption?: string, ownerName: string, createdAt: any}[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [newMedia, setNewMedia] = useState({ url: '', type: 'image' as 'image' | 'video', caption: '' });
  const [newsItems, setNewsItems] = useState<{id: string, title: string, content: string, imageUrl?: string, authorName: string, isUrgent?: boolean, createdAt: any}[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [newNews, setNewNews] = useState({ title: '', content: '', imageUrl: '', isUrgent: false });
  const [selectedVideo, setSelectedVideo] = useState<{url: string, title?: string} | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string, type: 'media' | 'news' | 'message'}>({
    isOpen: false,
    id: '',
    type: 'message'
  });
  
  const today = new Date();

  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isAdministrative = user?.role === 'Dono / Proprietário' || 
                          user?.role === 'Administrativo' || 
                          user?.role === 'admin' || 
                          user?.role === 'manager' ||
                          user?.email === 'elizeuferron@gmail.com';

  const isVisitor = user?.role === 'Visitante';
  const visitorExpired = useMemo(() => {
    if (!isVisitor || !user?.createdAt) return false;
    const createdDate = user.createdAt.toDate ? user.createdAt.toDate() : parseISO(user.createdAt);
    return differenceInDays(new Date(), createdDate) > 15;
  }, [user, isVisitor]);

  const canShare = isAdministrative && !isVisitor && !visitorExpired;

  const videoShares = useMemo(() => mediaShares.filter(m => m.type === 'video').slice(0, 4), [mediaShares]);
  const imageShares = useMemo(() => mediaShares.filter(m => m.type === 'image'), [mediaShares]);

  // Sync Global Dashboard Message (Notice Board)
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, 'settings', 'dashboard'), (docSnap) => {
      if (docSnap.exists()) {
        setBoardMessage(docSnap.data().message || '');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/dashboard');
    });

    const messagesQuery = query(
      collection(db, 'dashboard_messages'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

      const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = (snapshot.docs || []).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setMessages(msgs);
      setLoadingMessages(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'dashboard_messages');
    });

    const mediaQuery = query(
      collection(db, 'media_shares'),
      orderBy('createdAt', 'desc'),
      limit(12)
    );

    const unsubMedia = onSnapshot(mediaQuery, (snapshot) => {
      const media = (snapshot.docs || [])
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((item: any) => !item.deleted) as any[];
      setMediaShares(media);
      setLoadingMedia(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'media_shares');
    });

    const newsQuery = query(
      collection(db, 'news_feed'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubNews = onSnapshot(newsQuery, (snapshot) => {
      const news = (snapshot.docs || [])
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((item: any) => !item.deleted) as any[];
      setNewsItems(news);
      setLoadingNews(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'news_feed');
    });

    return () => {
      unsub();
      unsubMessages();
      unsubMedia();
      unsubNews();
    };
  }, [user?.uid]);

  const handleShareNews = async () => {
    if (!newNews.title.trim() || !newNews.content.trim()) {
      toast.error('Título e conteúdo são obrigatórios.');
      return;
    }

    try {
      await setDoc(doc(collection(db, 'news_feed')), {
        ...newNews,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Admin',
        createdAt: serverTimestamp()
      });
      setNewNews({ title: '', content: '', imageUrl: '', isUrgent: false });
      setIsAddingNews(false);
      toast.success('Notícia publicada com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'news_feed');
    }
  };

  const handleShareMedia = async () => {
    if (!newMedia.url.trim()) {
      toast.error('Por favor, informe a URL ou selecione um arquivo.');
      return;
    }

    try {
      await setDoc(doc(collection(db, 'media_shares')), {
        ...newMedia,
        ownerId: user.uid,
        ownerName: user.displayName || user.email || 'Admin',
        createdAt: serverTimestamp()
      });
      setNewMedia({ url: '', type: 'image', caption: '' });
      setIsAddingMedia(false);
      toast.success('Mídia compartilhada com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'media_shares');
    }
  };

  const processDelete = async () => {
    const { id, type } = deleteConfirm;
    try {
      if (type === 'media') {
        await deleteDoc(doc(db, 'media_shares', id));
        toast.success('Mídia removida definitivamente!');
      } else if (type === 'news') {
        await deleteDoc(doc(db, 'news_feed', id));
        toast.success('Notícia excluída definitivamente!');
      } else if (type === 'message') {
        await deleteDoc(doc(db, 'dashboard_messages', id));
        toast.success('Mensagem removida.');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${type}/${id}`);
    }
  };

  const handleDeleteMedia = (id: string) => {
    setDeleteConfirm({ isOpen: true, id, type: 'media' });
  };

  const handleDeleteNews = (id: string) => {
    setDeleteConfirm({ isOpen: true, id, type: 'news' });
  };

  const handleDeleteMessage = (id: string) => {
    setDeleteConfirm({ isOpen: true, id, type: 'message' });
  };

  const handleSocialShare = (type: string, url: string, caption?: string) => {
    const text = encodeURIComponent(caption || 'Confira este momento da DM Turismo!');
    const shareUrl = encodeURIComponent(url);
    
    let platformUrl = '';
    switch(type) {
      case 'facebook':
        platformUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case 'whatsapp':
        platformUrl = `https://wa.me/?text=${text}%20${shareUrl}`;
        break;
      default:
        if (navigator.share) {
          navigator.share({
            title: 'DM Turismo',
            text: caption,
            url: url
          }).catch((err) => {
            if (err.name !== 'AbortError') {
              console.error('Share error:', err);
              toast.error('Não foi possível compartilhar via sistema nativo.');
            }
          });
          return;
        }
    }
    
    if (platformUrl) window.open(platformUrl, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('O arquivo é muito grande. Máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMedia({ ...newMedia, url: reader.result as string, type: file.type.startsWith('video') ? 'video' : 'image' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await setDoc(doc(collection(db, 'dashboard_messages')), {
        text: newMessage,
        sender: user?.displayName || user?.email || 'Sistema',
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'dashboard_messages');
    }
  };

  // Active drivers calculation based on trips
  const activeDriversCount = useMemo(() => {
    return new Set((trips || []).filter(t => t.status === 'active').map(t => t.driverId)).size;
  }, [trips]);

  // Memoized Birthday logic
  const { monthBirthdays, todayBirthdays } = useMemo(() => {
    const currentMonth = today.getMonth();

    const birthdayData = (employees || [])
      .filter(emp => emp.birthDate && emp.status === 'active')
      .map(emp => {
        const birth = parseISO(emp.birthDate!);
        const thisYearBirth = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        
        let nextBirth = thisYearBirth;
        if (isBefore(thisYearBirth, today) && !isSameDay(thisYearBirth, today)) {
          nextBirth = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
        }
        
        return { 
          ...emp, 
          birthMonth: birth.getMonth(),
          daysUntil: differenceInDays(nextBirth, today),
          isToday: isSameDay(thisYearBirth, today)
        };
      });

    return {
      monthBirthdays: birthdayData
        .filter(emp => emp.birthMonth === currentMonth)
        .sort((a, b) => a.daysUntil - b.daysUntil),
      todayBirthdays: birthdayData.filter(emp => emp.isToday)
    };
  }, [employees, today]);



  return (
    <div className="space-y-10 pb-20">
      {/* Modal de Vídeo */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-sm pointer-events-auto"
            onClick={() => setSelectedVideo(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-6xl aspect-video bg-zinc-900 rounded-[2.5rem] overflow-hidden relative z-10 border border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] pointer-events-auto"
          >
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-6 right-6 z-20 w-12 h-12 bg-zinc-950/50 hover:bg-zinc-950 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
            >
              <Plus size={24} className="rotate-45" />
            </button>
            
            {selectedVideo.url.includes('youtube.com') || selectedVideo.url.includes('youtu.be') ? (
               <iframe 
                src={`https://www.youtube.com/embed/${selectedVideo.url.split('/').pop()?.split('=')[1] || selectedVideo.url.split('/').pop()}?autoplay=1`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
               />
            ) : (
              <video src={selectedVideo.url} className="w-full h-full" controls autoPlay playsInline />
            )}
            
            {(selectedVideo.title) && (
              <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                 <p className="text-white font-black uppercase tracking-widest text-sm">{selectedVideo.title}</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Visitor Expiration Alert */}
      {isVisitor && visitorExpired && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-zinc-950 border-2 border-brand-accent/50 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-brand-accent/5 opacity-5 animate-pulse" />
          <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent mb-2">
             <Ghost size={32} className="animate-bounce" />
          </div>
          <div className="space-y-1">
             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Acesso Expirado</h2>
             <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest max-w-md">Seu período experimental de 15 dias como Visitante chegou ao fim. Entre em contato com a gestão para liberar um acesso permanente.</p>
          </div>
          <button 
            onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
            className="px-8 py-3 bg-brand-accent text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-brand-accent/20"
          >
            Falar com Atendimento
          </button>
        </motion.div>
      )}

      {/* Birthday Celebration Banner */}
      {todayBirthdays.length > 0 && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 shadow-[0_20px_50px_rgba(16,185,129,0.3)] border border-white/20"
        >
          {/* Festive Background Decorations */}
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Cake size={200} className="text-white rotate-12" />
          </div>
          <div className="absolute bottom-0 left-0 p-8 opacity-10 pointer-events-none">
            <Sparkles size={120} className="text-white -rotate-12" />
          </div>
          
          {/* Animated Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-white/20"
                initial={{ 
                  x: Math.random() * 100 + '%', 
                  y: -20, 
                  scale: Math.random() * 0.5 + 0.5 
                }}
                animate={{ 
                  y: ['0%', '100%'],
                  x: [
                    (Math.random() * 100) + '%', 
                    (Math.random() * 100) + '%'
                  ],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: Math.random() * 5 + 5, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 5
                }}
                style={{
                  backgroundColor: ['#fff', '#fbbf24', '#34d399', '#f472b6'][Math.floor(Math.random() * 4)] + '40'
                }}
              />
            ))}
          </div>

          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
            <div className="flex -space-x-8">
              {todayBirthdays.map((emp, idx) => (
                <motion.div 
                  key={emp.id}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative z-10"
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden bg-zinc-900 group relative">
                    {emp.photoUrl ? (
                      <img 
                        src={emp.photoUrl} 
                        alt={emp.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                        <label className="cursor-pointer flex flex-col items-center gap-1 group/btn">
                          <Plus size={32} className="text-zinc-600 group-hover/btn:text-white transition-colors" />
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter group-hover/btn:text-white transition-colors">ADD FOTO</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  onUpdateEmployeePhoto(emp.id, reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                       <span className="text-[8px] font-black text-white uppercase truncate">{emp.name.split(' ')[0]}</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-brand-accent text-zinc-950 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transform rotate-12 border-2 border-white">
                    <Cake size={16} />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/20 rounded-full backdrop-blur-md border border-white/10">
                <Sparkles size={12} className="text-amber-300 animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Homenagem do Dia</span>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none drop-shadow-lg">
                  Parabéns!
                </h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-x-2 gap-y-1">
                  {todayBirthdays.map((e, idx) => (
                    <span key={e.id} className="text-emerald-50 font-bold uppercase tracking-widest text-sm md:text-lg">
                      {e.name}{idx < todayBirthdays.length - 1 ? " • " : ""}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-emerald-100/80 font-medium text-xs md:text-sm max-w-xl">
                Desejamos muita saúde, felicidade e sucesso para quem faz a nossa frota seguir em frente todos os dias. <b>A DM Turismo celebra com você!</b>
              </p>
            </div>

            <div className="hidden lg:block shrink-0">
               <motion.div 
                 animate={{ 
                   scale: [1, 1.1, 1],
                   rotate: [0, 5, -5, -0]
                 }}
                 transition={{ repeat: Infinity, duration: 4 }}
                 className="p-8 bg-white/10 rounded-[3rem] backdrop-blur-xl border border-white/20 shadow-2xl relative"
               >
                 <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg rotate-12">
                    <Sparkles size={24} className="text-zinc-950" />
                 </div>
                 <Cake size={64} className="text-white" />
               </motion.div>
            </div>
          </div>
        </motion.div>
      )}

  // Hero Welcome
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-asphalt-900/40 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group backdrop-blur-sm">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
           <img 
             src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=1000" 
             alt="Bus Decoration" 
             className="w-full h-full object-contain object-right"
           />
        </div>

        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full">
            <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse shadow-brand" />
            <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest leading-none">Painel de Controle Ativo</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter font-display leading-none">
              BEM-VINDO, <span className="text-brand-accent italic">{user?.displayName?.split(' ')[0] || 'GESTOR'}</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 pt-2">
              <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px] opacity-70">
                {format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <div className="flex items-center gap-3 bg-zinc-950/50 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md">
                <Clock size={14} className="text-brand-accent animate-pulse" />
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white tabular-nums tracking-tighter">
                    {format(currentTime, "HH:mm")}
                  </span>
                  <span className="text-[10px] font-black text-brand-accent tabular-nums uppercase">
                    {format(currentTime, "ss")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 relative z-10">
          <div className="flex items-center gap-4 bg-asphalt-950/80 backdrop-blur-2xl border border-white/5 p-5 rounded-[1.5rem] shadow-2xl glass-effect">
             <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <Bus size={24} className="text-emerald-500" />
             </div>
             <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Status Frota</p>
                <p className="text-sm font-black text-white uppercase tracking-tight">{vehicles.length} Veículos Ativos</p>
             </div>
          </div>

          {onShowInstall && (
            <button 
              onClick={onShowInstall}
              className="flex items-center gap-4 bg-zinc-900 hover:bg-zinc-800 text-white p-5 rounded-[1.5rem] shadow-2xl transition-all hover:scale-105 active:scale-95 group/help border border-white/5"
            >
               <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-brand-accent">
                  <BotIcon size={24} className="group-hover/help:animate-bounce" />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Ajuda Fácil</p>
                  <p className="text-sm font-black uppercase tracking-tight">Como Instalar?</p>
               </div>
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Motoristas Ativos" 
          value={activeDriversCount}
          icon={UserIcon}
          trend={`${activeDriversCount} em operação`}
          color="bg-emerald-500"
          glow="hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]"
        />
        <StatCard 
          title="Consumo Médio" 
          value="2.8 km/l" 
          icon={Fuel} 
          trend="-4.2%" 
          color="bg-brand-accent"
          glow="hover:shadow-[0_0_40px_rgba(255,107,0,0.2)]"
        />
        <StatCard 
          title="Manutenções" 
          value={maintenance.filter(m => m.status === 'pending').length} 
          icon={Wrench} 
          trend="Pendentes" 
          color="bg-rose-500" 
          glow="hover:shadow-[0_0_40px_rgba(244,63,94,0.2)]"
        />
        <StatCard 
          title="Viagens Ativas" 
          value={trips.filter(t => t.status === 'active').length} 
          icon={TrendingUp} 
          trend="Em curso" 
          color="bg-blue-500"
          glow="hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]"
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded-xl border border-brand-accent/20">
              <Newspaper className="text-brand-accent" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest font-display">Feed DM Turismo</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tight mt-1 opacity-70">Notícias oficiais e momentos compartilhados</p>
            </div>
          </div>
          {canShare && (
            <div className="flex gap-3">
              <button 
                onClick={() => setIsAddingNews(!isAddingNews)}
                className="flex items-center gap-2 px-5 py-2.5 bg-asphalt-900 border border-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-asphalt-800 active:scale-95 shadow-xl glass-effect"
              >
                {isAddingNews ? <Plus size={14} className="rotate-45" /> : <Newspaper size={14} />}
                Notícia
              </button>
              <button 
                onClick={() => setIsAddingMedia(!isAddingMedia)}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-asphalt-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-brand-accent/20 travel-button"
              >
                {isAddingMedia ? <Plus size={14} className="rotate-45" /> : <Camera size={14} />}
                Mídia
              </button>
            </div>
          )}
        </div>

        {isAddingNews && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-zinc-900 border border-zinc-800 rounded-[3rem] space-y-6 shadow-2xl relative"
          >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Título da Notícia</label>
                 <input 
                  type="text"
                  value={newNews.title}
                  onChange={(e) => setNewNews({...newNews, title: e.target.value})}
                  placeholder="EX: Nova Unidade em São Paulo Inaugurada..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-accent transition-all pl-12"
                 />
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">URL da Imagem (Opcional)</label>
                 <input 
                  type="text"
                  value={newNews.imageUrl}
                  onChange={(e) => setNewNews({...newNews, imageUrl: e.target.value})}
                  placeholder="https://imagem.da.noticia.jpg"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-accent transition-all"
                 />
                 <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="checkbox" 
                      id="urgent"
                      checked={newNews.isUrgent}
                      onChange={(e) => setNewNews({...newNews, isUrgent: e.target.checked})}
                      className="w-4 h-4 accent-amber-500" 
                    />
                    <label htmlFor="urgent" className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Notícia Urgente?</label>
                 </div>
               </div>
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Conteúdo</label>
                 <textarea 
                  value={newNews.content}
                  onChange={(e) => setNewNews({...newNews, content: e.target.value})}
                  placeholder="Detalhes da notícia..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-xs font-bold text-white h-[180px] resize-none transition-all focus:border-brand-accent"
                 />
               </div>
             </div>
             <div className="flex justify-end pt-4 border-t border-zinc-800">
               <button 
                onClick={handleShareNews}
                className="px-12 py-4 bg-brand-accent text-zinc-950 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-brand-accent/20"
               >Publicar Notícia</button>
             </div>
          </motion.div>
        )}

        {/* Global News Section */}
        {newsItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {newsItems.map((news) => (
                <motion.div 
                  key={news.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className={cn(
                    "bg-asphalt-900/60 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col group hover:border-brand-accent/30 transition-all backdrop-blur-sm",
                    news.isUrgent && "border-amber-500/30 bg-amber-500/5 shadow-[0_0_50px_rgba(245,158,11,0.05)]"
                  )}
                >
                  {news.imageUrl && (
                    <div className="h-48 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                       <img 
                        src={news.imageUrl} 
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                       />
                    </div>
                  )}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[8px] font-black text-sky-blue uppercase tracking-[0.2em] opacity-70">Informativo DM</span>
                       <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                         {news.createdAt ? format(news.createdAt.toDate(), "dd/MM/yyyy") : 'Agora'}
                       </span>
                    </div>
                    {news.isUrgent && (
                      <div className="mb-4 flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full w-fit border border-amber-500/20">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-amber" />
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Urgente</span>
                      </div>
                    )}
                    <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-4 group-hover:text-brand-accent transition-colors font-display leading-tight">
                      {news.title}
                    </h4>
                    <p className="text-[13px] text-zinc-400 font-medium leading-relaxed line-clamp-4 flex-1">
                      {news.content}
                    </p>
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-asphalt-950 flex items-center justify-center border border-white/5 overflow-hidden shadow-inner">
                             <UserIcon size={14} className="text-zinc-600" />
                          </div>
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{news.authorName}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          {(isAdministrative || (user && news.authorId === user.uid)) && (
                            <button 
                              onClick={() => handleDeleteNews(news.id)}
                              className="p-2 text-zinc-700 hover:text-rose-500 transition-colors bg-asphalt-950 rounded-lg border border-white/5"
                              title="Excluir Notícia"
                            >
                               <Trash2 size={16} />
                            </button>
                          )}
                       </div>
                    </div>
                  </div>
                </motion.div>
             ))}
          </div>
        )}

        {/* Vídeos em Destaque (Limite 4) */}
        {videoShares.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-brand-accent/10 rounded-xl">
                 <Camera className="text-brand-accent" size={20} />
               </div>
               <h3 className="text-sm font-black text-white uppercase tracking-widest">Vídeos em Destaque</h3>
               <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Máximo 4 registros</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {videoShares.map((video) => (
                 <motion.div 
                   key={video.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-zinc-950/60 border border-zinc-800 rounded-[2rem] overflow-hidden group hover:border-brand-accent/40 transition-all shadow-2xl relative"
                 >
                   <div className="aspect-video bg-black relative group/video">
                      {video.url.includes('youtube.com') || video.url.includes('youtu.be') ? (
                         <div className="w-full h-full cursor-pointer" onClick={() => setSelectedVideo({ url: video.url, title: video.caption })}>
                            <img 
                              src={`https://img.youtube.com/vi/${video.url.split('/').pop()?.split('=')[1] || video.url.split('/').pop()}/maxresdefault.jpg`} 
                              className="w-full h-full object-cover opacity-60 group-hover/video:opacity-40 transition-opacity"
                              alt="Thumbnail"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                               <div className="w-12 h-12 bg-brand-accent rounded-full flex items-center justify-center text-zinc-950 shadow-2xl group-hover/video:scale-110 transition-transform">
                                  <ChevronRight size={24} className="ml-1" />
                               </div>
                            </div>
                         </div>
                      ) : (
                        <div className="w-full h-full cursor-pointer" onClick={() => setSelectedVideo({ url: video.url, title: video.caption })}>
                          <video src={video.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-12 h-12 bg-brand-accent rounded-full flex items-center justify-center text-zinc-950 shadow-2xl group-hover/video:scale-110 transition-transform">
                                <ChevronRight size={24} className="ml-1" />
                             </div>
                          </div>
                        </div>
                      )}
                   </div>
                   <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">{video.ownerName}</span>
                         <span className="text-[8px] font-bold text-zinc-600 uppercase">
                            {video.createdAt ? format(video.createdAt.toDate(), "dd/MM") : 'Agora'}
                         </span>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-400 line-clamp-2">{video.caption || 'Sem legenda'}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                         <div className="flex gap-2">
                            <button 
                              onClick={() => handleSocialShare('whatsapp', video.url, video.caption)}
                              className="p-1.5 bg-zinc-900 rounded-lg text-zinc-500 hover:text-emerald-500 transition-colors"
                            >
                               <Share2 size={12} />
                            </button>
                         </div>
                         {(isAdministrative || (user && video.ownerId === user.uid)) && (
                            <button 
                              onClick={() => handleDeleteMedia(video.id)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                               <Trash2 size={12} />
                               Excluir
                            </button>
                         )}
                      </div>
                   </div>
                 </motion.div>
               ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-900 pt-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-brand-accent/10 rounded-xl">
               <Camera className="text-brand-accent" size={20} />
             </div>
             <h3 className="text-sm font-black text-white uppercase tracking-widest">Mural de Fotos</h3>
          </div>
        </div>

        {isAddingMedia && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-zinc-900 border border-zinc-800 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Share2 size={120} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Upload ou Link Direto</label>
                <div className="flex flex-col gap-4">
                   <div className="relative group">
                      <input 
                        type="text"
                        value={newMedia.url}
                        onChange={(e) => setNewMedia({...newMedia, url: e.target.value})}
                        placeholder="Link da imagem ou vídeo (YouTube/Vimeo)..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-accent transition-all pl-12 shadow-inner"
                      />
                      <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="h-px flex-1 bg-zinc-800" />
                     <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">OU</span>
                     <div className="h-px flex-1 bg-zinc-800" />
                   </div>
                   <label className="flex items-center justify-center gap-3 p-6 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl cursor-pointer hover:border-brand-accent/50 transition-all group shadow-inner">
                      <Upload size={20} className="text-zinc-600 group-hover:text-brand-accent transition-colors" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] group-hover:text-white">Selecionar Arquivo do Dispositivo</span>
                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                   </label>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Legenda / Descrição</label>
                <textarea 
                  value={newMedia.caption}
                  onChange={(e) => setNewMedia({...newMedia, caption: e.target.value})}
                  placeholder="Escreva algo sobre este momento com a frota..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-xs font-bold text-white h-[140px] resize-none transition-all focus:border-brand-accent shadow-inner"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-6 border-t border-zinc-800/50">
               <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-2xl border border-zinc-800">
                 <button 
                  onClick={() => setNewMedia({...newMedia, type: 'image'})}
                  className={cn("px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", newMedia.type === 'image' ? "bg-brand-accent text-zinc-950 shadow-lg" : "text-zinc-600 hover:text-white")}
                 >Imagem</button>
                 <button 
                  onClick={() => setNewMedia({...newMedia, type: 'video'})}
                  className={cn("px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all", newMedia.type === 'video' ? "bg-brand-accent text-zinc-950 shadow-lg" : "text-zinc-600 hover:text-white")}
                 >Vídeo</button>
               </div>
               <button 
                onClick={handleShareMedia}
                className="w-full sm:w-auto px-12 py-4 bg-brand-accent text-zinc-950 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-brand-accent/20 active:scale-95"
               >Publicar no Mural</button>
            </div>
          </motion.div>
        )}

        <div className="flex items-start gap-6 overflow-x-auto pb-8 custom-scrollbar snap-x snap-mandatory">
          {loadingMedia ? (
            <div className="flex gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-80 h-96 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] animate-pulse shrink-0" />
              ))}
            </div>
          ) : imageShares.length > 0 ? (
            imageShares.map((media) => (
              <motion.div 
                key={media.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-80 h-[450px] bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shrink-0 overflow-hidden relative group snap-start border-zinc-800/50 hover:border-brand-accent/30 transition-all shadow-2xl"
              >
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                   <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                   <span className="text-[8px] font-black text-white uppercase tracking-widest">IMAGEM</span>
                </div>

                <div className="h-2/3 bg-zinc-950 relative overflow-hidden">
                  <img 
                    src={media.url} 
                    alt={media.caption} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="text-[10px] font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-brand-accent/10 flex items-center justify-center">
                          <UserIcon size={12} />
                        </div>
                        {media.ownerName}
                      </div>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                        {media.createdAt ? format(media.createdAt.toDate(), "dd 'de' MMM", { locale: ptBR }) : 'Agora'}
                      </p>
                  </div>
                  
                  <p className="text-sm font-semibold text-zinc-300 line-clamp-3 leading-relaxed">
                    {media.caption || 'Celebrando as conquistas da nossa frota!'}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                     <div className="flex items-center gap-2">
                       <button 
                        onClick={() => handleSocialShare('whatsapp', media.url, media.caption)}
                        className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-500 hover:text-emerald-500 transition-all shadow-lg"
                        title="Compartilhar no WhatsApp"
                       >
                          <Share2 size={14} />
                       </button>
                       <button 
                        onClick={() => handleSocialShare('facebook', media.url, media.caption)}
                        className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-500 hover:text-blue-500 transition-all shadow-lg"
                        title="Compartilhar no Facebook"
                       >
                          <Facebook size={14} />
                       </button>
                     </div>

                     {(isAdministrative || (user && media.ownerId === user.uid)) && (
                        <button 
                          onClick={() => handleDeleteMedia(media.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
                        >
                           <Trash2 size={14} />
                           Excluir
                        </button>
                     )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="w-full py-24 flex flex-col items-center justify-center bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-[3.5rem] text-center space-y-6">
              <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] flex items-center justify-center border border-zinc-800 shadow-xl">
                 <Camera size={40} className="text-zinc-800" />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em]">Mural de Momentos Vazio</p>
                <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Os melhores registros da DM Turismo aparecerão neste feed</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Notice Board & Messages */}
        <Card className="lg:col-span-2 bg-zinc-900/60 border-zinc-800 p-0 overflow-hidden flex flex-col h-[500px]">
          <div className="p-8 border-b border-zinc-800 bg-zinc-950/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-accent/10 rounded-xl">
                <MessageSquare className="text-brand-accent" size={20} />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Painel de Mensagens</h3>
            </div>
            <div className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full">
              <span className="text-[10px] font-black text-zinc-500 uppercase">Tempo Real</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <UserIcon size={18} className="text-zinc-500" />
                  </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white uppercase tracking-tight">{msg.sender}</span>
                          {isAdministrative && (
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-rose-500 transition-all"
                              title="Excluir Mensagem"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                        <span className="text-[9px] font-black text-zinc-600 uppercase">
                          {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : 'Agora'}
                        </span>
                      </div>
                      <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl rounded-tl-none group-hover:border-zinc-700 transition-colors">
                        <p className="text-sm text-zinc-300 font-medium leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-950 rounded-3xl flex items-center justify-center">
                  <MessageSquare size={32} className="text-zinc-800" />
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-10">Use o campo abaixo para deixar lembretes ou comunicações para a equipe.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-6 bg-zinc-950 border-t border-zinc-800">
            <div className="relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="DIGITE UMA MENSAGEM PARA O PAINEL..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-6 pr-16 text-xs font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:border-brand-accent/50 transition-all uppercase tracking-wider"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-brand-accent hover:bg-white text-zinc-950 rounded-xl transition-all shadow-lg flex items-center justify-center active:scale-90"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </Card>

        {/* Birthday Reminders */}
        <Card className="bg-zinc-900/60 border-zinc-800 p-8 h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                 <Cake className="text-emerald-500" size={20} />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Aniversariantes do Dia</h3>
            </div>
            <div className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Hoje</span>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2">
            {todayBirthdays.length > 0 ? (
              todayBirthdays.map((emp) => (
                <div key={emp.id} className="relative group p-1">
                   <div className="flex items-center gap-4 p-4 rounded-2xl transition-all border bg-emerald-500 text-white border-white/20 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02]">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden bg-zinc-900 border border-zinc-800 relative group/photo">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon size={20} className="text-zinc-600" />
                      )}
                      
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                        <Camera size={16} className="text-white" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && onUpdateEmployeePhoto) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                onUpdateEmployeePhoto(emp.id, reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-tight truncate text-white">{emp.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">{emp.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="px-2 py-1 bg-white/20 rounded text-[9px] font-black text-white uppercase tracking-tighter">PARABÉNS!</div>
                    </div>
                   </div>
                   <div className="absolute -top-2 -right-2">
                      <Sparkles size={24} className="text-white animate-pulse" />
                   </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-950 rounded-3xl flex items-center justify-center border border-zinc-800">
                  <Cake size={32} className="text-zinc-800" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Nenhum aniversário hoje.</p>
                   <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest mt-2">{format(today, 'MMMM', { locale: ptBR })}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800">
             <button 
               onClick={() => setActiveSection('staff')}
               className="w-full py-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition-all text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] flex items-center justify-center gap-2"
             >
                Ver Toda Equipe
                <ChevronRight size={14} />
             </button>
          </div>
        </Card>
      </div>
      
      {/* OS Summary Section - Button Grid */}
      <Card className="bg-zinc-900/60 border-zinc-800 p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-accent/10 rounded-xl">
              <TrendingUp className="text-brand-accent" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Painel de Ordens de Serviço</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight mt-1">Status operacional em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 mr-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[8px] font-black text-zinc-500 uppercase">Em Curso</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[8px] font-black text-zinc-500 uppercase">Próx. 7 Dias</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[8px] font-black text-zinc-500 uppercase">Futuras</span></div>
            </div>
            <button 
              onClick={() => setActiveSection('os')}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-all italic"
            >
              Ver Todas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(trips || []).length > 0 ? (
            (trips || [])
              .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
              .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
              .slice(0, 12)
              .map((trip) => {
                const driver = employees.find(e => e.id === trip.driverId);
                const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                const startDate = parseISO(trip.startDate);
                const diffDays = differenceInDays(startDate, new Date());
                
                let bgColor = "border-blue-500/20 hover:border-blue-500 bg-blue-500/5";
                let accentColor = "text-blue-500";
                let indicator = "bg-blue-500";
                
                if (trip.status === 'active') {
                  bgColor = "border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5";
                  accentColor = "text-emerald-500";
                  indicator = "bg-emerald-500";
                } else if (diffDays <= 7) {
                  bgColor = "border-amber-500/20 hover:border-amber-500 bg-amber-500/5";
                  accentColor = "text-amber-500";
                  indicator = "bg-amber-500";
                }

                return (
                  <button 
                    key={trip.id}
                    onClick={() => onViewTrip(trip)}
                    className={cn(
                      "flex flex-col p-4 rounded-2xl border transition-all text-left group relative overflow-hidden",
                      bgColor
                    )}
                  >
                    <div className={cn("absolute top-0 right-0 w-16 h-16 opacity-5 pointer-events-none -mr-4 -mt-4", indicator)} style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", accentColor)}>
                        {trip.status === 'active' ? 'EM REALIZAÇÃO' : `EM ${diffDays <= 0 ? 'HOJE' : diffDays + ' DIAS'}`}
                      </span>
                      <div className={cn("w-1.5 h-1.5 rounded-full", indicator, trip.status === 'active' && "animate-pulse")} />
                    </div>

                    <h4 className="text-white font-black text-xs uppercase mb-1 truncate group-hover:text-brand-accent transition-colors">
                      {trip.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-black text-white italic">{vehicle?.plate || 'S/ PLACA'}</span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">| {format(startDate, 'dd/MM/yy')}</span>
                    </div>

                    <div className="mt-auto pt-3 border-t border-zinc-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-zinc-950 flex items-center justify-center text-zinc-600">
                          <UserIcon size={10} />
                        </div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase truncate max-w-[100px]">
                          {driver?.name.split(' ')[0] || 'S/ MOTORISTA'}
                        </span>
                      </div>
                      <Plus size={12} className="text-zinc-700 group-hover:text-brand-accent transition-colors" />
                    </div>
                  </button>
                );
              })
          ) : (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
              <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">Nenhuma Ordem de Serviço ativa ou agendada.</p>
            </div>
          )}
        </div>
      </Card>

      <ConfirmModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={processDelete}
        title="Confirmar Exclusão"
        message={`Você tem certeza que deseja excluir este item definitivamente? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};
