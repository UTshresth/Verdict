import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import RoomsClient from './RoomsClient';

export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/');
  }

  const [createdRooms, participations] = await Promise.all([
    prisma.room.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { participants: true, wagers: true } } }
    }),
    prisma.roomParticipant.findMany({
      where: { userId: user.id },
      include: { room: { include: { _count: { select: { participants: true, wagers: true } } } } },
      orderBy: { createdAt: 'desc' }
    })
  ]);
  const joinedRooms = participations.map((p: any) => p.room);

  // Serialize dates
  const serialize = (rooms: any[]) => rooms.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deadline: r.deadline?.toISOString() || null,
    bettingDeadline: r.bettingDeadline?.toISOString() || null,
    argumentDeadline: r.argumentDeadline?.toISOString() || null,
  }));

  return (
    <RoomsClient
      createdRooms={serialize(createdRooms)}
      joinedRooms={serialize(joinedRooms)}
      userId={user.id}
    />
  );
}
