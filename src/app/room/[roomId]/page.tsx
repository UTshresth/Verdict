import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import RoomClient from './RoomClient';

export default async function RoomPage({ params }: any) {
  const supabase = await createClient();
  const { roomId } = await params;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Run database lookups concurrently 
  const [room, participant] = await Promise.all([
    prisma.room.findUnique({
      where: { id: roomId },
      include: {
        _count: { select: { participants: true } },
        participants: { select: { side: true } },
        messages: { 
          orderBy: { createdAt: 'desc' }, // latest first
          take: 50 
        }
      }
    }),
    prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId: roomId,
          userId: user.id
        }
      }
    })
  ]);

  if (!room) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#080514', color: '#fff' }}>
        <h2>Arena Not Found</h2>
      </div>
    );
  }

  // Reverse messages so they display chronologically locally
  room.messages.reverse();

  // Serialize dates to ISO strings for client component
  const serializedRoom = {
    ...room,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
    deadline: room.deadline?.toISOString() || null,
    bettingDeadline: room.bettingDeadline?.toISOString() || null,
    argumentDeadline: room.argumentDeadline?.toISOString() || null,
  };

  return (
    <RoomClient 
      room={serializedRoom} 
      currentUser={user} 
      initialParticipant={participant} 
    />
  );
}
