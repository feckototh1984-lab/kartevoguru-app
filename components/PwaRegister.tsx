'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          console.log('Service Worker regisztrálva')
        })
        .catch((error) => {
          console.error('Service Worker hiba:', error)
        })
    }
  }, [])

  return null
}