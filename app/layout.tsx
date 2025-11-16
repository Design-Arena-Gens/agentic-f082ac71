import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PrivaT',
  description: 'Chat pribadi seperti WhatsApp',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
