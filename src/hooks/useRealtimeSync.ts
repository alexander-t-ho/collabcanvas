import { useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc,
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCanvas } from '../contexts/CanvasContext';
import { useAuth } from '../contexts/AuthContext';
import { CanvasObject } from '../types';

const CANVAS_ID = 'default'; // Single canvas for MVP

export const useRealtimeSync = () => {
  const { objects, setObjects, selectedId } = useCanvas();
  const { currentUser } = useAuth();

  // Listen to object changes from Firestore
  useEffect(() => {
    const objectsRef = collection(db, 'canvases', CANVAS_ID, 'objects');
    const q = query(objectsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedObjects: CanvasObject[] = [];
      
      snapshot.forEach((doc) => {
        updatedObjects.push({ id: doc.id, ...doc.data() } as CanvasObject);
      });

      setObjects(updatedObjects);
    });

    return () => unsubscribe();
  }, [setObjects]);

  // Sync local changes to Firestore
  const syncToFirestore = useCallback(async (object: CanvasObject) => {
    if (!currentUser) return;
    
    try {
      const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', object.id);
      await setDoc(objectRef, object, { merge: true });
    } catch (error) {
      console.error('Error syncing to Firestore:', error);
    }
  }, [currentUser]);

  const deleteFromFirestore = useCallback(async (objectId: string) => {
    if (!currentUser) return;
    
    try {
      const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', objectId);
      await deleteDoc(objectRef);
    } catch (error) {
      console.error('Error deleting from Firestore:', error);
    }
  }, [currentUser]);

  // Listen for local object changes and sync
  useEffect(() => {
    objects.forEach(obj => {
      // Only sync if this user created/modified it recently
      if (obj.createdBy === currentUser?.uid && Date.now() - obj.lastModified < 1000) {
        syncToFirestore(obj);
      }
    });
  }, [objects, currentUser, syncToFirestore]);

  return { syncToFirestore, deleteFromFirestore };
};