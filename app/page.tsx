import Link from 'next/link'

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

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
          <h2 className="text-lg font-bold text-slate-900">Munkalapok</h2>
          <p className="mt-2 text-sm text-slate-500">
            Új munkalap létrehozása, mentése és visszanézése.
          </p>
          <Link
            href="/work-orders"
            className="mt-4 inline-flex rounded-xl border border-[#388cc4] px-4 py-2 text-sm font-semibold text-[#388cc4] hover:bg-[#388cc4] hover:text-white"
          >
            Megnyitás
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
          <h2 className="text-lg font-bold text-slate-900">Ügyfelek</h2>
          <p className="mt-2 text-sm text-slate-500">
            Ügyféladatok kezelése és új ügyfelek rögzítése.
          </p>
          <Link
            href="/customers"
            className="mt-4 inline-flex rounded-xl border border-[#388cc4] px-4 py-2 text-sm font-semibold text-[#388cc4] hover:bg-[#388cc4] hover:text-white"
          >
            Megnyitás
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
          <h2 className="text-lg font-bold text-slate-900">Új munkalap</h2>
          <p className="mt-2 text-sm text-slate-500">
            Gyors indítás új címhez, új ügyfélhez vagy új kiszálláshoz.
          </p>
          <Link
            href="/work-orders/new"
            className="mt-4 inline-flex rounded-xl bg-[#12bf3d] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Létrehozás
          </Link>
        </div>
      </section>
    </main>
  )
}