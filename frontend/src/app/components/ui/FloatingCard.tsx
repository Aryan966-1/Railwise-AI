import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
}

export function FloatingCard({ children, className = '', delay = 0, hover = true, onClick }: FloatingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={hover ? { y: -8, scale: 1.02 } : {}}
      onClick={onClick}
      className={`
        relative rounded-3xl 
        backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60
        border border-white/20 dark:border-purple-500/20
        shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] 
        dark:shadow-[0_8px_32px_rgba(139,92,246,0.15),0_2px_8px_rgba(0,0,0,0.4)]
        hover:shadow-[0_12px_48px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.12)]
        dark:hover:shadow-[0_12px_48px_rgba(139,92,246,0.25),0_4px_12px_rgba(0,0,0,0.6)]
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Enhanced glassmorphism glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 pointer-events-none" />
      
      {/* Soft inner glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/5 pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}