import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const groups = Array.from(db.groups.values()).filter((g) => g.members.has(me.userId))
  return NextResponse.json({ groups: groups.map((g) => ({ ...g, members: Array.from(g.members) })) })
}

export async function POST(req: Request) {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const name = String(body?.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const group = db.createGroup(me.userId, name)
  return NextResponse.json({ group: { ...group, members: Array.from(group.members) } })
}

export async function PUT(req: Request) {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const groupId = String(body?.groupId ?? '')
  if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
  const group = db.joinGroup(me.userId, groupId)
  return NextResponse.json({ group: { ...group, members: Array.from(group.members) } })
}
