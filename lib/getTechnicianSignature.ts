import { supabase } from '@/lib/supabase'
import type { TechnicianSignature } from './types'

export async function getLatestTechnicianSignature(): Promise<TechnicianSignature | null> {
  const { data, error } = await supabase
    .from('technician_signatures')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Hiba a technikus aláírás lekérésekor:', error.message)
    return null
  }

  return data
}