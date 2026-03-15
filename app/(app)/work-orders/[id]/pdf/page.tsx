'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { supabase } from '@/lib/supabase'

type WorkOrder = {
  id: string
  work_order_number: string | null
  service_date: string | null
  address: string | null
  job_type: string | null
  target_pest: string | null
  treatment_description: string | null
  next_service_date: string | null
  created_at: string | null
  notes: string | null
}

type Customer = {
  name: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('hu-HU')
}

export default function WorkOrderPdfPage() {
  const params = useParams()
  const id = params?.id as string

  const printRef = useRef<HTMLDivElement | null>(null)

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('work_orders')
        .select(`
          *,
          customer:customers (*)
        `)
        .eq('id', id)
        .single()

      if (data) {
        setWorkOrder(data)
        setCustomer(data.customer)
      }

      setLoading(false)
    }

    if (id) load()
  }, [id])

  async function generatePdfBlob() {
    if (!printRef.current) return null

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF('p', 'mm', 'a4')

    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

    return pdf.output('blob')
  }

  async function handleDownloadPdf() {
    const blob = await generatePdfBlob()
    if (!blob) return

    const pdf = new jsPDF()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `munkalap-${workOrder?.work_order_number}.pdf`
    a.click()
  }

  async function handleSendEmail() {
    try {
      setSendingEmail(true)

      const pdfBlob = await generatePdfBlob()
      if (!pdfBlob) return

      const formData = new FormData()
      formData.append('workOrderId', id)
      formData.append(
        'pdf',
        pdfBlob,
        `munkalap-${workOrder?.work_order_number}.pdf`
      )

      const res = await fetch('/api/send-work-order-email', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error()

      alert('Munkalap elküldve e-mailben.')
    } catch {
      alert('Nem sikerült elküldeni az e-mailt.')
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) return <div>Betöltés...</div>

  return (
    <main style={{ padding: 30, background: '#eef4f8' }}>
      <div style={{ marginBottom: 20 }}>

        <button onClick={() => window.print()} style={buttonStyle}>
          Nyomtatás
        </button>

        <button onClick={handleDownloadPdf} style={buttonStyle}>
          PDF letöltése
        </button>

        <button
          onClick={handleSendEmail}
          style={{ ...buttonStyle, background: '#12bf3d', color: '#fff' }}
        >
          {sendingEmail ? 'Küldés...' : 'Munkalap küldése'}
        </button>

      </div>

      <div ref={printRef} style={paperStyle}>

        <h1>KártevőGuru munkalap</h1>

        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={thStyle}>Munkalap száma</td>
              <td style={tdStyle}>{workOrder?.work_order_number}</td>
            </tr>

            <tr>
              <td style={thStyle}>Dátum</td>
              <td style={tdStyle}>{formatDate(workOrder?.service_date)}</td>
            </tr>

            <tr>
              <td style={thStyle}>Ügyfél</td>
              <td style={tdStyle}>{customer?.name}</td>
            </tr>

            <tr>
              <td style={thStyle}>Telefon</td>
              <td style={tdStyle}>{customer?.phone}</td>
            </tr>

            <tr>
              <td style={thStyle}>Cím</td>
              <td style={tdStyle}>{workOrder?.address}</td>
            </tr>

            <tr>
              <td style={thStyle}>Munka típusa</td>
              <td style={tdStyle}>{workOrder?.job_type}</td>
            </tr>

            <tr>
              <td style={thStyle}>Kártevő</td>
              <td style={tdStyle}>{workOrder?.target_pest}</td>
            </tr>

            <tr>
              <td style={thStyle}>Kezelés leírása</td>
              <td style={tdStyle}>{workOrder?.treatment_description}</td>
            </tr>

            <tr>
              <td style={thStyle}>Megjegyzés</td>
              <td style={tdStyle}>{workOrder?.notes}</td>
            </tr>
          </tbody>
        </table>

      </div>
    </main>
  )
}

const paperStyle: CSSProperties = {
  background: '#fff',
  padding: 40,
  borderRadius: 10,
  maxWidth: 800,
  margin: 'auto',
}

const buttonStyle: CSSProperties = {
  padding: '10px 16px',
  marginRight: 10,
  borderRadius: 8,
  border: '1px solid #ccc',
  background: '#fff',
  cursor: 'pointer',
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: 10,
  fontWeight: 700,
}

const tdStyle: CSSProperties = {
  padding: 10,
}