import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { User } from '@supabase/supabase-js';
import { getCachedUser, setCachedUser, CachedUser } from '../services/localStorageService';
import { isOnline } from '../services/syncService';

interface AuthContextType {
  currentUser: User | null;
  cachedUser: CachedUser | null;
  loading: boolean;
  isOfflineMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  cachedUser: null,
  loading: true,
  isOfflineMode: false,
  login: async () => { },
  signup: async () => { },
  logout: async () => { },
  resetPassword: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cachedUser, setCachedUserState] = useState<CachedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for cached user first
    const cached = getCachedUser();
    if (cached) {
      setCachedUserState(cached);
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUser(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
        if (cached && !isOnline()) {
          setIsOfflineMode(true);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked reset link - redirect to update password page
        navigate('/update-password');
      }

      if (session?.user) {
        handleUser(session.user);
      } else {
        setCurrentUser(null);
        if (!isOnline() && cached) {
          setIsOfflineMode(true);
          setCachedUserState(cached);
        } else {
          setCachedUserState(null);
          setIsOfflineMode(false);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUser = (user: User) => {
    setCurrentUser(user);
    setIsOfflineMode(false);

    const userData: CachedUser = {
      uid: user.id,
      email: user.email || null,
      displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
      cachedAt: Date.now(),
    };

    setCachedUser(userData);
    setCachedUserState(userData);
    setLoading(false);
  };

  const signup = async (email: string, password: string) => {
    if (!isOnline()) throw new Error('ইন্টারনেট সংযোগ প্রয়োজন');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        handleUser(data.session.user);
      } else if (data.user) {
        // User created but email confirmation required
        throw new Error('Account created! Please check your email to confirm.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে');
    }
  };

  const login = async (email: string, password: string) => {
    if (!isOnline()) throw new Error('লগইনের জন্য ইন্টারনেট সংযোগ প্রয়োজন');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) handleUser(data.user);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please confirm your email address first.');
      }
      throw new Error('Invalid email or password');
    }
  };

  const resetPassword = async (email: string) => {
    if (!isOnline()) throw new Error('ইন্টারনেট সংযোগ প্রয়োজন');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Redirect to root, listener will handle it
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে');
    }
  };

  const logout = async () => {
    setCachedUser(null);
    setCachedUserState(null);
    setIsOfflineMode(false);

    if (isOnline()) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
  };

  const effectiveUser = currentUser || (isOfflineMode ? {
    id: cachedUser?.uid || '',
    email: cachedUser?.email || undefined,
    user_metadata: { full_name: cachedUser?.displayName },
    app_metadata: {},
    aud: '',
    created_at: ''
  } as User : null);

  const value = {
    currentUser: effectiveUser,
    cachedUser,
    loading,
    isOfflineMode,
    login,
    signup,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
