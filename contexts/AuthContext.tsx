import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  cachedUser: null,
  loading: true,
  isOfflineMode: false,
  login: async () => { },
  signup: async () => { },
  logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cachedUser, setCachedUserState] = useState<CachedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    // Check for cached user first (for offline support)
    const cached = getCachedUser();
    if (cached) {
      setCachedUserState(cached);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsOfflineMode(false);

        // Cache user for offline access
        setCachedUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || null,
          cachedAt: Date.now(),
        });
        setCachedUserState({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || null,
          cachedAt: Date.now(),
        });

        // Create/update user document in Firestore (if online)
        if (isOnline()) {
          try {
            const userDoc = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDoc);
            if (!docSnap.exists()) {
              await setDoc(userDoc, {
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0],
                createdAt: Date.now(),
              });
            }
          } catch (e) {
            console.log('Firestore sync error:', e);
          }
        }
      } else {
        setCurrentUser(null);

        // If offline and we have cached user, allow offline mode
        if (!isOnline() && cached) {
          console.log('[Auth] Offline mode with cached user');
          setIsOfflineMode(true);
          setCachedUserState(cached);
        } else {
          setCachedUserState(null);
          setIsOfflineMode(false);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string) => {
    if (!isOnline()) {
      throw new Error('ইন্টারনেট সংযোগ প্রয়োজন');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        displayName: email.split('@')[0],
        createdAt: Date.now(),
      });

      // Cache user for offline access
      setCachedUser({
        uid: userCredential.user.uid,
        email: email,
        displayName: email.split('@')[0],
        cachedAt: Date.now(),
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('সঠিক ইমেইল দিন');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('ইন্টারনেট সংযোগ নেই');
      }
      throw new Error('অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে');
    }
  };

  const login = async (email: string, password: string) => {
    if (!isOnline()) {
      throw new Error('লগইনের জন্য ইন্টারনেট সংযোগ প্রয়োজন');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Cache user for offline access
      setCachedUser({
        uid: userCredential.user.uid,
        email: email,
        displayName: userCredential.user.displayName || email.split('@')[0],
        cachedAt: Date.now(),
      });
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        throw new Error('ভুল ইমেইল বা পাসওয়ার্ড');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('সঠিক ইমেইল দিন');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('অনেক চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('ইন্টারনেট সংযোগ নেই');
      }
      throw new Error('লগইন করতে সমস্যা হয়েছে');
    }
  };

  const logout = async () => {
    // Clear cached user on logout
    setCachedUser(null);
    setCachedUserState(null);
    setIsOfflineMode(false);

    if (isOnline()) {
      await signOut(auth);
    }
    setCurrentUser(null);
  };

  // Effective user - use cached user if offline and no current user
  const effectiveUser = currentUser || (isOfflineMode ? {
    uid: cachedUser?.uid || '',
    email: cachedUser?.email || null,
    displayName: cachedUser?.displayName || null,
  } as User : null);

  const value = {
    currentUser: effectiveUser,
    cachedUser,
    loading,
    isOfflineMode,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};