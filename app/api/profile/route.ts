import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { userId, name, avatarUrl, status, privacy } = me
  return NextResponse.json({ userId, name, avatarUrl, status, privacy })
}

export async function PUT(req: Request) {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (typeof body.name === 'string') me.name = body.name.trim().slice(0, 80)
  if (typeof body.status === 'string') me.status = body.status.trim().slice(0, 140)
  if (typeof body.avatarUrl === 'string') me.avatarUrl = body.avatarUrl
  if (body.privacy === 'public' || body.privacy === 'friends' || body.privacy === 'private') me.privacy = body.privacy
  db.users.set(me.userId, me)
  return NextResponse.json({ ok: true })
}
