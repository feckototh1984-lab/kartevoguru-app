'use client'

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

export default function WorkOrderDocument({
  loading,
  errorText,
  workOrder,
  photos,
  products,
  technicianSignature,
}: WorkOrderDocumentProps) {
  const customer = Array.isArray(workOrder?.customers)
    ? workOrder.customers[0]
    : workOrder?.customers

  return (
    <>
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

          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
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

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
          <p className="text-sm text-slate-500">Betöltés...</p>
        </div>
      ) : errorText ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-700">Hiba történt</p>
          <p className="mt-2 text-sm text-red-600">{errorText}</p>
        </div>
      ) : !workOrder ? (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6">
          <p className="font-semibold text-amber-700">
            A munkalap nem található.
          </p>
        </div>
      ) : (
        <div data-pdf-ready="true" className="space-y-5">
          <section className="print-sheet overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <div className="border-b border-slate-200 bg-white px-5 py-6 sm:px-7 md:px-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 rounded-[22px] border-[3px] border-[#12bf3d] bg-white p-3">
                    <Image
                      src="/logo.png"
                      alt="KártevőGuru"
                      width={220}
                      height={82}
                      priority
                      className="h-auto w-[150px] sm:w-[180px] md:w-[210px]"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="text-base text-slate-600 md:text-lg">
                      KártevőGuru
                    </div>
                    <h2 className="text-[28px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[36px] md:text-[46px]">
                      KÁRTEVŐIRTÁSI
                      <br />
                      MUNKALAP
                    </h2>
                    <div className="mt-2 text-lg text-slate-500 md:text-[30px] md:leading-tight">
                      Egészségügyi kártevőirtás
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 px-5 py-6 text-slate-800 sm:px-7 md:px-10 md:py-8">
              <section className="avoid-break">
                <div className="mb-4 border-b-[3px] border-slate-200 pb-2">
                  <h3 className="text-[26px] font-extrabold text-slate-900 md:text-[34px]">
                    Szolgáltató adatai
                  </h3>
                </div>

                <div className="space-y-2 text-[18px] leading-[1.8] md:text-[22px]">
                  <p>
                    <span className="font-bold">Szolgáltató:</span> KártevőGuru
                  </p>
                  <p>
                    <span className="font-bold">Felelős személy:</span>{' '}
                    {technicianSignature?.technician_name ||
                      'Tóth Ferenc Richárd'}
                  </p>
                  <p>
                    <span className="font-bold">Telefon:</span> +36 30 602 0650
                  </p>
                  <p>
                    <span className="font-bold">E-mail:</span>{' '}
                    info@kartevoguru.hu
                  </p>
                  <p>
                    <span className="font-bold">Székhely / cím:</span> 8700
                    Marcali, Borsó-hegyi út 4779
                  </p>
                  <p>
                    <span className="font-bold">Működési nyilv. szám:</span>{' '}
                    SO-05/neo976-1/2025
                  </p>
                  <p>
                    <span className="font-bold">Nyilvántartási szám:</span>{' '}
                    0099697
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

              <section className="avoid-break">
                <div className="mb-4 border-b-[3px] border-slate-200 pb-2">
                  <h3 className="text-[26px] font-extrabold text-slate-900 md:text-[34px]">
                    Szolgáltatás részletei
                  </h3>
                </div>

                <div className="space-y-2 text-[18px] leading-[1.8] md:text-[22px]">
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
                    <span className="font-bold">Munkalap sorszám:</span>{' '}
                    {workOrder.order_number || '—'}
                  </p>
                  <p>
                    <span className="font-bold">Generálva:</span>{' '}
                    {formatDateTime(workOrder.created_at)}
                  </p>
                </div>
              </section>

              <section className="avoid-break">
                <div className="mb-4 border-b-[3px] border-slate-200 pb-2">
                  <h3 className="text-[26px] font-extrabold text-slate-900 md:text-[34px]">
                    Kártevőirtó technikusok
                  </h3>
                </div>

                <p className="text-[18px] leading-[1.8] md:text-[22px]">
                  {technicianSignature?.technician_name ||
                    'Tóth Ferenc Richárd'}{' '}
                  (Működési nyilvántartási szám: SO-05/neo976-1/2025)
                </p>
              </section>

              {customer?.notes && (
                <section className="avoid-break">
                  <div className="mb-4 border-b-[3px] border-slate-200 pb-2">
                    <h3 className="text-[26px] font-extrabold text-slate-900 md:text-[34px]">
                      Megjegyzés
                    </h3>
                  </div>

                  <div className="min-h-[56px] whitespace-pre-wrap rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-[18px] leading-[1.8] md:text-[22px]">
                    {customer.notes}
                  </div>
                </section>
              )}

              <section className="avoid-break">
                <div className="mb-4 border-b-[3px] border-slate-200 pb-2">
                  <h3 className="text-[26px] font-extrabold text-slate-900 md:text-[34px]">
                    Kezelés leírása
                  </h3>
                </div>

                <div className="min-h-[90px] whitespace-pre-wrap rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-[18px] leading-[1.8] md:text-[22px]">
                  {workOrder.treatment_description || '—'}
                </div>
              </section>

              <section className="avoid-break">
                <div className="mb-4 border-b-[3px] border-slate-200 pb-2">
                  <h3 className="text-[26px] font-extrabold text-slate-900 md:text-[34px]">
                    Felhasznált készítmények
                  </h3>
                </div>

                <div className="space-y-4">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="space-y-2 text-[18px] leading-[1.8] md:text-[22px]">
                          <p>
                            <span className="font-bold">Termék:</span>{' '}
                            {product.product_name || '—'}
                          </p>
                          <p>
                            <span className="font-bold">Mennyiség:</span>{' '}
                            {product.quantity || '—'}
                          </p>
                          <p>
                            <span className="font-bold">
                              Alkalmazási technika:
                            </span>{' '}
                            {product.method || '—'}
                          </p>
                          <p>
                            <span className="font-bold">Célzott kártevő:</span>{' '}
                            {product.target_pest || '—'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <div className="space-y-2 text-[18px] leading-[1.8] md:text-[22px]">
                        <p>
                          <span className="font-bold">Termék:</span> Nincs még
                          külön rögzítve
                        </p>
                        <p>
                          <span className="font-bold">Mennyiség:</span> —
                        </p>
                        <p>
                          <span className="font-bold">Technika:</span>{' '}
                          {workOrder.job_type || '—'}
                        </p>
                        <p>
                          <span className="font-bold">Kártevő:</span>{' '}
                          {workOrder.target_pest || '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="avoid-break">
                <div className="mb-4 border-b-[3px] border-slate-200 pb-2">
                  <h3 className="text-[26px] font-extrabold text-slate-900 md:text-[34px]">
                    Figyelmeztetések, óvintézkedések és javasolt teendők
                  </h3>
                </div>

                {workOrder.auto_warnings?.length ||
                workOrder.auto_tasks?.length ? (
                  <div className="grid gap-4 md:grid-cols-2 print-grid-2">
                    <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4">
                      <div className="mb-2 text-base font-bold text-rose-700 md:text-lg">
                        Figyelmeztetések
                      </div>

                      {workOrder.auto_warnings?.length ? (
                        <ul className="list-disc space-y-1 pl-5 text-[16px] leading-[1.7] text-slate-800 md:text-[18px]">
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

                    <div className="rounded-[22px] border border-blue-200 bg-blue-50 px-4 py-4">
                      <div className="mb-2 text-base font-bold text-[#388cc4] md:text-lg">
                        Teendők
                      </div>

                      {workOrder.auto_tasks?.length ? (
                        <ul className="list-disc space-y-1 pl-5 text-[16px] leading-[1.7] text-slate-800 md:text-[18px]">
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
                  <div className="min-h-[56px] whitespace-pre-wrap rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-[18px] leading-[1.8] md:text-[22px]">
                    A helyszíni tájékoztatás szerinti óvintézkedések betartása
                    javasolt.
                  </div>
                )}
              </section>

              <section className="avoid-break">
                <div className="mb-4 border-b-[3px] border-slate-200 pb-2">
                  <h3 className="text-[26px] font-extrabold text-slate-900 md:text-[34px]">
                    Aláírás
                  </h3>
                </div>

                <div className="grid gap-8 pt-2 md:grid-cols-2 print-grid-2">
                  <div>
                    <div className="mb-3 text-sm text-slate-500 md:text-base">
                      Szolgáltató aláírás
                    </div>

                    {technicianSignature?.signature_data ? (
                      <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-3 py-3">
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
                        <div className="pb-2 text-sm font-medium text-slate-700 md:text-base">
                          {technicianSignature?.technician_name ||
                            'Tóth Ferenc Richárd'}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-sm font-medium text-slate-900 md:text-base">
                      {technicianSignature?.technician_name ||
                        'Tóth Ferenc Richárd'}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 text-sm text-slate-500 md:text-base">
                      Ügyfél aláírás
                    </div>

                    {workOrder.customer_signature_url ? (
                      <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex h-[90px] items-center justify-center border-b border-slate-400">
                          <img
                            src={workOrder.customer_signature_url}
                            alt="Ügyfél aláírás"
                            className="max-h-[75px] max-w-full object-contain"
                          />
                        </div>
                        <div className="mt-2 text-xs text-slate-500 md:text-sm">
                          Aláírva: {formatDateTime(workOrder.signed_at)}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[90px] border-b border-slate-400" />
                    )}

                    <div className="mt-2 text-sm font-medium text-slate-900 md:text-base">
                      {customer?.name || 'Megrendelő'}
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-2 text-center text-xs text-slate-400 md:text-sm">
                Dokumentum generálva: {formatDateTime(workOrder.created_at)}
              </div>
            </div>
          </section>

          {photos.length > 0 && (
            <section className="print-sheet overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(2,8,20,.08)]">
              <div className="border-b border-slate-200 bg-white px-5 py-6 sm:px-7 md:px-10">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 rounded-[22px] border-[3px] border-[#12bf3d] bg-white p-3">
                    <Image
                      src="/logo.png"
                      alt="KártevőGuru"
                      width={140}
                      height={50}
                      className="h-auto w-[120px] md:w-[140px]"
                    />
                  </div>

                  <div>
                    <div className="text-base text-slate-600 md:text-lg">
                      KártevőGuru
                    </div>
                    <h3 className="text-[28px] font-extrabold tracking-tight text-slate-900 md:text-[36px]">
                      HELYSZÍNI FOTÓDOKUMENTÁCIÓ
                    </h3>
                    <div className="mt-2 text-base text-slate-500 md:text-lg">
                      Munkalap: {workOrder.order_number || '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="print-grid-photos grid grid-cols-1 gap-6 px-5 py-6 md:grid-cols-2 md:px-10">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="avoid-break overflow-hidden rounded-[22px] border border-slate-200"
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

                    <div className="border-t border-slate-200 px-3 py-2 text-sm text-slate-600 md:text-base">
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
    </>
  )
}