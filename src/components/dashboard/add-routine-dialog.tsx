'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useJEEStore } from '@/store/use-jee-store';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLOR_PRESETS = [
  { value: '#f59e0b', label: 'Amber' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
  { value: '#22c55e', label: 'Green' },
];

interface AddRoutineDialogProps {
  onRoutineCreated?: () => void;
}

export function AddRoutineDialog({ onRoutineCreated }: AddRoutineDialogProps) {
  const { showAddRoutine, setShowAddRoutine } = useJEEStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [daysActive, setDaysActive] = useState<number[]>([1, 2, 3, 4, 5]);
  const [color, setColor] = useState('#8b5cf6');

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then(setSubjects)
      .catch(() => {});
  }, []);

  const toggleDay = (dayIndex: number) => {
    setDaysActive((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubjectId('');
    setStartTime('09:00');
    setEndTime('10:00');
    setDaysActive([1, 2, 3, 4, 5]);
    setColor('#8b5cf6');
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      toast.error('Routine title is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        subjectId: subjectId || null,
        startTime,
        endTime,
        daysActive: daysActive.sort().join(','),
        color,
      };

      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create routine');

      toast.success('Routine created!', { description: title });
      resetForm();
      setShowAddRoutine(false);
      onRoutineCreated?.();
    } catch {
      toast.error('Failed to create routine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setShowAddRoutine(open);
    if (!open) resetForm();
  };

  return (
    <Dialog open={showAddRoutine} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-400">
            <Plus className="w-5 h-5" />
            New Routine
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Add a time block to your daily schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="routine-title" className="text-slate-300 text-sm">
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="routine-title"
              placeholder="e.g., Morning Physics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500/50"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="routine-desc" className="text-slate-300 text-sm">
              Description
            </Label>
            <Textarea
              id="routine-desc"
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500/50 min-h-[60px]"
            />
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-slate-300 text-sm">Subject (optional)</Label>
            <Select value={subjectId || '__none__'} onValueChange={(val) => setSubjectId(val === '__none__' ? '' : val)}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select subject" />
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

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="start-time" className="text-slate-300 text-sm">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white font-mono focus-visible:ring-emerald-500/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="end-time" className="text-slate-300 text-sm">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white font-mono focus-visible:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Days Active */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">Active Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day, i) => {
                const dayNum = i + 1;
                const isActive = daysActive.includes(dayNum);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(dayNum)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isActive
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                        : 'border-slate-700 text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Picker */}
          <div className="flex flex-col gap-2">
            <Label className="text-slate-300 text-sm">Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Routine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
