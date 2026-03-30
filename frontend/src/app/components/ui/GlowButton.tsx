import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function GlowButton({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  variant = 'primary' 
}: GlowButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-8 py-4 rounded-full font-semibold shadow-lg
        transition-all duration-300 overflow-hidden
        ${variant === 'primary' 
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
          : 'bg-muted/50 text-foreground border border-border/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl'}
        ${className}
      `}
      style={{
        boxShadow: variant === 'primary' && !disabled
          ? '0 0 30px rgba(139, 92, 246, 0.4), 0 8px 24px rgba(0, 0, 0, 0.15)'
          : undefined
      }}
    >
      {/* Animated glow effect */}
      {variant === 'primary' && !disabled && (
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 blur-xl -z-10"
        />
      )}
      
      {/* Shimmer effect on hover */}
      <motion.div
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
