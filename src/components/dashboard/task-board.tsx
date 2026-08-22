'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJEEStore, type Task, type Difficulty, type TaskStatus, type Priority } from '@/store/use-jee-store';
import { AddTaskDialog } from './add-task-dialog';
import { Badge } from '@/components/ui/badge';
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
import {
  Plus,
  Trash2,
  Clock,
  Flame,
  Zap,
  Swords,
  Star,
  CheckCircle2,
  Circle,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// Difficulty visual config
const DIFFICULTY_CONFIG: Record<Difficulty, { color: string; label: string; glow: string }> = {
  easy: { color: '#22c55e', label: 'Easy', glow: 'shadow-[0_0_8px_rgba(34,197,94,0.3)]' },
  normal: { color: '#3b82f6', label: 'Normal', glow: '' },
  hard: { color: '#f97316', label: 'Hard', glow: 'shadow-[0_0_8px_rgba(249,115,22,0.3)]' },
  extreme: { color: '#ef4444', label: 'Extreme', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]' },
  legendary: { color: '#a855f7', label: 'Legendary', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]' },
};

const PRIORITY_CONFIG: Record<Priority, { icon: React.ReactNode; color: string }> = {
  low: { icon: null, color: 'text-slate-500' },
  medium: { icon: <AlertTriangle className="w-3 h-3" />, color: 'text-yellow-500' },
  high: { icon: <Flame className="w-3 h-3" />, color: 'text-orange-500' },
  critical: { icon: <Zap className="w-3 h-3" />, color: 'text-red-500' },
};

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
  skipped: 'pending',
};

const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  pending: <Circle className="w-5 h-5 text-slate-500" />,
  in_progress: <Timer className="w-5 h-5 text-amber-400" />,
  completed: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  skipped: <Circle className="w-5 h-5 text-slate-600" />,
};

type FilterTab = 'all' | 'pending' | 'in_progress' | 'completed';

const FILTER_TABS: { value: FilterTab; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Swords className="w-3.5 h-3.5" /> },
  { value: 'pending', label: 'Pending', icon: <Circle className="w-3.5 h-3.5" /> },
  { value: 'in_progress', label: 'Active', icon: <Timer className="w-3.5 h-3.5" /> },
  { value: 'completed', label: 'Done', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
];

export function TaskBoard() {
  const { tasks, setTasks, setShowAddTask, triggerXPAnimation, setStats } = useJEEStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [togglingTask, setTogglingTask] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks?all=true');
      const data = await res.json();
      setTasks(data);
    } catch {
      toast.error('Failed to load quests');
    } finally {
      setLoading(false);
    }
  }, [setTasks]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch {/* silent */}
  }, [setStats]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filter tasks
  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filter);

  // Group by status for column layout
  const grouped = {
    pending: tasks.filter((t) => t.status === 'pending'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    completed: tasks.filter((t) => t.status === 'completed'),
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = STATUS_CYCLE[task.status];
    if (!nextStatus) return;

    setTogglingTask(task.id);
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      const data = await res.json();

      // If completed, trigger XP animation
      if (nextStatus === 'completed' && data.xpGained > 0) {
        triggerXPAnimation(data.xpGained);
        toast.success(`Quest completed! +${data.xpGained} XP`, {
          description: task.title,
        });
      }

      // Refresh tasks and stats
      await Promise.all([fetchTasks(), fetchStats()]);
    } catch {
      toast.error('Failed to update quest');
    } finally {
      setTogglingTask(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      const res = await fetch(`/api/tasks?id=${deletingTask.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Quest deleted');
      fetchTasks();
    } catch {
      toast.error('Failed to delete quest');
    } finally {
      setDeletingTask(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header with add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            Quest Board
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {tasks.filter((t) => t.status === 'completed').length}/{tasks.length} quests completed
          </p>
        </div>
        <Button
          onClick={() => setShowAddTask(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          New Quest
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/50 w-fit">
        {FILTER_TABS.map((tab) => {
          const count = tab.value === 'all'
            ? tasks.length
            : tasks.filter((t) => t.status === tab.value).length;
          const isActive = filter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className={`font-mono text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full bg-slate-900 rounded-xl" />
          ))}
        </div>
      )}

      {/* Task list (filtered) */}
      {!loading && filter !== 'all' && (
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-slate-500"
              >
                <Star className="w-8 h-8 mb-2 text-slate-700" />
                <p className="text-sm">No {filter.replace('_', ' ')} quests</p>
                <p className="text-xs text-slate-600 mt-1">Create a new quest to get started</p>
              </motion.div>
            )}
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => handleToggleStatus(task)}
                onDelete={() => setDeletingTask(task)}
                toggling={togglingTask === task.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Column view (all) */}
      {!loading && filter === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusColumn
            title="Pending"
            tasks={grouped.pending}
            onToggle={handleToggleStatus}
            onDelete={(t) => setDeletingTask(t)}
            togglingId={togglingTask}
            accentColor="text-slate-400"
          />
          <StatusColumn
            title="In Progress"
            tasks={grouped.in_progress}
            onToggle={handleToggleStatus}
            onDelete={(t) => setDeletingTask(t)}
            togglingId={togglingTask}
            accentColor="text-amber-400"
          />
          <StatusColumn
            title="Completed"
            tasks={grouped.completed}
            onToggle={handleToggleStatus}
            onDelete={(t) => setDeletingTask(t)}
            togglingId={togglingTask}
            accentColor="text-emerald-400"
          />
        </div>
      )}

      <AddTaskDialog onTaskCreated={fetchTasks} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingTask} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <AlertDialogContent className="bg-slate-950 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Quest?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently remove &quot;{deletingTask?.title}&quot;. This action cannot be undone.
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

// Individual task card
function TaskCard({ task, onToggle, onDelete, toggling }: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  toggling: boolean;
}) {
  const diff = DIFFICULTY_CONFIG[task.difficulty];
  const prio = PRIORITY_CONFIG[task.priority];
  const isCompleted = task.status === 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -1 }}
      className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-colors ${
        isCompleted
          ? 'bg-slate-900/40 border-slate-800/30'
          : 'bg-slate-900/80 border-slate-700/50 hover:border-slate-600/50'
      } ${diff.glow}`}
    >
      {/* Status toggle button */}
      <button
        onClick={onToggle}
        disabled={toggling}
        className="mt-0.5 shrink-0 opacity-70 hover:opacity-100 transition-opacity disabled:opacity-40"
        title={`Click to mark ${STATUS_CYCLE[task.status]}`}
      >
        {STATUS_ICON[task.status]}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`text-sm font-semibold leading-tight ${
              isCompleted ? 'text-slate-500 line-through' : 'text-white'
            }`}
          >
            {task.title}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tags row */}
        <div className="flex items-center flex-wrap gap-1.5 mt-2">
          {/* Difficulty badge */}
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ color: diff.color, backgroundColor: `${diff.color}15`, border: `1px solid ${diff.color}30` }}
          >
            {diff.label}
          </span>

          {/* Subject tag */}
          {task.subject && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                color: task.subject.color,
                backgroundColor: `${task.subject.color}15`,
              }}
            >
              {task.subject.name}
            </span>
          )}

          {/* Priority indicator */}
          {prio.icon && (
            <span className={`flex items-center gap-0.5 ${prio.color}`}>
              {prio.icon}
              <span className="text-[10px] uppercase font-medium">{task.priority}</span>
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-amber-400/80 font-mono">
            <Zap className="w-3 h-3" />
            +{task.xpReward} XP
          </span>
          {task.estimatedMinutes && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
              <Clock className="w-3 h-3" />
              {task.estimatedMinutes}m
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Column for status groups
function StatusColumn({ title, tasks, onToggle, onDelete, togglingId, accentColor }: {
  title: string;
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  togglingId: string | null;
  accentColor: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className={`text-xs font-bold uppercase tracking-widest ${accentColor}`}>
          {title}
        </h3>
        <Badge
          variant="secondary"
          className="bg-slate-800 text-slate-400 text-[10px] font-mono h-5 px-1.5"
        >
          {tasks.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-slate-600 text-xs"
            >
              No quests
            </motion.div>
          )}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => onToggle(task)}
              onDelete={() => onDelete(task)}
              toggling={togglingId === task.id}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
