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
  public_token: string | null
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

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}