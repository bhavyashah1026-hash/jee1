import { create } from 'zustand';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme' | 'legendary';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type TimerMode = 'idle' | 'focus' | 'break' | 'deep_work';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  subjectId?: string | null;
  subject?: { id: string; name: string; color: string; icon: string } | null;
  difficulty: Difficulty;
  xpReward: number;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  status: TaskStatus;
  priority: Priority;
  scheduledFor?: string | null;
  completedAt?: string | null;
  orderIndex: number;
}

export interface Routine {
  id: string;
  title: string;
  description?: string | null;
  subjectId?: string | null;
  subject?: { id: string; name: string; color: string; icon: string } | null;
  startTime: string;
  endTime: string;
  daysActive: string;
  isActive: boolean;
  color: string;
  orderIndex: number;
}

export interface UserProfile {
  id: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyMinutes: number;
  totalTasksCompleted: number;
}

export interface Stats {
  profile: UserProfile | null;
  todayStreak: { id: string; date: string; tasksCompleted: number; totalXP: number; studyMinutes: number } | null;
  taskStats: {
    completedToday: number;
    totalToday: number;
    pendingToday: number;
    inProgressToday: number;
  };
  xp: {
    totalXP: number;
    currentLevel: number;
    xpPercentage: number;
    xpInCurrentLevel: number;
    xpNeeded: number;
  };
  recentStreaks: { id: string; date: string; tasksCompleted: number; totalXP: number; studyMinutes: number }[];
  subjectStats: { id: string; name: string; color: string; icon: string; tasksCompleted: number; totalStudyMinutes: number }[];
  recentSessions: { id: string; subject: { name: string; color: string } | null; durationMinutes: number; mode: string; startedAt: string }[];
}

const FOCUS_DURATIONS: Record<string, number> = {
  focus: 25 * 60,
  break: 5 * 60,
  deep_work: 90 * 60,
};

interface JEEStore {
  // Tasks
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;

  // Routines
  routines: Routine[];
  setRoutines: (routines: Routine[]) => void;

  // Stats
  stats: Stats | null;
  setStats: (stats: Stats) => void;

  // Timer
  timerMode: TimerMode;
  timerSeconds: number;
  timerSubjectId: string | null;
  timerTaskId: string | null;
  timerRunning: boolean;
  setTimerMode: (mode: TimerMode) => void;
  startTimer: (mode: TimerMode, subjectId?: string | null, taskId?: string | null) => void;
  stopTimer: () => void;
  tickTimer: () => void;

  // XP animation
  lastXPGained: number;
  showXPAnimation: boolean;
  triggerXPAnimation: (xp: number) => void;

  // Active tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Add task dialog
  showAddTask: boolean;
  setShowAddTask: (show: boolean) => void;

  // Add routine dialog
  showAddRoutine: boolean;
  setShowAddRoutine: (show: boolean) => void;
}

export const useJEEStore = create<JEEStore>((set, get) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),

  routines: [],
  setRoutines: (routines) => set({ routines }),

  stats: null,
  setStats: (stats) => set({ stats }),

  timerMode: 'idle',
  timerSeconds: 0,
  timerSubjectId: null,
  timerTaskId: null,
  timerRunning: false,

  setTimerMode: (mode) => set({ timerMode: mode, timerSeconds: FOCUS_DURATIONS[mode] || 0 }),

  startTimer: (mode, subjectId = null, taskId = null) => {
    set({
      timerMode: mode,
      timerSeconds: FOCUS_DURATIONS[mode] || 0,
      timerSubjectId: subjectId,
      timerTaskId: taskId,
      timerRunning: true,
    });
  },

  stopTimer: () => {
    const { timerSeconds, timerMode, timerSubjectId, timerTaskId, timerRunning } = get();
    if (timerRunning && timerMode !== 'idle') {
      const durationMinutes = Math.ceil((FOCUS_DURATIONS[timerMode] - timerSeconds) / 60);
      // Log the session to the backend
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: timerSubjectId,
          taskId: timerTaskId,
          durationMinutes,
          mode: timerMode,
        }),
      }).catch(console.error);
    }
    set({
      timerMode: 'idle',
      timerSeconds: 0,
      timerRunning: false,
    });
  },

  tickTimer: () => {
    const { timerSeconds, timerRunning } = get();
    if (!timerRunning || timerSeconds <= 0) {
      set({ timerRunning: false });
      return;
    }
    set({ timerSeconds: timerSeconds - 1 });
  },

  lastXPGained: 0,
  showXPAnimation: false,
  triggerXPAnimation: (xp) => {
    set({ lastXPGained: xp, showXPAnimation: true });
    setTimeout(() => set({ showXPAnimation: false }), 2000);
  },

  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  showAddTask: false,
  setShowAddTask: (show) => set({ showAddTask: show }),

  showAddRoutine: false,
  setShowAddRoutine: (show) => set({ showAddRoutine: show }),
}));
