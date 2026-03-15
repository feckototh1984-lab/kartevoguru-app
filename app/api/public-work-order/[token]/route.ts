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
        { error: 'Hiányzó Supabase környezeti változó.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        id,
        work_order_number,
        service_date,
        address,
        job_type,
        target_pest,
        treatment_description,
        notes,
        next_service_date,
        created_at,
        customer:customers (
          name,
          contact_person,
          phone,
          email,
          address
        ),
        work_order_products (
          id,
          product_name,
          quantity,
          method,
          target_pest
        ),
        work_order_photos (
          id,
          file_name,
          public_url,
          created_at
        )
      `)
      .eq('public_token', token)
      .single()

    if (error) {
      console.error('PUBLIC WORK ORDER QUERY ERROR:', error)
      return NextResponse.json(
        { error: `Lekérdezési hiba: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'A munkalap nem található ehhez a tokenhez.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...data,
      order_number: data.work_order_number,
    })
  } catch (error) {
    console.error('PUBLIC WORK ORDER API ERROR:', error)

    return NextResponse.json(
      { error: 'Szerverhiba történt.' },
      { status: 500 }
    )
  }
}