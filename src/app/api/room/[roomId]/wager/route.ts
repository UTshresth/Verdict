export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

// Place a wager  
export async function POST(req: Request, { params }: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId } = await params;
    const { amount, side } = await req.json();

    if (!amount || !side) return NextResponse.json({ error: 'Missing amount or side' }, { status: 400 });
    
    const wagerAmount = parseInt(amount);
    if (wagerAmount < 100 || wagerAmount > 10000) {
      return NextResponse.json({ error: 'Wager must be between 100 and 10,000' }, { status: 400 });
    }

    // Check room is in betting phase
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    if (room.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Betting is closed. Room has completed.' }, { status: 400 });
    }
    
    if (room.status === 'LIVE' || (room.bettingDeadline && new Date() > room.bettingDeadline)) {
      return NextResponse.json({ error: 'Betting window has closed. Debate is underway.' }, { status: 400 });
    }

    if (room.maxBettingCred && wagerAmount > room.maxBettingCred) {
      return NextResponse.json({ error: `Max bet for this room is ${room.maxBettingCred}` }, { status: 400 });
    }

    // Check user has enough creds
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return NextResponse.json({ error: 'User not found in DB' }, { status: 404 });
    if (dbUser.walletBalance < wagerAmount) {
      return NextResponse.json({ error: `Insufficient creds. You have ${dbUser.walletBalance}` }, { status: 400 });
    }

    // Check if user already wagered in this room
    const existing = await prisma.wager.findFirst({ where: { roomId, userId: user.id } });
    if (existing) {
      return NextResponse.json({ error: 'You already placed a bet in this room' }, { status: 400 });
    }

    // Transaction: deduct wallet + create wager + update pool
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { walletBalance: { decrement: wagerAmount } },
      }),
      prisma.wager.create({
        data: { userId: user.id, roomId, amount: wagerAmount, sideChosen: side },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { wagerPool: { increment: wagerAmount } },
      }),
    ]);

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id }, select: { walletBalance: true } });

    return NextResponse.json({ success: true, newBalance: updatedUser?.walletBalance });
  } catch (error) {
    console.error('Wager error:', error);
    return NextResponse.json({ error: 'Failed to place wager' }, { status: 500 });
  }
}
