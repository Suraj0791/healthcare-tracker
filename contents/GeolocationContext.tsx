'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface GeolocationState {
  location: {
    latitude: number
    longitude: number
    address?: string
  } | null
  loading: boolean
  error: Error | null
}

const GeolocationContext = createContext<GeolocationState>({
  location: null,
  loading: false,
  error: null,
})

export function useGeolocation() {
  return useContext(GeolocationContext)
}

export function GeolocationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: true,
    error: null,
  })
  
  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        loading: false,
        error: new Error('Geolocation is not supported by your browser'),
      })
      return
    }
    
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Try to get address from coordinates using reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          )
          
          const data = await response.json()
          const address = data.display_name
          
          setState({
            location: {
              latitude,
              longitude,
              address,
            },
            loading: false,
            error: null,
          })
        } catch (error) {
          // If reverse geocoding fails, still return the coordinates
          setState({
            location: {
              latitude,
              longitude,
            },
            loading: false,
            error: null,
          })
        }
      },
      (error) => {
        setState({
          location: null,
          loading: false,
          error: new Error(
            error.code === 1
              ? 'Permission denied. Please allow location access.'
              : error.code === 2
                ? 'Position unavailable. Please try again.'
                : error.code === 3
                  ? 'Timeout. Please try again.'
                  : 'An unknown error occurred.'
          ),
        })
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
    )
    
    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])
  
  return (
    <GeolocationContext.Provider value={state}>
      {children}
    </GeolocationContext.Provider>
  )
}
