import Link from 'next/link'

const weekDays = [
  { day: 'H', date: '10' },
  { day: 'K', date: '11' },
  { day: 'Sze', date: '12' },
  { day: 'Cs', date: '13', active: true },
  { day: 'P', date: '14' },
  { day: 'Szo', date: '15' },
  { day: 'V', date: '16' },
]

const upcomingJobs = [
  {
    time: '09:00',
    customer: 'Mai kiszállások',
    address: 'Itt később a mai munkalapok jelennek meg',
    status: 'Nincs bekötve',
  },
  {
    time: '—',
    customer: 'Következő időpontok',
    address: 'Később összekötjük a munkalapokkal',
    status: 'Előkészítés',
  },
]

export default function HomePage() {
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Heti áttekintő</h2>
              <p className="mt-1 text-sm text-slate-500">
                Itt később a kiszállások és időpontok jelennek meg.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              Március
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-3">
            {weekDays.map((item) => (
              <div
                key={`${item.day}-${item.date}`}
                className={`rounded-2xl border p-4 text-center ${
                  item.active
                    ? 'border-[#12bf3d] bg-[#12bf3d]/10'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.day}
                </div>
                <div className="mt-2 text-xl font-extrabold text-slate-900">
                  {item.date}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {item.active ? 'Ma' : '—'}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Ez most még egy egyszerű előkészített naptárblokk. A következő
              lépésben rá tudjuk kötni a munkalapokra, és akkor automatikusan
              mutatja majd a napi kiszállásokat.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <h2 className="text-xl font-bold text-slate-900">Mai teendők</h2>
            <p className="mt-1 text-sm text-slate-500">
              Napi induló nézet a fontosabb munkákhoz.
            </p>

            <div className="mt-5 space-y-4">
              {upcomingJobs.map((job, index) => (
                <div
                  key={`${job.customer}-${index}`}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-slate-900">
                      {job.time}
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {job.status}
                    </div>
                  </div>

                  <div className="mt-3 text-base font-semibold text-slate-900">
                    {job.customer}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {job.address}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <h2 className="text-xl font-bold text-slate-900">Gyors műveletek</h2>

            <div className="mt-5 grid gap-3">
              <Link
                href="/work-orders/new"
                className="inline-flex items-center justify-center rounded-xl bg-[#12bf3d] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                + Új munkalap
              </Link>

              <Link
                href="/work-orders"
                className="inline-flex items-center justify-center rounded-xl border border-[#388cc4] px-4 py-3 text-sm font-semibold text-[#388cc4] hover:bg-[#388cc4] hover:text-white"
              >
                Munkalapok megnyitása
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