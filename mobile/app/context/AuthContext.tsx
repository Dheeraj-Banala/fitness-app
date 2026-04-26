import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureAuth } from '../services/api';

type AuthContextType = {
  token: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  refreshToken: null,
  setTokens: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('refreshToken'),
    ]).then(([storedToken, storedRefresh]) => {
      if (storedToken && storedRefresh) {
        setToken(storedToken);
        setRefreshToken(storedRefresh);
        configureAuth(storedRefresh,
          (newToken) => {
            setToken(newToken);
            AsyncStorage.setItem('token', newToken);
          },
          () => setTokens(null, null)
        );
      }
      setIsLoading(false);
    });
  }, []);

  function setTokens(accessToken: string | null, newRefreshToken: string | null) {
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
    if (accessToken && newRefreshToken) {
      AsyncStorage.setItem('token', accessToken);
      AsyncStorage.setItem('refreshToken', newRefreshToken);
      configureAuth(newRefreshToken,
        (newToken) => {
          setToken(newToken);
          AsyncStorage.setItem('token', newToken);
        },
        () => setTokens(null, null)
      );
    } else {
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('refreshToken');
      configureAuth(null, () => {}, () => {});
    }
  }

  return (
    <AuthContext.Provider value={{ token, refreshToken, setTokens, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
