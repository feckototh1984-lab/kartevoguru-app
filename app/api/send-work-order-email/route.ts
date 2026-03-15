import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SendWorkOrderEmailBody = {
  workOrderId?: string | null
}

type CustomerRow = {
  name: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  customer_type: string | null
  notes: string | null
}

type WorkOrderRow = {
  id: string
  order_number: string | null
  service_date: string | null
  job_type: string | null
  target_pest: string | null
  address: string | null
  treatment_description: string | null
  status: string | null
  pdf_file_path: string | null
  completed_at: string | null
  customers: CustomerRow | CustomerRow[] | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function escapeHtml(value?: string | null) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

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
        order_number,
        service_date,
        job_type,
        target_pest,
        address,
        treatment_description,
        status,
        pdf_file_path,
        completed_at,
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
      .eq('id', workOrderId)
      .single()

    if (workOrderError || !workOrder) {
      console.error('Munkalap lekérési hiba:', workOrderError)
      return Response.json(
        { error: 'A munkalap nem található.' },
        { status: 404 }
      )
    }

    const typedWorkOrder = workOrder as unknown as WorkOrderRow

    const customer = Array.isArray(typedWorkOrder.customers)
      ? typedWorkOrder.customers[0]
      : typedWorkOrder.customers

    const customerEmail = customer?.email?.trim()

    if (!customerEmail) {
      return Response.json(
        { error: 'Az ügyfélhez nincs e-mail cím rögzítve.' },
        { status: 400 }
      )
    }

    if (!typedWorkOrder.completed_at) {
      return Response.json(
        { error: 'A munkalapot előbb véglegesíteni kell.' },
        { status: 400 }
      )
    }

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = Number(process.env.SMTP_PORT || 465)
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const mailFrom = process.env.MAIL_FROM || smtpUser
    const mailBcc = process.env.MAIL_BCC || ''

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

    const customerName =
      customer?.contact_person?.trim() ||
      customer?.name?.trim() ||
      'Ügyfelünk'

    const orderNumber = typedWorkOrder.order_number || 'munkalap'

    let attachments: {
      filename: string
      content: Buffer
      contentType: string
    }[] = []

    if (typedWorkOrder.pdf_file_path) {
      const { data: pdfFile, error: downloadError } = await supabase.storage
        .from('work-order-pdfs')
        .download(typedWorkOrder.pdf_file_path)

      if (!downloadError && pdfFile) {
        const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())

        attachments = [
          {
            filename: `${orderNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      } else {
        console.error('PDF letöltési hiba, csatolmány nélkül küldjük:', downloadError)
      }
    }

    const html = `
<!DOCTYPE html>
<html lang="hu">
  <head>
    <meta charSet="utf-8" />
    <title>KártevőGuru munkalap – ${escapeHtml(orderNumber)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:700px;margin:0 auto;padding:24px 16px;">
      <div style="background:linear-gradient(135deg,#388cc4,#12bf3d);padding:24px;border-radius:16px 16px 0 0;color:#ffffff;">
        <div style="font-size:13px;opacity:.95;">KártevőGuru</div>
        <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;">Munkalap küldése</h1>
      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px;">
        <p style="margin:0 0 16px;">Kedves ${escapeHtml(customerName)}!</p>

        <p style="margin:0 0 16px;">
          Küldjük a KártevőGuru által véglegesített munkalap adatait.
        </p>

        <div style="display:inline-block;background:#eef6ff;color:#388cc4;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:18px;">
          Munkalap sorszám: ${escapeHtml(orderNumber)}
        </div>

        <table style="width:100%;border-collapse:collapse;margin:0 0 18px;">
          <tr>
            <td style="padding:8px 0;font-weight:700;width:180px;">Elvégzés időpontja:</td>
            <td style="padding:8px 0;">${escapeHtml(formatDate(typedWorkOrder.service_date))}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-weight:700;">Munka típusa:</td>
            <td style="padding:8px 0;">${escapeHtml(typedWorkOrder.job_type || '—')}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-weight:700;">Célzott kártevő:</td>
            <td style="padding:8px 0;">${escapeHtml(typedWorkOrder.target_pest || '—')}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-weight:700;">Helyszín:</td>
            <td style="padding:8px 0;">${escapeHtml(
              typedWorkOrder.address || customer?.address || '—'
            )}</td>
          </tr>
        </table>

        <div style="margin:0 0 18px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
          <div style="font-weight:700;margin-bottom:8px;">Kezelés leírása</div>
          <div style="white-space:pre-wrap;line-height:1.7;">${escapeHtml(
            typedWorkOrder.treatment_description || '—'
          )}</div>
        </div>

        ${
          attachments.length > 0
            ? `<p style="margin:0 0 18px;line-height:1.7;">A véglegesített munkalapot PDF csatolmányként is mellékeltük.</p>`
            : `<p style="margin:0 0 18px;line-height:1.7;">A munkalap PDF csatolmányának automatikus küldése jelenleg fejlesztés alatt van, ezért ezt az összefoglalót küldtük el Önnek.</p>`
        }

        <p style="margin:0 0 18px;line-height:1.7;">
          Amennyiben további kérdése van, vagy újabb rovar-, darázs-, poloska-, rágcsálóirtási vagy HACCP szolgáltatásra lenne szüksége, keressen bizalommal.
        </p>

        <div style="margin-top:28px;padding:16px;background:#0b1f33;color:#bfdbfe;border-radius:12px;">
          <div style="font-weight:700;color:#ffffff;">KártevőGuru</div>
          <div style="margin-top:6px;">Telefon: +36 30 602 0650</div>
          <div>E-mail: info@kartevoguru.hu</div>
        </div>
      </div>
    </div>
  </body>
</html>
`

    const text = `
Kedves ${customerName}!

Küldjük a KártevőGuru által véglegesített munkalap adatait.

Munkalap sorszáma: ${orderNumber}
Elvégzés időpontja: ${formatDate(typedWorkOrder.service_date)}
Munka típusa: ${typedWorkOrder.job_type || '—'}
Célzott kártevő: ${typedWorkOrder.target_pest || '—'}
Helyszín: ${typedWorkOrder.address || customer?.address || '—'}

Kezelés leírása:
${typedWorkOrder.treatment_description || '—'}

${
  attachments.length > 0
    ? 'A véglegesített munkalapot PDF csatolmányként is mellékeltük.'
    : 'A munkalap PDF csatolmányának automatikus küldése jelenleg fejlesztés alatt van, ezért ezt az összefoglalót küldtük el Önnek.'
}

Amennyiben további kérdése van, vagy újabb rovar-, darázs-, poloska-, rágcsálóirtási vagy HACCP szolgáltatásra lenne szüksége, keressen bizalommal.

Üdvözlettel:
KártevőGuru
+36 30 602 0650
info@kartevoguru.hu
`.trim()

    await transporter.sendMail({
      from: `KártevőGuru <${mailFrom}>`,
      to: customerEmail,
      cc: 'info@kartevoguru.hu',
      bcc: mailBcc || undefined,
      subject: `KártevőGuru munkalap – ${orderNumber}`,
      html,
      text,
      attachments,
    })

    return Response.json({ success: true })
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