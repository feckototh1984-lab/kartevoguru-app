export type Customer = {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  contact_person?: string
}

export type WorkOrder = {
  id: string
  work_order_number?: string
  customer_id: string
  service_date: string
  job_type: string
  target_pest: string
  address: string
  treatment_description?: string
  safety_notes?: string
  status?: string
  pdf_url?: string
}
export type WorkOrderPhoto = {
  id: string
  work_order_id: string
  file_path: string
  file_name: string | null
  public_url: string | null
  created_at: string | null
}
export type TechnicianSignature = {
  id: string
  technician_name: string
  signature_data: string
  created_at: string
  updated_at: string
}