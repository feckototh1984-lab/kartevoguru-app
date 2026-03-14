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
  customer_type: 'lakossagi',
  notes: '',
  is_active: true,
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').replace(/-/g, '')
}

function getCustomerTypeLabel(type: string) {
  switch (type) {
    case 'fix_partner':
      return 'Fix partner'
    case 'lakossagi':
      return 'Lakossági'
    case 'haccp':
      return 'HACCP'
    default:
      return type || 'Ismeretlen'
  }
}

function getCustomerTypeBadgeClass(type: string) {
  switch (type) {
    case 'fix_partner':
      return 'bg-blue-100 text-blue-700'
    case 'lakossagi':
      return 'bg-green-100 text-green-700'
    case 'haccp':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState(emptyCustomer)
  const [loading, setLoading] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)

  async function loadCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (!error && data) setCustomers(data)
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  async function checkDuplicateCustomer() {
    const normalizedPhone = normalizePhone(form.phone.trim())
    const normalizedEmail = form.email.trim().toLowerCase()
    const normalizedName = form.name.trim().toLowerCase()
    const normalizedAddress = form.address.trim().toLowerCase()

    for (const customer of customers) {
      if (editingCustomerId && customer.id === editingCustomerId) continue

      const customerPhone = normalizePhone((customer.phone || '').trim())
      const customerEmail = (customer.email || '').trim().toLowerCase()
      const customerName = (customer.name || '').trim().toLowerCase()
      const customerAddress = (customer.address || '').trim().toLowerCase()

      if (normalizedPhone && customerPhone && normalizedPhone === customerPhone) {
        return 'Már létezik ügyfél ezzel a telefonszámmal.'
      }

      if (normalizedEmail && customerEmail && normalizedEmail === customerEmail) {
        return 'Már létezik ügyfél ezzel az e-mail címmel.'
      }

      if (
        normalizedName &&
        normalizedAddress &&
        customerName &&
        customerAddress &&
        normalizedName === customerName &&
        normalizedAddress === customerAddress
      ) {
        return 'Már létezik ügyfél ugyanezzel a név és cím párossal.'
      }
    }

    return null
  }

  function handleEditCustomer(customer: Customer) {
    setEditingCustomerId(customer.id)
    setForm({
      name: customer.name || '',
      contact_person: customer.contact_person || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      customer_type: customer.customer_type || 'lakossagi',
      notes: customer.notes || '',
      is_active: customer.is_active ?? true,
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelEdit() {
    setEditingCustomerId(null)
    setForm(emptyCustomer)
  }

  async function handleArchiveCustomer(customerId: string) {
    const confirmed = window.confirm('Biztosan archiválod ezt az ügyfelet?')

    if (!confirmed) return

    const { error } = await supabase
      .from('customers')
      .update({ is_active: false })
      .eq('id', customerId)

    if (error) {
      alert(error.message)
      return
    }

    if (editingCustomerId === customerId) {
      handleCancelEdit()
    }

    loadCustomers()
  }

  async function handleCreateOrUpdateCustomer(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim()) {
      alert('A név megadása kötelező.')
      return
    }

    if (!form.address.trim()) {
      alert('A cím megadása kötelező.')
      return
    }

    const duplicateMessage = await checkDuplicateCustomer()

    if (duplicateMessage) {
      alert(duplicateMessage)
      return
    }

    setLoading(true)

    const payload = {
      name: form.name.trim(),
      contact_person: form.contact_person.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      address: form.address.trim(),
      customer_type: form.customer_type,
      notes: form.notes.trim() || null,
      is_active: true,
    }

    let error = null

    if (editingCustomerId) {
      const response = await supabase
        .from('customers')
        .update(payload)
        .eq('id', editingCustomerId)

      error = response.error
    } else {
      const response = await supabase.from('customers').insert([payload])
      error = response.error
    }

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setForm(emptyCustomer)
    setEditingCustomerId(null)
    loadCustomers()
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-[0_12px_28px_rgba(2,8,20,.08)] p-5">
        <h2 className="text-lg font-bold mb-4">
          {editingCustomerId ? 'Ügyfél szerkesztése' : 'Új partner / ügyfél'}
        </h2>

        <form onSubmit={handleCreateOrUpdateCustomer} className="space-y-3">
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

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-600">
              Ügyfél típusa
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
              value={form.customer_type}
              onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
            >
              <option value="lakossagi">Lakossági</option>
              <option value="fix_partner">Fix partner</option>
              <option value="haccp">HACCP</option>
            </select>
          </div>

          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Megjegyzés"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl px-4 py-3 font-semibold bg-[#12bf3d] text-white shadow hover:opacity-90 disabled:opacity-60"
            >
              {loading
                ? 'Mentés...'
                : editingCustomerId
                ? 'Ügyfél frissítése'
                : 'Ügyfél mentése'}
            </button>

            {editingCustomerId ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl px-4 py-3 font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Mégse
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_12px_28px_rgba(2,8,20,.08)] p-5">
        <h2 className="text-lg font-bold mb-4">Partnerlista</h2>

        <div className="space-y-3">
          {customers.map((customer) => (
            <div key={customer.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{customer.name}</div>
                  <div className="text-sm text-slate-500">{customer.address}</div>
                  <div className="text-sm text-slate-500">
                    {customer.phone || 'Nincs telefonszám'}
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getCustomerTypeBadgeClass(
                    customer.customer_type
                  )}`}
                >
                  {getCustomerTypeLabel(customer.customer_type)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleEditCustomer(customer)}
                  className="rounded-lg px-3 py-2 text-sm font-medium border border-[#388cc4] text-[#388cc4] hover:bg-blue-50"
                >
                  Szerkesztés
                </button>

                <button
                  type="button"
                  onClick={() => handleArchiveCustomer(customer.id)}
                  className="rounded-lg px-3 py-2 text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50"
                >
                  Archiválás
                </button>
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