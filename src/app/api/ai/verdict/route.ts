export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { deliverVerdict } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId, messages } = await req.json();

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    if (room.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only the room admin can summon the judge' }, { status: 403 });
    }

    // Get AI verdict
    const result = await deliverVerdict(
      room.topic,
      room.sideAPov,
      room.sideBPov,
      room.judgeMode,
      messages || []
    );

    const winningSide = result.winner; // 'A' or 'B'

    // Update room: set winner, status, verdict
    const updateRoom = prisma.room.update({
      where: { id: roomId },
      data: { 
        status: 'COMPLETED', 
        winningSide: winningSide,
        verdict: result.verdict,
      }
    });

    const addVerdictMessage = prisma.message.create({
      data: {
        roomId,
        userId: user.id, // Admin's user ID triggering it
        content: `🏆 VERDICT: Side ${winningSide} wins!\n\n${result.verdict}`,
        sender: 'System',
        isSystem: true,
      }
    });

    await prisma.$transaction([updateRoom, addVerdictMessage]);

    // === PAYOUT LOGIC ===
    const allWagers = await prisma.wager.findMany({ where: { roomId, paidOut: false } });
    
    const winningWagers = allWagers.filter(w => w.sideChosen === winningSide);
    const losingWagers = allWagers.filter(w => w.sideChosen !== winningSide);
    
    const totalPool = allWagers.reduce((sum, w) => sum + w.amount, 0);
    const winningPool = winningWagers.reduce((sum, w) => sum + w.amount, 0);

    if (winningWagers.length > 0 && winningPool > 0) {
      // Distribute proportionally: each winner gets their share of the total pool
      const payoutOps = winningWagers.map(w => {
        const share = Math.floor((w.amount / winningPool) * totalPool);
        return prisma.user.update({
          where: { id: w.userId },
          data: { 
            walletBalance: { increment: share },
            totalWins: { increment: 1 },
          },
        });
      });

      // Mark losers
      const loserOps = losingWagers.length > 0
        ? [...new Set(losingWagers.map(w => w.userId))].map(uid =>
            prisma.user.update({ where: { id: uid }, data: { totalLosses: { increment: 1 } } })
          )
        : [];

      // Mark all wagers as paid out
      const markPaid = prisma.wager.updateMany({
        where: { roomId },
        data: { paidOut: true },
      });

      await prisma.$transaction([...payoutOps, ...loserOps, markPaid]);
    } else if (allWagers.length > 0) {
      // Edge case: no winning wagers — refund everyone
      const refundOps = allWagers.map(w =>
        prisma.user.update({
          where: { id: w.userId },
          data: { walletBalance: { increment: w.amount } },
        })
      );
      const markPaid = prisma.wager.updateMany({
        where: { roomId },
        data: { paidOut: true },
      });
      await prisma.$transaction([...refundOps, markPaid]);
    }

    return NextResponse.json({ winner: winningSide, verdict: result.verdict });
  } catch (error) {
    console.error('Verdict error:', error);
    return NextResponse.json({ error: 'Failed to deliver verdict' }, { status: 500 });
  }
}
