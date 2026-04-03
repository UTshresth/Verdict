export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, image } = await request.json();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name && { name }),
      ...(image && { image }),
    },
  });

  return NextResponse.json({ success: true, user: updated });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return NextResponse.json({ user: dbUser });
}
