import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_TENANT_ID } from '../constants/config';

interface User {
  username: string;
  email: string;
  tenantId?: string;
  role?: string;
  attributes: Record<string, string>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      try {
        // TODO: Implement real Cognito session check
        // For now, just set loading to false
        setLoading(false);
      } catch (error) {
        console.error('Session check failed:', error);
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const handleSignIn = async (email: string, password?: string) => {
    // TODO: Implement real Cognito authentication
    if (!password) {
      throw new Error('Password is required');
    }
    
    // Temporary implementation until Cognito integration
    setUser({
      username: email,
      email: email,
      tenantId: DEFAULT_TENANT_ID, // TODO: Extract from Cognito user attributes
      role: 'admin',
      attributes: {}
    });
  };

  const handleSignOut = async () => {
    // TODO: Implement real Cognito sign out
    setUser(null);
  };

  const getToken = async () => {
    // TODO: Return real Cognito ID token
    return 'temp-token-placeholder';
  };

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}