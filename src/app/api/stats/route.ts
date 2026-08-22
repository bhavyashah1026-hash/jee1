import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/stats — get user profile + today's streak + overall stats
export async function GET() {
  try {
    const profile = await db.userProfile.findFirst();
    const today = new Date().toISOString().split('T')[0];

    const todayStreak = await db.streak.findUnique({
      where: { date: today },
    });

    // Today's task stats
    const todayTasks = await db.task.findMany({
      where: {
        OR: [
          { scheduledFor: today },
          { scheduledFor: null },
        ],
      },
    });

    const completedToday = todayTasks.filter((t) => t.status === 'completed').length;
    const totalToday = todayTasks.length;
    const pendingToday = todayTasks.filter((t) => t.status === 'pending').length;
    const inProgressToday = todayTasks.filter((t) => t.status === 'in_progress').length;

    // XP to next level
    const totalXP = profile?.totalXP || 0;
    const currentLevel = profile?.level || 1;
    const xpForCurrentLevel = (currentLevel - 1) * (currentLevel - 1) * 100;
    const xpForNextLevel = currentLevel * currentLevel * 100;
    const xpProgress = xpForNextLevel - xpForCurrentLevel;
    const xpInCurrentLevel = totalXP - xpForCurrentLevel;
    const xpPercentage = Math.min((xpInCurrentLevel / xpProgress) * 100, 100);

    // Last 7 days study minutes
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentStreaks = await db.streak.findMany({
      where: { date: { gte: sevenDaysAgoStr } },
      orderBy: { date: 'asc' },
    });

    // Subject-wise breakdown
    const subjects = await db.subject.findMany({
      include: {
        tasks: { where: { status: 'completed' } },
        sessions: true,
      },
    });

    const subjectStats = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      icon: s.icon,
      tasksCompleted: s.tasks.length,
      totalStudyMinutes: s.sessions.reduce((acc, session) => acc + session.durationMinutes, 0),
    }));

    // Recent sessions
    const recentSessions = await db.studySession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: { subject: true },
    });

    return NextResponse.json({
      profile,
      todayStreak,
      taskStats: {
        completedToday,
        totalToday,
        pendingToday,
        inProgressToday,
      },
      xp: {
        totalXP,
        currentLevel,
        xpPercentage,
        xpInCurrentLevel,
        xpNeeded: xpProgress,
      },
      recentStreaks,
      subjectStats,
      recentSessions,
    });
  } catch (error) {
    console.error('GET stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
