'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import WorkOrderDocument from '@/components/work-orders/WorkOrderDocument'
import type {
  WorkOrderDetails,
  WorkOrderPhoto,
  WorkOrderProduct,
  TechnicianSignature,
} from '@/components/work-orders/types'

type PublicWorkOrderResponse = {
  workOrder: WorkOrderDetails
  photos: WorkOrderPhoto[]
  products: WorkOrderProduct[]
  technicianSignature: TechnicianSignature | null
  error?: string
}

export default function PublicSharePage() {
  const params = useParams()
  const token = params?.token as string

  const [workOrder, setWorkOrder] = useState<WorkOrderDetails | null>(null)
  const [photos, setPhotos] = useState<WorkOrderPhoto[]>([])
  const [products, setProducts] = useState<WorkOrderProduct[]>([])
  const [technicianSignature, setTechnicianSignature] =
    useState<TechnicianSignature | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState('')

  useEffect(() => {
    async function loadPublicWorkOrder() {
      if (!token) return

      try {
        setLoading(true)
        setErrorText('')

        const response = await fetch(`/api/public-work-order/${token}`, {
          cache: 'no-store',
        })

        const rawText = await response.text()
        const result = rawText ? (JSON.parse(rawText) as PublicWorkOrderResponse) : null

        if (!response.ok) {
          throw new Error(
            result?.error || 'Nem sikerült betölteni a munkalapot.'
          )
        }

        if (!result) {
          throw new Error('Az API üres választ adott.')
        }

        setWorkOrder(result.workOrder)
        setPhotos(result.photos || [])
        setProducts(result.products || [])
        setTechnicianSignature(result.technicianSignature || null)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Ismeretlen hiba történt.'
        setErrorText(message)
      } finally {
        setLoading(false)
      }
    }

    loadPublicWorkOrder()
  }, [token])

  return (
    <WorkOrderDocument
      loading={loading}
      errorText={errorText}
      workOrder={workOrder}
      photos={photos}
      products={products}
      technicianSignature={technicianSignature}
      mode="public"
      onPrint={() => window.print()}
    />
  )
}
