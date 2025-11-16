import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const me = getCurrentUser()
  if (!me || !me.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const users = Array.from(db.users.values()).map((u) => ({ userId: u.userId, name: u.name, isAdmin: !!u.isAdmin }))
  const groups = Array.from(db.groups.values()).map((g) => ({ groupId: g.groupId, name: g.name, members: g.members.size }))
  return NextResponse.json({ users, groups })
}

export async function DELETE(req: Request) {
  const me = getCurrentUser()
  if (!me || !me.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json().catch(() => ({}))
  if (body.userId) {
    db.users.delete(String(body.userId))
    return NextResponse.json({ ok: true })
  }
  if (body.groupId) {
    db.groups.delete(String(body.groupId))
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'userId or groupId required' }, { status: 400 })
}
