import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { validateRoom } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      type, topic, sideA, sideB, judgeMode, maxCred, 
      bettingDeadline, argumentDeadline, adminControls, participantLimit
    } = body;

    if (!topic || !sideA || !sideB) {
      return NextResponse.json({ error: 'Missing required configuration' }, { status: 400 });
    }

    // AI Gatekeeper: Validate room topic via Groq LLM
    const validation = await validateRoom(topic, sideA, sideB);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: `Room rejected by AI: ${validation.reason}` 
      }, { status: 422 });
    }

    const room = await prisma.room.create({
      data: {
        creatorId: user.id,
        type: type === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
        topic,
        sideAPov: sideA,
        sideBPov: sideB,
        judgeMode: judgeMode || 'ANALYST',
        maxBettingCred: maxCred ? parseInt(maxCred) : null,
        bettingDeadline: bettingDeadline ? new Date(bettingDeadline) : null,
        argumentDeadline: argumentDeadline ? new Date(argumentDeadline) : null,
        adminControls: adminControls || false,
        participantLimit: participantLimit ? parseInt(participantLimit) : null,
        status: 'OPEN',
      }
    });

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    console.error('Room create error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
