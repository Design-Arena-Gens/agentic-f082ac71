import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSessionFor } from '@/lib/auth'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const userId = String(body?.userId ?? '').trim().toUpperCase()
  const password = String(body?.password ?? '')
  if (!userId || !password) return NextResponse.json({ error: 'ID dan password wajib' }, { status: 400 })

  const user = db.users.get(userId)
  if (!user) return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 404 })
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return NextResponse.json({ error: 'Password salah' }, { status: 401 })

  const session = createSessionFor(user.userId)
  return NextResponse.json({ userId: user.userId, name: user.name, isAdmin: user.isAdmin, token: session.token })
}
