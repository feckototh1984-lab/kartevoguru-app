'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import WorkOrderDocument from '@/components/work-orders/WorkOrderDocument'
import { formatDate } from '@/components/work-orders/types'
import type {
  WorkOrderDetails,
  WorkOrderPhoto,
  WorkOrderProduct,
  TechnicianSignature,
} from '@/components/work-orders/types'

export default function WorkOrderPdfPage() {
  const params = useParams()
  const id = params?.id as string

  const [workOrder, setWorkOrder] = useState<WorkOrderDetails | null>(null)
  const [photos, setPhotos] = useState<WorkOrderPhoto[]>([])
  const [products, setProducts] = useState<WorkOrderProduct[]>([])
  const [technicianSignature, setTechnicianSignature] =
    useState<TechnicianSignature | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

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
          public_token,
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
        .order('created_at', { ascending: true })

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

  async function handleSendEmail() {
    if (!workOrder) return

    if (!customer?.email?.trim()) {
      alert('Az ügyfélhez nincs e-mail cím rögzítve.')
      return
    }

    if (!workOrder.public_token?.trim()) {
      alert('Ehhez a munkalaphoz nincs publikus token.')
      return
    }

    try {
      setSendingEmail(true)

      const response = await fetch('/api/send-work-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workOrderId: workOrder.id,
          publicToken: workOrder.public_token,
          customerEmail: customer.email,
          customerName: customer.contact_person || customer.name || 'Ügyfelünk',
          orderNumber: workOrder.order_number,
          serviceDate: formatDate(workOrder.service_date),
          address: workOrder.address || customer.address,
          jobType: workOrder.job_type,
          targetPest: workOrder.target_pest,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Nem sikerült elküldeni az e-mailt.')
      }

      alert(
        'A munkalap sikeresen elküldve az ügyfélnek és az info@kartevoguru.hu címre.'
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ismeretlen hiba történt.'
      alert(message)
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <WorkOrderDocument
      loading={loading}
      errorText={errorText}
      workOrder={workOrder}
      photos={photos}
      products={products}
      technicianSignature={technicianSignature}
      mode="private"
      sendingEmail={sendingEmail}
      onSendEmail={handleSendEmail}
      onPrint={() => window.print()}
      backHref={`/work-orders/${id}`}
      backLabel="Vissza a munkalaphoz"
    />
  )
}