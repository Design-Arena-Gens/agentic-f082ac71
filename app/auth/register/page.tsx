"use client"
import Link from 'next/link'
import { useState } from 'react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, password }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Gagal daftar'); return }
    setCreatedId(data.userId)
    setTimeout(() => location.replace('/dashboard'), 800)
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Daftar</h1>
      <form onSubmit={onSubmit} className="card mt-6 p-6 space-y-4">
        <div>
          <label className="text-sm">Nama</label>
          <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {createdId && <p className="text-sm text-green-700">ID kamu: <b>{createdId}</b></p>}
        <button className="btn w-full" type="submit">Buat Akun</button>
        <p className="text-sm text-gray-600">Sudah punya akun? <Link className="text-primary-600" href="/auth/login">Masuk</Link></p>
      </form>
    </main>
  )
}
