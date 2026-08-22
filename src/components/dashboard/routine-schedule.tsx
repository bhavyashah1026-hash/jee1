'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJEEStore, type Routine } from '@/store/use-jee-store';
import { AddRoutineDialog } from './add-routine-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Clock, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get current day as 1-7 (Mon=1, Sun=7)
function getCurrentDayNum(): number {
  const jsDay = new Date().getDay(); // 0=Sun
  return jsDay === 0 ? 7 : jsDay;
}

// Parse HH:mm to minutes since midnight
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Format minutes to HH:mm
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function RoutineSchedule() {
  const { routines, setRoutines, setShowAddRoutine } = useJEEStore();
  const [loading, setLoading] = useState(true);
  const [deletingRoutine, setDeletingRoutine] = useState<Routine | null>(null);
  const [now, setNow] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchRoutines = async () => {
    try {
      const res = await fetch('/api/routines');
      const data = await res.json();
      setRoutines(data);
    } catch {
      toast.error('Failed to load routines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, [setRoutines]);

  const currentDay = getCurrentDayNum();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Filter routines for today
  const todayRoutines = useMemo(() => {
    return routines
      .filter((r) => {
        const days = r.daysActive.split(',').map(Number);
        return days.includes(currentDay);
      })
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [routines, currentDay]);

  // Find current and next routine
  const currentRoutine = todayRoutines.find((r) => {
    const start = timeToMinutes(r.startTime);
    const end = timeToMinutes(r.endTime);
    return currentMinutes >= start && currentMinutes < end;
  });

  const nextRoutine = todayRoutines.find((r) => {
    return timeToMinutes(r.startTime) > currentMinutes;
  });

  const handleDelete = async () => {
    if (!deletingRoutine) return;
    try {
      const res = await fetch(`/api/routines?id=${deletingRoutine.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Routine deleted');
      fetchRoutines();
    } catch {
      toast.error('Failed to delete routine');
    } finally {
      setDeletingRoutine(null);
    }
  };

  // Calculate the position of the "now" indicator on the timeline
  // We want a 6am to midnight timeline (360 to 1440 minutes)
  const TIMELINE_START = 360; // 6:00 AM
  const TIMELINE_END = 1440; // 12:00 AM (midnight)
  const TIMELINE_RANGE = TIMELINE_END - TIMELINE_START;

  const nowPosition = Math.max(0, Math.min(100, ((currentMinutes - TIMELINE_START) / TIMELINE_RANGE) * 100));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
            Daily Routine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {DAY_FULL[now.getDay()]} — {todayRoutines.length} blocks scheduled
          </p>
        </div>
        <Button
          onClick={() => setShowAddRoutine(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          Add Block
        </Button>
      </div>

      {/* Day indicators */}
      <div className="flex items-center gap-1">
        {DAY_NAMES.map((day, i) => {
          const dayNum = i === 0 ? 7 : i;
          const isToday = dayNum === currentDay;
          return (
            <div
              key={day}
              className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                isToday
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-600 border border-transparent'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-slate-900 rounded-xl" />
          ))}
        </div>
      )}

      {/* Timeline */}
      {!loading && (
        <div className="relative">
          {/* Now indicator */}
          {currentMinutes >= TIMELINE_START && currentMinutes <= TIMELINE_END && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute left-0 right-0 z-10"
              style={{ top: `${nowPosition}%` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.6)' }} />
                <div className="flex-1 h-px bg-red-500/40" />
                <span className="text-[10px] font-mono text-red-400 shrink-0">
                  {minutesToTime(currentMinutes)}
                </span>
              </div>
            </motion.div>
          )}

          {/* Routine blocks */}
          <div className="flex flex-col gap-2 mt-2">
            <AnimatePresence>
              {todayRoutines.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-slate-600 text-sm"
                >
                  No routines for today. Add one above!
                </motion.div>
              )}

              {todayRoutines.map((routine, index) => {
                const isCurrent = currentRoutine?.id === routine.id;
                const isNext = nextRoutine?.id === routine.id;
                const startMin = timeToMinutes(routine.startTime);
                const endMin = timeToMinutes(routine.endTime);
                const durationMins = endMin - startMin;

                return (
                  <motion.div
                    key={routine.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className={`group relative flex items-stretch gap-3 p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-opacity-80'
                        : isNext
                          ? 'bg-slate-900/60 border-slate-700/40'
                          : 'bg-slate-900/40 border-slate-800/30'
                    }`}
                    style={
                      isCurrent
                        ? {
                            borderColor: routine.color,
                            backgroundColor: `${routine.color}08`,
                            boxShadow: `0 0 15px ${routine.color}20`,
                          }
                        : {}
                    }
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1">
                      <div
                        className="w-3 h-3 rounded-full border-2"
                        style={{
                          borderColor: routine.color,
                          backgroundColor: isCurrent ? routine.color : 'transparent',
                        }}
                      />
                      {index < todayRoutines.length - 1 && (
                        <div className="w-px flex-1 bg-slate-800 mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`text-sm font-semibold ${
                            isCurrent ? 'text-white' : 'text-slate-300'
                          }`}>
                            {routine.title}
                            {isCurrent && (
                              <span
                                className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                                style={{
                                  color: routine.color,
                                  backgroundColor: `${routine.color}20`,
                                }}
                              >
                                NOW
                              </span>
                            )}
                            {isNext && !isCurrent && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase text-slate-400 bg-slate-800">
                                UP NEXT
                              </span>
                            )}
                          </h3>
                          {routine.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{routine.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setDeletingRoutine(routine)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                          <Clock className="w-3 h-3" />
                          {routine.startTime} — {routine.endTime}
                          <span className="text-slate-600">({durationMins}m)</span>
                        </span>
                        {routine.subject && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              color: routine.subject.color,
                              backgroundColor: `${routine.subject.color}15`,
                            }}
                          >
                            {routine.subject.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      <AddRoutineDialog onRoutineCreated={fetchRoutines} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingRoutine} onOpenChange={(open) => !open && setDeletingRoutine(null)}>
        <AlertDialogContent className="bg-slate-950 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Routine?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently remove &quot;{deletingRoutine?.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-slate-400 hover:text-white bg-slate-900 border-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
