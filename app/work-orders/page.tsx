'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

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
}

export default function WorkOrdersArchivePage() {
  const [rows, setRows] = useState<WorkOrderListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
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
          created_at
        `)
        .order('created_at', { ascending: false })

      setLoading(false)

      if (error) {
        alert(error.message)
        return
      }

      setRows((data || []) as WorkOrderListRow[])
    }

    loadWorkOrders()
  }, [])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()

    return rows.filter((row) => {
      const signatureText = row.customer_signature_url ? 'aláírt' : 'nincs aláírás'

      const haystack = [
        row.order_number || '',
        row.job_type || '',
        row.target_pest || '',
        row.address || '',
        row.status || '',
        signatureText,
      ]
        .join(' ')
        .toLowerCase()

      return q ? haystack.includes(q) : true
    })
  }, [rows, search])

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm text-slate-500">KártevőGuru App</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Munkalap archívum</h1>
          <p className="mt-1 text-sm text-slate-500">
            Itt látod az összes elmentett munkalapot sorszámmal együtt.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/work-orders/new"
            className="rounded-xl px-4 py-3 font-semibold bg-[#12bf3d] text-white shadow hover:opacity-90"
          >
            + Új munkalap
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_12px_28px_rgba(2,8,20,.08)] p-5">
        <h2 className="text-lg font-bold mb-4">Keresés</h2>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
          placeholder="Keresés sorszámra, címre, munka típusára, kártevőre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-[0_12px_28px_rgba(2,8,20,.08)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Mentett munkalapok</h2>
          <div className="text-sm text-slate-500">
            Összesen: <span className="font-semibold text-slate-700">{filteredRows.length}</span> db
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Betöltés...</p>
        ) : filteredRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-600">
                  <th className="py-3 pr-3">Sorszám</th>
                  <th className="py-3 pr-3">Dátum</th>
                  <th className="py-3 pr-3">Munka típusa</th>
                  <th className="py-3 pr-3">Kártevő</th>
                  <th className="py-3 pr-3">Cím</th>
                  <th className="py-3 pr-3">Státusz</th>
                  <th className="py-3 pr-3">Aláírás</th>
                  <th className="py-3 pr-3">Művelet</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="py-3 pr-3 font-bold text-[#388cc4]">
                      {row.order_number || '—'}
                    </td>
                    <td className="py-3 pr-3">{row.service_date || '—'}</td>
                    <td className="py-3 pr-3">{row.job_type || '—'}</td>
                    <td className="py-3 pr-3">{row.target_pest || '—'}</td>
                    <td className="py-3 pr-3">{row.address || '—'}</td>
                    <td className="py-3 pr-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {row.status || '—'}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      {row.customer_signature_url ? (
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Van
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Nincs
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <Link
                        href={`/work-orders/${row.id}`}
                        className="inline-flex rounded-xl border border-[#388cc4] px-3 py-2 text-xs font-semibold text-[#388cc4] hover:bg-[#388cc4] hover:text-white"
                      >
                        Megnyitás
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Még nincs mentett munkalap.</p>
        )}
      </div>
    </main>
  )
}