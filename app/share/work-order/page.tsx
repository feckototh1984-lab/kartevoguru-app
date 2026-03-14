import { notFound } from 'next/navigation'
import Image from 'next/image'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'KártevőGuru munkalap',
  robots: {
    index: false,
    follow: false,
  },
}

type PageProps = {
  params: Promise<{
    token: string
  }>
}

type WorkOrderPhoto = {
  id: string
  file_url: string | null
}

type CustomerDetails = {
  name: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
}

type WorkOrderDetails = {
  id: string
  work_order_number: string | null
  service_date: string | null
  address: string | null
  job_type: string | null
  target_pest: string | null
  treatment_description: string | null
  created_at: string | null
  customer_signature_url: string | null
  technician_signature_url: string | null
  customers: CustomerDetails | CustomerDetails[] | null
  work_order_photos: WorkOrderPhoto[] | null
}

function formatDate(dateString?: string | null) {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('hu-HU')
}

function normalizeCustomer(customer: WorkOrderDetails['customers']): CustomerDetails | null {
  if (!customer) return null
  return Array.isArray(customer) ? (customer[0] ?? null) : customer
}

export default async function SharedWorkOrderPage({ params }: PageProps) {
  const { token } = await params

  const { data, error } = await supabaseAdmin
    .from('work_orders')
    .select(`
      id,
      work_order_number,
      service_date,
      address,
      job_type,
      target_pest,
      treatment_description,
      created_at,
      customer_signature_url,
      technician_signature_url,
      customers (
        name,
        contact_person,
        phone,
        email,
        address
      ),
      work_order_photos (
        id,
        file_url
      )
    `)
    .eq('public_token', token)
    .single()

  if (error || !data) {
    notFound()
  }

  const workOrder = data as unknown as WorkOrderDetails
  const customer = normalizeCustomer(workOrder.customers)

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '24px 12px',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 12px 28px rgba(2,8,20,.08)',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #388cc4, #12bf3d)',
            color: '#fff',
            padding: '24px',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
            KártevőGuru munkalap
          </h1>
          <p style={{ margin: '8px 0 0', opacity: 0.95 }}>
            Munkalapszám: {workOrder.work_order_number || '-'}
          </p>
        </div>

        <div style={{ padding: 24 }}>
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12, color: '#1f2937' }}>
              Ügyfél adatai
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              <InfoCard label="Név" value={customer?.name} />
              <InfoCard label="Kapcsolattartó" value={customer?.contact_person} />
              <InfoCard label="Telefon" value={customer?.phone} />
              <InfoCard label="E-mail" value={customer?.email} />
              <InfoCard label="Cím" value={workOrder.address || customer?.address} />
              <InfoCard label="Dátum" value={formatDate(workOrder.service_date)} />
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12, color: '#1f2937' }}>
              Munkavégzés adatai
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              <InfoCard label="Munka típusa" value={workOrder.job_type} />
              <InfoCard label="Célzott kártevő" value={workOrder.target_pest} />
            </div>

            <div
              style={{
                marginTop: 12,
                padding: 16,
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                background: '#f8fafc',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: 8,
                }}
              >
                Kezelés leírása
              </div>
              <div style={{ whiteSpace: 'pre-wrap', color: '#1f2937' }}>
                {workOrder.treatment_description || '-'}
              </div>
            </div>
          </section>

          {!!workOrder.work_order_photos?.length && (
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, marginBottom: 12, color: '#1f2937' }}>
                Feltöltött fotók
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                {workOrder.work_order_photos.map((photo) =>
                  photo.file_url ? (
                    <div
                      key={photo.id}
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '4 / 3',
                        borderRadius: 14,
                        overflow: 'hidden',
                        border: '1px solid #e5e7eb',
                        background: '#f1f5f9',
                      }}
                    >
                      <Image
                        src={photo.file_url}
                        alt="Munkalap fotó"
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}

          {(workOrder.customer_signature_url || workOrder.technician_signature_url) && (
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, marginBottom: 12, color: '#1f2937' }}>
                Aláírások
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                <SignatureCard
                  title="Ügyfél aláírás"
                  imageUrl={workOrder.customer_signature_url}
                />
                <SignatureCard
                  title="Technikus aláírás"
                  imageUrl={workOrder.technician_signature_url}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}

function InfoCard({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div
      style={{
        padding: 16,
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        background: '#fff',
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: '#475569',
          marginBottom: 6,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div style={{ color: '#1f2937' }}>{value || '-'}</div>
    </div>
  )
}

function SignatureCard({
  title,
  imageUrl,
}: {
  title: string
  imageUrl?: string | null
}) {
  return (
    <div
      style={{
        padding: 16,
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        background: '#fff',
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: '#475569',
          marginBottom: 10,
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      {imageUrl ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 140,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <Image
            src={imageUrl}
            alt={title}
            fill
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        </div>
      ) : (
        <div style={{ color: '#94a3b8' }}>Nincs aláírás</div>
      )}
    </div>
  )
}