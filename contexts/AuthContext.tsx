import React, { createContext, useContext, useEffect, useState } from 'react';

// Local User type (mimics Firebase User structure for compatibility)
export interface LocalUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  currentUser: LocalUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  guestLogin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => { },
  signup: async () => { },
  logout: () => { },
  guestLogin: () => { },
});

export const useAuth = () => useContext(AuthContext);

const LOCAL_STORAGE_KEY = 'zenith_user';
const LOCAL_USERS_KEY = 'zenith_users'; // Store registered users

const generateUID = () => 'user_' + Math.random().toString(36).substring(2, 15);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const getUsers = (): Record<string, { password: string; uid: string }> => {
    const users = localStorage.getItem(LOCAL_USERS_KEY);
    return users ? JSON.parse(users) : {};
  };

  const saveUsers = (users: Record<string, { password: string; uid: string }>) => {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  };

  const signup = async (email: string, password: string) => {
    const users = getUsers();
    if (users[email]) {
      throw new Error('User already exists with this email.');
    }
    const uid = generateUID();
    users[email] = { password, uid };
    saveUsers(users);

    const user: LocalUser = { uid, email, displayName: email.split('@')[0] };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const login = async (email: string, password: string) => {
    const users = getUsers();
    const userRecord = users[email];
    if (!userRecord || userRecord.password !== password) {
      throw new Error('Invalid email or password.');
    }

    const user: LocalUser = { uid: userRecord.uid, email, displayName: email.split('@')[0] };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setCurrentUser(null);
  };

  const guestLogin = () => {
    const uid = generateUID();
    const user: LocalUser = { uid, email: null, displayName: 'Guest' };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const value = {
    currentUser,
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