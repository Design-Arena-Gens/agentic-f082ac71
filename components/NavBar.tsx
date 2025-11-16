"use client"
import Link from 'next/link'

export default function NavBar({ user }: { user?: { userId: string; name: string; isAdmin?: boolean } | null }) {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    location.href = '/'
  }
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={user ? '/dashboard' : '/'} className="font-semibold">PrivaT</Link>
        <div className="flex items-center gap-4 text-sm">
          {user && (
            <>
              <span className="hidden sm:inline text-gray-600">{user.name} ({user.userId})</span>
              <button onClick={logout} className="btn px-3 py-1">Keluar</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
