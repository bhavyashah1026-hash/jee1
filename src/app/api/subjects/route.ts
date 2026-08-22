import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/subjects
export async function GET() {
  try {
    const subjects = await db.subject.findMany({
      include: {
        _count: {
          select: {
            tasks: true,
            sessions: true,
          },
        },
      },
    });
    return NextResponse.json(subjects);
  } catch (error) {
    console.error('GET subjects error:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}
