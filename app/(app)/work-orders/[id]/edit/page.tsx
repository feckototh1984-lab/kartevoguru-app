'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type CustomerDetails = {
  id: string
  name: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  customer_type: string | null
  notes: string | null
}

type WorkOrderEditDetails = {
  id: string
  customer_id: string | null
  order_number: string | null
  service_date: string | null
  service_time: string | null
  job_type: string | null
  target_pest: string | null
  address: string | null
  treatment_description: string | null
  status: string | null
  customers: CustomerDetails | CustomerDetails[] | null
}

const JOB_TYPE_OPTIONS = [
  'Rovarirtás',
  'Rágcsálóirtás',
  'Darázsirtás',
  'Ágyi poloska irtás',
  'Csótányirtás',
  'Pókirtás',
  'Bolhairtás',
  'Fertőtlenítés',
  'HACCP ellenőrzés',
  'HACCP kártevőirtás',
  'Ellenőrzés',
  'Egyéb',
]

const TARGET_PEST_OPTIONS = [
  'Csótány',
  'Ágyi poloska',
  'Hangya',
  'Légy',
  'Szúnyog',
  'Pók',
  'Darázs',
  'Egér',
  'Patkány',
  'Egér és patkány',
  'Bolha',
  'Moly',
  'Ezüstös pikkelyke',
  'Árvaszúnyog',
  'Egyéb',
]

export default function EditWorkOrderPage() {

  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)

  const [workOrder,setWorkOrder] = useState<WorkOrderEditDetails | null>(null)

  const [workForm,setWorkForm] = useState({
    service_date:'',
    service_time:'',
    job_type:'',
    target_pest:'',
    address:'',
    treatment_description:'',
    status:'scheduled'
  })

  const [customerForm,setCustomerForm] = useState({
    name:'',
    contact_person:'',
    phone:'',
    email:'',
    address:'',
    customer_type:'fix_partner',
    notes:''
  })

  useEffect(()=>{

    async function load(){

      const {data,error} = await supabase
      .from('work_orders')
      .select(`
        id,
        customer_id,
        order_number,
        service_date,
        service_time,
        job_type,
        target_pest,
        address,
        treatment_description,
        status,
        customers (
          id,
          name,
          contact_person,
          phone,
          email,
          address,
          customer_type,
          notes
        )
      `)
      .eq('id',id)
      .single()

      if(error){
        alert(error.message)
        return
      }

      const typed = data as unknown as WorkOrderEditDetails

      const customer = Array.isArray(typed.customers)
      ? typed.customers[0]
      : typed.customers

      setWorkOrder(typed)

      setWorkForm({
        service_date: typed.service_date || '',
        service_time: typed.service_time || '',
        job_type: typed.job_type || '',
        target_pest: typed.target_pest || '',
        address: typed.address || '',
        treatment_description: typed.treatment_description || '',
        status: typed.status || 'scheduled'
      })

      setCustomerForm({
        name: customer?.name || '',
        contact_person: customer?.contact_person || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        address: customer?.address || '',
        customer_type: customer?.customer_type || 'fix_partner',
        notes: customer?.notes || ''
      })

      setLoading(false)

    }

    load()

  },[id])


  async function handleSave(e:React.FormEvent){

    e.preventDefault()

    if(!workOrder) return

    setSaving(true)

    const customer = Array.isArray(workOrder.customers)
    ? workOrder.customers[0]
    : workOrder.customers

    await supabase
    .from('customers')
    .update({
      name: customerForm.name,
      contact_person: customerForm.contact_person,
      phone: customerForm.phone,
      email: customerForm.email,
      address: customerForm.address,
      customer_type: customerForm.customer_type,
      notes: customerForm.notes
    })
    .eq('id',customer?.id)

    await supabase
    .from('work_orders')
    .update({
      service_date: workForm.service_date,
      service_time: workForm.service_time,
      job_type: workForm.job_type,
      target_pest: workForm.target_pest,
      address: workForm.address,
      treatment_description: workForm.treatment_description,
      status: workForm.status
    })
    .eq('id',workOrder.id)

    setSaving(false)

    alert('Sikeresen mentve')

    router.push(`/work-orders/${workOrder.id}`)
    router.refresh()

  }

  const timeOptions = Array.from({length:27},(_,i)=>{

    const hour = 7 + Math.floor(i/2)
    const minute = i%2===0 ? '00':'30'

    return `${String(hour).padStart(2,'0')}:${minute}`

  })

  if(loading){

    return <main className="p-8">Betöltés...</main>

  }

  return(

  <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

    <div>

      <div className="text-sm text-slate-500">KártevőGuru App</div>

      <h1 className="text-3xl font-extrabold tracking-tight">
        Munka szerkesztése
      </h1>

    </div>

<form onSubmit={handleSave} className="space-y-6">

<section className="bg-white rounded-2xl p-5 shadow">

<h2 className="text-lg font-bold mb-4">Munka adatai</h2>

<div className="grid md:grid-cols-2 gap-4">

<div>

<label className="block text-sm font-semibold mb-2">Dátum</label>

<input
type="date"
className="w-full border border-slate-300 rounded-xl px-4 py-3"
value={workForm.service_date}
onChange={(e)=>setWorkForm({...workForm,service_date:e.target.value})}
/>

</div>

<div>

<label className="block text-sm font-semibold mb-2">Időpont</label>

<select
className="w-full border border-slate-300 rounded-xl px-4 py-3"
value={workForm.service_time}
onChange={(e)=>setWorkForm({...workForm,service_time:e.target.value})}
>

<option value="">Időpont</option>

{timeOptions.map(t=>(
<option key={t} value={t}>{t}</option>
))}

</select>

</div>

<div>

<label className="block text-sm font-semibold mb-2">Munka típusa</label>

<select
className="w-full border border-slate-300 rounded-xl px-4 py-3"
value={workForm.job_type}
onChange={(e)=>setWorkForm({...workForm,job_type:e.target.value})}
>

<option value="">Válassz</option>

{JOB_TYPE_OPTIONS.map(o=>(
<option key={o} value={o}>{o}</option>
))}

</select>

</div>

<div>

<label className="block text-sm font-semibold mb-2">Célzott kártevő</label>

<select
className="w-full border border-slate-300 rounded-xl px-4 py-3"
value={workForm.target_pest}
onChange={(e)=>setWorkForm({...workForm,target_pest:e.target.value})}
>

<option value="">Válassz</option>

{TARGET_PEST_OPTIONS.map(o=>(
<option key={o} value={o}>{o}</option>
))}

</select>

</div>

<div className="md:col-span-2">

<label className="block text-sm font-semibold mb-2">
Munkavégzés címe
</label>

<input
className="w-full border border-slate-300 rounded-xl px-4 py-3"
value={workForm.address}
onChange={(e)=>setWorkForm({...workForm,address:e.target.value})}
/>

</div>

<div className="md:col-span-2">

<label className="block text-sm font-semibold mb-2">
Megjegyzés
</label>

<textarea
className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-24"
value={workForm.treatment_description}
onChange={(e)=>setWorkForm({...workForm,treatment_description:e.target.value})}
/>

</div>

</div>

</section>

<section className="bg-white rounded-2xl p-5 shadow">

<h2 className="text-lg font-bold mb-4">Ügyfél</h2>

<div className="grid md:grid-cols-2 gap-4">

<input
className="border border-slate-300 rounded-xl px-4 py-3"
placeholder="Név"
value={customerForm.name}
onChange={(e)=>setCustomerForm({...customerForm,name:e.target.value})}
/>

<input
className="border border-slate-300 rounded-xl px-4 py-3"
placeholder="Kapcsolattartó"
value={customerForm.contact_person}
onChange={(e)=>setCustomerForm({...customerForm,contact_person:e.target.value})}
/>

<input
className="border border-slate-300 rounded-xl px-4 py-3"
placeholder="Telefon"
value={customerForm.phone}
onChange={(e)=>setCustomerForm({...customerForm,phone:e.target.value})}
/>

<input
className="border border-slate-300 rounded-xl px-4 py-3"
placeholder="Email"
value={customerForm.email}
onChange={(e)=>setCustomerForm({...customerForm,email:e.target.value})}
/>

<input
className="md:col-span-2 border border-slate-300 rounded-xl px-4 py-3"
placeholder="Cím"
value={customerForm.address}
onChange={(e)=>setCustomerForm({...customerForm,address:e.target.value})}
/>

<textarea
className="md:col-span-2 border border-slate-300 rounded-xl px-4 py-3"
placeholder="Megjegyzés"
value={customerForm.notes}
onChange={(e)=>setCustomerForm({...customerForm,notes:e.target.value})}
/>

</div>

</section>

<div className="flex gap-3">

<button
type="submit"
disabled={saving}
className="bg-[#12bf3d] text-white px-6 py-3 rounded-xl font-semibold"
>

{saving ? 'Mentés...' : 'Mentés'}

</button>

<Link
href={`/work-orders/${id}`}
className="px-6 py-3 rounded-xl border border-slate-300"
>

Mégse

</Link>

</div>

</form>

</main>

  )

}