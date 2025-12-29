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

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  guestLogin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => { },
  signup: async () => { },
  logout: async () => { },
  guestLogin: () => { },
});

export const useAuth = () => useContext(AuthContext);

const LOCAL_STORAGE_KEY = 'tasker_guest_user';

// Guest user type for local-only usage
interface GuestUser {
  uid: string;
  email: null;
  displayName: string;
  isGuest: true;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | GuestUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for guest user first
    const guestUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (guestUser) {
      setCurrentUser(JSON.parse(guestUser));
      setLoading(false);
      return;
    }

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Store user data in Firestore
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
          console.log('Firestore sync skipped:', e);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email,
      displayName: email.split('@')[0],
      createdAt: Date.now(),
    });
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    await signOut(auth);
    setCurrentUser(null);
  };

  const guestLogin = () => {
    const guestUser: GuestUser = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 15),
      email: null,
      displayName: 'Guest',
      isGuest: true,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(guestUser));
    setCurrentUser(guestUser as any);
  };

  const value = {
    currentUser: currentUser as any,
    loading,
    login,
    signup,
    logout,
    guestLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};