import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const HouseholdContext = createContext(null);

export function HouseholdProvider({ children }) {
  const [currentHouseholdId, setCurrentHouseholdId] = useState(() => {
    return localStorage.getItem('cortege_current_household') || null;
  });
  const [memberVersion, setMemberVersion] = useState(0);

  const bumpMemberVersion = useCallback(() => {
    setMemberVersion(v => v + 1);
  }, []);

  useEffect(() => {
    if (currentHouseholdId) {
      localStorage.setItem('cortege_current_household', currentHouseholdId);
    } else {
      localStorage.removeItem('cortege_current_household');
    }
  }, [currentHouseholdId]);

  return (
    <HouseholdContext.Provider value={{ currentHouseholdId, setCurrentHouseholdId, memberVersion, bumpMemberVersion }}>
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
