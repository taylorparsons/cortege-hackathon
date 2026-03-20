import { createContext, useContext, useState, useEffect } from 'react';

const HouseholdContext = createContext(null);

export function HouseholdProvider({ children }) {
  const [currentHouseholdId, setCurrentHouseholdId] = useState(() => {
    return localStorage.getItem('cortege_current_household') || null;
  });

  useEffect(() => {
    if (currentHouseholdId) {
      localStorage.setItem('cortege_current_household', currentHouseholdId);
    } else {
      localStorage.removeItem('cortege_current_household');
    }
  }, [currentHouseholdId]);

  return (
    <HouseholdContext.Provider value={{ currentHouseholdId, setCurrentHouseholdId }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHouseholdContext() {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHouseholdContext must be used within HouseholdProvider');
  }
  return context;
}
