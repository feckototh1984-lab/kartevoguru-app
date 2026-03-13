import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import WorkOrderPdfDocument from './PdfDocument'
import { getWorkOrderPdfData } from './getWorkOrderPdfData'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await getWorkOrderPdfData(id)

    const pdfBuffer = await renderToBuffer(
      WorkOrderPdfDocument({ data })
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${data.workOrder.order_number || 'munkalap'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generálási hiba:', error)

    return NextResponse.json(
      { error: 'Nem sikerült legenerálni a PDF-et.' },
      { status: 500 }
    )
  }
}