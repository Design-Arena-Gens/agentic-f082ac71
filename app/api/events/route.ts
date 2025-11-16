import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const me = getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (event: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      const unsubscribe = db.subscribe(me.userId, send)
      send({ type: 'hello', payload: { now: Date.now(), userId: me.userId } })
      controller.enqueue(encoder.encode(': connected\n\n'))
      // heartbeat
      const interval = setInterval(() => controller.enqueue(encoder.encode(': ping\n\n')), 20000)
      ;(controller as any)._cleanup = () => {
        clearInterval(interval)
        unsubscribe()
      }
    },
    cancel() {
      const c = this as any
      if (c._cleanup) c._cleanup()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    }
  })
}
