import React, { createContext, useContext, useState } from 'react'

interface ItinerarySelectionContextType {
  selectedActivityId: string | null
  setSelectedActivityId: (id: string | null) => void
}

const ItinerarySelectionContext = createContext<ItinerarySelectionContextType>({
  selectedActivityId: null,
  setSelectedActivityId: (_id: string | null) => undefined,
})

export const useItinerarySelection = () => useContext(ItinerarySelectionContext)

export const ItinerarySelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  return (
    <ItinerarySelectionContext.Provider value={{ selectedActivityId, setSelectedActivityId }}>
      {children}
    </ItinerarySelectionContext.Provider>
  )
}
