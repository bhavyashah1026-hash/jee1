'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useJEEStore } from '@/store/use-jee-store';
import { Sparkles } from 'lucide-react';

export function XPAnimation() {
  const { lastXPGained, showXPAnimation } = useJEEStore();

  return (
    <AnimatePresence>
      {showXPAnimation && lastXPGained > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.2, y: -60 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-2xl font-bold text-amber-400 font-mono">
              +{lastXPGained} XP
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
