'use client'

import { useEffect, useState } from 'react'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Show "back online" briefly
      setShowIndicator(true)
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Don't show anything if online and not transitioning
  if (isOnline && !showIndicator) {
    return null
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        isOnline
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800 animate-pulse'
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      {isOnline ? 'Back Online' : 'Offline'}
    </div>
  )
}
