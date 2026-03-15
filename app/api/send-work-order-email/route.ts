import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { workOrderId } = await req.json()

    if (!workOrderId) {
      return NextResponse.json(
        { error: 'Hiányzó munkalap azonosító.' },
        { status: 400 }
      )
    }

    const { data: workOrder, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        customers (
          name,
          email
        )
      `)
      .eq('id', workOrderId)
      .single()

    if (error || !workOrder) {
      return NextResponse.json(
        { error: 'Munkalap nem található.' },
        { status: 404 }
      )
    }

    const customer = Array.isArray(workOrder.customers)
      ? workOrder.customers[0]
      : workOrder.customers

    if (!customer?.email) {
      return NextResponse.json(
        { error: 'Az ügyfélhez nincs e-mail cím.' },
        { status: 400 }
      )
    }

    const pdfLink = `${process.env.NEXT_PUBLIC_APP_URL}/work-orders/${workOrder.id}/pdf`

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    const html = `
      <div style="font-family:Arial;padding:20px">
        <h2>KártevőGuru munkalap</h2>

        <p>Tisztelt ${customer.name || 'Ügyfelünk'}!</p>

        <p>A kártevőirtási munkalap elkészült.</p>

        <p>
          <a href="${pdfLink}" 
             style="background:#12bf3d;color:white;padding:12px 20px;text-decoration:none;border-radius:6px">
             Munkalap megnyitása
          </a>
        </p>

        <p>Üdvözlettel:<br>
        KártevőGuru</p>
      </div>
    `

    await transporter.sendMail({
      from: `"KártevőGuru" <${process.env.SMTP_USER}>`,
      to: [customer.email, 'info@kartevoguru.hu'],
      subject: 'KártevőGuru munkalap',
      html
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'E-mail küldési hiba.' },
      { status: 500 }
    )
  }
}