import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { motion } from 'framer-motion';
import { Play, Trash2, Plus, Youtube, Link as LinkIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from './Cards';

// This is a draft component for the Featured Videos section.
// To be integrated into Dashboard.tsx upon user's "Atualizar o aplicativo" command.

interface FeaturedVideo {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
}

export const FeaturedVideosSection = ({ 
  videos, 
  onDelete, 
  onAdd, 
  isAdmin,
  onPlay 
}: { 
  videos: FeaturedVideo[]; 
  onDelete: (id: string) => void; 
  onAdd: (video: {url: string, title: string}) => void;
  isAdmin: boolean;
  onPlay: (video: {url: string, title: string}) => void;
}) => {
  const [newVideo, setNewVideo] = useState({ url: '', title: '' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-black text-white uppercase tracking-widest">Vídeos em Destaque</h3>
         {isAdmin && <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{videos.length}/4</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <motion.div 
            key={video.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-asphalt-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-brand-accent/30 transition-all backdrop-blur-md relative shadow-lg"
          >
            <div className="aspect-video relative group/video cursor-pointer" onClick={() => onPlay(video)}>
              <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center">
                 <Youtube className="text-zinc-700/50" size={48} />
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl group-hover/video:scale-110 transition-transform">
                   <Play size={20} fill="white" />
                 </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[11px] font-bold text-zinc-300 truncate">{video.title}</p>
              {isAdmin && (
                <button onClick={() => onDelete(video.id)} className="mt-2 text-rose-500 hover:text-rose-400">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {isAdmin && videos.length < 4 && (
          <div className="bg-asphalt-900/20 border-2 border-dashed border-zinc-800 rounded-[2.5rem] p-6 flex flex-col justify-center gap-4">
            <input 
              placeholder="Link do vídeo..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs"
              value={newVideo.url}
              onChange={e => setNewVideo({...newVideo, url: e.target.value})}
            />
            <input 
              placeholder="Título..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs"
              value={newVideo.title}
              onChange={e => setNewVideo({...newVideo, title: e.target.value})}
            />
            <button 
              onClick={() => { onAdd(newVideo); setNewVideo({url: '', title: ''}); }}
              className="px-4 py-2 bg-brand-accent text-zinc-950 rounded-xl text-[10px] font-bold uppercase"
            >
              Adicionar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
