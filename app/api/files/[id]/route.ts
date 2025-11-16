import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const file = db.files.get(params.id)
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const res = NextResponse.json({ file })
  return res
}
