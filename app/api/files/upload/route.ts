import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { dataUrl, mimeType, name, size } = body || {}
  if (typeof dataUrl !== 'string' || typeof mimeType !== 'string' || typeof name !== 'string' || typeof size !== 'number') {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }
  const file = db.storeFile({ dataUrl, mimeType, name, size, uploaderId: me.userId })
  return NextResponse.json({ file })
}
