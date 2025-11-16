import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: Request) {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const groupId = String(searchParams.get('groupId') ?? '')
  if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
  const msgs = db.getGroupMessages(groupId)
  return NextResponse.json({ messages: msgs })
}

export async function POST(req: Request) {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const groupId = String(body?.groupId ?? '')
  const text = typeof body?.text === 'string' ? body.text : undefined
  const fileId = typeof body?.fileId === 'string' ? body.fileId : undefined
  if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })
  const msg = db.sendMessage({ senderId: me.userId, recipientGroupId: groupId, text, fileId })
  return NextResponse.json({ message: msg })
}
