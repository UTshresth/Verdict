import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { moderateMessage } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, topic, sideA, sideB, userSide } = await req.json();

    if (!message || !topic || !userSide) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const result = await moderateMessage(message, topic, sideA || '', sideB || '', userSide);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Moderation error:', error);
    // Fail-open
    return NextResponse.json({ approved: true, reason: 'Moderation service error, message allowed.' });
  }
}
