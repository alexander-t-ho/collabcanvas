import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User } from 'firebase/auth';
import { AppUser } from '../types';
import { generateRandomColor } from '../utils/colors';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    const cursorColor = generateRandomColor();
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      displayName,
      email,
      cursorColor
    });
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        let userData = userDoc.data();
        
        // Create user document if it doesn't exist
        if (!userData) {
          const cursorColor = generateRandomColor();
          userData = {
            displayName: firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email || '',
            cursorColor
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        }
        
        setCurrentUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || userData.displayName || 'Anonymous',
          email: firebaseUser.email || '',
          cursorColor: userData.cursorColor || generateRandomColor()
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};