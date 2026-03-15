import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let workOrderId = ''
    let pdfBuffer: Buffer | null = null
    let pdfFileName = 'munkalap.pdf'

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      workOrderId = String(formData.get('workOrderId') || '')
      const pdfFile = formData.get('pdf') as File | null

      if (!workOrderId) {
        return NextResponse.json(
          { error: 'Hiányzó workOrderId.' },
          { status: 400 }
        )
      }

      if (!pdfFile) {
        return NextResponse.json(
          { error: 'Hiányzó PDF fájl.' },
          { status: 400 }
        )
      }

      pdfFileName = pdfFile.name || 'munkalap.pdf'
      pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
    } else {
      const body = await request.json()
      workOrderId = body?.workOrderId || ''
    }

    if (!workOrderId) {
      return NextResponse.json(
        { error: 'Hiányzó workOrderId.' },
        { status: 400 }
      )
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Hiányzó Supabase környezeti változó.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: workOrder, error: workOrderError } = await supabase
      .from('work_orders')
      .select(`
        *,
        customer:customers (*)
      `)
      .eq('id', workOrderId)
      .single()

    if (workOrderError || !workOrder) {
      console.error('WORK ORDER QUERY ERROR:', workOrderError)
      return NextResponse.json(
        { error: 'A munkalap nem található.' },
        { status: 404 }
      )
    }

    const customer = workOrder.customer as any

    const customerEmail =
      customer?.email ? String(customer.email).trim() : ''

    const customerName =
      customer?.name ? String(customer.name) : 'Ügyfelünk'

    const orderNumber =
      workOrder.work_order_number ||
      workOrder.order_number ||
      'azonosito-nelkul'

    const recipients = ['info@kartevoguru.hu']
    if (customerEmail) recipients.push(customerEmail)

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.verify()

    const baseUrl = getBaseUrl()
    const publicLink = workOrder.public_token
      ? `${baseUrl}/share/work-order/${workOrder.public_token}`
      : null

    const serviceDate = workOrder.service_date
      ? new Date(workOrder.service_date).toLocaleDateString('hu-HU')
      : '—'

    const subject = `KártevőGuru munkalap – ${orderNumber}`

    const html = `
      <div style="margin:0;padding:0;background:#f3f7fb;font-family:Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
          <div style="background:linear-gradient(135deg,#388cc4,#12bf3d);padding:24px;border-radius:16px 16px 0 0;color:#fff;">
            <h1 style="margin:0;font-size:24px;">KártevőGuru</h1>
            <p style="margin:8px 0 0 0;font-size:14px;">Elkészült munkalap</p>
          </div>

          <div style="background:#ffffff;padding:28px;border-radius:0 0 16px 16px;box-shadow:0 12px 28px rgba(2,8,20,.08);">
            <p style="font-size:16px;margin-top:0;">Kedves ${customerName}!</p>

            <p style="font-size:15px;color:#475569;line-height:1.7;">
              Csatolva küldjük az elkészült munkalapot PDF formátumban.
            </p>

            <div style="margin:24px 0;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
              <p><strong>Munkalap száma:</strong> ${orderNumber}</p>
              <p><strong>Dátum:</strong> ${serviceDate}</p>
              <p><strong>Cím:</strong> ${workOrder.address || '—'}</p>
            </div>

            ${
              publicLink
                ? `
              <p style="font-size:14px;color:#475569;line-height:1.7;">
                Tartalék megnyitási link:
              </p>
              <p style="font-size:13px;color:#388cc4;word-break:break-all;">
                ${publicLink}
              </p>
            `
                : ''
            }

            <p style="margin-top:24px;font-size:14px;line-height:1.7;">
              Üdvözlettel:<br/>
              <strong>KártevőGuru</strong><br/>
              +36 30 602 0650
            </p>
          </div>
        </div>
      </div>
    `

    const text = `
Kedves ${customerName}!

Csatolva küldjük az elkészült munkalapot PDF formátumban.

Munkalap száma: ${orderNumber}
Dátum: ${serviceDate}
Cím: ${workOrder.address || '—'}

${publicLink ? `Tartalék megnyitási link: ${publicLink}` : ''}

KártevőGuru
+36 30 602 0650
`.trim()

    const attachments = []

    if (pdfBuffer) {
      attachments.push({
        filename: pdfFileName || `munkalap-${orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      })
    }

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: recipients.join(','),
      subject,
      text,
      html,
      attachments,
    })

    return NextResponse.json({
      success: true,
      sentTo: recipients,
      messageId: info.messageId,
      attachedPdf: !!pdfBuffer,
    })
  } catch (error: any) {
    console.error('SEND WORK ORDER EMAIL ERROR FULL:', {
      message: error?.message,
      code: error?.code,
      response: error?.response,
      responseCode: error?.responseCode,
      stack: error?.stack,
    })

    return NextResponse.json(
      {
        error: 'Nem sikerült elküldeni az e-mailt.',
        details: error?.message || 'Ismeretlen hiba',
      },
      { status: 500 }
    )
  }
}