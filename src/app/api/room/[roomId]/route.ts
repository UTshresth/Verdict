import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(req: Request, { params }: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only the room creator can delete this room' }, { status: 403 });
    }

    await prisma.room.delete({ where: { id: roomId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Room delete error:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await req.json();
    const { action } = body;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only the admin can control this room' }, { status: 403 });
    }

    let updateData: any = {};

    if (action === 'END_BETTING') {
      updateData.status = 'LIVE';
    } else if (action === 'END_DEBATE') {
      updateData.status = 'COMPLETED';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: updateData,
    });

    return NextResponse.json({ room: updated });
  } catch (error) {
    console.error('Room update error:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}
