"use client"
import Link from 'next/link'
import { useState } from 'react'

export default function LoginPage() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, password }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Gagal masuk'); return }
    location.href = '/dashboard'
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Masuk</h1>
      <form onSubmit={onSubmit} className="card mt-6 p-6 space-y-4">
        <div>
          <label className="text-sm">ID Pengguna</label>
          <input className="input mt-1" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="PRVT-XXXXXX" />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" type="submit">Masuk</button>
        <p className="text-sm text-gray-600">Belum punya akun? <Link className="text-primary-600" href="/auth/register">Daftar</Link></p>
      </form>
    </main>
  )
}
