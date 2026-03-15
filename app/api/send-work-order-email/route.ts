import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

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
    const body = await request.json()
    const workOrderId = body?.workOrderId as string | undefined

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
        id,
        order_number,
        service_date,
        address,
        public_token,
        customer:customers (
          name,
          email
        )
      `)
      .eq('id', workOrderId)
      .single()

    if (workOrderError || !workOrder) {
      return NextResponse.json(
        { error: 'A munkalap nem található.' },
        { status: 404 }
      )
    }

    let publicToken = workOrder.public_token as string | null

    if (!publicToken) {
      publicToken = crypto.randomUUID()

      const { error: updateError } = await supabase
        .from('work_orders')
        .update({ public_token: publicToken })
        .eq('id', workOrderId)

      if (updateError) {
        console.error('PUBLIC TOKEN UPDATE ERROR:', updateError)
        return NextResponse.json(
          { error: 'Nem sikerült publikus tokent menteni.' },
          { status: 500 }
        )
      }
    }

    const baseUrl = getBaseUrl()
    const publicLink = `${baseUrl}/share/work-order/${publicToken}`

    // --- TypeScript fix ---
    const customer = workOrder.customer as any

    const customerEmail =
      customer && customer.email
        ? String(customer.email).trim()
        : ''

    const customerName =
      customer && customer.name
        ? String(customer.name)
        : 'Ügyfelünk'

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

    const serviceDate = workOrder.service_date
      ? new Date(workOrder.service_date).toLocaleDateString('hu-HU')
      : '—'

    const subject = `KártevőGuru munkalap – ${workOrder.order_number || 'azonosító nélkül'}`

    const html = `
      <div style="margin:0;padding:0;background:#f3f7fb;font-family:Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
          
          <div style="background:linear-gradient(135deg,#388cc4,#12bf3d);padding:24px;border-radius:16px 16px 0 0;color:#fff;">
            <h1 style="margin:0;font-size:24px;">KártevőGuru</h1>
            <p style="margin:8px 0 0 0;font-size:14px;">Elkészült munkalap</p>
          </div>

          <div style="background:#ffffff;padding:28px;border-radius:0 0 16px 16px;box-shadow:0 12px 28px rgba(2,8,20,.08);">

            <p style="font-size:16px;">
              Kedves ${customerName}!
            </p>

            <p style="font-size:15px;color:#475569;">
              A KártevőGuru munkalap elkészült. Az alábbi biztonságos linken tudja megnyitni:
            </p>

            <div style="margin:24px 0;">
              <a href="${publicLink}" style="display:inline-block;background:#12bf3d;color:#fff;padding:14px 22px;border-radius:12px;font-weight:bold;text-decoration:none;">
                Munkalap megnyitása
              </a>
            </div>

            <div style="margin:24px 0;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
              <p><strong>Munkalap száma:</strong> ${workOrder.order_number || '—'}</p>
              <p><strong>Dátum:</strong> ${serviceDate}</p>
              <p><strong>Cím:</strong> ${workOrder.address || '—'}</p>
            </div>

            <p style="font-size:13px;color:#388cc4;word-break:break-all;">
              ${publicLink}
            </p>

            <p style="margin-top:24px;font-size:14px;">
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

A KártevőGuru munkalap elkészült.

Munkalap száma: ${workOrder.order_number || '—'}
Dátum: ${serviceDate}
Cím: ${workOrder.address || '—'}

Megnyitás:
${publicLink}

KártevőGuru
+36 30 602 0650
`

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: recipients.join(','),
      subject,
      text,
      html,
    })

    return NextResponse.json({
      success: true,
      publicLink,
      sentTo: recipients,
    })

  } catch (error) {
    console.error('SEND WORK ORDER EMAIL ERROR:', error)

    return NextResponse.json(
      { error: 'Nem sikerült elküldeni az e-mailt.' },
      { status: 500 }
    )
  }
}