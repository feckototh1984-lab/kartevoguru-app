import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SendWorkOrderEmailBody = {
  workOrderId?: string | null
}

function formatSafe(value?: string | null) {
  return value?.trim() ? value.trim() : '—'
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendWorkOrderEmailBody
    const workOrderId = body.workOrderId?.trim()

    if (!workOrderId) {
      return Response.json(
        { error: 'Hiányzik a munkalap azonosítója (workOrderId).' },
        { status: 400 }
      )
    }

    const { data: workOrder, error: workOrderError } = await supabase
      .from('work_orders')
      .select(`
        id,
        work_order_number,
        service_date,
        address,
        job_type,
        target_pest,
        public_token,
        customers (
          name,
          email
        )
      `)
      .eq('id', workOrderId)
      .single()

    if (workOrderError || !workOrder) {
      console.error('Munkalap lekérési hiba:', workOrderError)
      return Response.json(
        { error: 'A munkalap nem található.' },
        { status: 404 }
      )
    }

    const customer = Array.isArray(workOrder.customers)
      ? workOrder.customers[0]
      : workOrder.customers

    const customerEmail = customer?.email?.trim()
    const customerName = customer?.name?.trim() || 'Ügyfelünk'

    if (!customerEmail) {
      return Response.json(
        { error: 'Hiányzik az ügyfél e-mail címe.' },
        { status: 400 }
      )
    }

    let publicToken = workOrder.public_token?.trim()

    if (!publicToken) {
      publicToken = crypto.randomUUID()

      const { error: updateTokenError } = await supabase
        .from('work_orders')
        .update({ public_token: publicToken })
        .eq('id', workOrderId)

      if (updateTokenError) {
        console.error('Publikus token mentési hiba:', updateTokenError)
        return Response.json(
          { error: 'Nem sikerült létrehozni a publikus tokent.' },
          { status: 500 }
        )
      }
    }

    const orderNumber = formatSafe(workOrder.work_order_number)
    const serviceDate = formatSafe(workOrder.service_date)
    const address = formatSafe(workOrder.address)
    const jobType = formatSafe(workOrder.job_type)
    const targetPest = formatSafe(workOrder.target_pest)

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = Number(process.env.SMTP_PORT || 465)
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const mailFrom = process.env.MAIL_FROM || smtpUser

    if (!smtpHost || !smtpUser || !smtpPass || !mailFrom) {
      return Response.json(
        { error: 'Hiányos SMTP beállítások.' },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      new URL(req.url).origin

    const shareUrl = `${appUrl}/share/work-order/${encodeURIComponent(publicToken)}`

    await transporter.sendMail({
      from: `KártevőGuru <${mailFrom}>`,
      to: customerEmail,
      cc: 'info@kartevoguru.hu',
      subject: `KártevőGuru munkalap – ${orderNumber}`,
      html: `
<div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1f2937;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#388cc4,#12bf3d);padding:24px;border-radius:16px 16px 0 0;color:#ffffff;">
      <div style="font-size:13px;opacity:.95;">KártevőGuru</div>
      <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;">Munkalap visszaigazolás</h1>
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px;">
      <p style="margin:0 0 16px;">Kedves ${customerName}!</p>

      <p style="margin:0 0 16px;">
        Ezúton küldjük a KártevőGuru által rögzített munkalap adatait.
      </p>

      <p style="margin:0 0 16px;">
        A munkalapot az alábbi gombra kattintva tudja megnyitni, letölteni vagy PDF formátumban elmenteni.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:0 0 20px;">
        <div style="margin-bottom:8px;"><strong>Munkalap sorszáma:</strong> ${orderNumber}</div>
        <div style="margin-bottom:8px;"><strong>Szolgáltatás dátuma:</strong> ${serviceDate}</div>
        <div style="margin-bottom:8px;"><strong>Munka típusa:</strong> ${jobType}</div>
        <div style="margin-bottom:8px;"><strong>Célzott kártevő:</strong> ${targetPest}</div>
        <div><strong>Helyszín:</strong> ${address}</div>
      </div>

      <div style="margin:24px 0;">
        <a
          href="${shareUrl}"
          style="display:inline-block;background:#12bf3d;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700;"
          target="_blank"
          rel="noopener noreferrer"
        >
          Munkalap megnyitása
        </a>
      </div>

      <p style="margin:0 0 16px;font-size:14px;color:#475569;">
        Ha a gomb nem működne, másolja be ezt a linket a böngészőbe:
      </p>

      <p style="margin:0 0 20px;word-break:break-all;font-size:14px;color:#388cc4;">
        ${shareUrl}
      </p>

      <p style="margin:0 0 16px;">
        Kérdés esetén keressen bizalommal az alábbi elérhetőségeken.
      </p>

      <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:12px;">
        <div style="font-weight:700;">KártevőGuru</div>
        <div>Telefon: +36 30 602 0650</div>
        <div>E-mail: info@kartevoguru.hu</div>
      </div>
    </div>
  </div>
</div>
`,
      text: `
Kedves ${customerName}!

Ezúton küldjük a KártevőGuru által rögzített munkalap adatait.

Munkalap sorszáma: ${orderNumber}
Szolgáltatás dátuma: ${serviceDate}
Munka típusa: ${jobType}
Célzott kártevő: ${targetPest}
Helyszín: ${address}

A munkalap megnyitása:
${shareUrl}

Üdvözlettel:
KártevőGuru
+36 30 602 0650
info@kartevoguru.hu
      `.trim(),
    })

    return Response.json({
      success: true,
      publicToken,
      shareUrl,
    })
  } catch (error) {
    console.error('Email küldési hiba:', error)

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Nem sikerült elküldeni az e-mailt.',
      },
      { status: 500 }
    )
  }
}