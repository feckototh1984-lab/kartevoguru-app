'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { supabase } from '@/lib/supabase'

type WorkOrder = {
  id: string
  customer_id: string | null
  work_order_number: string | null
  order_number?: string | null
  service_date: string | null
  address: string | null
  job_type: string | null
  target_pest: string | null
  treatment_description: string | null
  next_service_date: string | null
  created_at: string | null
  notes: string | null
  status?: string | null
  technician_name?: string | null
}

type Customer = {
  id: string
  name: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  customer_type?: string | null
  notes?: string | null
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

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('hu-HU')
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('hu-HU')
}

export default function WorkOrderPdfPage() {
  const params = useParams()
  const id = params?.id as string

  const printRef = useRef<HTMLDivElement | null>(null)

  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [products, setProducts] = useState<WorkOrderProduct[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const { data: workOrderData, error: workOrderError } = await supabase
          .from('work_orders')
          .select('*')
          .eq('id', id)
          .single()

        if (workOrderError) throw workOrderError
        setWorkOrder(workOrderData as WorkOrder)

        if (workOrderData?.customer_id) {
          const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('id', workOrderData.customer_id)
            .maybeSingle()

          setCustomer((customerData as Customer) || null)
        }

        const { data: productData } = await supabase
          .from('work_order_products')
          .select('*')
          .eq('work_order_id', id)
          .order('created_at', { ascending: true })

        setProducts((productData as WorkOrderProduct[]) || [])
      } catch (error) {
        console.error('PDF PAGE LOAD ERROR:', error)
        alert('Nem sikerült betölteni a munkalapot.')
      } finally {
        setLoading(false)
      }
    }

    if (id) loadData()
  }, [id])

  async function createPdfBlob() {
    if (!printRef.current) return null

    const pages = Array.from(
      printRef.current.querySelectorAll<HTMLElement>('[data-pdf-page="true"]')
    )

    if (pages.length === 0) return null

    const pdf = new jsPDF('p', 'mm', 'a4')

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]

      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pageWidth = 210
      const pageHeight = 297

      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight)
    }

    return pdf.output('blob')
  }

  async function handlePrint() {
    window.print()
  }

  async function handleDownloadPdf() {
    try {
      const blob = await createPdfBlob()
      if (!blob) {
        alert('Nem sikerült a PDF elkészítése.')
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `munkalap-${orderNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF DOWNLOAD ERROR:', error)
      alert('Nem sikerült a PDF letöltése.')
    }
  }

  async function handleSendEmail() {
    try {
      setSendingEmail(true)

      const pdfBlob = await createPdfBlob()
      if (!pdfBlob) {
        alert('Nem sikerült a PDF elkészítése.')
        return
      }

      const formData = new FormData()
      formData.append('workOrderId', String(id))
      formData.append('pdf', pdfBlob, `munkalap-${orderNumber}.pdf`)

      const response = await fetch('/api/send-work-order-email', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.details || result?.error || 'Nem sikerült elküldeni az e-mailt.')
      }

      alert('A munkalap e-mailben elküldve.')
    } catch (error: any) {
      console.error('SEND EMAIL ERROR:', error)
      alert(error?.message || 'Nem sikerült elküldeni az e-mailt.')
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <main style={screenBg}>
        <div style={loadingWrap}>Munkalap betöltése...</div>
      </main>
    )
  }

  if (!workOrder) {
    return (
      <main style={screenBg}>
        <div style={loadingWrap}>A munkalap nem található.</div>
      </main>
    )
  }

  const orderNumber =
    workOrder.work_order_number || workOrder.order_number || '—'

  const technicianName =
    workOrder.technician_name || 'Tóth Ferenc Richárd'

  const serviceWarnings = [
    'A kihelyezett irtószert ne távolítsák el a teljes hatás kialakulásáig.',
    'A kezelés alatt és közvetlenül utána a helyiségben tartózkodni nem szabad.',
    'Élelmiszereket, edényeket és használati tárgyakat zárt helyen kell tartani.',
  ]

  const serviceTodos = [
    'Az élelmiszermorzsákat zártan kell tárolni.',
    'A bejutási pontokat és repedéseket célszerű lezárni.',
    'A kezelés után alapos szellőztetés szükséges.',
    'A technikus által megadott várakozási időt be kell tartani.',
  ]

  return (
    <main style={screenBg}>
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          header,
          nav,
          .pdf-toolbar {
            display: none !important;
          }

          .pdf-screen-wrap {
            padding: 0 !important;
            background: #ffffff !important;
          }

          .pdf-document {
            box-shadow: none !important;
            margin: 0 auto !important;
          }

          .pdf-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
          }

          .pdf-page:last-child {
            page-break-after: auto;
          }
        }
      `}</style>

      <div className="pdf-toolbar" style={toolbarWrap}>
        <button type="button" onClick={handlePrint} style={toolbarButton}>
          Nyomtatás / PDF mentés
        </button>

        <button type="button" onClick={handleDownloadPdf} style={toolbarButtonGhost}>
          PDF letöltése
        </button>

        <button
          type="button"
          onClick={handleSendEmail}
          disabled={sendingEmail}
          style={toolbarButtonPrimary}
        >
          {sendingEmail ? 'Küldés folyamatban...' : 'Munkalap küldése'}
        </button>
      </div>

      <div className="pdf-screen-wrap" style={docWrap}>
        <div ref={printRef} className="pdf-document" style={documentStyle}>
          <section data-pdf-page="true" className="pdf-page" style={pageStyle}>
            <div style={headerRow}>
              <div style={brandArea}>
                <div style={logoBox}>
                  <div style={logoShield}>🛡</div>
                  <div>
                    <div style={logoSmall}>KÁRTEVŐ</div>
                    <div style={logoBigGreen}>GURU</div>
                  </div>
                </div>

                <div>
                  <div style={brandMini}>KártevőGuru</div>
                  <div style={docTitle}>KÁRTEVŐIRTÁSII<br />MUNKALAP</div>
                  <div style={docSubtitle}>Egészségügyi kártevőirtás</div>
                </div>
              </div>

              <div style={topMeta}>
                <div style={metaLabel}>MUNKALAP SORSZÁM</div>
                <div style={metaValue}>{orderNumber}</div>

                <div style={{ height: 14 }} />

                <div style={metaLabel}>GENERÁLVA</div>
                <div style={metaSub}>{formatDateTime(workOrder.created_at)}</div>
              </div>
            </div>

            <Divider />

            <div style={twoCol}>
              <Section title="Szolgáltató adatai">
                <InfoLine label="Szolgáltató" value="KártevőGuru" />
                <InfoLine label="Felelős személy" value="Tóth Ferenc Richárd" />
                <InfoLine label="Telefon" value="+36 30 602 0650" />
                <InfoLine label="E-mail" value="info@kartevoguru.hu" />
                <InfoLine label="Székhely / cím" value="8700 Marcali, Borsó-hegyi út 4779" />
                <InfoLine label="Működési nyilv. szám" value="SO-05/neo976-1/2025" />
                <InfoLine label="Nyilvántartási szám" value="0099697" />
                <InfoLine label="Adószám" value="91094722-1-34" />
                <InfoLine label="Bankszámlaszám" value="12042847-01896099-00100007" />
              </Section>

              <Section title="Szolgáltatás részletei">
                <InfoLine label="Megrendelő" value={customer?.name || '—'} />
                <InfoLine label="Kapcsolattartó" value={customer?.contact_person || '—'} />
                <InfoLine label="Telefonszám" value={customer?.phone || '—'} />
                <InfoLine label="E-mail" value={customer?.email || '—'} />
                <InfoLine label="Elvégzés időpontja" value={formatDate(workOrder.service_date)} />
                <InfoLine label="Munka típusa" value={workOrder.job_type || '—'} />
                <InfoLine label="Célzott kártevő" value={workOrder.target_pest || '—'} />
                <InfoLine label="Helyszín" value={workOrder.address || customer?.address || '—'} />
                <InfoLine label="Státusz" value={workOrder.status || 'draft'} />
              </Section>
            </div>

            <Section title="Kártevőirtó technikusok" topMargin={20}>
              <div style={simpleText}>
                {technicianName} (Működési nyilvántartási szám: SO-05/neo976-1/2025)
              </div>
            </Section>

            <Section title="Munkalap adatai" topMargin={20}>
              <div style={gridTwo}>
                <InfoLine label="Ügyfél címe" value={workOrder.address || customer?.address || '—'} />
                <InfoLine label="Ügyfél típusa" value={customer?.customer_type || 'lakossági'} />
              </div>
              <div style={{ marginTop: 10 }}>
                <InfoLine label="Megjegyzés" value={workOrder.notes || customer?.notes || '—'} />
              </div>
            </Section>

            <Section title="Kezelés leírása" topMargin={20}>
              <div style={textBox}>
                {workOrder.treatment_description || '—'}
              </div>
            </Section>

            <Section title="Felhasznált készítmények" topMargin={20}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHead}>Termék</th>
                    <th style={tableHead}>Mennyiség</th>
                    <th style={tableHead}>Alkalmazási technika</th>
                    <th style={tableHead}>Célzott kártevő</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((item) => (
                      <tr key={item.id}>
                        <td style={tableCell}>{item.product_name || '—'}</td>
                        <td style={tableCell}>{item.quantity || '—'}</td>
                        <td style={tableCell}>{item.method || '—'}</td>
                        <td style={tableCell}>{item.target_pest || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={tableCell} colSpan={4}>
                        Nincs rögzített készítmény.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            <div style={pageNumberFooter}>1/2</div>
          </section>

          <section data-pdf-page="true" className="pdf-page" style={pageStyle}>
            <Section title="Figyelmeztetések, óvintézkedések és javasolt teendők">
              <div style={warningGrid}>
                <div style={warningCardRed}>
                  <div style={warningTitleRed}>Figyelmeztetések</div>
                  <ul style={bulletList}>
                    {serviceWarnings.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div style={warningCardBlue}>
                  <div style={warningTitleBlue}>Teendők</div>
                  <ul style={bulletList}>
                    {serviceTodos.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            <Section title="Következő kezelés" topMargin={24}>
              <div style={textBox}>
                {workOrder.next_service_date
                  ? `Javasolt következő kezelés időpontja: ${formatDate(workOrder.next_service_date)}`
                  : 'Következő kezelés nincs megadva.'}
              </div>
            </Section>

            <Section title="Ügyfél tájékoztatás" topMargin={24}>
              <div style={textBox}>
                A kezelés eredményessége érdekében az irtószerrel kezelt felületeket és kihelyezett
                pontokat a technikus utasításai szerint kell kezelni. Kérdés esetén hívja:
                +36 30 602 0650.
              </div>
            </Section>

            <div style={signBlock}>
              <div style={signCol}>
                <div style={signLine} />
                <div style={signText}>Szolgáltató aláírása</div>
              </div>

              <div style={signCol}>
                <div style={signLine} />
                <div style={signText}>Megrendelő aláírása</div>
              </div>
            </div>

            <div style={bottomBar}>
              <div>KártevőGuru • Egészségügyi kártevőirtás</div>
              <div>2/2</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function Divider() {
  return <div style={dividerStyle} />
}

function Section({
  title,
  children,
  topMargin = 0,
}: {
  title: string
  children: React.ReactNode
  topMargin?: number
}) {
  return (
    <section style={{ marginTop: topMargin }}>
      <h2 style={sectionTitle}>{title}</h2>
      <div style={sectionLine} />
      <div style={{ marginTop: 10 }}>{children}</div>
    </section>
  )
}

function InfoLine({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={infoRow}>
      <span style={infoLabel}>{label}:</span> {value}
    </div>
  )
}

const screenBg: CSSProperties = {
  minHeight: '100vh',
  background: '#e9ecef',
  padding: '18px 10px 40px',
}

const loadingWrap: CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  background: '#fff',
  padding: 24,
  borderRadius: 12,
}

const toolbarWrap: CSSProperties = {
  maxWidth: 900,
  margin: '0 auto 16px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const toolbarButton: CSSProperties = {
  padding: '12px 18px',
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  background: '#ffffff',
  color: '#111827',
  fontWeight: 700,
  cursor: 'pointer',
}

const toolbarButtonGhost: CSSProperties = {
  padding: '12px 18px',
  borderRadius: 12,
  border: '1px solid #d0d5dd',
  background: '#ffffff',
  color: '#111827',
  fontWeight: 700,
  cursor: 'pointer',
}

const toolbarButtonPrimary: CSSProperties = {
  padding: '12px 18px',
  borderRadius: 12,
  border: 'none',
  background: '#12bf3d',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 8px 20px rgba(0,0,0,.18)',
}

const docWrap: CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
}

const documentStyle: CSSProperties = {
  width: '100%',
}

const pageStyle: CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  background: '#ffffff',
  margin: '0 auto 18px',
  boxShadow: '0 10px 30px rgba(0,0,0,.12)',
  padding: '14mm 12mm 12mm',
  boxSizing: 'border-box',
  position: 'relative',
}

const headerRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  alignItems: 'flex-start',
}

const brandArea: CSSProperties = {
  display: 'flex',
  gap: 18,
  alignItems: 'center',
}

const logoBox: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const logoShield: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 10,
  border: '2px solid #2cad5a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
}

const logoSmall: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: '#3b82f6',
  lineHeight: 1,
}

const logoBigGreen: CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: '#2cad5a',
  lineHeight: 1,
}

const brandMini: CSSProperties = {
  fontSize: 12,
  color: '#444',
  marginBottom: 4,
}

const docTitle: CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  lineHeight: 1.08,
  color: '#111827',
}

const docSubtitle: CSSProperties = {
  fontSize: 12,
  color: '#7b8794',
  marginTop: 8,
}

const topMeta: CSSProperties = {
  minWidth: 220,
  textAlign: 'right',
}

const metaLabel: CSSProperties = {
  fontSize: 11,
  color: '#6b7280',
  fontWeight: 700,
}

const metaValue: CSSProperties = {
  fontSize: 18,
  color: '#111827',
  fontWeight: 900,
  marginTop: 2,
}

const metaSub: CSSProperties = {
  fontSize: 12,
  color: '#374151',
  fontWeight: 700,
  marginTop: 2,
}

const dividerStyle: CSSProperties = {
  marginTop: 16,
  borderTop: '1px solid #d5d9de',
}

const twoCol: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 18,
  marginTop: 18,
}

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 900,
  color: '#111827',
}

const sectionLine: CSSProperties = {
  marginTop: 8,
  borderTop: '3px solid #cfd5db',
}

const infoRow: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.65,
  color: '#111827',
  marginBottom: 4,
}

const infoLabel: CSSProperties = {
  fontWeight: 800,
}

const simpleText: CSSProperties = {
  fontSize: 12,
  color: '#111827',
  lineHeight: 1.6,
}

const gridTwo: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 18,
}

const textBox: CSSProperties = {
  border: '1px solid #d7dbe0',
  borderRadius: 8,
  padding: 12,
  minHeight: 54,
  fontSize: 12,
  color: '#111827',
  lineHeight: 1.65,
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  border: '1px solid #d7dbe0',
  borderRadius: 8,
  overflow: 'hidden',
}

const tableHead: CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 800,
  padding: '10px 10px',
  borderBottom: '1px solid #d7dbe0',
  background: '#f8fafc',
}

const tableCell: CSSProperties = {
  fontSize: 12,
  padding: '10px 10px',
  borderBottom: '1px solid #e5e7eb',
  color: '#111827',
}

const pageNumberFooter: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 10,
  textAlign: 'center',
  fontSize: 13,
  color: '#6b7280',
  fontWeight: 700,
}

const warningGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 18,
}

const warningCardRed: CSSProperties = {
  border: '1px solid #e6c4ca',
  background: '#fff8f8',
  borderRadius: 8,
  padding: 14,
  minHeight: 170,
}

const warningCardBlue: CSSProperties = {
  border: '1px solid #d6dbe1',
  background: '#fafbfc',
  borderRadius: 8,
  padding: 14,
  minHeight: 170,
}

const warningTitleRed: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: '#b42318',
  marginBottom: 10,
}

const warningTitleBlue: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: '#344054',
  marginBottom: 10,
}

const bulletList: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  fontSize: 12,
  lineHeight: 1.7,
  color: '#111827',
}

const signBlock: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 26,
  marginTop: 42,
}

const signCol: CSSProperties = {
  textAlign: 'center',
}

const signLine: CSSProperties = {
  borderTop: '1px solid #9aa4b2',
  marginBottom: 8,
}

const signText: CSSProperties = {
  fontSize: 12,
  color: '#374151',
  fontWeight: 700,
}

const bottomBar: CSSProperties = {
  position: 'absolute',
  left: '12mm',
  right: '12mm',
  bottom: '10mm',
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 11,
  color: '#6b7280',
  fontWeight: 700,
}