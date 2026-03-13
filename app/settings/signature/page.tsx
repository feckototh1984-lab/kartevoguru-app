'use client'

import { useEffect, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '@/lib/supabase'

type TechnicianSignature = {
  id: string
  technician_name: string
  signature_data: string
  created_at: string
  updated_at: string
}

export default function SignatureSettingsPage() {
  const sigRef = useRef<SignatureCanvas | null>(null)
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null)

  const [technicianName, setTechnicianName] = useState('Tóth Ferenc Richárd')
  const [savedSignature, setSavedSignature] = useState<TechnicianSignature | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [canvasWidth, setCanvasWidth] = useState(700)

  useEffect(() => {
    fetchSignature()
  }, [])

  useEffect(() => {
    function updateCanvasWidth() {
      if (!canvasWrapperRef.current) return
      const width = Math.floor(canvasWrapperRef.current.offsetWidth)
      if (width > 0) {
        setCanvasWidth(width)
      }
    }

    updateCanvasWidth()
    window.addEventListener('resize', updateCanvasWidth)

    return () => {
      window.removeEventListener('resize', updateCanvasWidth)
    }
  }, [])

  async function fetchSignature() {
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('technician_signatures')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      setMessage('Hiba történt az aláírás betöltésekor.')
      setLoading(false)
      return
    }

    if (data) {
      setSavedSignature(data)
      setTechnicianName(data.technician_name)
    }

    setLoading(false)
  }

  function clearSignature() {
    sigRef.current?.clear()
    setMessage('')
  }

  async function saveSignature() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setMessage('Kérlek, írd alá a mezőt mentés előtt.')
      return
    }

    const signatureData = sigRef.current.toDataURL('image/png')

    setSaving(true)
    setMessage('')

    if (savedSignature) {
      const { data, error } = await supabase
        .from('technician_signatures')
        .update({
          technician_name: technicianName,
          signature_data: signatureData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', savedSignature.id)
        .select()
        .single()

      if (error) {
        setMessage('Nem sikerült frissíteni az aláírást.')
        setSaving(false)
        return
      }

      setSavedSignature(data)
      setMessage('Az aláírás sikeresen frissítve.')
    } else {
      const { data, error } = await supabase
        .from('technician_signatures')
        .insert({
          technician_name: technicianName,
          signature_data: signatureData,
        })
        .select()
        .single()

      if (error) {
        setMessage('Nem sikerült elmenteni az aláírást.')
        setSaving(false)
        return
      }

      setSavedSignature(data)
      setMessage('Az aláírás sikeresen elmentve.')
    }

    setSaving(false)
  }

  async function deleteSavedSignature() {
    if (!savedSignature) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('technician_signatures')
      .delete()
      .eq('id', savedSignature.id)

    if (error) {
      setMessage('Nem sikerült törölni a mentett aláírást.')
      setSaving(false)
      return
    }

    setSavedSignature(null)
    setMessage('A mentett aláírás törölve.')
    setSaving(false)
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#388cc4] to-[#12bf3d] p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold">Technikus aláírás beállítás</h1>
        <p className="mt-2 text-sm text-white/90">
          Itt egyszer elmentheted a saját aláírásodat, amit a munkalap PDF-ek automatikusan használhatnak.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Technikus neve
        </label>
        <input
          type="text"
          value={technicianName}
          onChange={(e) => setTechnicianName(e.target.value)}
          className="mb-6 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#388cc4]"
          placeholder="Pl. Tóth Ferenc Richárd"
        />

        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Aláírás
        </label>

        <div
          ref={canvasWrapperRef}
          className="overflow-hidden rounded-2xl border border-slate-300 bg-white"
        >
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            canvasProps={{
              width: canvasWidth,
              height: 220,
              className: 'block w-full h-[220px] bg-white touch-none',
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={saveSignature}
            disabled={saving || loading}
            className="rounded-xl bg-[#12bf3d] px-5 py-3 font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Mentés...' : 'Aláírás mentése'}
          </button>

          <button
            onClick={clearSignature}
            type="button"
            className="rounded-xl border border-[#388cc4] px-5 py-3 font-semibold text-[#388cc4] hover:bg-[#388cc4]/5"
          >
            Törlés a vászonról
          </button>

          {savedSignature && (
            <button
              onClick={deleteSavedSignature}
              disabled={saving}
              type="button"
              className="rounded-xl border border-red-300 px-5 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Mentett aláírás törlése
            </button>
          )}
        </div>

        {message && (
          <p className="mt-4 text-sm font-medium text-slate-700">{message}</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Jelenlegi mentett aláírás</h2>

        {loading ? (
          <p className="text-sm text-slate-500">Betöltés...</p>
        ) : savedSignature ? (
          <div>
            <p className="mb-3 text-sm text-slate-600">
              <span className="font-semibold">Technikus:</span> {savedSignature.technician_name}
            </p>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <img
                src={savedSignature.signature_data}
                alt="Mentett technikus aláírás"
                className="max-h-32 object-contain"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Még nincs mentett aláírás.</p>
        )}
      </div>
    </main>
  )
}