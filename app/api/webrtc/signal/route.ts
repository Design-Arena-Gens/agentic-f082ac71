import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const targetId = String(body?.targetId ?? '')
  const signal = body?.signal
  if (!targetId || !signal) return NextResponse.json({ error: 'targetId and signal required' }, { status: 400 })
  db.emitToUser(targetId, { type: 'webrtc_signal', payload: { fromUserId: me.userId, targetId, signal } })
  return NextResponse.json({ ok: true })
}
