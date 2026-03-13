import { supabase } from '@/lib/supabase'

export type CustomerDetails = {
  name: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  customer_type: string | null
  notes: string | null
}

export type WorkOrderPhoto = {
  id: string
  work_order_id: string
  file_path: string
  file_name: string | null
  public_url: string | null
  created_at: string | null
}

export type WorkOrderProduct = {
  id: string
  work_order_id: string
  product_name: string | null
  quantity: string | null
  method: string | null
  target_pest: string | null
  created_at: string | null
}

export type TechnicianSignature = {
  id: string
  technician_name: string
  signature_data: string
  created_at: string
  updated_at: string
}

export type WorkOrderDetails = {
  id: string
  order_number: string | null
  service_date: string | null
  job_type: string | null
  target_pest: string | null
  address: string | null
  treatment_description: string | null
  status: string | null
  created_at: string
  customer_signature_url: string | null
  signed_at: string | null
  auto_warnings: string[] | null
  auto_tasks: string[] | null
  customers: CustomerDetails | CustomerDetails[] | null
}

export type WorkOrderPdfData = {
  workOrder: WorkOrderDetails
  customer: CustomerDetails | null
  photos: WorkOrderPhoto[]
  products: WorkOrderProduct[]
  technicianSignature: TechnicianSignature | null
}

export async function getWorkOrderPdfData(id: string): Promise<WorkOrderPdfData> {
  const { data, error } = await supabase
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
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new Error('A munkalap nem található.')
  }

  const { data: photoData, error: photoError } = await supabase
    .from('work_order_photos')
    .select('*')
    .eq('work_order_id', id)
    .order('created_at', { ascending: true })

  if (photoError) {
    throw new Error(photoError.message)
  }

  const { data: productData, error: productError } = await supabase
    .from('work_order_products')
    .select('*')
    .eq('work_order_id', id)
    .order('created_at', { ascending: true })

  if (productError) {
    throw new Error(productError.message)
  }

  const { data: technicianData, error: technicianError } = await supabase
    .from('technician_signatures')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (technicianError) {
    throw new Error(technicianError.message)
  }

  const workOrder = data as unknown as WorkOrderDetails
  const customer = Array.isArray(workOrder.customers)
    ? workOrder.customers[0] || null
    : workOrder.customers || null

  return {
    workOrder,
    customer,
    photos: (photoData || []) as WorkOrderPhoto[],
    products: (productData || []) as WorkOrderProduct[],
    technicianSignature: (technicianData as TechnicianSignature | null) || null,
  }
}