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

    if (!typedWorkOrder.pdf_file_path) {
      return Response.json(
        { error: 'A munkalap még nincs véglegesítve, nincs mentett PDF.' },
        { status: 400 }
      )
    }

    const { data: pdfFile, error: downloadError } = await supabase.storage
      .from('work-order-pdfs')
      .download(typedWorkOrder.pdf_file_path)

    if (downloadError || !pdfFile) {
      console.error('PDF letöltési hiba:', downloadError)
      return Response.json(
        { error: 'Nem sikerült letölteni a mentett PDF-et.' },
        { status: 500 }
      )
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())

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
          Csatoltan küldjük a KártevőGuru által véglegesített munkalapot.
        </p>

        <div style="display:inline-block;background:#eef6ff;color:#388cc4;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:18px;">
          Munkalap sorszám: ${escapeHtml(orderNumber)}
        </div>

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

Csatoltan küldjük a KártevőGuru által véglegesített munkalapot.

Munkalap sorszáma: ${orderNumber}

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
      attachments: [
        {
          filename: `${orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
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