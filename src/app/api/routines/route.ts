import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/routines
export async function GET() {
  try {
    const routines = await db.routine.findMany({
      orderBy: { orderIndex: 'asc' },
      include: { subject: true },
    });
    return NextResponse.json(routines);
  } catch (error) {
    console.error('GET routines error:', error);
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
  }
}

// POST /api/routines
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, subjectId, startTime, endTime, daysActive, color } = body;

    const routineCount = await db.routine.count();

    const routine = await db.routine.create({
      data: {
        title,
        description: description || null,
        subjectId: subjectId || null,
        startTime,
        endTime,
        daysActive: daysActive || '1,2,3,4,5,6,7',
        color: color || '#6366f1',
        orderIndex: routineCount,
      },
      include: { subject: true },
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    console.error('POST routine error:', error);
    return NextResponse.json({ error: 'Failed to create routine' }, { status: 500 });
  }
}

// PATCH /api/routines
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    const routine = await db.routine.update({
      where: { id },
      data: updates,
      include: { subject: true },
    });

    return NextResponse.json(routine);
  } catch (error) {
    console.error('PATCH routine error:', error);
    return NextResponse.json({ error: 'Failed to update routine' }, { status: 500 });
  }
}

// DELETE /api/routines
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Routine ID is required' }, { status: 400 });
    }

    await db.routine.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE routine error:', error);
    return NextResponse.json({ error: 'Failed to delete routine' }, { status: 500 });
  }
}
