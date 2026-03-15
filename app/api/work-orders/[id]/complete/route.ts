import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return Response.json(
        { error: 'Hiányzik a munkalap azonosítója.' },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const pdfFile = formData.get('pdf')

    if (!pdfFile || !(pdfFile instanceof File)) {
      return Response.json(
        { error: 'Hiányzik a PDF fájl.' },
        { status: 400 }
      )
    }

    const { data: workOrder, error: workOrderError } = await supabase
      .from('work_orders')
      .select('id, order_number')
      .eq('id', id)
      .single()

    if (workOrderError || !workOrder) {
      return Response.json(
        { error: 'A munkalap nem található.' },
        { status: 404 }
      )
    }

    const safeOrderNumber =
      workOrder.order_number?.replace(/[^\w\-]+/g, '_') || `work-order-${id}`

    const filePath = `work-orders/${id}/${safeOrderNumber}.pdf`
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
    const completedAt = new Date().toISOString()

    const { error: uploadError } = await supabase.storage
      .from('work-order-pdfs')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('PDF upload hiba:', uploadError)
      return Response.json(
        { error: 'Nem sikerült feltölteni a PDF-et.' },
        { status: 500 }
      )
    }

    const { error: updateError } = await supabase
      .from('work_orders')
      .update({
        status: 'completed',
        completed_at: completedAt,
        pdf_file_path: filePath,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Munkalap frissítési hiba:', updateError)
      return Response.json(
        { error: 'Nem sikerült véglegesíteni a munkalapot.' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      status: 'completed',
      completed_at: completedAt,
      pdf_file_path: filePath,
    })
  } catch (error) {
    console.error('Munka befejezése hiba:', error)

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Nem sikerült a munkalap véglegesítése.',
      },
      { status: 500 }
    )
  }
}