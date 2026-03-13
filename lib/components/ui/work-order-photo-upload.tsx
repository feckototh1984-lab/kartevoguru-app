'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type WorkOrderPhoto = {
  id: string
  work_order_id: string
  file_path: string
  file_name: string | null
  public_url: string | null
  created_at: string | null
}

type Props = {
  workOrderId: string
  initialPhotos?: WorkOrderPhoto[]
}

export default function WorkOrderPhotoUpload({
  workOrderId,
  initialPhotos = [],
}: Props) {
  const [photos, setPhotos] = useState<WorkOrderPhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const uploadedPhotos: WorkOrderPhoto[] = []

      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`
        const filePath = `${workOrderId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('work-order-photos')
          .upload(filePath, file, {
            upsert: false,
          })

        if (uploadError) {
          throw uploadError
        }

        const { data: publicUrlData } = supabase.storage
          .from('work-order-photos')
          .getPublicUrl(filePath)

        const publicUrl = publicUrlData.publicUrl

        const { data: insertedPhoto, error: insertError } = await supabase
          .from('work_order_photos')
          .insert({
            work_order_id: workOrderId,
            file_path: filePath,
            file_name: file.name,
            public_url: publicUrl,
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        uploadedPhotos.push(insertedPhoto as WorkOrderPhoto)
      }

      setPhotos((prev) => [...uploadedPhotos, ...prev])

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Hiba történt a feltöltés során.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photo: WorkOrderPhoto) {
    const confirmed = window.confirm('Biztosan törlöd ezt a fotót?')
    if (!confirmed) return

    try {
      const { error: storageError } = await supabase.storage
        .from('work-order-photos')
        .remove([photo.file_path])

      if (storageError) {
        throw storageError
      }

      const { error: dbError } = await supabase
        .from('work_order_photos')
        .delete()
        .eq('id', photo.id)

      if (dbError) {
        throw dbError
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    } catch (err: any) {
      alert(err.message || 'Nem sikerült törölni a fotót.')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(2,8,20,.08)]">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800">Fotók</h2>
        <p className="text-sm text-slate-500">
          Helyszíni képek feltöltése a munkalaphoz
        </p>
      </div>

      <div className="mb-5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full rounded-xl border border-slate-300 p-3 text-sm"
        />

        {uploading && (
          <p className="mt-2 text-sm text-slate-500">
            Feltöltés folyamatban...
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Még nincs feltöltött fotó ehhez a munkalaphoz.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
            >
              {photo.public_url ? (
                <img
                  src={photo.public_url}
                  alt={photo.file_name || 'Munkalap fotó'}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                  Nincs előnézet
                </div>
              )}

              <div className="p-3">
                <p className="truncate text-sm font-medium text-slate-700">
                  {photo.file_name || 'Fotó'}
                </p>

                <button
                  type="button"
                  onClick={() => handleDelete(photo)}
                  className="mt-3 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Törlés
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}