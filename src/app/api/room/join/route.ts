import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId, side } = await req.json();
    if (!roomId || !side) return NextResponse.json({ error: 'Missing roomId or side' }, { status: 400 });

    // Ensure user exists in our DB (upsert from Supabase auth)
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        image: user.user_metadata?.avatar_url,
      }
    });

    // Check room exists and isn't completed
    const room = await prisma.room.findUnique({ where: { id: roomId }, include: { _count: { select: { participants: true } } } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    // Check participant limit
    if (room.participantLimit && room._count.participants >= room.participantLimit) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 });
    }

    // Create participant (upsert to avoid dupes)
    const participant = await prisma.roomParticipant.upsert({
      where: { roomId_userId: { roomId, userId: user.id } },
      update: { side: side },
      create: { roomId, userId: user.id, side: side },
    });

    // Automatically accept any pending invite for this room
    await prisma.roomInvite.updateMany({
      where: {
        roomId: roomId,
        userId: user.id,
        status: 'PENDING'
      },
      data: {
        status: 'ACCEPTED'
      }
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error('Join error:', error);
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 });
  }
}
