'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useJEEStore, type TimerMode } from '@/store/use-jee-store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Pause, RotateCcw, Timer, Coffee, Brain } from 'lucide-react';
import { toast } from 'sonner';

const MODE_CONFIG: Record<string, { label: string; duration: number; color: string; icon: React.ReactNode }> = {
  focus: { label: 'Focus', duration: 25 * 60, color: '#f59e0b', icon: <Timer className="w-4 h-4" /> },
  break: { label: 'Break', duration: 5 * 60, color: '#22c55e', icon: <Coffee className="w-4 h-4" /> },
  deep_work: { label: 'Deep Work', duration: 90 * 60, color: '#ef4444', icon: <Brain className="w-4 h-4" /> },
};

const MODE_SUGGESTION: Record<string, TimerMode> = {
  focus: 'break',
  break: 'focus',
  deep_work: 'break',
};

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export function TimerWidget() {
  const {
    timerMode,
    timerSeconds,
    timerRunning,
    timerSubjectId,
    startTimer,
    stopTimer,
    tickTimer,
  } = useJEEStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then(setSubjects)
      .catch(() => {});
  }, []);

  // Handle timer completion — stopTimer() in the store handles session logging
  const handleTimerComplete = useCallback(() => {
    const config = MODE_CONFIG[timerMode];
    if (!config) return;

    // Stop the timer (store handles session logging to /api/sessions)
    stopTimer();

    // Toast notification
    toast.success(`${config.label} session complete!`, {
      description: timerMode === 'break'
        ? 'Ready for another round?'
        : 'Great work! Time for a break?',
    });
  }, [timerMode, stopTimer]);

  // Tick the timer every second when running
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, tickTimer]);

  // Handle timer completion
  useEffect(() => {
    if (timerSeconds <= 0 && timerRunning && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      handleTimerComplete();
    }
    if (timerRunning && timerSeconds > 0) {
      hasCompletedRef.current = false;
    }
  }, [timerSeconds, timerRunning, handleTimerComplete]);

  const handleStart = (mode: TimerMode) => {
    hasCompletedRef.current = false;
    startTimer(mode, selectedSubjectId || null);
  };

  const handleReset = () => {
    hasCompletedRef.current = false;
    stopTimer();
  };

  const totalSeconds = MODE_CONFIG[timerMode]?.duration ?? timerSeconds;
  const progress = totalSeconds > 0 ? ((totalSeconds - timerSeconds) / totalSeconds) * 100 : 0;
  const isActive = timerMode !== 'idle';
  const config = MODE_CONFIG[timerMode];
  const color = config?.color ?? '#475569';

  // SVG circle params
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Format time
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Suggest next mode
  const suggestion = timerSeconds <= 0 && !timerRunning && isActive
    ? MODE_SUGGESTION[timerMode]
    : null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode selector */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/50">
        {(Object.keys(MODE_CONFIG) as TimerMode[]).map((mode) => {
          const m = MODE_CONFIG[mode];
          const isCurrentMode = timerMode === mode;
          return (
            <button
              key={mode}
              onClick={() => {
                if (!timerRunning) handleStart(mode);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isCurrentMode && isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={
                isCurrentMode && isActive
                  ? { backgroundColor: `${m.color}20`, boxShadow: `0 0 10px ${m.color}20` }
                  : {}
              }
            >
              {m.icon}
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Timer ring */}
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
          {/* Background ring */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-800"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
            style={
              timerRunning
                ? { filter: `drop-shadow(0 0 8px ${color})` }
                : {}
            }
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <motion.span
            key={timeDisplay}
            initial={timerRunning ? { scale: 1.02 } : {}}
            className="text-4xl sm:text-5xl font-bold font-mono text-white tracking-tight"
            style={
              timerRunning
                ? { textShadow: `0 0 20px ${color}60` }
                : {}
            }
          >
            {isActive ? timeDisplay : '00:00'}
          </motion.span>
          {config && (
            <span className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
              {config.label}
            </span>
          )}
          {/* Pulsing glow when running */}
          {timerRunning && (
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${color}15, transparent 70%)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {timerRunning ? (
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
          >
            <Pause className="w-4 h-4 mr-1.5" />
            Stop
          </Button>
        ) : (
          <>
            {isActive && timerSeconds < totalSeconds && timerSeconds > 0 && (
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
            )}
            {(!isActive || timerSeconds <= 0) && (
              <Button
                onClick={() => handleStart('focus')}
                size="sm"
                className="text-black font-semibold"
                style={{ backgroundColor: '#f59e0b' }}
              >
                <Play className="w-4 h-4 mr-1.5" />
                Start
              </Button>
            )}
            {isActive && timerSeconds > 0 && (
              <Button
                onClick={() => startTimer(timerMode, selectedSubjectId || null)}
                size="sm"
                className="text-black font-semibold"
                style={{ backgroundColor: color }}
              >
                <Play className="w-4 h-4 mr-1.5" />
                Resume
              </Button>
            )}
          </>
        )}
      </div>

      {/* Subject selector */}
      {!timerRunning && (
        <div className="w-full max-w-[200px]">
          <Select value={selectedSubjectId || '__none__'} onValueChange={(val) => setSelectedSubjectId(val === '__none__' ? '' : val)}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white text-xs h-8">
              <SelectValue placeholder="Tag subject" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="__none__" className="text-slate-400 text-xs">No subject</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Suggestion after completion */}
      {suggestion && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={() => handleStart(suggestion)}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
          >
            Start {MODE_CONFIG[suggestion]?.label} session →
          </button>
        </motion.div>
      )}
    </div>
  );
}
