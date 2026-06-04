import React, { createContext, useContext, useState, useMemo } from 'react'

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

  const contextValue = useMemo(() => ({
    selectedActivityId,
    setSelectedActivityId
  }), [selectedActivityId])

  return (
    <ItinerarySelectionContext.Provider value={contextValue}>
      {children}
    </ItinerarySelectionContext.Provider>
  )
}
