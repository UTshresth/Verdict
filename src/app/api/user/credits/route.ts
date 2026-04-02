import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Upsert user in case they don't exist in our DB yet
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        image: user.user_metadata?.avatar_url,
      },
    });

    // Get recent wager history
    const wagers = await prisma.wager.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        room: { select: { topic: true, status: true, winningSide: true, sideAPov: true, sideBPov: true } },
      },
    });

    return NextResponse.json({
      balance: dbUser.walletBalance,
      totalWins: dbUser.totalWins,
      totalLosses: dbUser.totalLosses,
      wagers: wagers.map(w => ({
        id: w.id,
        amount: w.amount,
        side: w.sideChosen,
        paidOut: w.paidOut,
        createdAt: w.createdAt.toISOString(),
        room: w.room,
      })),
    });
  } catch (error) {
    console.error('Credits error:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}
