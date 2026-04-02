import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: any) {
  try {
    const { roomId } = await params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        wagerPool: true,
        status: true,
        participants: {
          select: { side: true }
        }
      }
    });

    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sideA = room.participants.filter(p => p.side === 'A').length;
    const sideB = room.participants.filter(p => p.side === 'B').length;

    return NextResponse.json({
      wagerPool: room.wagerPool,
      status: room.status,
      participantsCount: room.participants.length,
      sideA,
      sideB
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
