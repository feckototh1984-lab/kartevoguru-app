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

type ProductRow = {
  id: string
  product_name: string | null
  quantity: string | null
  method: string | null
  target_pest: string | null
  created_at: string | null
}

type PhotoRow = {
  id: string
  public_url: string | null
  file_name: string | null
  created_at: string | null
}

type TechnicianSignatureRow = {
  id: string
  technician_name: string | null
  signature_data: string | null
  created_at: string | null
  updated_at: string | null
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
  created_at: string | null
  customer_signature_url: string | null
  signed_at: string | null
  auto_warnings: string[] | null
  auto_tasks: string[] | null
  customers: CustomerRow | CustomerRow[] | null
}

function formatSafe(value?: string | null) {
  return value?.trim() ? value.trim() : '—'
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

function formatDateTime(value?: string | null) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function escapeHtml(value?: string | null) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function nl2br(value?: string | null) {
  return escapeHtml(value).replace(/\n/g, '<br />')
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
        order_number,
        service_date,
        job_type,
        target_pest,
        address,
        treatment_description,
        status,
        created_at,
        customer_signature_url,
        signed_at,
        auto_warnings,
        auto_tasks,
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

    const { data: productsData, error: productsError } = await supabase
      .from('work_order_products')
      .select(`
        id,
        product_name,
        quantity,
        method,
        target_pest,
        created_at
      `)
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: true })

    if (productsError) {
      console.error('Készítmények lekérési hiba:', productsError)
      return Response.json(
        { error: 'Nem sikerült lekérni a készítményeket.' },
        { status: 500 }
      )
    }

    const { data: photosData, error: photosError } = await supabase
      .from('work_order_photos')
      .select(`
        id,
        public_url,
        file_name,
        created_at
      `)
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: true })

    if (photosError) {
      console.error('Fotók lekérési hiba:', photosError)
    }

    const { data: technicianData, error: technicianError } = await supabase
      .from('technician_signatures')
      .select(`
        id,
        technician_name,
        signature_data,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (technicianError) {
      console.error('Technikus aláírás lekérési hiba:', technicianError)
    }

    const typedWorkOrder = workOrder as unknown as WorkOrderRow
    const products = (productsData || []) as ProductRow[]
    const photos = (photosData || []) as PhotoRow[]
    const technicianSignature =
      (technicianData as TechnicianSignatureRow | null) || null

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

    const customerName =
      customer?.contact_person?.trim() ||
      customer?.name?.trim() ||
      'Ügyfelünk'

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

    const orderNumber = formatSafe(typedWorkOrder.order_number)
    const serviceDate = formatDate(typedWorkOrder.service_date)
    const createdAt = formatDateTime(typedWorkOrder.created_at)
    const signedAt = formatDateTime(typedWorkOrder.signed_at)
    const address = formatSafe(typedWorkOrder.address || customer?.address)
    const jobType = formatSafe(typedWorkOrder.job_type)
    const targetPest = formatSafe(typedWorkOrder.target_pest)
    const status = formatSafe(typedWorkOrder.status)
    const customerType = formatSafe(customer?.customer_type)
    const customerPhone = formatSafe(customer?.phone)
    const customerAddress = formatSafe(customer?.address)
    const customerNotes = formatSafe(customer?.notes)
    const treatmentDescription = typedWorkOrder.treatment_description || '—'

    const warnings = typedWorkOrder.auto_warnings || []
    const tasks = typedWorkOrder.auto_tasks || []

    const productsRowsHtml =
      products.length > 0
        ? products
            .map(
              (product) => `
                <tr>
                  <td style="padding:10px;border:1px solid #e2e8f0;">${escapeHtml(formatSafe(product.product_name))}</td>
                  <td style="padding:10px;border:1px solid #e2e8f0;">${escapeHtml(formatSafe(product.quantity))}</td>
                  <td style="padding:10px;border:1px solid #e2e8f0;">${escapeHtml(formatSafe(product.method))}</td>
                  <td style="padding:10px;border:1px solid #e2e8f0;">${escapeHtml(formatSafe(product.target_pest))}</td>
                </tr>
              `
            )
            .join('')
        : `
          <tr>
            <td style="padding:10px;border:1px solid #e2e8f0;">Nincs még külön rögzítve</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">—</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${escapeHtml(jobType)}</td>
            <td style="padding:10px;border:1px solid #e2e8f0;">${escapeHtml(targetPest)}</td>
          </tr>
        `

    const warningsHtml =
      warnings.length > 0
        ? `<ul style="margin:0;padding-left:18px;">${warnings
            .map((item) => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`)
            .join('')}</ul>`
        : `<div style="color:#64748b;">Nincs automatikus figyelmeztetés.</div>`

    const tasksHtml =
      tasks.length > 0
        ? `<ul style="margin:0;padding-left:18px;">${tasks
            .map((item) => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`)
            .join('')}</ul>`
        : `<div style="color:#64748b;">Nincs automatikus teendő.</div>`

    const photosHtml =
      photos.length > 0
        ? `
          <div style="margin-top:28px;">
            <div style="font-size:20px;font-weight:800;color:#0f172a;margin-bottom:12px;">
              Helyszíni fotódokumentáció
            </div>
            ${photos
              .filter((photo) => photo.public_url)
              .map(
                (photo, index) => `
                  <div style="margin-bottom:18px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                    <div style="padding:10px 14px;background:#f8fafc;font-weight:700;color:#334155;">
                      Fotó ${index + 1}${photo.file_name ? ` — ${escapeHtml(photo.file_name)}` : ''}
                    </div>
                    <div style="padding:12px;background:#ffffff;">
                      <img
                        src="${photo.public_url}"
                        alt="Fotó ${index + 1}"
                        style="max-width:100%;height:auto;border-radius:8px;display:block;"
                      />
                    </div>
                  </div>
                `
              )
              .join('')}
          </div>
        `
        : ''

    const technicianSignatureHtml = technicianSignature?.signature_data
      ? `
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#f8fafc;">
          <div style="height:90px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #94a3b8;">
            <img
              src="${technicianSignature.signature_data}"
              alt="Technikus aláírás"
              style="max-height:75px;max-width:100%;object-fit:contain;"
            />
          </div>
          <div style="margin-top:8px;font-weight:600;color:#0f172a;">
            ${escapeHtml(technicianSignature.technician_name || 'Tóth Ferenc')}
          </div>
        </div>
      `
      : `
        <div style="height:110px;border-bottom:1px solid #94a3b8;display:flex;align-items:flex-end;">
          <div style="padding-bottom:8px;font-weight:600;color:#0f172a;">
            ${escapeHtml(technicianSignature?.technician_name || 'Tóth Ferenc')}
          </div>
        </div>
      `

    const customerSignatureHtml = typedWorkOrder.customer_signature_url
      ? `
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;background:#f8fafc;">
          <div style="height:90px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #94a3b8;">
            <img
              src="${typedWorkOrder.customer_signature_url}"
              alt="Ügyfél aláírás"
              style="max-height:75px;max-width:100%;object-fit:contain;"
            />
          </div>
          <div style="margin-top:8px;font-size:12px;color:#64748b;">
            Aláírva: ${escapeHtml(signedAt)}
          </div>
          <div style="margin-top:6px;font-weight:600;color:#0f172a;">
            ${escapeHtml(customer?.name || 'Megrendelő')}
          </div>
        </div>
      `
      : `
        <div style="height:110px;border-bottom:1px solid #94a3b8;"></div>
        <div style="margin-top:8px;font-weight:600;color:#0f172a;">
          ${escapeHtml(customer?.name || 'Megrendelő')}
        </div>
      `

    const html = `
<!DOCTYPE html>
<html lang="hu">
  <head>
    <meta charSet="utf-8" />
    <title>KártevőGuru munkalap – ${escapeHtml(orderNumber)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="max-width:900px;margin:0 auto;padding:24px 16px;">
      <div style="background:linear-gradient(135deg,#388cc4,#12bf3d);padding:24px;border-radius:16px 16px 0 0;color:#ffffff;">
        <div style="font-size:13px;opacity:.95;">KártevőGuru</div>
        <h1 style="margin:8px 0 0;font-size:30px;line-height:1.2;">Kártevőirtási munkalap</h1>
      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px;">
        <p style="margin:0 0 16px;">Kedves ${escapeHtml(customerName)}!</p>

        <p style="margin:0 0 18px;">
          Ezúton küldjük a KártevőGuru által rögzített munkalapot.
        </p>

        <div style="display:inline-block;background:#eef6ff;color:#388cc4;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:18px;">
          Munkalap sorszám: ${escapeHtml(orderNumber)}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px;">
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#ffffff;">
            <div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:10px;">Szolgáltató adatai</div>
            <div style="line-height:1.8;">
              <div><strong>Szolgáltató:</strong> KártevőGuru</div>
              <div><strong>Felelős személy:</strong> ${escapeHtml(technicianSignature?.technician_name || 'Tóth Ferenc')}</div>
              <div><strong>Telefon:</strong> +36 30 602 0650</div>
              <div><strong>E-mail:</strong> info@kartevoguru.hu</div>
              <div><strong>Székhely / cím:</strong> 8700 Marcali, Borsó-hegyi út 4779</div>
              <div><strong>Működési nyilv. szám:</strong> SO-05/neo976-1/2025</div>
              <div><strong>Nyilvántartási szám:</strong> 0099697</div>
              <div><strong>Adószám:</strong> 91094722-1-34</div>
              <div><strong>Bankszámlaszám:</strong> 12042847-01896099-00100007</div>
            </div>
          </div>

          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#ffffff;">
            <div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:10px;">Szolgáltatás részletei</div>
            <div style="line-height:1.8;">
              <div><strong>Megrendelő:</strong> ${escapeHtml(customer?.name || '—')}</div>
              <div><strong>Kapcsolattartó:</strong> ${escapeHtml(customer?.contact_person || '—')}</div>
              <div><strong>Telefonszám:</strong> ${escapeHtml(customerPhone)}</div>
              <div><strong>E-mail:</strong> ${escapeHtml(customer?.email || '—')}</div>
              <div><strong>Elvégzés időpontja:</strong> ${escapeHtml(serviceDate)}</div>
              <div><strong>Munka típusa:</strong> ${escapeHtml(jobType)}</div>
              <div><strong>Célzott kártevő:</strong> ${escapeHtml(targetPest)}</div>
              <div><strong>Helyszín:</strong> ${escapeHtml(address)}</div>
              <div><strong>Státusz:</strong> ${escapeHtml(status)}</div>
              <div><strong>Generálva:</strong> ${escapeHtml(createdAt)}</div>
            </div>
          </div>
        </div>

        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#ffffff;margin-bottom:24px;">
          <div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:10px;">Ügyféladatok</div>
          <div style="line-height:1.8;">
            <div><strong>Ügyfél címe:</strong> ${escapeHtml(customerAddress)}</div>
            <div><strong>Ügyfél típusa:</strong> ${escapeHtml(customerType)}</div>
            <div><strong>Megjegyzés:</strong> ${escapeHtml(customerNotes)}</div>
          </div>
        </div>

        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#ffffff;margin-bottom:24px;">
          <div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:10px;">Kezelés leírása</div>
          <div style="white-space:normal;line-height:1.7;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
            ${nl2br(treatmentDescription)}
          </div>
        </div>

        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#ffffff;margin-bottom:24px;">
          <div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:10px;">Felhasznált készítmények</div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="text-align:left;padding:10px;border:1px solid #e2e8f0;">Termék</th>
                <th style="text-align:left;padding:10px;border:1px solid #e2e8f0;">Mennyiség</th>
                <th style="text-align:left;padding:10px;border:1px solid #e2e8f0;">Alkalmazási technika</th>
                <th style="text-align:left;padding:10px;border:1px solid #e2e8f0;">Célzott kártevő</th>
              </tr>
            </thead>
            <tbody>
              ${productsRowsHtml}
            </tbody>
          </table>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px;">
          <div style="border:1px solid #fecdd3;border-radius:12px;padding:16px;background:#fff1f2;">
            <div style="font-size:18px;font-weight:800;color:#be123c;margin-bottom:10px;">Figyelmeztetések</div>
            ${warningsHtml}
          </div>

          <div style="border:1px solid #bfdbfe;border-radius:12px;padding:16px;background:#eff6ff;">
            <div style="font-size:18px;font-weight:800;color:#1d4ed8;margin-bottom:10px;">Teendők</div>
            ${tasksHtml}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px;">
          <div>
            <div style="font-size:16px;font-weight:700;color:#475569;margin-bottom:8px;">Szolgáltató aláírás</div>
            ${technicianSignatureHtml}
          </div>

          <div>
            <div style="font-size:16px;font-weight:700;color:#475569;margin-bottom:8px;">Ügyfél aláírás</div>
            ${customerSignatureHtml}
          </div>
        </div>

        ${photosHtml}

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

Ezúton küldjük a KártevőGuru által rögzített munkalapot.

Munkalap sorszáma: ${orderNumber}
Elvégzés időpontja: ${serviceDate}
Munka típusa: ${jobType}
Célzott kártevő: ${targetPest}
Helyszín: ${address}
Státusz: ${status}

Ügyfél:
- Név: ${formatSafe(customer?.name)}
- Kapcsolattartó: ${formatSafe(customer?.contact_person)}
- Telefonszám: ${customerPhone}
- E-mail: ${formatSafe(customer?.email)}
- Cím: ${customerAddress}
- Típus: ${customerType}
- Megjegyzés: ${customerNotes}

Kezelés leírása:
${treatmentDescription}

Felhasznált készítmények:
${
  products.length > 0
    ? products
        .map(
          (product, index) =>
            `${index + 1}. ${formatSafe(product.product_name)} | ${formatSafe(product.quantity)} | ${formatSafe(product.method)} | ${formatSafe(product.target_pest)}`
        )
        .join('\n')
    : `Nincs még külön rögzítve | — | ${jobType} | ${targetPest}`
}

Figyelmeztetések:
${warnings.length > 0 ? warnings.map((w) => `- ${w}`).join('\n') : '- Nincs automatikus figyelmeztetés.'}

Teendők:
${tasks.length > 0 ? tasks.map((t) => `- ${t}`).join('\n') : '- Nincs automatikus teendő.'}

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