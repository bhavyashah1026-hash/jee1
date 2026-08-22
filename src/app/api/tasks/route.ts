import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const XP_REWARDS: Record<string, number> = {
  easy: 15,
  normal: 25,
  hard: 50,
  extreme: 100,
  legendary: 200,
};

// GET /api/tasks — fetch today's tasks (and optionally all)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const all = searchParams.get('all') === 'true';

    if (all) {
      const tasks = await db.task.findMany({
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
        include: { subject: true },
      });
      return NextResponse.json(tasks);
    }

    const tasks = await db.task.findMany({
      where: {
        OR: [
          { scheduledFor: date },
          { scheduledFor: null },
        ],
      },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
      include: { subject: true },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks — create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, subjectId, difficulty, estimatedMinutes, priority, scheduledFor } = body;

    const xpReward = XP_REWARDS[difficulty] || XP_REWARDS.normal;

    const taskCount = await db.task.count();

    const task = await db.task.create({
      data: {
        title,
        description: description || null,
        subjectId: subjectId || null,
        difficulty: difficulty || 'normal',
        xpReward,
        estimatedMinutes: estimatedMinutes || null,
        priority: priority || 'medium',
        scheduledFor: scheduledFor || null,
        orderIndex: taskCount,
      },
      include: { subject: true },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST task error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PATCH /api/tasks — update a task (status, reorder, edit)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, orderIndex, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const existingTask = await db.task.findUnique({ where: { id } });
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // If completing a task, handle XP and streak
    let xpGained = 0;
    if (status === 'completed' && existingTask.status !== 'completed') {
      xpGained = existingTask.xpReward;
      const today = new Date().toISOString().split('T')[0];

      // Update streak
      const todayStreak = await db.streak.upsert({
        where: { date: today },
        create: { date: today, tasksCompleted: 1, totalXP: xpGained },
        update: { tasksCompleted: { increment: 1 }, totalXP: { increment: xpGained } },
      });

      // Update user profile
      await db.userProfile.updateMany({
        data: {
          totalXP: { increment: xpGained },
          totalTasksCompleted: { increment: 1 },
          // Level formula: level = floor(sqrt(totalXP / 100)) + 1
        },
      });

      // Recalculate level
      const profile = await db.userProfile.findFirst();
      if (profile) {
        const newLevel = Math.floor(Math.sqrt(profile.totalXP / 100)) + 1;
        await db.userProfile.updateMany({
          data: { level: newLevel },
        });
      }

      // Update streak count
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayStreak = await db.streak.findUnique({ where: { date: yesterdayStr } });

      if (yesterdayStreak) {
        await db.userProfile.updateMany({
          data: { currentStreak: { increment: 1 } },
        });
      } else {
        // Check if today streak was already updated
        if (todayStreak.tasksCompleted === 1) {
          await db.userProfile.updateMany({
            data: { currentStreak: 1 },
          });
        }
      }

      // Update longest streak
      const updatedProfile = await db.userProfile.findFirst();
      if (updatedProfile && updatedProfile.currentStreak > updatedProfile.longestStreak) {
        await db.userProfile.updateMany({
          data: { longestStreak: updatedProfile.currentStreak },
        });
      }
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...(status && { status, completedAt: status === 'completed' ? new Date() : null }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...updates,
      },
      include: { subject: true },
    });

    return NextResponse.json({ task, xpGained });
  } catch (error) {
    console.error('PATCH task error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks — remove a task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await db.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE task error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
