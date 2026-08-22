import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/sessions — get study sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const sessions = await db.studySession.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: { subject: true },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('GET sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST /api/sessions — log a study session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subjectId, taskId, durationMinutes, mode } = body;

    const session = await db.studySession.create({
      data: {
        subjectId: subjectId || null,
        taskId: taskId || null,
        durationMinutes: durationMinutes || 0,
        mode: mode || 'focus',
        endedAt: new Date(),
      },
      include: { subject: true },
    });

    // Update today's streak
    const today = new Date().toISOString().split('T')[0];
    await db.streak.upsert({
      where: { date: today },
      create: { date: today, studyMinutes: durationMinutes },
      update: { studyMinutes: { increment: durationMinutes } },
    });

    // Update profile
    await db.userProfile.updateMany({
      data: { totalStudyMinutes: { increment: durationMinutes } },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('POST session error:', error);
    return NextResponse.json({ error: 'Failed to log session' }, { status: 500 });
  }
}
