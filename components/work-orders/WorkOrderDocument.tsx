'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDate, formatDateTime } from './types'
import type {
  WorkOrderDetails,
  WorkOrderPhoto,
  WorkOrderProduct,
  TechnicianSignature,
} from './types'

type WorkOrderDocumentProps = {
  loading: boolean
  errorText: string
  workOrder: WorkOrderDetails | null
  photos: WorkOrderPhoto[]
  products: WorkOrderProduct[]
  technicianSignature: TechnicianSignature | null
  mode: 'private' | 'public'
  sendingEmail?: boolean
  onSendEmail?: () => void
  onPrint?: () => void
  backHref?: string
  backLabel?: string
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

export default function WorkOrderDocument({
  loading,
  errorText,
  workOrder,
  photos,
  products,
  technicianSignature,
  mode,
  sendingEmail = false,
  onSendEmail,
  onPrint,
  backHref,
  backLabel = 'Vissza',
}: WorkOrderDocumentProps) {
  const customer = Array.isArray(workOrder?.customers)
    ? workOrder.customers[0]
    : workOrder?.customers

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-slate-100 px-4 py-6 print:max-w-none print:bg-white print:px-0 print:py-0">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          html,
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-sheet {
            width: 100%;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }

          .print-page-break {
            page-break-before: always;
          }

          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-grid-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .print-grid-photos {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>

      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-500">KártevőGuru App</div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {mode === 'private'
              ? 'Nyomtatható munkalap'
              : 'Munkalap megtekintése'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'private'
              ? 'Innen nyomtathatod vagy e-mailben is elküldheted a munkalapot.'
              : 'Az ügyfél számára megosztott munkalap nézete.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {onPrint && (
            <button
              onClick={onPrint}
              className="rounded-xl bg-[#12bf3d] px-5 py-3 font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,.18)] hover:opacity-90"
            >
              Nyomtatás / PDF mentés
            </button>
          )}

          {mode === 'private' && onSendEmail && (
            <button
              onClick={onSendEmail}
              disabled={sendingEmail || loading || !workOrder}
              className="rounded-xl bg-[#388cc4] px-5 py-3 font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,.18)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingEmail ? 'Küldés folyamatban...' : 'E-mail küldése'}
            </button>
          )}

          {backHref && (
            <Link
              href={backHref}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50"
            >
              {backLabel}
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
          <p className="text-sm text-slate-500">Betöltés...</p>
        </div>
      ) : errorText ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-700">Hiba történt</p>
          <p className="mt-2 text-sm text-red-600">{errorText}</p>
        </div>
      ) : !workOrder ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-semibold text-amber-700">
            A munkalap nem található.
          </p>
        </div>
      ) : (
        <div data-pdf-ready="true">
          <section className="print-sheet overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <div className="border-b border-slate-200 bg-gradient-to-r from-[#388cc4] to-[#12bf3d] px-6 py-6 text-white md:px-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="shrink-0 rounded-2xl bg-white/95 px-4 py-3 shadow-md">
                    <Image
                      src="/logo.png"
                      alt="KártevőGuru"
                      width={180}
                      height={64}
                      priority
                      className="h-auto w-[150px] sm:w-[180px]"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold tracking-wide text-white/85">
                      KártevőGuru
                    </div>
                    <h2 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight text-white">
                      KÁRTEVŐIRTÁSI
                      <br />
                      MUNKALAP
                    </h2>
                    <div className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm">
                      Egészségügyi kártevőirtás
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/12 px-4 py-4 text-left backdrop-blur-sm ring-1 ring-white/20 md:min-w-[220px] md:text-right">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/80">
                    Munkalap sorszám
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-white">
                    {workOrder.order_number || '—'}
                  </div>

                  <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-white/80">
                    Generálva
                  </div>
                  <div className="mt-1 text-sm font-medium text-white">
                    {formatDateTime(workOrder.created_at)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-5 py-6 text-[13px] leading-relaxed text-slate-800 md:px-8">
              <div className="grid gap-6 md:grid-cols-2 print-grid-2 avoid-break">
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 border-b-2 border-slate-200 pb-2">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Szolgáltató adatai
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    <p>
                      <span className="font-bold">Szolgáltató:</span> KártevőGuru
                    </p>
                    <p>
                      <span className="font-bold">Felelős személy:</span>{' '}
                      {technicianSignature?.technician_name || 'Tóth Ferenc Richárd'}
                    </p>
                    <p>
                      <span className="font-bold">Telefon:</span> +36 30 602 0650
                    </p>
                    <p>
                      <span className="font-bold">E-mail:</span> info@kartevoguru.hu
                    </p>
                    <p>
                      <span className="font-bold">Székhely / cím:</span> 8700 Marcali,
                      Borsó-hegyi út 4779
                    </p>
                    <p>
                      <span className="font-bold">Működési nyilv. szám:</span>{' '}
                      SO-05/neo976-1/2025
                    </p>
                    <p>
                      <span className="font-bold">Nyilvántartási szám:</span> 0099697
                    </p>
                    <p>
                      <span className="font-bold">Adószám:</span> 91094722-1-34
                    </p>
                    <p>
                      <span className="font-bold">Bankszámlaszám:</span>{' '}
                      12042847-01896099-00100007
                    </p>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 border-b-2 border-slate-200 pb-2">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Szolgáltatás részletei
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    <p>
                      <span className="font-bold">Megrendelő:</span>{' '}
                      {customer?.name || '—'}
                    </p>
                    <p>
                      <span className="font-bold">Kapcsolattartó:</span>{' '}
                      {customer?.contact_person || '—'}
                    </p>
                    <p>
                      <span className="font-bold">Telefonszám:</span>{' '}
                      {customer?.phone || '—'}
                    </p>
                    <p>
                      <span className="font-bold">E-mail:</span>{' '}
                      {customer?.email || '—'}
                    </p>
                    <p>
                      <span className="font-bold">Elvégzés időpontja:</span>{' '}
                      {formatDate(workOrder.service_date)}
                    </p>
                    <p>
                      <span className="font-bold">Munka típusa:</span>{' '}
                      {workOrder.job_type || '—'}
                    </p>
                    <p>
                      <span className="font-bold">Célzott kártevő:</span>{' '}
                      {workOrder.target_pest || '—'}
                    </p>
                    <p>
                      <span className="font-bold">Helyszín:</span>{' '}
                      {workOrder.address || customer?.address || '—'}
                    </p>
                    <p>
                      <span className="font-bold">Státusz:</span>{' '}
                      {getStatusLabel(workOrder.status)}
                    </p>
                  </div>
                </section>
              </div>

              <section className="avoid-break rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 border-b-2 border-slate-200 pb-2">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Kártevőirtó technikusok
                  </h3>
                </div>

                <p>
                  {technicianSignature?.technician_name || 'Tóth Ferenc Richárd'}{' '}
                  (Működési nyilvántartási szám: SO-05/neo976-1/2025)
                </p>
              </section>

              <section className="avoid-break rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 border-b-2 border-slate-200 pb-2">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Munkalap adatai
                  </h3>
                </div>

                <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
                  <div>
                    <span className="font-bold">Ügyfél címe:</span>{' '}
                    {customer?.address || '—'}
                  </div>
                  <div>
                    <span className="font-bold">Ügyfél típusa:</span>{' '}
                    {customer?.customer_type || '—'}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-bold">Megjegyzés:</span>{' '}
                    {customer?.notes || '—'}
                  </div>
                </div>
              </section>

              <section className="avoid-break rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 border-b-2 border-slate-200 pb-2">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Kezelés leírása
                  </h3>
                </div>

                <div className="min-h-[90px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {workOrder.treatment_description || '—'}
                </div>
              </section>

              <section className="avoid-break rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 border-b-2 border-slate-200 pb-2">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Felhasznált készítmények
                  </h3>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-300">
                  <div className="hidden grid-cols-4 border-b border-slate-300 bg-slate-100 font-bold md:grid">
                    <div className="px-3 py-3">Termék</div>
                    <div className="px-3 py-3">Mennyiség</div>
                    <div className="px-3 py-3">Alkalmazási technika</div>
                    <div className="px-3 py-3">Célzott kártevő</div>
                  </div>

                  {products.length > 0 ? (
                    <>
                      <div className="hidden md:block">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            className="grid grid-cols-4 border-t border-slate-200 text-sm"
                          >
                            <div className="px-3 py-3">
                              {product.product_name || '—'}
                            </div>
                            <div className="px-3 py-3">
                              {product.quantity || '—'}
                            </div>
                            <div className="px-3 py-3">
                              {product.method || '—'}
                            </div>
                            <div className="px-3 py-3">
                              {product.target_pest || '—'}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 p-3 md:hidden">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <p>
                              <span className="font-bold">Termék:</span>{' '}
                              {product.product_name || '—'}
                            </p>
                            <p>
                              <span className="font-bold">Mennyiség:</span>{' '}
                              {product.quantity || '—'}
                            </p>
                            <p>
                              <span className="font-bold">Alkalmazási technika:</span>{' '}
                              {product.method || '—'}
                            </p>
                            <p>
                              <span className="font-bold">Célzott kártevő:</span>{' '}
                              {product.target_pest || '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="grid gap-2 p-3 text-sm md:grid-cols-4">
                      <div>
                        <span className="font-bold">Termék:</span> Nincs még külön
                        rögzítve
                      </div>
                      <div>
                        <span className="font-bold">Mennyiség:</span> —
                      </div>
                      <div>
                        <span className="font-bold">Technika:</span>{' '}
                        {workOrder.job_type || '—'}
                      </div>
                      <div>
                        <span className="font-bold">Kártevő:</span>{' '}
                        {workOrder.target_pest || '—'}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="avoid-break rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 border-b-2 border-slate-200 pb-2">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Figyelmeztetések, óvintézkedések és javasolt teendők
                  </h3>
                </div>

                {workOrder.auto_warnings?.length || workOrder.auto_tasks?.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
                      <div className="mb-2 text-sm font-bold text-rose-700">
                        Figyelmeztetések
                      </div>

                      {workOrder.auto_warnings?.length ? (
                        <ul className="list-disc space-y-1 pl-5 text-[12px] text-slate-800">
                          {workOrder.auto_warnings.map((item, index) => (
                            <li key={`pdf-warning-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-500">
                          Nincs automatikus figyelmeztetés.
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
                      <div className="mb-2 text-sm font-bold text-[#388cc4]">
                        Teendők
                      </div>

                      {workOrder.auto_tasks?.length ? (
                        <ul className="list-disc space-y-1 pl-5 text-[12px] text-slate-800">
                          {workOrder.auto_tasks.map((item, index) => (
                            <li key={`pdf-task-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-500">
                          Nincs automatikus teendő.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[56px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    A helyszíni tájékoztatás szerinti óvintézkedések betartása
                    javasolt.
                  </div>
                )}
              </section>

              <section className="avoid-break rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 border-b-2 border-slate-200 pb-2">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Aláírás
                  </h3>
                </div>

                <div className="grid gap-8 pt-2 md:grid-cols-2">
                  <div>
                    <div className="mb-3 text-sm text-slate-500">
                      Szolgáltató aláírás
                    </div>

                    {technicianSignature?.signature_data ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex h-[90px] items-center justify-center border-b border-slate-400">
                          <img
                            src={technicianSignature.signature_data}
                            alt="Technikus aláírás"
                            className="max-h-[75px] max-w-full object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-[90px] items-end border-b border-slate-400">
                        <div className="pb-2 text-sm font-medium text-slate-700">
                          {technicianSignature?.technician_name || 'Tóth Ferenc Richárd'}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {technicianSignature?.technician_name || 'Tóth Ferenc Richárd'}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-sm text-slate-500">
                      Ügyfél aláírás
                    </div>

                    {workOrder.customer_signature_url ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex h-[90px] items-center justify-center border-b border-slate-400">
                          <img
                            src={workOrder.customer_signature_url}
                            alt="Ügyfél aláírás"
                            className="max-h-[75px] max-w-full object-contain"
                          />
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Aláírva: {formatDateTime(workOrder.signed_at)}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[90px] border-b border-slate-400" />
                    )}

                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {customer?.name || 'Megrendelő'}
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-2 text-center text-xs text-slate-400">
                Dokumentum generálva: {formatDateTime(workOrder.created_at)}
              </div>
            </div>
          </section>

          {photos.length > 0 && (
            <section className="print-sheet mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(2,8,20,.08)]">
              <div className="border-b border-slate-200 bg-gradient-to-r from-[#388cc4] to-[#12bf3d] px-6 py-5 text-white md:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white/85">
                      KártevőGuru
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-white">
                      HELYSZÍNI FOTÓDOKUMENTÁCIÓ
                    </h3>
                    <div className="mt-2 text-sm text-white/85">
                      Munkalap: {workOrder.order_number || '—'}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/95 px-4 py-3 shadow-md">
                    <Image
                      src="/logo.png"
                      alt="KártevőGuru"
                      width={140}
                      height={50}
                      className="h-auto w-[120px] md:w-[140px]"
                    />
                  </div>
                </div>
              </div>

              <div className="print-grid-photos grid grid-cols-1 gap-6 px-5 py-6 md:grid-cols-2 md:px-8">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="avoid-break overflow-hidden rounded-2xl border border-slate-200"
                  >
                    <div className="flex h-[240px] items-center justify-center bg-slate-100">
                      {photo.public_url ? (
                        <img
                          src={photo.public_url}
                          alt={photo.file_name || `Fotó ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-sm text-slate-400">
                          Nincs előnézet
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-200 px-3 py-2 text-sm text-slate-600">
                      Fotó {index + 1}
                      {photo.file_name ? ` — ${photo.file_name}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  )
}