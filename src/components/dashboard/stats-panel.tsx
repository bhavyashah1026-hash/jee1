'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import type { Stats } from '@/store/use-jee-store';
import {
  Clock,
  CheckCircle2,
  Flame,
  Trophy,
  BookOpen,
  Timer,
} from 'lucide-react';

interface StatsPanelProps {
  stats: Stats | null;
  onRefresh?: () => void;
}

export function StatsPanel({ stats, onRefresh }: StatsPanelProps) {
  if (!stats) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48 bg-slate-900" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 bg-slate-900 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full bg-slate-900 rounded-xl" />
      </div>
    );
  }

  const { profile, taskStats, xp, subjectStats, recentStreaks, recentSessions } = stats;

  const totalHours = profile ? Math.round(profile.totalStudyMinutes / 60 * 10) / 10 : 0;
  const longestStreak = profile?.longestStreak ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Clock className="w-5 h-5 text-cyan-400" />}
          label="Study Hours"
          value={`${totalHours}h`}
          subtext={profile ? `${profile.totalStudyMinutes}m total` : ''}
          color="#06b6d4"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          label="Quests Done"
          value={String(profile?.totalTasksCompleted ?? 0)}
          subtext={`${taskStats.completedToday} today`}
          color="#10b981"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-400" />}
          label="Current Streak"
          value={`${profile?.currentStreak ?? 0}d`}
          subtext={`Best: ${longestStreak}d`}
          color="#f97316"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-amber-400" />}
          label="Total XP"
          value={xp.totalXP.toLocaleString()}
          subtext={`Level ${xp.currentLevel}`}
          color="#f59e0b"
        />
      </div>

      {/* Subject-wise breakdown */}
      {subjectStats.length > 0 && (
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/50 p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-slate-400" />
            Subject Breakdown
          </h3>
          <div className="flex flex-col gap-3">
            {subjectStats.map((subject, i) => {
              // Find max study minutes for relative bar width
              const maxMinutes = Math.max(...subjectStats.map((s) => s.totalStudyMinutes), 1);
              const barWidth = (subject.totalStudyMinutes / maxMinutes) * 100;
              const hours = Math.round(subject.totalStudyMinutes / 60 * 10) / 10;

              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-24 sm:w-28 shrink-0">
                    <span className="text-xs font-medium" style={{ color: subject.color }}>
                      {subject.name}
                    </span>
                  </div>
                  <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(barWidth, 2)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: subject.color,
                        boxShadow: `0 0 8px ${subject.color}40`,
                      }}
                    />
                  </div>
                  <div className="w-20 text-right shrink-0">
                    <span className="text-xs font-mono text-slate-400">
                      {hours}h
                    </span>
                    <span className="text-[10px] text-slate-600 ml-1">
                      ({subject.tasksCompleted} quests)
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Last 7 days activity chart */}
      {recentStreaks.length > 0 && (
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/50 p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Timer className="w-4 h-4 text-slate-400" />
            Last 7 Days Activity
          </h3>
          <div className="flex items-end gap-2 h-32">
            {recentStreaks.map((day, i) => {
              // Fill missing days
              const maxMin = Math.max(...recentStreaks.map((d) => d.studyMinutes), 1);
              const heightPct = (day.studyMinutes / maxMin) * 100;
              const dateObj = new Date(day.date);
              const dayLabel = dateObj.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
              const isToday = day.date === new Date().toISOString().split('T')[0];

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-slate-500">
                    {day.studyMinutes > 0 ? `${Math.round(day.studyMinutes / 60 * 10) / 10}h` : ''}
                  </span>
                  <div className="w-full flex-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPct, 3)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                      className={`w-full rounded-t-md ${
                        isToday
                          ? 'bg-amber-500'
                          : day.studyMinutes > 0
                            ? 'bg-slate-600'
                            : 'bg-slate-800'
                      }`}
                      style={
                        isToday
                          ? { boxShadow: '0 0 10px rgba(245,158,11,0.3)' }
                          : day.studyMinutes > 0
                            ? { boxShadow: '0 0 5px rgba(100,116,139,0.2)' }
                            : {}
                      }
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isToday ? 'text-amber-400' : 'text-slate-600'
                    }`}
                  >
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/50 p-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-slate-400" />
            Recent Sessions
          </h3>
          <div className="flex flex-col gap-2">
            {recentSessions.map((session, i) => {
              const subjectName = session.subject?.name ?? 'General';
              const subjectColor = session.subject?.color ?? '#64748b';
              const modeLabel = session.mode === 'deep_work'
                ? 'Deep Work'
                : session.mode === 'break'
                  ? 'Break'
                  : 'Focus';
              const timeAgo = getTimeAgo(session.startedAt);

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-2 border-b border-slate-800/40 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: subjectColor }}
                    />
                    <div>
                      <span className="text-xs font-medium text-slate-300">
                        {subjectName}
                      </span>
                      <span className="text-[10px] text-slate-600 ml-2">{modeLabel}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">
                      {session.durationMinutes}m
                    </span>
                    <span className="text-[10px] text-slate-600">{timeAgo}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl bg-slate-900/60 border border-slate-800/50 p-4"
      style={{ boxShadow: `0 0 15px ${color}08` }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold font-mono text-white leading-tight">{value}</p>
      {subtext && (
        <p className="text-[10px] text-slate-500 mt-1">{subtext}</p>
      )}
    </motion.div>
  );
}

// Simple relative time formatter
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}
