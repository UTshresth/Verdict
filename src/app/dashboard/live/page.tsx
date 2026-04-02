import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import LiveClient from './LiveClient';

export default async function LiveDebatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/');
  }

  const [publicRooms, invites] = await Promise.all([
    prisma.room.findMany({
      where: { 
        type: 'PUBLIC',
        status: { not: 'COMPLETED' } 
      },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { participants: true } } }
    }),
    prisma.roomInvite.findMany({
      where: { userId: user.id },
      include: { room: { include: { _count: { select: { participants: true } } } } },
      orderBy: { createdAt: 'desc' }
    })
  ]);
  const privateRooms = invites.map((i: any) => ({
    ...i.room,
    inviteStatus: i.status,
    inviteId: i.id
  }));

  const serialize = (rooms: any[]) => rooms.map(r => ({
    ...r,
    createdAt: r.createdAt?.toISOString?.() || r.createdAt,
    updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
    deadline: r.deadline?.toISOString?.() || null,
    bettingDeadline: r.bettingDeadline?.toISOString?.() || null,
    argumentDeadline: r.argumentDeadline?.toISOString?.() || null,
  }));

  return (
    <LiveClient
      publicRooms={serialize(publicRooms)}
      privateRooms={serialize(privateRooms)}
    />
  );
}
