'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generateAutoWarnings } from '@/lib/autoWarnings'

export type WorkOrderProduct = {
  id: string
  work_order_id: string
  product_name: string | null
  quantity: string | null
  method: string | null
  target_pest: string | null
  created_at: string | null
}

export type AutoWarningsResult = {
  warnings: string[]
  tasks: string[]
}

type EditableProductRow = {
  localId: string
  id?: string
  product_name: string
  quantity: string
  method: string
  target_pest: string
  new_product_name?: string
}

type Props = {
  workOrderId: string
  initialProducts?: WorkOrderProduct[]
  onSaved?: (
    products: WorkOrderProduct[],
    generated?: AutoWarningsResult
  ) => void
}

const methodOptions = [
  'permetezés',
  'hidegköd képzés',
  'ULV',
  'gél kihelyezés',
  'csalianyag kihelyezés',
  'porozás',
  'fertőtlenítés',
  'monitorozás',
]

const pestOptions = [
  'rovar',
  'csótány',
  'ágyi poloska',
  'hangya',
  'pók',
  'darázs',
  'légy',
  'bolha',
  'rágcsáló',
  'egér',
  'patkány',
]

function generateLocalId() {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID()
  }

  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function createEmptyRow(): EditableProductRow {
  return {
    localId: generateLocalId(),
    product_name: '',
    quantity: '',
    method: '',
    target_pest: '',
    new_product_name: '',
  }
}

export default function WorkOrderProductsField({
  workOrderId,
  initialProducts = [],
  onSaved,
}: Props) {
  const [rows, setRows] = useState<EditableProductRow[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [productOptions, setProductOptions] = useState<string[]>([])
  const [addingProductRowId, setAddingProductRowId] = useState<string | null>(null)

  useEffect(() => {
    loadProductCatalog()
  }, [])

  useEffect(() => {
    if (initialProducts.length > 0) {
      setRows(
        initialProducts.map((item) => ({
          localId: generateLocalId(),
          id: item.id,
          product_name: item.product_name || '',
          quantity: item.quantity || '',
          method: item.method || '',
          target_pest: item.target_pest || '',
          new_product_name: '',
        }))
      )
    } else {
      setRows([createEmptyRow()])
    }
  }, [initialProducts])

  async function loadProductCatalog() {
    const { data, error } = await supabase
      .from('product_catalog')
      .select('name')
      .order('name', { ascending: true })

    if (error) {
      console.error('Nem sikerült betölteni a termékkatalógust:', error.message)
      return
    }

    if (data) {
      setProductOptions(data.map((item) => item.name))
    }
  }

  const hasAtLeastOneMeaningfulRow = useMemo(() => {
    return rows.some(
      (row) =>
        row.product_name.trim() ||
        row.quantity.trim() ||
        row.method.trim() ||
        row.target_pest.trim()
    )
  }, [rows])

  function updateRow(
    localId: string,
    field: keyof Omit<EditableProductRow, 'localId' | 'id'>,
    value: string
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.localId === localId ? { ...row, [field]: value } : row
      )
    )
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()])
    setMessage('')
  }

  function removeRow(localId: string) {
    setRows((prev) => {
      const next = prev.filter((row) => row.localId !== localId)
      return next.length > 0 ? next : [createEmptyRow()]
    })
    setMessage('')
  }

  async function addProductToCatalog(localId: string) {
    const row = rows.find((item) => item.localId === localId)
    const cleaned = row?.new_product_name?.trim() || ''

    if (!cleaned) {
      setMessage('Írj be egy új terméknevet.')
      return
    }

    const alreadyExists = productOptions.some(
      (item) => item.toLowerCase() === cleaned.toLowerCase()
    )

    if (alreadyExists) {
      setRows((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? {
                ...item,
                product_name: cleaned,
                new_product_name: '',
              }
            : item
        )
      )
      setMessage('Ez a termék már szerepel a listában, kiválasztottam neked.')
      return
    }

    setAddingProductRowId(localId)
    setMessage('')

    const { error } = await supabase
      .from('product_catalog')
      .insert([{ name: cleaned }])

    if (error) {
      setAddingProductRowId(null)
      setMessage('Nem sikerült hozzáadni a terméket a listához.')
      return
    }

    await loadProductCatalog()

    setRows((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? {
              ...item,
              product_name: cleaned,
              new_product_name: '',
            }
          : item
      )
    )

    setAddingProductRowId(null)
    setMessage('Az új termék bekerült a listába és ki is lett választva.')
  }

  async function saveRows() {
    setSaving(true)
    setMessage('')

    const cleanedRows = rows.filter(
      (row) =>
        row.product_name.trim() ||
        row.quantity.trim() ||
        row.method.trim() ||
        row.target_pest.trim()
    )

    const { error: deleteError } = await supabase
      .from('work_order_products')
      .delete()
      .eq('work_order_id', workOrderId)

    if (deleteError) {
      setSaving(false)
      setMessage('Nem sikerült menteni a készítményeket.')
      return
    }

    if (cleanedRows.length === 0) {
      const { error: workOrderUpdateError } = await supabase
        .from('work_orders')
        .update({
          auto_warnings: [],
          auto_tasks: [],
        })
        .eq('id', workOrderId)

      if (workOrderUpdateError) {
        setSaving(false)
        setMessage(
          'A készítménylista ürítve lett, de a figyelmeztetések frissítése nem sikerült.'
        )
        onSaved?.([], { warnings: [], tasks: [] })
        return
      }

      setSaving(false)
      setMessage('A készítménylista ürítve lett.')
      onSaved?.([], { warnings: [], tasks: [] })
      return
    }

    const payload = cleanedRows.map((row) => ({
      work_order_id: workOrderId,
      product_name: row.product_name || null,
      quantity: row.quantity || null,
      method: row.method || null,
      target_pest: row.target_pest || null,
    }))

    const { data, error } = await supabase
      .from('work_order_products')
      .insert(payload)
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      setSaving(false)
      setMessage('Nem sikerült menteni a készítményeket.')
      return
    }

    const savedProducts = (data || []) as WorkOrderProduct[]

    const generated = generateAutoWarnings(
      savedProducts.map((item) => ({
        method: item.method,
        target_pest: item.target_pest,
      }))
    )

    const { error: workOrderUpdateError } = await supabase
      .from('work_orders')
      .update({
        auto_warnings: generated.warnings,
        auto_tasks: generated.tasks,
      })
      .eq('id', workOrderId)

    if (workOrderUpdateError) {
      setSaving(false)
      setMessage(
        'A készítmények mentve lettek, de a figyelmeztetések frissítése nem sikerült.'
      )
      return
    }

    setRows(
      savedProducts.map((item) => ({
        localId: generateLocalId(),
        id: item.id,
        product_name: item.product_name || '',
        quantity: item.quantity || '',
        method: item.method || '',
        target_pest: item.target_pest || '',
        new_product_name: '',
      }))
    )

    onSaved?.(savedProducts, {
      warnings: generated.warnings,
      tasks: generated.tasks,
    })

    setSaving(false)
    setMessage('A készítmények és az automatikus figyelmeztetések sikeresen mentve.')
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Felhasznált készítmények</h2>
        <p className="mt-1 text-sm text-slate-500">
          Több készítményt is hozzáadhatsz a munkalaphoz.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={row.localId}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-700">
                Készítmény #{index + 1}
              </div>

              <button
                type="button"
                onClick={() => removeRow(row.localId)}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Törlés
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Termék
                </label>
                <select
                  value={row.product_name}
                  onChange={(e) =>
                    updateRow(row.localId, 'product_name', e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#388cc4]"
                >
                  <option value="">Válassz terméket...</option>
                  {productOptions.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>

                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nincs a listában? Add hozzá itt
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={row.new_product_name || ''}
                      onChange={(e) =>
                        updateRow(row.localId, 'new_product_name', e.target.value)
                      }
                      placeholder="Pl. Biokill, Fendona, K-Othrine..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#388cc4]"
                    />

                    <button
                      type="button"
                      onClick={() => addProductToCatalog(row.localId)}
                      disabled={addingProductRowId === row.localId}
                      className="rounded-xl bg-[#388cc4] px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {addingProductRowId === row.localId
                        ? 'Hozzáadás...'
                        : 'Termék mentése'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Mennyiség
                </label>
                <input
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(row.localId, 'quantity', e.target.value)
                  }
                  placeholder="Pl. 20 g / 50 ml / 2 db"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#388cc4]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Alkalmazási technika
                </label>
                <select
                  value={row.method}
                  onChange={(e) =>
                    updateRow(row.localId, 'method', e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#388cc4]"
                >
                  <option value="">Válassz technikát...</option>
                  {methodOptions.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Célzott kártevő
                </label>
                <select
                  value={row.target_pest}
                  onChange={(e) =>
                    updateRow(row.localId, 'target_pest', e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#388cc4]"
                >
                  <option value="">Válassz kártevőt...</option>
                  {pestOptions.map((pest) => (
                    <option key={pest} value={pest}>
                      {pest}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveRows}
          disabled={saving}
          className="rounded-xl bg-[#12bf3d] px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Mentés...' : 'Készítmények mentése'}
        </button>

        <button
          type="button"
          onClick={addRow}
          className="rounded-xl border border-[#388cc4] px-5 py-3 font-semibold text-[#388cc4] hover:bg-[#388cc4]/5"
        >
          + Új készítmény
        </button>

        {message && (
          <p className="text-sm font-medium text-slate-600">{message}</p>
        )}
      </div>

      {!hasAtLeastOneMeaningfulRow && (
        <p className="mt-4 text-sm text-slate-400">
          Még nincs rögzített készítmény ehhez a munkalaphoz.
        </p>
      )}
    </section>
  )
}