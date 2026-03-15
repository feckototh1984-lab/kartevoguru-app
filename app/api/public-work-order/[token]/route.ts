import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params

    if (!token) {
      return NextResponse.json({ error: 'Hiányzó token.' }, { status: 400 })
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
      .select('*')
      .eq('public_token', token)
      .single()

    if (workOrderError) {
      console.error('WORK ORDER QUERY ERROR:', workOrderError)
      return NextResponse.json(
        { error: `Lekérdezési hiba: ${workOrderError.message}` },
        { status: 500 }
      )
    }

    if (!workOrder) {
      return NextResponse.json(
        { error: 'A munkalap nem található ehhez a tokenhez.' },
        { status: 404 }
      )
    }

    let customer: any = null
    let products: any[] = []
    let photos: any[] = []

    if (workOrder.customer_id) {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', workOrder.customer_id)
        .maybeSingle()

      if (customerError) {
        console.error('CUSTOMER QUERY ERROR:', customerError)
      } else {
        customer = customerData
      }
    }

    const { data: productData, error: productError } = await supabase
      .from('work_order_products')
      .select('*')
      .eq('work_order_id', workOrder.id)
      .order('created_at', { ascending: true })

    if (productError) {
      console.error('PRODUCT QUERY ERROR:', productError)
    } else {
      products = productData || []
    }

    const { data: photoData, error: photoError } = await supabase
      .from('work_order_photos')
      .select('*')
      .eq('work_order_id', workOrder.id)
      .order('created_at', { ascending: true })

    if (photoError) {
      console.error('PHOTO QUERY ERROR:', photoError)
    } else {
      photos = photoData || []
    }

    return NextResponse.json({
      ...workOrder,
      order_number: workOrder.work_order_number ?? workOrder.order_number ?? null,
      notes: workOrder.notes ?? null,
      customer,
      work_order_products: products,
      work_order_photos: photos,
    })
  } catch (error: any) {
    console.error('PUBLIC WORK ORDER API ERROR:', error)

    return NextResponse.json(
      { error: error?.message || 'Szerverhiba történt.' },
      { status: 500 }
    )
  }
}