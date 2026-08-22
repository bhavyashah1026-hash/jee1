'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useJEEStore, type Stats } from '@/store/use-jee-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Countdown } from '@/components/dashboard/countdown';
import { XPBar } from '@/components/dashboard/xp-bar';
import { XPAnimation } from '@/components/dashboard/xp-animation';
import { TaskBoard } from '@/components/dashboard/task-board';
import { TimerWidget } from '@/components/dashboard/timer-widget';
import { RoutineSchedule } from '@/components/dashboard/routine-schedule';
import { StatsPanel } from '@/components/dashboard/stats-panel';
import {
  LayoutDashboard,
  Swords,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  Zap,
} from 'lucide-react';

export default function Home() {
  const { stats, setStats, activeTab, setActiveTab } = useJEEStore();
  const [initialized, setInitialized] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch {/* silent */}
  }, [setStats]);

  // Initialize: seed DB then fetch all data
  useEffect(() => {
    const init = async () => {
      try {
        await fetch('/api/seed', { method: 'POST' });
      } catch {/* silent */}
      await fetchStats();
      setInitialized(true);
    };
    init();
  }, [fetchStats]);

  // Refresh stats periodically (every 30s)
  useEffect(() => {
    if (!initialized) return;
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [initialized, fetchStats]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-white">
      {/* XP Animation overlay */}
      <XPAnimation />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3 shrink-0">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30"
                style={{ boxShadow: '0 0 15px rgba(245,158,11,0.15)' }}
              >
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight">
                  JEE Command Center
                </h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden sm:block">
                  Advanced 2028
                </p>
              </div>
            </div>

            {/* XP Bar (desktop) */}
            {stats && (
              <div className="hidden md:block flex-1 max-w-lg">
                <XPBar stats={stats} />
              </div>
            )}

            {/* Mobile quick stats */}
            {stats && (
              <div className="flex md:hidden items-center gap-3">
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-mono font-bold">{stats.profile?.currentStreak ?? 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-mono font-bold">{stats.xp.totalXP}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile XP bar */}
          {stats && (
            <div className="md:hidden mt-2">
              <XPBar stats={stats} />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab Navigation */}
          <TabsList className="bg-slate-900/60 border border-slate-800/50 mb-6 w-full sm:w-fit">
            <TabsTrigger
              value="dashboard"
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="quests"
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <Swords className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quests</span>
            </TabsTrigger>
            <TabsTrigger
              value="routines"
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Routines</span>
            </TabsTrigger>
            <TabsTrigger
              value="statistics"
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: Countdown + Quick Stats */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Countdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-slate-950/80 border border-slate-800/50 p-6 flex items-center justify-center"
                  style={{ boxShadow: '0 0 40px rgba(245,158,11,0.03)' }}
                >
                  <Countdown />
                </motion.div>

                {/* Quick Stats Row */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <QuickStat
                      icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      label="Today's Quests"
                      value={`${stats.taskStats.completedToday}/${stats.taskStats.totalToday}`}
                      color="#10b981"
                    />
                    <QuickStat
                      icon={<Clock className="w-4 h-4 text-cyan-400" />}
                      label="Today's Study"
                      value={stats.todayStreak
                        ? `${Math.round(stats.todayStreak.studyMinutes / 60 * 10) / 10}h`
                        : '0h'
                      }
                      color="#06b6d4"
                    />
                    <QuickStat
                      icon={<Flame className="w-4 h-4 text-orange-400" />}
                      label="Streak"
                      value={`${stats.profile?.currentStreak ?? 0} days`
                      }
                      color="#f97316"
                    />
                    <QuickStat
                      icon={<Zap className="w-4 h-4 text-amber-400" />}
                      label="Today's XP"
                      value={stats.todayStreak ? String(stats.todayStreak.totalXP) : '0'}
                      color="#f59e0b"
                    />
                  </div>
                )}

                {/* Subject Progress (mini) */}
                {stats && stats.subjectStats.length > 0 && (
                  <div className="rounded-xl bg-slate-900/40 border border-slate-800/50 p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Subject Progress
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {stats.subjectStats.map((subject) => {
                        const hours = Math.round(subject.totalStudyMinutes / 60 * 10) / 10;
                        return (
                          <div
                            key={subject.id}
                            className="rounded-lg p-3 border"
                            style={{
                              borderColor: `${subject.color}20`,
                              backgroundColor: `${subject.color}05`,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="text-xs font-semibold"
                                style={{ color: subject.color }}
                              >
                                {subject.name}
                              </span>
                              <span className="text-lg font-bold font-mono text-white">
                                {hours}<span className="text-xs text-slate-500">h</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundColor: subject.color,
                                    boxShadow: `0 0 6px ${subject.color}40`,
                                    width: `${Math.min((subject.totalStudyMinutes / 10080) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">
                                {subject.tasksCompleted}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Timer */}
              <div className="flex flex-col gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl bg-slate-950/80 border border-slate-800/50 p-6"
                >
                  <TimerWidget />
                </motion.div>
              </div>
            </div>
          </TabsContent>

          {/* Quests Tab */}
          <TabsContent value="quests">
            <TaskBoard />
          </TabsContent>

          {/* Routines Tab */}
          <TabsContent value="routines">
            <RoutineSchedule />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="statistics">
            <StatsPanel stats={stats} onRefresh={fetchStats} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/50 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-600">
            Built for JEE 2028. No shortcuts, only hard work.
          </p>
        </div>
      </footer>
    </div>
  );
}

function QuickStat({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl bg-slate-900/60 border border-slate-800/50 p-3"
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold font-mono text-white leading-tight">{value}</p>
    </motion.div>
  );
}
