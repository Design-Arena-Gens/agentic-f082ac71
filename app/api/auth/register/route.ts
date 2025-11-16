import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSessionFor } from '@/lib/auth'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const name = String(body?.name ?? '').trim()
  const password = String(body?.password ?? '')
  if (!name || !password) return NextResponse.json({ error: 'Nama dan password wajib' }, { status: 400 })

  const passwordHash = await hashPassword(password)
  const isFirstUser = db.users.size === 0
  const user = db.createUser({ name, passwordHash, isAdmin: isFirstUser })
  const session = createSessionFor(user.userId)
  return NextResponse.json({ userId: user.userId, name: user.name, isAdmin: user.isAdmin, token: session.token })
}
