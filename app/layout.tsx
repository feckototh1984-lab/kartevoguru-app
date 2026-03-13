import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import PwaRegister from '@/app/components/PwaRegister'

export const metadata: Metadata = {
  title: 'KártevőGuru App',
  description: 'Digitális munkalap és ügyfélkezelő rendszer',
  applicationName: 'KártevőGuru App',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KártevőGuru',
  },
  formatDetection: {
    telephone: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="hu">
      <body className="min-h-screen bg-slate-100 text-slate-900">
        <PwaRegister />

        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#388cc4] to-[#12bf3d] text-lg font-extrabold text-white shadow-[0_8px_20px_rgba(0,0,0,.18)]">
                  KG
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    KártevőGuru
                  </div>
                  <div className="text-lg font-extrabold tracking-tight">
                    KártevőGuru App
                  </div>
                </div>
              </Link>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Főoldal
              </Link>

              <Link
                href="/work-orders"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Munkalapok
              </Link>

              <Link
                href="/work-orders/new"
                className="rounded-xl bg-[#12bf3d] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
              >
                + Új munkalap
              </Link>

              <Link
                href="/customers"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Ügyfelek
              </Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-0 py-0">{children}</div>
      </body>
    </html>
  )
}