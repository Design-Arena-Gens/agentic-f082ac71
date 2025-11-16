import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: Request) {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const peerId = String(searchParams.get('peerId') ?? '')
  if (!peerId) return NextResponse.json({ error: 'peerId required' }, { status: 400 })
  const msgs = db.getPrivateChat(me.userId, peerId)
  return NextResponse.json({ messages: msgs })
}

export async function POST(req: Request) {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const toId = String(body?.toId ?? '')
  const text = typeof body?.text === 'string' ? body.text : undefined
  const fileId = typeof body?.fileId === 'string' ? body.fileId : undefined
  if (!toId) return NextResponse.json({ error: 'toId required' }, { status: 400 })
  const msg = db.sendMessage({ senderId: me.userId, recipientUserId: toId, text, fileId })
  return NextResponse.json({ message: msg })
}
