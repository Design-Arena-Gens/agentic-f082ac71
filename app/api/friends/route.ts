import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const friends = Array.from(me.friends).map((id) => {
    const u = db.users.get(id)
    return u ? { userId: u.userId, name: u.name, status: u.status, avatarUrl: u.avatarUrl } : undefined
  }).filter(Boolean)
  return NextResponse.json({ friends })
}

export async function POST(req: Request) {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const friendId = String(body?.userId ?? '').toUpperCase()
  if (!friendId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (!db.users.has(friendId)) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  db.addFriend(me.userId, friendId)
  db.emitToUser(friendId, { type: 'friend_request', payload: { fromUserId: me.userId } })
  return NextResponse.json({ ok: true })
}
