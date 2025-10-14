import React, { createContext, useContext, useState, useCallback } from 'react';
import { updatePassword, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { useAuth } from './AuthContext';

interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  cursorColor: string;
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUserPhoto: (file: File) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  loading: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) throw new Error('useUserProfile must be used within UserProfileProvider');
  return context;
};

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user profile when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      const loadProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              displayName: currentUser.displayName || data.displayName || '',
              email: currentUser.email || '',
              photoURL: (currentUser as any).photoURL || data.photoURL || '',
              cursorColor: data.cursorColor || '#3b82f6'
            });
          } else {
            // Create default profile
            setUserProfile({
              displayName: currentUser.displayName || 'Anonymous',
              email: currentUser.email || '',
              photoURL: (currentUser as any).photoURL || '',
              cursorColor: '#3b82f6'
            });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      };
      loadProfile();
    } else {
      setUserProfile(null);
    }
  }, [currentUser]);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    
    setLoading(true);
    try {
      // Update Firebase Auth profile if displayName or photoURL changed
      if (updates.displayName !== undefined || updates.photoURL !== undefined) {
        await updateProfile(firebaseUser, {
          displayName: updates.displayName || firebaseUser.displayName,
          photoURL: updates.photoURL || (firebaseUser as any).photoURL
        });
      }

      // Update Firestore user document
      await updateDoc(doc(db, 'users', firebaseUser.uid), updates);

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserPhoto = useCallback(async (file: File) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    
    setLoading(true);
    try {
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `avatars/${firebaseUser.uid}/${timestamp}_${file.name}`;
      const imageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update profile with new photo URL
      await updateUserProfile({ photoURL: downloadURL });
    } catch (error) {
      console.error('Error uploading user photo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateUserProfile]);

  const changePassword = useCallback(async (newPassword: string) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    
    setLoading(true);
    try {
      await updatePassword(firebaseUser, newPassword);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    userProfile,
    updateUserProfile,
    updateUserPhoto,
    changePassword,
    loading
  };

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
};
