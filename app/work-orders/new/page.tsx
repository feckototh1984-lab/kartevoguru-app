'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Customer = {
  id: string
  name: string
}

type CustomerMode = 'existing' | 'new'

export default function NewWorkOrderPage() {
  const router = useRouter()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [customerMode, setCustomerMode] = useState<CustomerMode>('existing')

  const [form, setForm] = useState({
    customer_id: '',
    service_date: '',
    service_time: '',
    address: '',
    job_type: '',
    target_pest: '',
    treatment_description: '',
  })

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    customer_type: 'fix_partner',
    notes: '',
  })

  useEffect(() => {
    async function loadCustomers() {
      setCustomersLoading(true)

      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name', { ascending: true })

      setCustomersLoading(false)

      if (error) {
        alert('Nem sikerült betölteni az ügyfeleket: ' + error.message)
        return
      }

      setCustomers((data || []) as Customer[])
    }

    loadCustomers()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()

    if (!form.service_date || !form.address || !form.job_type || !form.target_pest) {
      alert('Töltsd ki a kötelező munkalap mezőket.')
      return
    }

    setLoading(true)

    let customerId = form.customer_id

    if (customerMode === 'existing') {
      if (!customerId) {
        setLoading(false)
        alert('Válassz ki egy meglévő ügyfelet.')
        return
      }
    }

    if (customerMode === 'new') {
      if (!newCustomer.name.trim()) {
        setLoading(false)
        alert('Az új ügyfél nevének megadása kötelező.')
        return
      }

      const { data: insertedCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            name: newCustomer.name,
            contact_person: newCustomer.contact_person || null,
            phone: newCustomer.phone || null,
            email: newCustomer.email || null,
            address: newCustomer.address || null,
            customer_type: newCustomer.customer_type || null,
            notes: newCustomer.notes || null,
          },
        ])
        .select('id')
        .single()

      if (customerError || !insertedCustomer) {
        setLoading(false)
        alert(
          'Nem sikerült létrehozni az új ügyfelet: ' +
            (customerError?.message || 'Ismeretlen hiba')
        )
        return
      }

      customerId = insertedCustomer.id
    }

    const payload = {
      customer_id: customerId,
      service_date: form.service_date,
      service_time: form.service_time || null,
      address: form.address,
      job_type: form.job_type,
      target_pest: form.target_pest,
      treatment_description: form.treatment_description,
      status: 'draft',
    }

    const { error: workOrderError } = await supabase
      .from('work_orders')
      .insert([payload])

    setLoading(false)

    if (workOrderError) {
      alert('Nem sikerült létrehozni a munkalapot: ' + workOrderError.message)
      return
    }

    alert('Munkalap sikeresen létrehozva.')
    router.push('/work-orders')
    router.refresh()
  }

  const timeOptions = Array.from({ length: 27 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2)
    const minute = i % 2 === 0 ? '00' : '30'
    return `${String(hour).padStart(2, '0')}:${minute}`
  })

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm text-slate-500">KártevőGuru App</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Új munkalap</h1>
          <p className="mt-1 text-sm text-slate-500">
            Válassz meglévő ügyfelet, vagy hozz létre újat helyben.
          </p>
        </div>

        <Link
          href="/work-orders"
          className="px-5 py-3 rounded-xl font-semibold border border-slate-300 bg-white hover:bg-slate-50"
        >
          Vissza az archívumhoz
        </Link>
      </div>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-2xl shadow-[0_12px_28px_rgba(2,8,20,.08)] p-5 space-y-6"
      >
        <div>
          <h2 className="text-lg font-bold mb-3">Ügyfél kezelése</h2>

          <div className="flex gap-3 flex-wrap mb-4">
            <button
              type="button"
              onClick={() => setCustomerMode('existing')}
              className={`px-4 py-2 rounded-xl font-semibold border ${
                customerMode === 'existing'
                  ? 'bg-[#388cc4] text-white border-[#388cc4]'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Meglévő ügyfél
            </button>

            <button
              type="button"
              onClick={() => setCustomerMode('new')}
              className={`px-4 py-2 rounded-xl font-semibold border ${
                customerMode === 'new'
                  ? 'bg-[#12bf3d] text-white border-[#12bf3d]'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Új ügyfél rögzítése
            </button>
          </div>

          {customerMode === 'existing' ? (
            <div>
              <label className="block text-sm font-semibold mb-2">Ügyfél *</label>
              <select
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                disabled={customersLoading}
              >
                <option value="">
                  {customersLoading ? 'Ügyfelek betöltése...' : 'Ügyfél kiválasztása'}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Név *</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="Ügyfél / cég neve"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Kapcsolattartó</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="Kapcsolattartó neve"
                  value={newCustomer.contact_person}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, contact_person: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Telefonszám</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="+36..."
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">E-mail</label>
                <input
                  type="email"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="ugyfel@email.hu"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Típus</label>
                <select
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  value={newCustomer.customer_type}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, customer_type: e.target.value })
                  }
                >
                  <option value="fix_partner">Fix partner</option>
                  <option value="lakossagi">Lakossági</option>
                  <option value="ceges">Céges</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Cím</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="Pl. 7400 Kaposvár, Fő utca 12."
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Megjegyzés</label>
                <textarea
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-24"
                  placeholder="Belső megjegyzés az ügyfélhez"
                  value={newCustomer.notes}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, notes: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-bold mb-4">Munkalap adatai</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Szolgáltatás dátuma *</label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
                value={form.service_date}
                onChange={(e) => setForm({ ...form, service_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Időpont</label>
              <select
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
                value={form.service_time}
                onChange={(e) => setForm({ ...form, service_time: e.target.value })}
              >
                <option value="">Időpont kiválasztása</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Munka típusa *</label>
              <input
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
                placeholder="Pl. rovarirtás"
                value={form.job_type}
                onChange={(e) => setForm({ ...form, job_type: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Célzott kártevő *</label>
              <input
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
                placeholder="Pl. csótány"
                value={form.target_pest}
                onChange={(e) => setForm({ ...form, target_pest: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Helyszín címe *</label>
              <input
                className="w-full border border-slate-300 rounded-xl px-4 py-3"
                placeholder="A munkavégzés címe"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Kezelés leírása</label>
              <textarea
                className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-28"
                placeholder="Írd le röviden a kezelést..."
                value={form.treatment_description}
                onChange={(e) =>
                  setForm({ ...form, treatment_description: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 flex-wrap">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#12bf3d] text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-50 hover:opacity-90"
          >
            {loading ? 'Mentés...' : 'Munkalap létrehozása'}
          </button>

          <Link
            href="/customers"
            className="px-5 py-3 rounded-xl font-semibold border border-slate-300 bg-white hover:bg-slate-50"
          >
            Ügyfelek oldal
          </Link>
        </div>
      </form>
    </main>
  )
}