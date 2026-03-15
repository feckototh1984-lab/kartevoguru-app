import nodemailer from 'nodemailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const pdfFile = formData.get('pdf')
    const workOrderId = String(formData.get('workOrderId') || '').trim()
    const customerEmail = String(formData.get('customerEmail') || '').trim()
    const customerName = String(formData.get('customerName') || '').trim()
    const workOrderNumber = String(formData.get('workOrderNumber') || '').trim()

    if (!workOrderId) {
      return Response.json(
        { error: 'Hiányzik a munkalap azonosítója.' },
        { status: 400 }
      )
    }

    if (!customerEmail) {
      return Response.json(
        { error: 'Hiányzik az ügyfél e-mail címe.' },
        { status: 400 }
      )
    }

    if (!pdfFile || !(pdfFile instanceof File)) {
      return Response.json(
        { error: 'Hiányzik a PDF csatolmány.' },
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

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const safeCustomerName = customerName || 'Ügyfelünk'
    const safeWorkOrderNumber = workOrderNumber || 'munkalap'

    const html = `
<!DOCTYPE html>
<html lang="hu">
  <head>
    <meta charSet="utf-8" />
    <title>KártevőGuru munkalap – ${safeWorkOrderNumber}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:700px;margin:0 auto;padding:24px 16px;">
      <div style="background:linear-gradient(135deg,#388cc4,#12bf3d);padding:24px;border-radius:16px 16px 0 0;color:#ffffff;">
        <div style="font-size:13px;opacity:.95;">KártevőGuru</div>
        <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;">Munkalap küldése</h1>
      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px;">
        <p style="margin:0 0 16px;">Kedves ${safeCustomerName}!</p>

        <p style="margin:0 0 16px;">
          Csatoltan küldjük a KártevőGuru által elkészített munkalapot.
        </p>

        <div style="display:inline-block;background:#eef6ff;color:#388cc4;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:18px;">
          Munkalap sorszám: ${safeWorkOrderNumber}
        </div>

        <p style="margin:0 0 18px;line-height:1.7;">
          Amennyiben további kérdése van, vagy újabb rovar-, darázs-, poloska-, rágcsálóirtási vagy HACCP kapcsolódó szolgáltatásra lenne szüksége, keressen bizalommal.
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
Kedves ${safeCustomerName}!

Csatoltan küldjük a KártevőGuru által elkészített munkalapot.

Munkalap sorszáma: ${safeWorkOrderNumber}

Amennyiben további kérdése van, vagy újabb rovar-, darázs-, poloska-, rágcsálóirtási vagy HACCP kapcsolódó szolgáltatásra lenne szüksége, keressen bizalommal.

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
      subject: `KártevőGuru munkalap – ${safeWorkOrderNumber}`,
      html,
      text,
      attachments: [
        {
          filename: `${safeWorkOrderNumber}.pdf`,
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