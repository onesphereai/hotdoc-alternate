import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { configureAuth, signInUser, signOutUser, getCurrentUserInfo, getIdToken } from '@hotdoc-alt/lib';

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

interface AuthProviderProps {
  children: ReactNode;
  config: {
    userPoolId: string;
    userPoolClientId: string;
    region?: string;
  };
}

export function AuthProvider({ children, config }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configureAuth(config);
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userInfo = await getCurrentUserInfo();
      if (userInfo) {
        setUser({
          username: userInfo.user.username,
          email: userInfo.user.signInDetails?.loginId || '',
          tenantId: userInfo.user.userAttributes?.['custom:tenantId'],
          role: userInfo.user.userAttributes?.['custom:role'],
          attributes: userInfo.user.userAttributes || {}
        });
      }
    } catch (error) {
      console.error('Check user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInUser(email, password);
      await checkUser();
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const getToken = async () => {
    return await getIdToken();
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}