'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type CustomerSummary = {
  name: string | null
}

type WorkOrderListRow = {
  id: string
  order_number: string | null
  service_date: string | null
  job_type: string | null
  target_pest: string | null
  address: string | null
  status: string | null
  pdf_url?: string | null
  customer_signature_url?: string | null
  signed_at?: string | null
  created_at: string
  customers: CustomerSummary | CustomerSummary[] | null
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case 'scheduled':
      return 'Felvéve'
    case 'in_progress':
      return 'Folyamatban'
    case 'done':
      return 'Lezárva'
    case 'draft':
      return 'Piszkozat'
    case 'cancelled':
      return 'Sztornózva'
    default:
      return status || '—'
  }
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-700'
    case 'in_progress':
      return 'bg-amber-100 text-amber-700'
    case 'done':
      return 'bg-green-100 text-green-700'
    case 'draft':
      return 'bg-slate-100 text-slate-700'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function getCustomerName(row: WorkOrderListRow) {
  const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers
  return customer?.name || 'Ügyfél nélkül'
}

export default function WorkOrdersArchivePage() {
  const router = useRouter()

  const [rows, setRows] = useState<WorkOrderListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCancelled, setShowCancelled] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadWorkOrders()
  }, [])

  async function loadWorkOrders() {
    setLoading(true)

    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        id,
        order_number,
        service_date,
        job_type,
        target_pest,
        address,
        status,
        pdf_url,
        customer_signature_url,
        signed_at,
        created_at,
        customers (
          name
        )
      `)
      .order('created_at', { ascending: false })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setRows((data || []) as WorkOrderListRow[])
  }

  async function handleCancel(rowId: string) {
    setUpdatingId(rowId)

    const { error } = await supabase
      .from('work_orders')
      .update({ status: 'cancelled' })
      .eq('id', rowId)

    setUpdatingId(null)

    if (error) {
      alert('Nem sikerült sztornózni a munkát: ' + error.message)
      return
    }

    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, status: 'cancelled' } : row
      )
    )
  }

  async function handleRestore(rowId: string) {
    setUpdatingId(rowId)

    const { error } = await supabase
      .from('work_orders')
      .update({ status: 'scheduled' })
      .eq('id', rowId)

    setUpdatingId(null)

    if (error) {
      alert('Nem sikerült visszaállítani a munkát: ' + error.message)
      return
    }

    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, status: 'scheduled' } : row
      )
    )
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (!showCancelled && row.status === 'cancelled') {
        return false
      }

      const customerName = getCustomerName(row)
      const signatureText = row.customer_signature_url ? 'aláírt' : 'nincs aláírás'
      const statusText = getStatusLabel(row.status)

      const haystack = [
        customerName,
        row.order_number || '',
        row.job_type || '',
        row.target_pest || '',
        row.address || '',
        row.status || '',
        statusText,
        signatureText,
      ]
        .join(' ')
        .toLowerCase()

      return q ? haystack.includes(q) : true
    })
  }, [rows, search, showCancelled])

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm text-slate-500">KártevőGuru App</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Munkák</h1>
          <p className="mt-1 text-sm text-slate-500">
            Itt látod az összes rögzített munkát és azok aktuális állapotát.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/work-orders/new"
            className="rounded-xl px-4 py-3 font-semibold bg-[#12bf3d] text-white shadow hover:opacity-90"
          >
            + Új munka felvétele
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_12px_28px_rgba(2,8,20,.08)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-4">Keresés</h2>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Keresés ügyfélre, címre, munka típusára, kártevőre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="h-4 w-4"
            />
            Sztornózott munkák mutatása
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_12px_28px_rgba(2,8,20,.08)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Mentett munkák</h2>
          <div className="text-sm text-slate-500">
            Összesen:{' '}
            <span className="font-semibold text-slate-700">
              {filteredRows.length}
            </span>{' '}
            db
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Betöltés...</p>
        ) : filteredRows.length ? (
          <div className="space-y-4">
            {filteredRows.map((row) => {
              const customerName = getCustomerName(row)

              return (
                <div
                  key={row.id}
                  onClick={() => router.push(`/work-orders/${row.id}`)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-[1px] hover:shadow-[0_12px_28px_rgba(2,8,20,.08)]"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {customerName}
                      </div>

                      <div className="mt-1 text-sm font-medium text-[#388cc4]">
                        {row.job_type || 'Munkavégzés'}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          row.status
                        )}`}
                      >
                        {getStatusLabel(row.status)}
                      </span>

                      {row.customer_signature_url ? (
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Aláírva
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Nincs aláírás
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Dátum
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        {row.service_date || '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Kártevő
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        {row.target_pest || '—'}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Cím
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        {row.address || '—'}
                      </div>
                    </div>

                    {row.order_number && (
                      <div className="md:col-span-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Sorszám
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {row.order_number}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/work-orders/${row.id}/edit`}
                      className="inline-flex rounded-xl border border-[#388cc4] px-4 py-2 text-sm font-semibold text-[#388cc4] hover:bg-[#388cc4] hover:text-white"
                    >
                      Szerkesztés
                    </Link>

                    {row.status === 'cancelled' ? (
                      <button
                        type="button"
                        onClick={() => handleRestore(row.id)}
                        disabled={updatingId === row.id}
                        className="inline-flex rounded-xl border border-green-600 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-600 hover:text-white disabled:opacity-50"
                      >
                        {updatingId === row.id ? 'Mentés...' : 'Visszaállítás'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCancel(row.id)}
                        disabled={updatingId === row.id}
                        className="inline-flex rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
                      >
                        {updatingId === row.id ? 'Mentés...' : 'Sztornó'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Még nincs mentett munka.</p>
        )}
      </div>
    </main>
  )
}