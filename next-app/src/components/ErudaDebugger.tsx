'use client'

import { useEffect } from 'react'

export default function ErudaDebugger() {
  useEffect(() => {
    // Only load Eruda in development mode
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    // For debugging, load Eruda on both mobile and desktop
    // You can uncomment the line below to restrict to mobile only
    // if (!isMobile) {
    //   return
    // }

    // Load Eruda script
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/eruda'
    script.async = true
    script.onload = () => {
      // Initialize Eruda
      if (typeof window !== 'undefined' && (window as any).eruda) {
        (window as any).eruda.init()
        console.log('Eruda initialized for debugging')
        
        // Add a global function to show Eruda manually
        ;(window as any).showEruda = () => {
          (window as any).eruda.show()
        }
        
        // Log instructions
        console.log('🔧 Eruda Debugger loaded!')
        console.log('📱 On mobile: Tap the floating button or shake device')
        console.log('💻 On desktop: Type "showEruda()" in console or look for floating button')
      }
    }

    document.head.appendChild(script)

    // Cleanup
    return () => {
      const existingScript = document.querySelector('script[src*="eruda"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [])

  return null
} 