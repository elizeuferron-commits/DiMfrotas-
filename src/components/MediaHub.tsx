import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  X, 
  Instagram, 
  Youtube, 
  Video, 
  Plus, 
  Trash2, 
  Link as LinkIcon,
  Smartphone,
  Facebook
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from './Cards';

interface MediaItem {
  id: string;
  url: string;
  type: 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'other';
  title?: string;
  caption?: string;
  thumbnail?: string;
}

export const MediaHub = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const detectType = (url: string): MediaItem['type'] => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('facebook.com')) return 'facebook';
    return 'other';
  };

  const handleAddMedia = () => {
    if (!ReactPlayer.canPlay(newUrl)) {
      alert('Link não suportado ou inválido.');
      return;
    }

    const type = detectType(newUrl);
    const newItem: MediaItem = {
      id: Math.random().toString(36).substr(2, 9),
      url: newUrl,
      type,
      title: `Vídeo ${type.toUpperCase()}`,
    };

    setMediaList([newItem, ...mediaList]);
    setNewUrl('');
    setIsAdding(false);
  };

  const removeItem = (id: string) => {
    setMediaList(mediaList.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">DM Media Hub</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Reprodutor multi-plataforma (Youtube, Insta, TikTok)</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-accent text-zinc-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-accent/20"
        >
          <Plus size={16} /> Adicionar Link
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl space-y-6"
          >
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Colidie o Link aqui</label>
              <div className="relative">
                <input 
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/... ou youtube.com/watch?v=..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-accent transition-all pl-12"
                />
                <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
              </div>
              <p className="text-[9px] text-zinc-600 font-bold uppercase">Formatos suportados: YouTube, Facebook, SoundCloud, Streamable, Vimeo, Wistia, Twitch, DailyMotion, Vidyard, Instagram e TikTok.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleAddMedia}
                className="flex-1 py-4 bg-white text-zinc-950 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-accent transition-all"
              >
                Confirmar
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="px-8 py-4 bg-zinc-800 text-zinc-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-700"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mediaList.map((item) => (
          <motion.div 
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-zinc-950 border border-zinc-800 rounded-[2rem] overflow-hidden hover:border-brand-accent/50 transition-all shadow-xl"
          >
            <div className="aspect-video bg-zinc-900 relative">
              <ReactPlayer 
                url={item.url}
                width="100%"
                height="100%"
                light={true} // Use thumbnail for performance
                playIcon={
                  <div className="w-16 h-16 bg-brand-accent rounded-full flex items-center justify-center text-zinc-900 shadow-2xl scale-100 group-hover:scale-110 transition-transform">
                    <Play size={32} fill="currentColor" />
                  </div>
                }
                onError={(e) => console.error('MediaHub Player Error:', e)}
                {...({} as any)}
              />
              <div className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10">
                {item.type === 'youtube' && <Youtube size={16} className="text-rose-500" />}
                {item.type === 'instagram' && <Instagram size={16} className="text-pink-500" />}
                {item.type === 'tiktok' && <Smartphone size={16} className="text-white" />}
                {item.type === 'facebook' && <Facebook size={16} className="text-blue-500" />}
                {item.type === 'other' && <Video size={16} className="text-zinc-400" />}
              </div>
              <button 
                onClick={() => removeItem(item.id)}
                className="absolute top-4 right-4 p-2 bg-rose-500/10 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white border border-rose-500/20"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-6">
              <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest">{item.title}</h4>
              <p className="text-[12px] font-bold text-zinc-400 mt-1 truncate">{item.url}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {mediaList.length === 0 && !isAdding && (
        <div className="p-20 bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-700">
            <Video size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-zinc-500 uppercase tracking-tighter">Nenhuma mídia ativa</h3>
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Adicione links de redes sociais para exibir no telão</p>
          </div>
        </div>
      )}
    </div>
  );
};
