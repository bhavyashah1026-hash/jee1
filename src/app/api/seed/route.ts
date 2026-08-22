import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Seed subjects
    const existingSubjects = await db.subject.count();
    if (existingSubjects === 0) {
      await db.subject.createMany({
        data: [
          { name: 'Physics', color: '#f59e0b', icon: 'Atom' },
          { name: 'Chemistry', color: '#10b981', icon: 'FlaskConical' },
          { name: 'Mathematics', color: '#ef4444', icon: 'Sigma' },
        ],
      });
    }

    // Seed user profile
    const existingProfile = await db.userProfile.count();
    if (existingProfile === 0) {
      await db.userProfile.create({
        data: {
          totalXP: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          totalStudyMinutes: 0,
          totalTasksCompleted: 0,
        },
      });
    }

    // Seed default routines
    const existingRoutines = await db.routine.count();
    if (existingRoutines === 0) {
      const physics = await db.subject.findFirst({ where: { name: 'Physics' } });
      const chemistry = await db.subject.findFirst({ where: { name: 'Chemistry' } });
      const math = await db.subject.findFirst({ where: { name: 'Mathematics' } });

      await db.routine.createMany({
        data: [
          {
            title: 'Morning Physics',
            description: 'Concept building & theory',
            subjectId: physics?.id,
            startTime: '06:00',
            endTime: '08:00',
            daysActive: '1,2,3,4,5,6',
            color: '#f59e0b',
            orderIndex: 0,
          },
          {
            title: 'Chemistry Deep Dive',
            description: 'Organic + Inorganic practice',
            subjectId: chemistry?.id,
            startTime: '09:00',
            endTime: '11:00',
            daysActive: '1,2,3,4,5,6',
            color: '#10b981',
            orderIndex: 1,
          },
          {
            title: 'Mathematics Grind',
            description: 'Problem solving & calculus',
            subjectId: math?.id,
            startTime: '14:00',
            endTime: '17:00',
            daysActive: '1,2,3,4,5,6',
            color: '#ef4444',
            orderIndex: 2,
          },
          {
            title: 'Evening Revision',
            description: 'Review & weak topics',
            startTime: '19:00',
            endTime: '21:00',
            daysActive: '1,2,3,4,5,6',
            color: '#8b5cf6',
            orderIndex: 3,
          },
          {
            title: 'Weekly Mock Test',
            description: 'Full-length JEE mock',
            startTime: '09:00',
            endTime: '12:00',
            daysActive: '7',
            color: '#ec4899',
            orderIndex: 4,
          },
        ],
      });
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
