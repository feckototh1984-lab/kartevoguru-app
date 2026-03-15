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

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data, error } = await supabase
      .from('work_orders')
      .select('id, work_order_number, public_token')
      .eq('public_token', token)
      .single()

    if (error) {
      console.error('TOKEN TEST ERROR:', error)
      return NextResponse.json(
        { error: `TOKEN TEST: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Nincs találat ehhez a tokenhez.' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('TOKEN TEST FATAL:', error)
    return NextResponse.json(
      { error: error?.message || 'Ismeretlen hiba' },
      { status: 500 }
    )
  }
}