'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import WorkOrderPhotoUpload from '@/lib/components/ui/work-order-photo-upload'
import SignaturePadField from '@/lib/components/SignaturePadField'
import WorkOrderProductsField, {
  type WorkOrderProduct,
} from '@/lib/components/WorkOrderProductsField'

type CustomerDetails = {
  name: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  customer_type: string | null
  notes: string | null
}

type WorkOrderPhoto = {
  id: string
  work_order_id: string
  file_path: string
  file_name: string | null
  public_url: string | null
  created_at: string | null
}

type TechnicianSignature = {
  id: string
  technician_name: string
  signature_data: string
  created_at: string
  updated_at: string
}

type WorkOrderDetails = {
  id: string
  order_number: string | null
  service_date: string | null
  job_type: string | null
  target_pest: string | null
  address: string | null
  treatment_description: string | null
  status: string | null
  created_at: string
  customer_signature_url: string | null
  signed_at: string | null
  auto_warnings: string[] | null
  auto_tasks: string[] | null
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

export default function WorkOrderDetailsPage() {
  const params = useParams()
  const id = params?.id as string

  const [workOrder, setWorkOrder] = useState<WorkOrderDetails | null>(null)
  const [photos, setPhotos] = useState<WorkOrderPhoto[]>([])
  const [products, setProducts] = useState<WorkOrderProduct[]>([])
  const [technicianSignature, setTechnicianSignature] =
    useState<TechnicianSignature | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')

  useEffect(() => {
    async function loadWorkOrder() {
      if (!id) return

      setLoading(true)
      setErrorText('')

      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id,
          order_number,
          service_date,
          job_type,
          target_pest,
          address,
          treatment_description,
          status,
          created_at,
          customer_signature_url,
          signed_at,
          auto_warnings,
          auto_tasks,
          customers (
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

      const { data: photoData, error: photoError } = await supabase
        .from('work_order_photos')
        .select('*')
        .eq('work_order_id', id)
        .order('created_at', { ascending: false })

      if (photoError) {
        setLoading(false)
        setErrorText(photoError.message)
        return
      }

      const { data: productData, error: productError } = await supabase
        .from('work_order_products')
        .select('*')
        .eq('work_order_id', id)
        .order('created_at', { ascending: true })

      if (productError) {
        setLoading(false)
        setErrorText(productError.message)
        return
      }

      const { data: technicianData, error: technicianError } = await supabase
        .from('technician_signatures')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (technicianError) {
        setLoading(false)
        setErrorText(technicianError.message)
        return
      }

      setWorkOrder(data as unknown as WorkOrderDetails)
      setPhotos((photoData || []) as WorkOrderPhoto[])
      setProducts((productData || []) as WorkOrderProduct[])
      setTechnicianSignature(
        (technicianData as TechnicianSignature | null) || null
      )
      setLoading(false)
    }

    loadWorkOrder()
  }, [id])

  const customer = Array.isArray(workOrder?.customers)
    ? workOrder.customers[0]
    : workOrder?.customers

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm text-slate-500">KártevőGuru App</div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Munka adatlap
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Részletes adatok a kiválasztott munkáról.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link
            href="/settings/signature"
            className="px-5 py-3 rounded-xl font-semibold border border-[#388cc4] text-[#388cc4] bg-white hover:bg-[#388cc4]/5"
          >
            Technikus aláírás
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
          <p className="font-semibold text-amber-700">
            A munka nem található.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-[#388cc4] to-[#12bf3d] text-white rounded-2xl p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <div className="text-sm opacity-90 mb-2">Munka sorszáma</div>
            <div className="text-3xl font-extrabold">
              {workOrder.order_number || 'Nincs sorszám'}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
              <h2 className="text-lg font-bold mb-4">Munkalap adatai</h2>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-slate-500 mb-1">
                    Szolgáltatás dátuma
                  </div>
                  <div className="font-semibold">
                    {workOrder.service_date || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Munka típusa</div>
                  <div className="font-semibold">
                    {workOrder.job_type || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Célzott kártevő</div>
                  <div className="font-semibold">
                    {workOrder.target_pest || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Munkavégzés címe</div>
                  <div className="font-semibold">
                    {workOrder.address || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Státusz</div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                      workOrder.status
                    )}`}
                  >
                    {getStatusLabel(workOrder.status)}
                  </span>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Kezelés leírása</div>
                  <div className="font-semibold whitespace-pre-wrap">
                    {workOrder.treatment_description || '—'}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
              <h2 className="text-lg font-bold mb-4">Ügyfél adatai</h2>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-slate-500 mb-1">Ügyfél neve</div>
                  <div className="font-semibold">{customer?.name || '—'}</div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Kapcsolattartó</div>
                  <div className="font-semibold">
                    {customer?.contact_person || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Telefonszám</div>
                  <div className="font-semibold">{customer?.phone || '—'}</div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">E-mail</div>
                  <div className="font-semibold">{customer?.email || '—'}</div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Ügyfél címe</div>
                  <div className="font-semibold">{customer?.address || '—'}</div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Ügyfél típusa</div>
                  <div className="font-semibold">
                    {customer?.customer_type || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1">Megjegyzés</div>
                  <div className="font-semibold whitespace-pre-wrap">
                    {customer?.notes || '—'}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {workOrder.auto_warnings?.length || workOrder.auto_tasks?.length ? (
            <section className="bg-white rounded-2xl p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
              <h2 className="text-lg font-bold mb-4">
                Automatikus figyelmeztetések és teendők
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-rose-600 mb-3">
                    Figyelmeztetések
                  </h3>

                  {workOrder.auto_warnings?.length ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {workOrder.auto_warnings.map((item, index) => (
                        <li
                          key={`warning-${index}`}
                          className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Nincs automatikus figyelmeztetés.
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#388cc4] mb-3">
                    Teendők
                  </h3>

                  {workOrder.auto_tasks?.length ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {workOrder.auto_tasks.map((item, index) => (
                        <li
                          key={`task-${index}`}
                          className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Nincs automatikus teendő.
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          <section className="bg-white rounded-2xl p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="text-lg font-bold">Mentett technikus aláírás</h2>

              <Link
                href="/settings/signature"
                className="px-4 py-2 rounded-xl border border-[#388cc4] text-[#388cc4] font-semibold hover:bg-[#388cc4]/5"
              >
                Aláírás szerkesztése
              </Link>
            </div>

            {technicianSignature?.signature_data ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <img
                    src={technicianSignature.signature_data}
                    alt="Technikus aláírás"
                    className="max-h-36 object-contain"
                  />
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Technikus: {technicianSignature.technician_name}
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Még nincs mentett technikus aláírás.
                </p>
              </div>
            )}
          </section>

          <WorkOrderProductsField
            workOrderId={id}
            initialProducts={products}
            onSaved={(savedProducts, generated) => {
              setProducts(savedProducts)

              if (generated) {
                setWorkOrder((prev) =>
                  prev
                    ? {
                        ...prev,
                        auto_warnings: generated.warnings,
                        auto_tasks: generated.tasks,
                      }
                    : prev
                )
              }
            }}
          />

          <SignaturePadField
            workOrderId={id}
            existingSignatureUrl={workOrder.customer_signature_url}
            onSaved={(url) =>
              setWorkOrder((prev) =>
                prev
                  ? {
                      ...prev,
                      customer_signature_url: url,
                      signed_at: new Date().toISOString(),
                    }
                  : prev
              )
            }
          />

          {workOrder.customer_signature_url && (
            <section className="bg-white rounded-2xl p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
              <h2 className="text-lg font-bold mb-4">Elmentett ügyfél aláírás</h2>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <img
                  src={workOrder.customer_signature_url}
                  alt="Ügyfél aláírás"
                  className="max-h-36 object-contain"
                />
              </div>

              {workOrder.signed_at && (
                <p className="mt-3 text-sm text-slate-500">
                  Aláírva: {new Date(workOrder.signed_at).toLocaleString('hu-HU')}
                </p>
              )}
            </section>
          )}

          <WorkOrderPhotoUpload
            workOrderId={id}
            initialPhotos={photos}
          />

          <section className="bg-white rounded-2xl p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/work-orders/${id}/pdf`}
                className="px-5 py-3 rounded-xl font-semibold bg-[#12bf3d] text-white hover:opacity-90"
              >
                Munka lezárása
              </Link>

              <Link
                href="/work-orders"
                className="px-5 py-3 rounded-xl font-semibold border border-slate-300 bg-white hover:bg-slate-50"
              >
                Vissza a munkákhoz
              </Link>
            </div>
          </section>
        </>
      )}
    </main>
  )
}