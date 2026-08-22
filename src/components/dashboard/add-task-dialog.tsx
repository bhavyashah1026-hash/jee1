'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useJEEStore, type Difficulty, type Priority } from '@/store/use-jee-store';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().default(''),
  subjectId: z.string().optional().default(''),
  difficulty: z.enum(['easy', 'normal', 'hard', 'extreme', 'legendary']).default('normal'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  estimatedMinutes: z.coerce.number().min(1).max(480).optional().default(30),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: '#22c55e' },
  { value: 'normal', label: 'Normal', color: '#3b82f6' },
  { value: 'hard', label: 'Hard', color: '#f97316' },
  { value: 'extreme', label: 'Extreme', color: '#ef4444' },
  { value: 'legendary', label: 'Legendary', color: '#a855f7' },
];

interface AddTaskDialogProps {
  onTaskCreated?: () => void;
}

export function AddTaskDialog({ onTaskCreated }: AddTaskDialogProps) {
  const { showAddTask, setShowAddTask } = useJEEStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      subjectId: '',
      difficulty: 'normal',
      priority: 'medium',
      estimatedMinutes: 30,
    },
  });

  const watchDifficulty = watch('difficulty');
  const watchSubjectId = watch('subjectId');
  const watchPriority = watch('priority');

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then(setSubjects)
      .catch(() => {});
  }, []);

  const onSubmit = async (data: TaskFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        subjectId: data.subjectId || null,
        description: data.description || null,
        estimatedMinutes: data.estimatedMinutes || null,
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create task');

      toast.success('Quest added!', { description: data.title });
      reset();
      setShowAddTask(false);
      onTaskCreated?.();
    } catch {
      toast.error('Failed to create quest');
    } finally {
      setSubmitting(false);
    }
  };

  // Close and reset form
  const handleOpenChange = (open: boolean) => {
    setShowAddTask(open);
    if (!open) reset();
  };

  return (
    <Dialog open={showAddTask} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-400">
            <Plus className="w-5 h-5" />
            New Quest
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new study quest to conquer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title" className="text-slate-300 text-sm">
              Quest Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Solve 50 JEE Physics problems"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-amber-500/50"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description" className="text-slate-300 text-sm">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Optional details about this quest..."
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-amber-500/50 min-h-[60px]"
              {...register('description')}
            />
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-slate-300 text-sm">Subject</Label>
            <Select
              value={watchSubjectId || '__none__'}
              onValueChange={(val) => setValue('subjectId', val === '__none__' ? '' : val)}
            >
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select subject (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="__none__" className="text-slate-400">No subject</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">Difficulty</Label>
            <RadioGroup
              value={watchDifficulty}
              onValueChange={(val) => setValue('difficulty', val as Difficulty)}
              className="flex flex-wrap gap-2"
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <label
                  key={d.value}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-xs font-medium ${
                    watchDifficulty === d.value
                      ? 'border-current'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                  style={
                    watchDifficulty === d.value
                      ? { color: d.color, borderColor: d.color, boxShadow: `0 0 10px ${d.color}30` }
                      : {}
                  }
                >
                  <RadioGroupItem value={d.value} className="sr-only" />
                  {d.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Priority & Estimated Time in a row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-slate-300 text-sm">Priority</Label>
              <Select
                value={watchPriority}
                onValueChange={(val) => setValue('priority', val as Priority)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estimatedMinutes" className="text-slate-300 text-sm">
                Est. Minutes
              </Label>
              <Input
                id="estimatedMinutes"
                type="number"
                min={1}
                max={480}
                className="bg-slate-900 border-slate-700 text-white font-mono focus-visible:ring-amber-500/50"
                {...register('estimatedMinutes')}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Quest
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
