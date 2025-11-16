import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">PrivaT</h1>
        <p className="mt-3 text-gray-600">Aplikasi chatting pribadi sederhana ala WhatsApp.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link className="btn" href="/auth/login">Masuk</Link>
          <Link className="btn bg-white text-primary-700 border border-primary-600 hover:bg-primary-50" href="/auth/register">Daftar</Link>
        </div>
      </div>
    </main>
  )
}
