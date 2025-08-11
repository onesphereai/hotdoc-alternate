import { createContext, useContext, type ReactNode } from 'react';

interface AuthContextType {
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({ isGuest: true });

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const value = {
    isGuest: true
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}