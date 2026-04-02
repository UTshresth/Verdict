import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request, { params }: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params;
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    // Verify room exists and user is creator
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only the room creator can send invites' }, { status: 403 });
    }

    // Upsert invite (in case they were previously invited/declined)
    const invite = await prisma.roomInvite.upsert({
      where: {
        roomId_userId: {
          roomId: roomId,
          userId: targetUserId
        }
      },
      update: {
        status: 'PENDING',
        createdAt: new Date(),
      },
      create: {
        roomId,
        userId: targetUserId,
        status: 'PENDING',
      }
    });

    return NextResponse.json({ success: true, invite });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
