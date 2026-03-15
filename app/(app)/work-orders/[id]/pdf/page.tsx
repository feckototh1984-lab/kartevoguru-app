'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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

type WorkOrderProduct = {
  id: string
  work_order_id: string
  product_name: string | null
  quantity: string | null
  method: string | null
  target_pest: string | null
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
  pdf_file_path?: string | null
  completed_at?: string | null
  customers: CustomerDetails | CustomerDetails[] | null
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export default function WorkOrderPdfPage() {
  const params = useParams()
  const id = params?.id as string
  const pdfRef = useRef<HTMLDivElement | null>(null)

  const [workOrder, setWorkOrder] = useState<WorkOrderDetails | null>(null)
  const [photos, setPhotos] = useState<WorkOrderPhoto[]>([])
  const [products, setProducts] = useState<WorkOrderProduct[]>([])
  const [technicianSignature, setTechnicianSignature] =
    useState<TechnicianSignature | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [completingWork, setCompletingWork] = useState(false)

  useEffect(() => {
    async function loadWorkOrder() {
      if (!id) return

      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          customers (*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        setErrorText(error.message)
        setLoading(false)
        return
      }

      const { data: photoData } = await supabase
        .from('work_order_photos')
        .select('*')
        .eq('work_order_id', id)

      const { data: productData } = await supabase
        .from('work_order_products')
        .select('*')
        .eq('work_order_id', id)

      const { data: technicianData } = await supabase
        .from('technician_signatures')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setWorkOrder(data)
      setPhotos(photoData || [])
      setProducts(productData || [])
      setTechnicianSignature(technicianData)
      setLoading(false)
    }

    loadWorkOrder()
  }, [id])

  const customer = Array.isArray(workOrder?.customers)
    ? workOrder?.customers[0]
    : workOrder?.customers

  async function handleCompleteWork() {
    if (!pdfRef.current || !workOrder) return

    try {
      setCompletingWork(true)

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/jpeg', 1.0)

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = 210
      const pageHeight = (canvas.height * pageWidth) / canvas.width

      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight)

      const blob = pdf.output('blob')

      const formData = new FormData()
      formData.append(
        'pdf',
        new File(
          [blob],
          `${workOrder.order_number || 'munkalap'}.pdf`,
          { type: 'application/pdf' }
        )
      )

      const response = await fetch(`/api/work-orders/${workOrder.id}/complete`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Nem sikerült a munka befejezése.')
      }

      setWorkOrder((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              completed_at: result.completed_at,
              pdf_file_path: result.pdf_file_path,
            }
          : prev
      )

      alert('A munkalap véglegesítve lett.')
    } catch (error) {
      console.error(error)
      alert('Nem sikerült a munkalap véglegesítése.')
    } finally {
      setCompletingWork(false)
    }
  }

  async function handleSendEmail() {
    if (!workOrder) return

    try {
      setSendingEmail(true)

      const response = await fetch('/api/send-work-order-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrderId: workOrder.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Nem sikerült elküldeni az e-mailt.')
      }

      alert('A munkalap elküldve e-mailben.')
    } catch (err) {
      console.error(err)
      alert('Nem sikerült elküldeni az e-mailt.')
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) return <div className="p-6">Betöltés...</div>
  if (!workOrder) return <div className="p-6">Munkalap nem található.</div>

  return (
    <main className="mx-auto max-w-5xl p-6 bg-slate-100 min-h-screen">
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => window.print()}
          className="bg-[#12bf3d] text-white px-5 py-3 rounded-xl font-semibold"
        >
          Nyomtatás / PDF mentés
        </button>

        <button
          onClick={handleCompleteWork}
          disabled={completingWork}
          className="bg-slate-900 text-white px-5 py-3 rounded-xl font-semibold"
        >
          {completingWork ? 'PDF készül...' : 'Munka befejezése'}
        </button>

        <button
          onClick={handleSendEmail}
          disabled={sendingEmail}
          className="bg-[#388cc4] text-white px-5 py-3 rounded-xl font-semibold"
        >
          {sendingEmail ? 'Küldés...' : 'E-mail küldése'}
        </button>

        <Link
          href={`/work-orders/${id}`}
          className="border px-5 py-3 rounded-xl bg-white"
        >
          Vissza
        </Link>
      </div>

      <div
        ref={pdfRef}
        className="bg-white rounded-2xl shadow p-8"
      >
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="logo" width={160} height={60} />
            <div>
              <div className="text-sm text-slate-500">KártevőGuru</div>
              <div className="text-2xl font-bold">
                KÁRTEVŐIRTÁSI MUNKALAP
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">Munkalap sorszám</div>
            <div className="text-xl font-bold">
              {workOrder.order_number}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="font-bold mb-2">Szolgáltató</div>
            <div>KártevőGuru</div>
            <div>+36 30 602 0650</div>
            <div>info@kartevoguru.hu</div>
          </div>

          <div>
            <div className="font-bold mb-2">Megrendelő</div>
            <div>{customer?.name}</div>
            <div>{customer?.phone}</div>
            <div>{customer?.email}</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="font-bold mb-2">Kezelés leírása</div>
          <div className="border rounded p-3 bg-slate-50">
            {workOrder.treatment_description}
          </div>
        </div>

        <div className="mt-6 text-xs text-center text-slate-400">
          Generálva: {formatDateTime(workOrder.created_at)}
        </div>
      </div>
    </main>
  )
}