import { NextResponse } from 'next/server'
import { clearSessionCookie, getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST() {
  const token = (await import('next/headers')).cookies().get('privat_session')?.value
  if (token) db.sessions.delete(token)
  clearSessionCookie()
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const me = getCurrentUser()
  return NextResponse.json({ user: me ? { userId: me.userId, name: me.name, isAdmin: !!me.isAdmin } : null })
}
