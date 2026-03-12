import React, { createContext, useContext } from 'react';
import { useLimit } from '../hooks/useLimit';

const LimitContext = createContext(null);

export function LimitProvider({ children }) {
  const limit = useLimit();
  return <LimitContext.Provider value={limit}>{children}</LimitContext.Provider>;
}

export function useLimitContext() {
  return useContext(LimitContext);
}
