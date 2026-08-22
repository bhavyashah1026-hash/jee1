'use client';

import { motion } from 'framer-motion';
import { useJEEStore } from '@/store/use-jee-store';
import { Flame, Star, Zap } from 'lucide-react';
import type { Stats } from '@/store/use-jee-store';

export function XPBar({ stats }: { stats: Stats }) {
  const profile = stats?.profile ?? null;
  const xp = stats?.xp ?? { totalXP: 0, currentLevel: 1, xpPercentage: 0, xpInCurrentLevel: 0, xpNeeded: 100 };

  const streak = profile?.currentStreak ?? 0;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Level and XP Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30"
            style={{ boxShadow: '0 0 15px rgba(245,158,11,0.2)' }}
          >
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Level</span>
            <span className="text-xl font-bold font-mono text-white leading-tight">
              {xp.currentLevel}
            </span>
          </div>
        </div>

        {/* Streak counter */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/30"
            style={{ boxShadow: streak > 0 ? '0 0 15px rgba(239,68,68,0.2)' : 'none' }}
          >
            <Flame className="w-5 h-5 text-red-400" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Streak</span>
            <span className="text-xl font-bold font-mono text-white leading-tight">
              {streak}
              <span className="text-xs text-slate-500 ml-1">days</span>
            </span>
          </div>
        </div>

        {/* Total XP */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Total XP</span>
            <span className="text-xl font-bold font-mono text-white leading-tight">
              {xp.totalXP.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
            Level {xp.currentLevel} Progress
          </span>
          <span className="text-xs font-mono text-slate-400">
            {xp.xpInCurrentLevel} / {xp.xpNeeded} XP
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-800 border border-slate-700/50 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(xp.xpPercentage, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              boxShadow: '0 0 10px rgba(245,158,11,0.5)',
            }}
          />
        </div>
        <div className="flex items-center justify-end mt-0.5">
          <span className="text-[10px] font-mono text-slate-600">
            {Math.round(xp.xpPercentage)}% to Level {xp.currentLevel + 1}
          </span>
        </div>
      </div>
    </div>
  );
}
