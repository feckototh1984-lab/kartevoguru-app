'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type CustomerDetails = {
  id: string
  name: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  customer_type: string | null
  notes: string | null
}

type WorkOrderEditDetails = {
  id: string
  customer_id: string | null
  order_number: string | null
  service_date: string | null
  service_time: string | null
  job_type: string | null
  target_pest: string | null
  address: string | null
  treatment_description: string | null
  status: string | null
  customers: CustomerDetails | CustomerDetails[] | null
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case 'scheduled':
      return 'Felvéve'
    case 'in_progress':
      return 'Folyamatban'
    case 'done':
      return 'Lezárva'
    case 'cancelled':
      return 'Sztornózva'
    case 'draft':
      return 'Piszkozat'
    default:
      return status || '—'
  }
}

export default function EditWorkOrderPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorText, setErrorText] = useState('')

  const [workOrder, setWorkOrder] = useState<WorkOrderEditDetails | null>(null)

  const [workForm, setWorkForm] = useState({
    service_date: '',
    service_time: '',
    job_type: '',
    target_pest: '',
    address: '',
    treatment_description: '',
    status: 'scheduled',
  })

  const [customerForm, setCustomerForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    customer_type: 'fix_partner',
    notes: '',
  })

  useEffect(() => {
    async function loadWorkOrder() {
      if (!id) return

      setLoading(true)
      setErrorText('')

      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id,
          customer_id,
          order_number,
          service_date,
          service_time,
          job_type,
          target_pest,
          address,
          treatment_description,
          status,
          customers (
            id,
            name,
            contact_person,
            phone,
            email,
            address,
            customer_type,
            notes
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        setLoading(false)
        setErrorText(error.message)
        return
      }

      const typedData = data as unknown as WorkOrderEditDetails
      const customer = Array.isArray(typedData.customers)
        ? typedData.customers[0]
        : typedData.customers

      setWorkOrder(typedData)

      setWorkForm({
        service_date: typedData.service_date || '',
        service_time: typedData.service_time || '',
        job_type: typedData.job_type || '',
        target_pest: typedData.target_pest || '',
        address: typedData.address || '',
        treatment_description: typedData.treatment_description || '',
        status: typedData.status || 'scheduled',
      })

      setCustomerForm({
        name: customer?.name || '',
        contact_person: customer?.contact_person || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        address: customer?.address || '',
        customer_type: customer?.customer_type || 'fix_partner',
        notes: customer?.notes || '',
      })

      setLoading(false)
    }

    loadWorkOrder()
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!workOrder) return

    if (!workForm.service_date || !workForm.job_type || !workForm.target_pest || !workForm.address) {
      alert('Töltsd ki a kötelező munka mezőket.')
      return
    }

    if (!customerForm.name.trim()) {
      alert('Az ügyfél neve kötelező.')
      return
    }

    const customer = Array.isArray(workOrder.customers)
      ? workOrder.customers[0]
      : workOrder.customers

    if (!customer?.id) {
      alert('Az ügyfél rekord nem található ehhez a munkához.')
      return
    }

    setSaving(true)

    const { error: customerError } = await supabase
      .from('customers')
      .update({
        name: customerForm.name.trim(),
        contact_person: customerForm.contact_person || null,
        phone: customerForm.phone || null,
        email: customerForm.email || null,
        address: customerForm.address || null,
        customer_type: customerForm.customer_type || null,
        notes: customerForm.notes || null,
      })
      .eq('id', customer.id)

    if (customerError) {
      setSaving(false)
      alert('Nem sikerült menteni az ügyfél adatait: ' + customerError.message)
      return
    }

    const { error: workOrderError } = await supabase
      .from('work_orders')
      .update({
        service_date: workForm.service_date,
        service_time: workForm.service_time || null,
        job_type: workForm.job_type,
        target_pest: workForm.target_pest,
        address: workForm.address,
        treatment_description: workForm.treatment_description || null,
        status: workForm.status || 'scheduled',
      })
      .eq('id', workOrder.id)

    setSaving(false)

    if (workOrderError) {
      alert('Nem sikerült menteni a munka adatait: ' + workOrderError.message)
      return
    }

    alert('A munka és az ügyfél adatai sikeresen frissültek.')
    router.push(`/work-orders/${workOrder.id}`)
    router.refresh()
  }

  const timeOptions = Array.from({ length: 27 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2)
    const minute = i % 2 === 0 ? '00' : '30'
    return `${String(hour).padStart(2, '0')}:${minute}`
  })

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm text-slate-500">KártevőGuru App</div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Munka szerkesztése
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Itt javíthatod a munka és az ügyfél hibás adatait is.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/work-orders/${id}`}
            className="px-5 py-3 rounded-xl font-semibold border border-[#388cc4] text-[#388cc4] bg-white hover:bg-[#388cc4] hover:text-white"
          >
            Vissza a munkához
          </Link>

          <Link
            href="/work-orders"
            className="px-5 py-3 rounded-xl font-semibold border border-slate-300 bg-white hover:bg-slate-50"
          >
            Vissza a munkákhoz
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
          <p className="text-sm text-slate-500">Betöltés...</p>
        </div>
      ) : errorText ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="font-semibold text-red-700">Hiba történt</p>
          <p className="text-sm text-red-600 mt-2">{errorText}</p>
        </div>
      ) : !workOrder ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="font-semibold text-amber-700">A munka nem található.</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-gradient-to-r from-[#388cc4] to-[#12bf3d] text-white rounded-2xl p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <div className="text-sm opacity-90 mb-2">Munka sorszáma</div>
            <div className="text-3xl font-extrabold">
              {workOrder.order_number || 'Nincs sorszám'}
            </div>
          </div>

          <section className="bg-white rounded-2xl p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <h2 className="text-lg font-bold mb-4">Munka adatai</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Dátum *</label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  value={workForm.service_date}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, service_date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Időpont</label>
                <select
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  value={workForm.service_time}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, service_time: e.target.value })
                  }
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
                  value={workForm.job_type}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, job_type: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Célzott kártevő *</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="Pl. csótány"
                  value={workForm.target_pest}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, target_pest: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Munkavégzés címe *</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="A munkavégzés címe"
                  value={workForm.address}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, address: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Státusz</label>
                <select
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  value={workForm.status}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, status: e.target.value })
                  }
                >
                  <option value="scheduled">Felvéve</option>
                  <option value="in_progress">Folyamatban</option>
                  <option value="done">Lezárva</option>
                  <option value="cancelled">Sztornózva</option>
                  <option value="draft">Piszkozat</option>
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  Jelenlegi állapot: {getStatusLabel(workForm.status)}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">
                  Megjegyzés / feladatleírás
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-28"
                  placeholder="Belső megjegyzés a munkához"
                  value={workForm.treatment_description}
                  onChange={(e) =>
                    setWorkForm({
                      ...workForm,
                      treatment_description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <h2 className="text-lg font-bold mb-4">Ügyfél adatai</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Név *</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="Ügyfél / cég neve"
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Kapcsolattartó</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="Kapcsolattartó neve"
                  value={customerForm.contact_person}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      contact_person: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Telefonszám</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="+36..."
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">E-mail</label>
                <input
                  type="email"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="ugyfel@email.hu"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Típus</label>
                <select
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  value={customerForm.customer_type}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      customer_type: e.target.value,
                    })
                  }
                >
                  <option value="fix_partner">Fix partner</option>
                  <option value="lakossagi">Lakossági</option>
                  <option value="ceges">Céges</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Ügyfél címe</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-4 py-3"
                  placeholder="Pl. 7400 Kaposvár, Fő utca 12."
                  value={customerForm.address}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, address: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Megjegyzés</label>
                <textarea
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-24"
                  placeholder="Belső megjegyzés az ügyfélhez"
                  value={customerForm.notes}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
          </section>

          <div className="flex gap-3 flex-wrap">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#12bf3d] text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 hover:opacity-90"
            >
              {saving ? 'Mentés...' : 'Módosítások mentése'}
            </button>

            <Link
              href={`/work-orders/${id}`}
              className="px-6 py-3 rounded-xl font-semibold border border-slate-300 bg-white hover:bg-slate-50"
            >
              Mégse
            </Link>
          </div>
        </form>
      )}
    </main>
  )
}