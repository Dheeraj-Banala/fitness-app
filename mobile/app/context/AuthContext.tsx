import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  isLoading: boolean
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(stored => {
      if (stored) setTokenState(stored);
      setIsLoading(false);
    });
  }, []);

  function setToken(newToken: string | null) {
    setTokenState(newToken);
    if (newToken) {
      AsyncStorage.setItem('token', newToken);
    } else {
      AsyncStorage.removeItem('token');
    }
  }

  return (
    <AuthContext.Provider value={{ token, setToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}