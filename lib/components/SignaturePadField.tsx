'use client'

import { useEffect, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '@/lib/supabase'

type Props = {
  workOrderId: string
  existingSignatureUrl?: string | null
  onSaved?: (url: string) => void
}

export default function SignaturePadField({
  workOrderId,
  existingSignatureUrl,
  onSaved,
}: Props) {
  const sigRef = useRef<SignatureCanvas | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingSignatureUrl || null
  )
  const [canvasWidth, setCanvasWidth] = useState(700)
  const [canvasHeight, setCanvasHeight] = useState(220)

  useEffect(() => {
    function updateCanvasSize() {
      if (!containerRef.current) return

      const width = Math.max(280, Math.floor(containerRef.current.offsetWidth))
      const height = width < 480 ? 180 : 220

      setCanvasWidth(width)
      setCanvasHeight(height)
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [])

  const clearSignature = () => {
    sigRef.current?.clear()
    setMessage('')
  }

  const saveSignature = async () => {
    try {
      setLoading(true)
      setMessage('')

      if (!sigRef.current || sigRef.current.isEmpty()) {
        setMessage('Kérlek, írd alá a mezőt mentés előtt.')
        return
      }

      const dataUrl = sigRef.current.toDataURL('image/png')
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      const filePath = `${workOrderId}/customer-signature-${Date.now()}.png`

      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(filePath)

      const publicUrl = publicUrlData.publicUrl

      const { error: updateError } = await supabase
        .from('work_orders')
        .update({
          customer_signature_url: publicUrl,
          signed_at: new Date().toISOString(),
        })
        .eq('id', workOrderId)

      if (updateError) {
        throw updateError
      }

      setPreviewUrl(publicUrl)
      setMessage('Az aláírás sikeresen elmentve.')
      onSaved?.(publicUrl)
    } catch (error: any) {
      console.error(error)
      setMessage(error.message || 'Hiba történt a mentés közben.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
      <h2 className="text-lg font-bold mb-2">Ügyfél aláírás</h2>
      <p className="text-sm text-slate-500 mb-4">
        Az ügyfél itt tud aláírni egérrel vagy érintőképernyőn.
      </p>

      <div
        ref={containerRef}
        className="w-full rounded-xl border border-slate-300 overflow-hidden bg-white"
      >
        <SignatureCanvas
          key={`${canvasWidth}-${canvasHeight}`}
          ref={(ref) => {
            sigRef.current = ref
          }}
          penColor="black"
          canvasProps={{
            width: canvasWidth,
            height: canvasHeight,
            className: 'block w-full touch-none',
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={clearSignature}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Törlés
        </button>

        <button
          type="button"
          onClick={saveSignature}
          disabled={loading}
          className="rounded-xl bg-[#12bf3d] px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Mentés...' : 'Aláírás mentése'}
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm text-slate-600">{message}</p>
      )}

      {previewUrl && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-slate-700">
            Aktuális elmentett aláírás:
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <img
              src={previewUrl}
              alt="Elmentett ügyfél aláírás"
              className="max-h-32 object-contain"
            />
          </div>
        </div>
      )}
    </section>
  )
}