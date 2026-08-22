'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Zap, Target } from 'lucide-react';

const TARGET_DATE = new Date('2028-04-15T09:00:00+05:30');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const diff = TARGET_DATE.getTime() - now.getTime();

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function getMotivationalText(days: number): { text: string; icon: React.ReactNode } {
  if (days > 700) return { text: 'The journey of a thousand miles begins with a single step. Start NOW.', icon: <Target className="w-4 h-4" /> };
  if (days > 500) return { text: 'Build your foundation. Every concept mastered is a weapon in your arsenal.', icon: <Zap className="w-4 h-4" /> };
  if (days > 365) return { text: 'One year left. This is where legends are forged.', icon: <Flame className="w-4 h-4" /> };
  if (days > 200) return { text: 'Less than 8 months. Push harder. No room for mediocrity.', icon: <Flame className="w-4 h-4" /> };
  if (days > 100) return { text: '100 days war mode. Every minute counts. No distractions.', icon: <Target className="w-4 h-4" /> };
  if (days > 30) return { text: 'Final stretch. You have prepared for this. Trust the process.', icon: <Zap className="w-4 h-4" /> };
  return { text: 'JEE is here. Stay calm, stay sharp. You got this.', icon: <Flame className="w-4 h-4" /> };
}

function TimeUnit({ value, label, glowColor }: { value: number; label: string; glowColor: string }) {
  return (
    <motion.div
      className="flex flex-col items-center"
      whileHover={{ scale: 1.05 }}
    >
      <div
        className={`relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-sm`}
        style={{ boxShadow: `0 0 20px ${glowColor}30, inset 0 0 20px ${glowColor}10` }}
      >
        <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tighter text-white">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-slate-400 mt-2">
        {label}
      </span>
    </motion.div>
  );
}

export function Countdown() {
  // Initialize with zeros to avoid SSR/client hydration mismatch,
  // then calculate real values on mount.
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Calculate immediately, then update every second
    const tick = () => setTimeLeft(calculateTimeLeft());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const { text: motivationText, icon } = getMotivationalText(timeLeft.days);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        <Clock className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-widest">JEE Advanced 2028</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <TimeUnit value={timeLeft.days} label="Days" glowColor="#f59e0b" />
        <span className="text-2xl sm:text-3xl font-bold text-slate-600 mt-[-1.5rem] font-mono">:</span>
        <TimeUnit value={timeLeft.hours} label="Hours" glowColor="#f97316" />
        <span className="text-2xl sm:text-3xl font-bold text-slate-600 mt-[-1.5rem] font-mono">:</span>
        <TimeUnit value={timeLeft.minutes} label="Mins" glowColor="#ef4444" />
        <span className="text-2xl sm:text-3xl font-bold text-slate-600 mt-[-1.5rem] font-mono">:</span>
        <TimeUnit value={timeLeft.seconds} label="Secs" glowColor="#a855f7" />
      </div>
      <motion.div
        key={motivationText}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm max-w-md text-center"
      >
        <span className="text-amber-500">{icon}</span>
        <span className="italic">{motivationText}</span>
      </motion.div>
    </div>
  );
}
