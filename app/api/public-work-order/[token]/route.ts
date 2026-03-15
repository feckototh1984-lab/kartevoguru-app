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
      return NextResponse.json(
        { error: 'Hiányzó token.' },
        { status: 400 }
      )
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Hiányzik a Supabase környezeti változó.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

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
      .eq('public_token', token)
      .single()

    if (workOrderError || !workOrder) {
      return NextResponse.json(
        { error: 'A munkalap nem található ehhez a tokenhez.' },
        { status: 404 }
      )
    }

    const workOrderId = workOrder.id

    const { data: photos, error: photoError } = await supabase
      .from('work_order_photos')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: true })

    if (photoError) {
      return NextResponse.json(
        { error: `Fotók betöltési hiba: ${photoError.message}` },
        { status: 500 }
      )
    }

    const { data: products, error: productError } = await supabase
      .from('work_order_products')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: true })

    if (productError) {
      return NextResponse.json(
        { error: `Készítmények betöltési hiba: ${productError.message}` },
        { status: 500 }
      )
    }

    const { data: technicianSignature, error: technicianError } = await supabase
      .from('technician_signatures')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (technicianError) {
      return NextResponse.json(
        { error: `Technikus aláírás betöltési hiba: ${technicianError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      workOrder,
      photos: photos || [],
      products: products || [],
      technicianSignature: technicianSignature || null,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Ismeretlen szerverhiba történt.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}