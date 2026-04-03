import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.session?.user) {
      // Sync Google Auth user directly into our Prisma Public Schema!
      const userPrimary = data.session.user
      try {
        await prisma.user.upsert({
          where: { id: userPrimary.id },
          update: {
            email: userPrimary.email,
            // We only update email here to preserve user-set names and avatars in the database
          },
          create: {
            id: userPrimary.id,
            email: userPrimary.email,
            name: userPrimary.user_metadata?.full_name || 'Anonymous',
            image: userPrimary.user_metadata?.avatar_url
          }
        })
      } catch (e) {
        console.error("Failed to sync user to Prisma DB:", e)
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalhost = process.env.NODE_ENV === 'development'
      
      if (isLocalhost) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
