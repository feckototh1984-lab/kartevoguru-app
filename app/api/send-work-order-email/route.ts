import nodemailer from 'nodemailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SendWorkOrderEmailBody = {
  workOrderId?: string | null
  publicToken?: string | null
  customerEmail?: string | null
  customerName?: string | null
  orderNumber?: string | null
  serviceDate?: string | null
  address?: string | null
  jobType?: string | null
  targetPest?: string | null
}

function formatSafe(value?: string | null) {
  return value?.trim() ? value.trim() : '—'
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendWorkOrderEmailBody

    const workOrderId = body.workOrderId?.trim()
    const publicToken = body.publicToken?.trim()
    const customerEmail = body.customerEmail?.trim()
    const customerName = body.customerName?.trim() || 'Ügyfelünk'
    const orderNumber = formatSafe(body.orderNumber)
    const serviceDate = formatSafe(body.serviceDate)
    const address = formatSafe(body.address)
    const jobType = formatSafe(body.jobType)
    const targetPest = formatSafe(body.targetPest)

    if (!customerEmail) {
      return Response.json(
        { error: 'Hiányzik az ügyfél e-mail címe.' },
        { status: 400 }
      )
    }

    if (!workOrderId) {
      return Response.json(
        { error: 'Hiányzik a munkalap azonosítója (workOrderId).' },
        { status: 400 }
      )
    }

    if (!publicToken) {
      return Response.json(
        { error: 'Hiányzik a publikus token (publicToken).' },
        { status: 400 }
      )
    }

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

    const requestUrl = new URL(req.url)
    const origin = requestUrl.origin

    const shareUrl = `${origin}/share/work-order/${publicToken}`

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