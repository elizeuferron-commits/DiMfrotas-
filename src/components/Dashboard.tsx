// DM Turismo Dashboard Component
import React, { useState, useEffect, useMemo, memo } from 'react';
import ReactPlayer from 'react-player';
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
  Play,
  X,
  Link as LinkIcon,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, isBefore, parseISO, addDays, differenceInDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, StatCard } from './Cards';
import { cn } from '../lib/utils';
import { Employee, Vehicle, FuelLog, MaintenanceLog, Trip } from '../types';
import { ConfirmModal } from './UI';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, orderBy, limit, where, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';
import { FeaturedVideosSection } from './FeaturedVideosSection';

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
  onVehicleClick?: (vehicle: Vehicle) => void;
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
  onUpdateEmployeePhoto,
  onVehicleClick
}: DashboardProps) => {
  const [boardMessage, setBoardMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<{id: string, text: string, sender: string, timestamp: any}[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [mediaShares, setMediaShares] = useState<{id: string, url: string, type: 'image' | 'video', caption?: string, ownerName: string, ownerId: string, createdAt: any}[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [newMedia, setNewMedia] = useState({ url: '', type: 'image' as 'image' | 'video', caption: '' });
  const [newsItems, setNewsItems] = useState<{id: string, title: string, content: string, imageUrl?: string, authorName: string, authorId: string, isUrgent?: boolean, createdAt: any}[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [newNews, setNewNews] = useState({ title: '', content: '', imageUrl: '', isUrgent: false });
  const [selectedVideo, setSelectedVideo] = useState<{url: string, title?: string} | null>(null);
  const [modalVideoPlaying, setModalVideoPlaying] = useState(false);
  
  // Close video modal safely by stopping playback first
  const handleCloseVideoModal = () => {
    setModalVideoPlaying(false);
    setTimeout(() => {
      setSelectedVideo(null);
    }, 100); // Small delay to let player state settle
  };

  useEffect(() => {
    if (selectedVideo) {
      setModalVideoPlaying(true);
    }
  }, [selectedVideo]);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string, type: 'media' | 'news' | 'message'}>({
    isOpen: false,
    id: '',
    type: 'message'
  });
  
  const [featuredVideos, setFeaturedVideos] = useState<{id: string, url: string, title: string}[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

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

    const unsubFeatured = onSnapshot(collection(db, 'featured_videos'), (snapshot) => {
      const vids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setFeaturedVideos(vids);
      setLoadingFeatured(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'featured_videos');
    });

    return () => {
      unsub();
      unsubMessages();
      unsubMedia();
      unsubNews();
      unsubFeatured();
    };
  }, [user?.uid]);

  const handleAddFeaturedVideo = async (video: {url: string, title: string}) => {
    if (featuredVideos.length >= 4) {
      toast.error('Limite de 4 vídeos atingido.');
      return;
    }
    if (!video.url || !video.title) {
      toast.error('URL e título são obrigatórios.');
      return;
    }
    try {
      await setDoc(doc(collection(db, 'featured_videos')), {
        ...video,
        createdAt: serverTimestamp()
      });
      toast.success('Vídeo adicionado com sucesso.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'featured_videos');
    }
  };

  const handleDeleteFeaturedVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'featured_videos', id));
      toast.success('Vídeo removido com sucesso.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'featured_videos');
    }
  };

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
  const { monthBirthdays, todayBirthdays, nextFiveBirthdays } = useMemo(() => {
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
          isToday: isSameDay(thisYearBirth, today),
          formattedBirth: format(birth, "dd 'de' MMMM", { locale: ptBR })
        };
      });

    const todayList = birthdayData.filter(emp => emp.isToday);
    const upcomingList = birthdayData
      .filter(emp => !emp.isToday)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);

    return {
      todayBirthdays: todayList,
      monthBirthdays: birthdayData.filter(emp => emp.birthMonth === currentMonth),
      nextFiveBirthdays: upcomingList
    };
  }, [employees, today]);



  return (
    <div className="space-y-10 pb-20">
      {/* Modal de Vídeo */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
              onClick={handleCloseVideoModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-5xl aspect-video bg-zinc-950 rounded-[3rem] overflow-hidden relative z-10 border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
            >
              <button 
                onClick={handleCloseVideoModal}
                className="absolute top-6 right-6 z-50 w-12 h-12 bg-white/10 hover:bg-white text-zinc-950 rounded-full flex items-center justify-center transition-all border border-white/10 backdrop-blur-md"
              >
                <X size={24} />
              </button>
              
              <div className="w-full h-full">
                {(ReactPlayer as any).canPlay(selectedVideo.url) ? (
                  <ReactPlayer 
                    url={selectedVideo.url}
                    width="100%"
                    height="100%"
                    controls
                    playing={modalVideoPlaying}
                    playsinline
                    onError={(e) => {
                      console.error('Video Player Error:', e);
                      setModalVideoPlaying(false);
                    }}
                    {...({} as any)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Formato não suportado: {selectedVideo.url}</p>
                  </div>
                )}
              </div>
              
              {selectedVideo.title && (
                <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
                   <p className="text-white font-black uppercase tracking-[0.3em] text-xs">{selectedVideo.title}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Seção Especial de Aniversariantes */}
      <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 p-8 md:p-10 backdrop-blur-md relative overflow-hidden space-y-8 animate-in fade-in duration-500">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
          <Cake size={180} className="text-white rotate-12" />
        </div>

        {/* Header da Seção */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="p-3 bg-brand-accent/10 rounded-2xl border border-brand-accent/20 text-brand-accent">
            <Cake size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider font-display">Aniversariantes da Equipe</h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Celebrando quem engrandece a DM Turismo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LADO ESQUERDO: Aniversariante do Dia (Destaque Principal) */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest block font-sans">Aniversariante do Dia</span>
            
            {todayBirthdays.length > 0 ? (
              <div className="space-y-6">
                {todayBirthdays.map((emp) => (
                  <div key={emp.id} className="relative group bg-zinc-950/60 border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center text-center space-y-4 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-accent/[0.04] to-transparent rounded-[2.5rem] pointer-events-none" />
                    <div className="absolute -top-3 right-6 bg-brand-accent text-zinc-950 px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg border border-white/10 flex items-center gap-1.5 animate-pulse">
                      <Sparkles size={10} /> Parabéns!
                    </div>

                    {/* Foto Grande do Aniversariante */}
                    <div className="relative">
                      <div className="w-32 h-32 md:w-36 md:h-36 rounded-[2.5rem] border-4 border-brand-accent shadow-[0_10px_30px_rgba(255,107,0,0.15)] overflow-hidden bg-zinc-900 group relative">
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
                                      if (onUpdateEmployeePhoto) {
                                        onUpdateEmployeePhoto(emp.id, reader.result as string);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}
                        {emp.photoUrl && (
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer">
                            <Plus size={20} className="text-white" />
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Alterar Foto</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (onUpdateEmployeePhoto) {
                                      onUpdateEmployeePhoto(emp.id, reader.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                      
                      <div className="absolute -bottom-2 -right-2 bg-brand-accent text-zinc-950 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 border-2 border-zinc-950">
                        <Cake size={18} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-black text-xl text-white uppercase tracking-tight font-display">{emp.name}</h4>
                      <span className="text-[8px] font-black px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded-full uppercase tracking-widest border border-brand-accent/10">{emp.role}</span>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed max-w-xs">
                      Hoje o dia é todo seu! Que você tenha um caminho de muitas realizações e felicidades. <b>A DM Turismo celebra com orgulho!</b>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-950/20 border border-dashed border-zinc-800 rounded-[2.5rem] p-8 flex flex-col items-center text-center justify-center min-h-[300px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <div className="w-16 h-16 bg-zinc-900/60 rounded-[1.5rem] border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4 group-hover:scale-105 transition-transform duration-300">
                  <Cake size={28} className="text-zinc-500" />
                </div>
                <h4 className="font-black text-sm text-zinc-400 uppercase tracking-wider mb-2">Sem Aniversariantes Hoje</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
                  Não temos colaboradores completando primaveras hoje. Desejamos uma excelente jornada!
                </p>
              </div>
            )}
          </div>

          {/* LADO DIREITO: Próximos Aniversariantes */}
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-sans">Próximos 5 Aniversariantes</span>
            
            {nextFiveBirthdays.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {nextFiveBirthdays.map((emp) => (
                  <div 
                    key={emp.id} 
                    className="flex items-center gap-4 bg-zinc-950/40 p-4 rounded-3xl border border-white/5 hover:border-brand-accent/30 transition-all group duration-300"
                  >
                    {/* Foto Menor do Próximo Aniversariante */}
                    <div className="relative group/photo shrink-0">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 group-hover:border-brand-accent/50 transition-colors relative">
                        {emp.photoUrl ? (
                          <img 
                            src={emp.photoUrl} 
                            alt={emp.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-black uppercase">
                            {emp.name.charAt(0)}
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Plus size={16} className="text-white" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (onUpdateEmployeePhoto) {
                                    onUpdateEmployeePhoto(emp.id, reader.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-zinc-800 text-zinc-400 w-5 h-5 rounded-lg flex items-center justify-center border border-zinc-950 text-[10px] shadow">
                        🎂
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h5 className="font-black text-sm text-white uppercase truncate group-hover:text-brand-accent transition-colors leading-none mb-1">
                          {emp.name}
                        </h5>
                        <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest shrink-0">
                          {emp.daysUntil === 1 ? 'Amanhã!' : `em ${emp.daysUntil} dias`}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                        <span className="truncate max-w-[150px]">{emp.role}</span>
                        <span className="font-mono text-zinc-400 font-extrabold">{emp.formattedBirth}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-950/20 border border-dashed border-zinc-800 rounded-[2.5rem] p-8 flex flex-col items-center text-center justify-center h-full min-h-[200px]">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Nenhum próximo aniversariante agendado.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Videos Section */}
      <FeaturedVideosSection 
        videos={featuredVideos}
        onDelete={handleDeleteFeaturedVideo}
        onAdd={handleAddFeaturedVideo}
        isAdmin={isAdministrative}
        onPlay={(v) => setSelectedVideo(v)}
      />

  {/* Hero Welcome */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group backdrop-blur-sm">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
           <img 
             src="https://images.unsplash.com/photo-1549317661-bd38cea8ce65?auto=format&fit=crop&q=80&w=1000" 
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
          <div className="flex items-center gap-4 bg-zinc-950/80 backdrop-blur-2xl border border-white/5 p-5 rounded-[1.5rem] shadow-2xl glass-effect">
             <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <Bus size={24} className="text-emerald-500" />
             </div>
             <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Status Frota</p>
                <p className="text-sm font-black text-white uppercase tracking-tight">{vehicles.length} Veículos Ativos</p>
             </div>
          </div>
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
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-zinc-800 active:scale-95 shadow-xl glass-effect"
              >
                {isAddingNews ? <Plus size={14} className="rotate-45" /> : <Newspaper size={14} />}
                Notícia
              </button>
              <button 
                onClick={() => setIsAddingMedia(!isAddingMedia)}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-brand-accent/20 travel-button"
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
                    "bg-zinc-900/60 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col group hover:border-brand-accent/30 transition-all backdrop-blur-sm",
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
                          <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center border border-white/5 overflow-hidden shadow-inner">
                             <UserIcon size={14} className="text-zinc-600" />
                          </div>
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{news.authorName}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          {(isAdministrative || (user && news.authorId === user.uid)) && (
                            <button 
                              onClick={() => handleDeleteNews(news.id)}
                              className="p-2 text-zinc-700 hover:text-rose-500 transition-colors bg-zinc-950 rounded-lg border border-white/5"
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
                   className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-brand-accent/30 transition-all backdrop-blur-sm relative shadow-2xl"
                 >
                   <div className="aspect-video bg-zinc-950 relative group/video cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedVideo({ url: video.url, title: video.caption }); }}>
                     <ReactPlayer 
                        url={video.url}
                        width="100%"
                        height="100%"
                        light={true}
                        playIcon={
                          <div className="w-14 h-14 bg-brand-accent rounded-full flex items-center justify-center text-zinc-950 shadow-2xl group-hover/video:scale-110 transition-transform">
                             <Play size={24} fill="currentColor" className="ml-1" />
                          </div>
                        }
                        {...({} as any)}
                     />
                     <div className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                        {video.url.includes('instagram') ? <Instagram size={14} className="text-pink-500" /> : 
                         video.url.includes('tiktok') ? <Smartphone size={14} className="text-white" /> :
                         <Youtube size={14} className="text-rose-500" />}
                     </div>
                   </div>
                   <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">{video.ownerName}</span>
                         <span className="text-[8px] font-black text-zinc-600 uppercase">
                            {video.createdAt ? format(video.createdAt.toDate(), "dd/MM") : 'Agora'}
                         </span>
                      </div>
                      <p className="text-[11px] font-bold text-zinc-400 line-clamp-2 min-h-[2.5rem]">{video.caption || 'Sem legenda'}</p>
                      
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                         <div className="flex gap-2">
                            <button 
                              onClick={() => handleSocialShare('whatsapp', video.url, video.caption)}
                              className="p-2 bg-zinc-950 rounded-xl text-zinc-500 hover:text-white transition-colors border border-white/5"
                            >
                               <Share2 size={12} />
                            </button>
                         </div>
                         {(isAdministrative || (user && video.ownerId === user.uid)) && (
                            <button 
                              onClick={() => handleDeleteMedia(video.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-rose-500/20"
                            >
                               <Trash2 size={12} />
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
                        onChange={(e) => {
                          const url = e.target.value;
                          let type: 'video' | 'image' = 'image';
                          if ((ReactPlayer as any).canPlay(url)) type = 'video';
                          setNewMedia({...newMedia, url, type});
                        }}
                        placeholder="Cole o link (YouTube, Instagram, etc) ou use o botão à direita"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-accent transition-all pr-32"
                      />
                      <label className="absolute right-2 top-2 bottom-2 px-4 bg-zinc-900 hover:bg-brand-accent text-white hover:text-zinc-950 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-white/5 active:scale-95 group-hover:border-brand-accent/50">
                        <Upload size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Upload</span>
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                      </label>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 bg-zinc-950/50 p-4 rounded-2xl border border-white/5">
                   <div className={cn(
                     "w-12 h-12 rounded-xl flex items-center justify-center",
                     newMedia.type === 'video' ? "bg-rose-500/10 text-rose-500" : "bg-sky-blue/10 text-sky-blue"
                   )}>
                      {newMedia.type === 'video' ? <Youtube size={24} /> : <Camera size={24} />}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Tipo Identificado</p>
                      <p className="text-xs font-black text-white uppercase tracking-tight">{newMedia.type === 'video' ? 'Vídeo / Link Externo' : 'Imagem Estática'}</p>
                   </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Legenda / Descrição</label>
                <textarea 
                  value={newMedia.caption}
                  onChange={(e) => setNewMedia({...newMedia, caption: e.target.value})}
                  placeholder="Compartilhe algo sobre este registro..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-xs font-bold text-white h-[120px] resize-none transition-all focus:border-brand-accent"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-zinc-800">
               <button 
                 onClick={handleShareMedia}
                 className="px-12 py-4 bg-brand-accent text-zinc-950 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-brand-accent/20 active:scale-95 translate-y-0 hover:-translate-y-1"
               >
                 Compartilhar Mídia
               </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
           {imageShares.map((media) => (
              <motion.div 
                key={media.id}
                layoutId={media.id}
                className="group relative aspect-square bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-brand-accent/50 transition-all cursor-pointer"
              >
                  <img 
                    src={media.url} 
                    alt={media.caption} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                     <p className="text-[10px] font-bold text-white line-clamp-2 mb-2 leading-tight">{media.caption}</p>
                     <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-brand-accent uppercase truncate">{media.ownerName}</span>
                        {(isAdministrative || (user && media.ownerId === user.uid)) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteMedia(media.id); }}
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all"
                          >
                             <Trash2 size={12} />
                          </button>
                        )}
                     </div>
                  </div>
              </motion.div>
           ))}
        </div>
      </div>

       {/* Social Media & Bot Feed Integration */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-accent/10 rounded-xl">
                  <MessageSquare className="text-brand-accent" size={20} />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Comunicado Interno</h3>
             </div>
             
             <div className="p-10 bg-zinc-900/60 border border-white/5 rounded-[3rem] space-y-8 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                   <MessageSquare size={160} />
                </div>
                <div className="flex items-start gap-6 relative z-10">
                   <div className="w-16 h-16 bg-brand-accent rounded-[1.5rem] flex items-center justify-center text-zinc-950 shrink-0 shadow-2xl">
                      <Bell size={32} className="animate-bounce" />
                   </div>
                   <div className="space-y-4 flex-1">
                      <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Aviso da Gestão</p>
                      {isAdministrative && boardMessage === '' && !loadingMessages ? (
                        <div className="space-y-4">
                           <textarea 
                             value={newMessage}
                             onChange={(e) => setNewMessage(e.target.value)}
                             placeholder="Digite um comunicado para todos os colaboradores..."
                             className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-sm font-bold text-white min-h-[120px] focus:border-brand-accent transition-all"
                           />
                           <button 
                             onClick={handleSendMessage}
                             className="px-8 py-3 bg-brand-accent text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-brand-accent/20"
                           >Disparar Comunicado</button>
                        </div>
                      ) : (
                        <p className="text-xl md:text-2xl font-bold text-white leading-relaxed italic">
                           "{boardMessage || 'A DM Turismo deseja a todos os motoristas uma excelente jornada hoje. Segurança em primeiro lugar sempre!'}"
                        </p>
                      )}
                   </div>
                </div>
                

             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-accent/10 rounded-xl">
                  <BotIcon className="text-brand-accent" size={20} />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">DM Assistant (Alpha)</h3>
             </div>
             
             <div className="bg-zinc-950 border border-white/5 rounded-[3rem] p-8 space-y-6 relative overflow-hidden shadow-2xl glass-effect-dark">
                <div className="absolute inset-0 bg-brand-accent/5 pointer-events-none" />
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                   <div className="w-10 h-10 bg-asphalt-900 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                      <Sparkles size={18} className="text-brand-accent animate-pulse" />
                   </div>
                   <div>
                      <p className="text-xs font-black text-white uppercase tracking-tight">Status do Dia</p>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Análise Preditiva</p>
                   </div>
                </div>
                
                <div className="space-y-4">
                   <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Eficiência Combustível</span>
                         <TrendingUp size={12} className="text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-zinc-300 font-medium">A média da frota subiu 5% hoje. O veículo <b>ABC-1234</b> apresentou o melhor desempenho (3.1 km/l).</p>
                   </div>
                   

                   <button 
                    onClick={() => setActiveSection('criador')}
                    className="w-full py-4 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl flex items-center justify-center gap-3 group hover:bg-brand-accent transition-all active:scale-95 shadow-xl shadow-brand-accent/5"
                   >
                     <BotIcon size={16} className="text-brand-accent group-hover:text-zinc-950" />
                     <span className="text-[10px] font-black text-brand-accent group-hover:text-zinc-950 uppercase tracking-widest">Consultar Criador</span>
                   </button>
                </div>
             </div>
          </div>
       </div>

      {/* Confirm Registration Deletion */}
      <ConfirmModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        onConfirm={processDelete}
        title={`Excluir ${deleteConfirm.type === 'media' ? 'Mídia' : deleteConfirm.type === 'news' ? 'Notícia' : 'Mensagem'}`}
        message="Tem certeza que deseja remover este item? Esta ação não poderá ser desfeita e removerá os dados permanentemente do servidor."
      />
    </div>
  );
};
