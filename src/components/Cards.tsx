import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../lib/utils';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export const Card = ({ children, className, ...props }: CardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ 
      y: -4, 
      transition: { duration: 0.2 } 
    }}
    transition={{ type: "spring", stiffness: 260, damping: 20 }}
    className={cn("rustic-card p-8 transition-all duration-300", className)} 
    {...props}
  >
    {children}
  </motion.div>
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  color: string;
  glow?: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, color, glow }: StatCardProps) => (
  <Card className={cn("flex flex-col gap-6 border-zinc-800", glow)}>
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform -rotate-2", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{title}</p>
      <h3 className="text-3xl font-black text-white tracking-tight mb-2 tabular-nums">{value}</h3>
      {trend && (
        <div className="flex items-center gap-2">
          <div className="flex items-center px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700">
            <span className={cn("text-[9px] font-bold", trend.startsWith('+') ? "text-emerald-500" : "text-brand-accent")}>{trend}</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">Indicador</span>
        </div>
      )}
    </div>
  </Card>
);
