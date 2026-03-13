'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Customer = {
  id: string
  name: string
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  address: string
  customer_type: string
  notes?: string | null
  is_active: boolean
}

const emptyCustomer = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  customer_type: 'fix_partner',
  notes: '',
  is_active: true,
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState(emptyCustomer)
  const [loading, setLoading] = useState(false)

  async function loadCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setCustomers(data)
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('customers').insert([form])

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setForm(emptyCustomer)
    loadCustomers()
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-[0_12px_28px_rgba(2,8,20,.08)] p-5">
        <h2 className="text-lg font-bold mb-4">Új partner / ügyfél</h2>

        <form onSubmit={handleCreateCustomer} className="space-y-3">
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Név"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Kapcsolattartó"
            value={form.contact_person}
            onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Telefonszám"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="E-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Cím"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Típus: fix_partner / lakossagi / haccp"
            value={form.customer_type}
            onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
          />
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Megjegyzés"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-4 py-3 font-semibold bg-[#12bf3d] text-white shadow hover:opacity-90"
          >
            {loading ? 'Mentés...' : 'Ügyfél mentése'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_12px_28px_rgba(2,8,20,.08)] p-5">
        <h2 className="text-lg font-bold mb-4">Partnerlista</h2>

        <div className="space-y-3">
          {customers.map((customer) => (
            <div key={customer.id} className="rounded-xl border border-slate-200 p-3">
              <div className="font-semibold">{customer.name}</div>
              <div className="text-sm text-slate-500">{customer.address}</div>
              <div className="text-sm text-slate-500">
                {customer.phone || 'Nincs telefonszám'}
              </div>
            </div>
          ))}

          {!customers.length ? (
            <p className="text-sm text-slate-500">Még nincs rögzített ügyfél.</p>
          ) : null}
        </div>
      </div>
    </main>
  )
}