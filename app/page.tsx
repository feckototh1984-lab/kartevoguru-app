'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type WorkOrder = {
  id: string
  customer_id: string | null
  service_date: string
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

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat('hu-HU', {
    weekday: 'short',
  }).format(date)
}

export default function HomePage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const today = useMemo(() => new Date(), [])
  const todayKey = formatDateKey(today)

  const weekStart = useMemo(() => startOfWeek(today), [today])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index)
      return {
        date,
        key: formatDateKey(date),
        dayLabel: formatDayLabel(date),
        dayNumber: date.getDate(),
        isToday: formatDateKey(date) === todayKey,
      }
    })
  }, [weekStart, todayKey])

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)

      const [{ data: workOrdersData, error: workOrdersError }, { data: customersData, error: customersError }] =
        await Promise.all([
          supabase
            .from('work_orders')
            .select('id, customer_id, service_date, address, job_type, target_pest, status')
            .order('service_date', { ascending: true }),
          supabase
            .from('customers')
            .select('id, name')
            .order('name', { ascending: true }),
        ])

      setLoading(false)

      if (workOrdersError) {
        alert('Nem sikerült betölteni a munkalapokat: ' + workOrdersError.message)
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

  const todayJobs = useMemo(() => {
    return workOrders.filter((job) => job.service_date === todayKey)
  }, [workOrders, todayKey])

  const upcomingJobs = useMemo(() => {
    return workOrders
      .filter((job) => job.service_date > todayKey)
      .slice(0, 5)
  }, [workOrders, todayKey])

  const weeklyJobsMap = useMemo(() => {
    const map = new Map<string, WorkOrder[]>()

    for (const day of weekDays) {
      map.set(day.key, [])
    }

    for (const job of workOrders) {
      if (map.has(job.service_date)) {
        map.get(job.service_date)?.push(job)
      }
    }

    return map
  }, [workOrders, weekDays])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#388cc4] to-[#12bf3d] px-6 py-10 text-white shadow-[0_12px_28px_rgba(2,8,20,.08)] md:px-10">
        <div className="max-w-3xl">
          <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
            KártevőGuru App
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Digitális munkalap és ügyfélkezelő rendszer
          </h1>

          <p className="mt-4 max-w-2xl text-sm text-white/90 md:text-base">
            Itt kezeled az ügyfeleket, a munkalapokat, a fotódokumentációt és
            az aláírásokat egy helyen.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/work-orders/new"
              className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 shadow-[0_8px_20px_rgba(0,0,0,.18)] hover:opacity-95"
            >
              + Új munkalap
            </Link>

            <Link
              href="/work-orders"
              className="rounded-xl border border-white/70 px-5 py-3 font-semibold text-white hover:bg-white/10"
            >
              Munkalap archívum
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Heti áttekintő</h2>
              <p className="mt-1 text-sm text-slate-500">
                A mentett munkalapok automatikusan megjelennek a megfelelő napon.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              {formatMonthLabel(today)}
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Betöltés...
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-7">
              {weekDays.map((day) => {
                const jobs = weeklyJobsMap.get(day.key) || []

                return (
                  <div
                    key={day.key}
                    className={`rounded-2xl border p-4 min-h-[220px] ${
                      day.isToday
                        ? 'border-[#12bf3d] bg-[#12bf3d]/10'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {day.dayLabel}
                      </div>
                      <div className="text-lg font-extrabold text-slate-900">
                        {day.dayNumber}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {jobs.length === 0 ? (
                        <div className="text-xs text-slate-400">Nincs munka</div>
                      ) : (
                        jobs.map((job) => (
                          <div
                            key={job.id}
                            className="rounded-xl bg-white/90 border border-slate-200 p-3"
                          >
                            <div className="text-sm font-bold text-slate-900">
                              {customerMap.get(job.customer_id || '') || job.target_pest || 'Munkalap'}
                            </div>

                            {job.job_type && (
                              <div className="mt-1 text-xs font-medium text-[#388cc4]">
                                {job.job_type}
                              </div>
                            )}

                            {job.target_pest && (
                              <div className="mt-1 text-xs text-slate-600">
                                {job.target_pest}
                              </div>
                            )}

                            {job.address && (
                              <div className="mt-1 text-xs text-slate-500 line-clamp-3">
                                {job.address}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <h2 className="text-xl font-bold text-slate-900">Mai teendők</h2>
            <p className="mt-1 text-sm text-slate-500">
              A mai napra mentett munkalapok.
            </p>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                  Betöltés...
                </div>
              ) : todayJobs.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                  Ma még nincs ütemezett munkalap.
                </div>
              ) : (
                todayJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="text-base font-semibold text-slate-900">
                      {customerMap.get(job.customer_id || '') || 'Ügyfél nélkül'}
                    </div>

                    <div className="mt-1 text-sm text-[#388cc4] font-medium">
                      {job.job_type || 'Munkavégzés'}
                    </div>

                    {job.target_pest && (
                      <div className="mt-1 text-sm text-slate-600">
                        Kártevő: {job.target_pest}
                      </div>
                    )}

                    {job.address && (
                      <div className="mt-1 text-sm text-slate-500">
                        {job.address}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <h2 className="text-xl font-bold text-slate-900">Következő munkák</h2>
            <p className="mt-1 text-sm text-slate-500">
              A következő napokra rögzített munkalapok.
            </p>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                  Betöltés...
                </div>
              ) : upcomingJobs.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                  Nincs közelgő munkalap.
                </div>
              ) : (
                upcomingJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-base font-semibold text-slate-900">
                        {customerMap.get(job.customer_id || '') || 'Ügyfél nélkül'}
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {job.service_date}
                      </div>
                    </div>

                    <div className="mt-1 text-sm text-[#388cc4] font-medium">
                      {job.job_type || 'Munkavégzés'}
                    </div>

                    {job.target_pest && (
                      <div className="mt-1 text-sm text-slate-600">
                        Kártevő: {job.target_pest}
                      </div>
                    )}

                    {job.address && (
                      <div className="mt-1 text-sm text-slate-500">
                        {job.address}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}