import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    if (!router.pathname.includes('/login')) {
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      setIsLoggedIn,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export const useAuthContext = useAuth; 