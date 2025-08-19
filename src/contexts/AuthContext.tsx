import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, User } from '../lib/localStorage';

interface AuthContextType {
  user: User | null;
  profile: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: 'azubi' | 'ausbilder') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    db.initializeExampleAccounts();
    const currentUser = db.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user, error } = db.login(email, password);
    if (error) {
      return { error: new Error(error) };
    }
    setUser(user);
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'azubi' | 'ausbilder') => {
    const { user, error } = db.register(email, password, fullName, role);
    if (error) {
      return { error: new Error(error) };
    }
    setUser(user);
    return { error: null };
  };

  const signOut = async () => {
    db.logout();
    setUser(null);
  };

  const value = {
    user,
    profile: user, // For compatibility with existing code
    session: user ? { user } : null,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};