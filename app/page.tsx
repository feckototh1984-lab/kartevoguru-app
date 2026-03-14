'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type WorkOrder = {
  id: string
  customer_id: string | null
  service_date: string
  service_time: string | null
  address: string | null
  job_type: string | null
  target_pest: string | null
  status: string | null
}

type Customer = {
  id: string
  name: string
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatFullHungarianDate(date: Date) {
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

function isSameDay(a: Date, b: Date) {
  return formatDateKey(a) === formatDateKey(b)
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case 'scheduled':
      return 'Felvéve'
    case 'in_progress':
      return 'Folyamatban'
    case 'done':
      return 'Elvégezve'
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

export default function HomePage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const today = useMemo(() => new Date(), [])
  const [selectedDate, setSelectedDate] = useState(today)

  const todayKey = formatDateKey(today)
  const selectedDateKey = formatDateKey(selectedDate)

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)

      const [
        { data: workOrdersData, error: workOrdersError },
        { data: customersData, error: customersError },
      ] = await Promise.all([
        supabase
          .from('work_orders')
          .select(
            'id, customer_id, service_date, service_time, address, job_type, target_pest, status'
          )
          .order('service_date', { ascending: true })
          .order('service_time', { ascending: true }),
        supabase.from('customers').select('id, name').order('name', { ascending: true }),
      ])

      setLoading(false)

      if (workOrdersError) {
        alert('Nem sikerült betölteni a munkákat: ' + workOrdersError.message)
        return
      }

      if (customersError) {
        alert('Nem sikerült betölteni az ügyfeleket: ' + customersError.message)
        return
      }

      setWorkOrders((workOrdersData || []) as WorkOrder[])
      setCustomers((customersData || []) as Customer[])
    }

    loadDashboardData()
  }, [])

  const customerMap = useMemo(() => {
    return new Map(customers.map((customer) => [customer.id, customer.name]))
  }, [customers])

  const activeWorkOrders = useMemo(() => {
    return workOrders.filter((job) => job.status !== 'cancelled')
  }, [workOrders])

  const selectedDayJobs = useMemo(() => {
    return activeWorkOrders
      .filter((job) => job.service_date === selectedDateKey)
      .sort((a, b) => {
        const timeA = a.service_time || '99:99'
        const timeB = b.service_time || '99:99'
        return timeA.localeCompare(timeB)
      })
  }, [activeWorkOrders, selectedDateKey])

  const upcomingJobs = useMemo(() => {
    return activeWorkOrders
      .filter((job) => {
        if (job.service_date > todayKey) return true
        if (job.service_date === todayKey && job.service_time) return true
        return false
      })
      .sort((a, b) => {
        if (a.service_date !== b.service_date) {
          return a.service_date.localeCompare(b.service_date)
        }
        return (a.service_time || '99:99').localeCompare(b.service_time || '99:99')
      })
      .slice(0, 5)
  }, [activeWorkOrders, todayKey])

  const selectedDayLabel = formatFullHungarianDate(selectedDate)
  const isSelectedToday = isSameDay(selectedDate, today)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#388cc4] to-[#12bf3d] px-6 py-10 text-white shadow-[0_12px_28px_rgba(2,8,20,.08)] md:px-10">
        <div className="max-w-3xl">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
            KártevőGuru App
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Digitális munkakezelő és munkalap rendszer
          </h1>

          <p className="mt-4 max-w-2xl text-sm text-white/90 md:text-base">
            Itt kezeled az ügyfeleket, a felvett munkákat, a munkalapokat, a
            fotódokumentációt és az aláírásokat egy helyen.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/work-orders/new"
              className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 shadow-[0_8px_20px_rgba(0,0,0,.18)] hover:opacity-95"
            >
              + Új munka felvétele
            </Link>

            <Link
              href="/work-orders"
              className="rounded-xl border border-white/70 px-5 py-3 font-semibold text-white hover:bg-white/10"
            >
              Munkák megnyitása
            </Link>

            <Link
              href="/customers"
              className="rounded-xl border border-white/70 px-5 py-3 font-semibold text-white hover:bg-white/10"
            >
              Ügyfelek
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Napi feladatok</h2>
              <p className="mt-1 text-sm text-slate-500">
                A kiválasztott nap rögzített munkái időpont szerint rendezve.
              </p>
            </div>

            <Link
              href="/work-orders/new"
              className="inline-flex items-center justify-center rounded-xl bg-[#12bf3d] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              + Új munka felvétele
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedDate((prev) => addDays(prev, -1))}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                ← Előző nap
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  isSelectedToday
                    ? 'bg-[#12bf3d] text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Ma
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Következő nap →
              </button>
            </div>

            <div className="mt-4 text-lg font-bold capitalize text-slate-900">
              {selectedDayLabel}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              {selectedDayJobs.length} db munka ezen a napon
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 p-5 text-sm text-slate-500">
                Betöltés...
              </div>
            ) : selectedDayJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Erre a napra még nincs rögzített munka.
              </div>
            ) : (
              selectedDayJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/work-orders/${job.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-[1px] hover:shadow-[0_12px_28px_rgba(2,8,20,.08)]"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {customerMap.get(job.customer_id || '') || 'Ügyfél nélkül'}
                      </div>

                      <div className="mt-1 text-sm font-medium text-[#388cc4]">
                        {job.job_type || 'Munkavégzés'}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-xl bg-[#12bf3d]/10 px-3 py-2 text-sm font-bold text-[#0b7a2a]">
                        {job.service_time || 'Időpont nélkül'}
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          job.status
                        )}`}
                      >
                        {getStatusLabel(job.status)}
                      </span>
                    </div>
                  </div>

                  {job.target_pest && (
                    <div className="mt-3 text-sm text-slate-600">
                      Kártevő: {job.target_pest}
                    </div>
                  )}

                  {job.address && (
                    <div className="mt-1 text-sm text-slate-500">
                      {job.address}
                    </div>
                  )}

                  <div className="mt-4 text-sm font-semibold text-[#388cc4]">
                    Munka megnyitása →
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <h2 className="text-xl font-bold text-slate-900">Következő munkák</h2>
            <p className="mt-1 text-sm text-slate-500">
              A közelgő kiszállások gyors áttekintése.
            </p>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                  Betöltés...
                </div>
              ) : upcomingJobs.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                  Nincs közelgő munka.
                </div>
              ) : (
                upcomingJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/work-orders/${job.id}`}
                    className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-base font-semibold text-slate-900">
                        {customerMap.get(job.customer_id || '') || 'Ügyfél nélkül'}
                      </div>

                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {job.service_time || '—'}
                      </div>
                    </div>

                    <div className="mt-1 text-sm font-medium text-[#388cc4]">
                      {job.job_type || 'Munkavégzés'}
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                      {job.service_date}
                    </div>

                    {job.address && (
                      <div className="mt-1 text-sm text-slate-500">
                        {job.address}
                      </div>
                    )}

                    <div className="mt-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          job.status
                        )}`}
                      >
                        {getStatusLabel(job.status)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <h2 className="text-xl font-bold text-slate-900">Gyors műveletek</h2>

            <div className="mt-5 grid gap-3">
              <Link
                href="/work-orders/new"
                className="inline-flex items-center justify-center rounded-xl bg-[#12bf3d] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                + Új munka felvétele
              </Link>

              <Link
                href="/work-orders"
                className="inline-flex items-center justify-center rounded-xl border border-[#388cc4] px-4 py-3 text-sm font-semibold text-[#388cc4] hover:bg-[#388cc4] hover:text-white"
              >
                Munkák megnyitása
              </Link>

              <Link
                href="/customers"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ügyfelek megnyitása
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}