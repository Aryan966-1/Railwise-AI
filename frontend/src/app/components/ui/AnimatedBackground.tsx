import { motion } from 'motion/react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient - Enhanced for light and dark modes */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#0a0118] dark:via-[#1a0b2e] dark:to-[#0f0520]" />
      
      {/* Train background image with parallax */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1650246162044-222d5c406c25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidWxsZXQlMjB0cmFpbiUyMG1vdGlvbiUyMGJsdXIlMjBmdXR1cmlzdGljfGVufDF8fHx8MTc3NDg1MzAxMXww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Train background"
          className="w-full h-full object-cover opacity-[0.08] dark:opacity-[0.15] blur-sm"
        />
      </motion.div>

      {/* Motion lines / speed effect */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ 
              x: '200%', 
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "linear"
            }}
            className="absolute h-[2px] bg-gradient-to-r from-transparent via-blue-400/50 dark:via-purple-500/50 to-transparent"
            style={{
              top: `${15 + i * 10}%`,
              width: '30%',
              transform: 'skewX(-15deg)'
            }}
          />
        ))}
      </div>
      
      {/* Floating gradient orbs - Enhanced with more vibrant colors */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 dark:bg-blue-600/30 rounded-full blur-3xl"
        style={{ filter: 'blur(80px)' }}
      />
      
      <motion.div
        animate={{
          x: [0, -120, 0],
          y: [0, 120, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-40 right-20 w-[32rem] h-[32rem] bg-purple-500/20 dark:bg-purple-600/40 rounded-full blur-3xl"
        style={{ filter: 'blur(90px)' }}
      />
      
      <motion.div
        animate={{
          x: [0, 80, 0],
          y: [0, -80, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/20 dark:bg-pink-600/30 rounded-full blur-3xl"
        style={{ filter: 'blur(70px)' }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
              scale: [0, 1, 0],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-blue-400 dark:bg-purple-400 rounded-full"
            style={{
              boxShadow: '0 0 10px 2px currentColor'
            }}
          />
        ))}
      </div>

      {/* Grid pattern overlay - subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
    </div>
  );
}
