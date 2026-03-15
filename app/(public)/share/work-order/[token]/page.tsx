'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

type Customer = {
  name?: string | null
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}

type WorkOrderProduct = {
  id: string
  product_name?: string | null
  quantity?: string | null
  method?: string | null
  target_pest?: string | null
}

type WorkOrderPhoto = {
  id: string
  file_name?: string | null
  public_url?: string | null
  created_at?: string | null
}

type WorkOrderData = {
  id: string
  order_number?: string | null
  service_date?: string | null
  address?: string | null
  job_type?: string | null
  target_pest?: string | null
  treatment_description?: string | null
  notes?: string | null
  next_service_date?: string | null
  created_at?: string | null
  customer?: Customer | null
  work_order_products?: WorkOrderProduct[]
  work_order_photos?: WorkOrderPhoto[]
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('hu-HU')
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('hu-HU')
}

export default function PublicWorkOrderPage() {
  const params = useParams()
  const token = params?.token as string

  const [data, setData] = useState<WorkOrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadWorkOrder() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(`/api/public-work-order/${token}`, {
          cache: 'no-store',
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result?.error || 'Nem sikerült betölteni a munkalapot.')
        }

        setData(result)
      } catch (err: any) {
        setError(err?.message || 'Hiba történt.')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadWorkOrder()
    }
  }, [token])

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
        <p>Munkalap betöltése...</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ marginBottom: 12 }}>Munkalap</h1>
        <p>{error || 'A munkalap nem található.'}</p>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f3f7fb',
        padding: '24px 12px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 12px 28px rgba(2,8,20,.08)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #388cc4, #12bf3d)',
            color: '#fff',
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,.14)',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            Egészségügyi kártevőirtás
          </div>

          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800 }}>
            Munkalap
          </h1>

          <p style={{ margin: '8px 0 0 0', opacity: 0.95 }}>
            KártevőGuru nyilvános megosztás
          </p>
        </div>

        <div style={{ padding: 24 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 14 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>MUNKALAP SORSZÁM</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1f2937' }}>
                {data.order_number || '—'}
              </div>
            </div>

            <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 14 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>SZOLGÁLTATÁS DÁTUMA</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1f2937' }}>
                {formatDate(data.service_date)}
              </div>
            </div>

            <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 14 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>GENERÁLVA</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
                {formatDateTime(data.created_at)}
              </div>
            </div>
          </div>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12, color: '#1f2937' }}>Ügyfél adatai</h2>
            <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 14, background: '#fff' }}>
              <p><strong>Név:</strong> {data.customer?.name || '—'}</p>
              <p><strong>Kapcsolattartó:</strong> {data.customer?.contact_person || '—'}</p>
              <p><strong>Telefon:</strong> {data.customer?.phone || '—'}</p>
              <p><strong>E-mail:</strong> {data.customer?.email || '—'}</p>
              <p><strong>Cím:</strong> {data.address || data.customer?.address || '—'}</p>
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12, color: '#1f2937' }}>Kezelés adatai</h2>
            <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 14 }}>
              <p><strong>Munka típusa:</strong> {data.job_type || '—'}</p>
              <p><strong>Célzott kártevő:</strong> {data.target_pest || '—'}</p>
              <p><strong>Kezelés leírása:</strong> {data.treatment_description || '—'}</p>
              <p><strong>Megjegyzés:</strong> {data.notes || '—'}</p>
              <p><strong>Következő kezelés:</strong> {formatDate(data.next_service_date)}</p>
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12, color: '#1f2937' }}>Felhasznált készítmények</h2>
            <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 14 }}>
              {data.work_order_products && data.work_order_products.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.work_order_products.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        padding: 14,
                        background: '#f8fafc',
                      }}
                    >
                      <p><strong>Készítmény:</strong> {item.product_name || '—'}</p>
                      <p><strong>Mennyiség:</strong> {item.quantity || '—'}</p>
                      <p><strong>Módszer:</strong> {item.method || '—'}</p>
                      <p><strong>Célzott kártevő:</strong> {item.target_pest || '—'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nincs rögzített készítmény.</p>
              )}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 22, marginBottom: 12, color: '#1f2937' }}>Fotók</h2>
            <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 14 }}>
              {data.work_order_photos && data.work_order_photos.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                  }}
                >
                  {data.work_order_photos.map((photo) =>
                    photo.public_url ? (
                      <div key={photo.id}>
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '4 / 3',
                            borderRadius: 12,
                            overflow: 'hidden',
                            background: '#e5e7eb',
                          }}
                        >
                          <Image
                            src={photo.public_url}
                            alt={photo.file_name || 'Munkalap fotó'}
                            fill
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                        </div>
                        <p style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>
                          {photo.file_name || 'Fotó'}
                        </p>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <p>Nincs feltöltött fotó.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}