'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert('Bejelentkezési hiba: ' + error.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">
            KártevőGuru App
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Bejelentkezés a rendszerbe
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              E-mail cím
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pelda@email.hu"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#388cc4]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Jelszó
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Jelszó"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#388cc4]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#12bf3d] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Belépés...' : 'Belépés'}
          </button>
        </form>
      </div>
    </main>
  )
}