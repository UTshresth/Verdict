export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

// GET: Fetch all messages for a room
export async function GET(req: Request, { params }: any) {
  try {
    const { roomId } = await params;

    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, content: true, sender: true, side: true, isSystem: true, userId: true, createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST: Send a message (stores in DB after moderation)
export async function POST(req: Request, { params }: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId } = await params;
    const { content, side, sender } = await req.json();

    if (!content || !side) return NextResponse.json({ error: 'Missing content or side' }, { status: 400 });

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    if (room.status === 'COMPLETED' || (room.argumentDeadline && new Date() > room.argumentDeadline)) {
      return NextResponse.json({ error: 'Debate is closed.' }, { status: 403 });
    }

    if (room.status === 'OPEN' || (room.bettingDeadline && new Date() < room.bettingDeadline)) {
      if (!room.adminControls || room.status !== 'LIVE') {
         return NextResponse.json({ error: 'Debate has not started yet.' }, { status: 403 });
      }
    }

    const message = await prisma.message.create({
      data: {
        roomId,
        userId: user.id,
        content,
        side,
        sender: sender || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
