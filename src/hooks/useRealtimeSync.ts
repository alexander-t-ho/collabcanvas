import { useEffect } from 'react';
import { 
  collection, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCanvas } from '../contexts/CanvasContext';
import { CanvasObject } from '../types';

const CANVAS_ID = 'default';

export const useRealtimeSync = () => {
  const { setObjects } = useCanvas();

  // Listen to object changes from Firestore
  useEffect(() => {
    console.log('Setting up Firestore listener...'); // DEBUG
    
    const objectsRef = collection(db, 'canvases', CANVAS_ID, 'objects');
    const q = query(objectsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Firestore snapshot received:', snapshot.size, 'objects'); // DEBUG
      
      const updatedObjects: CanvasObject[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Object from Firestore:', doc.id, data); // DEBUG
        updatedObjects.push({ id: doc.id, ...data } as CanvasObject);
      });

      console.log('Setting objects:', updatedObjects.length); // DEBUG
      setObjects(updatedObjects);
    }, (error) => {
      console.error('Firestore listener error:', error); // DEBUG
    });

    return () => {
      console.log('Cleaning up Firestore listener'); // DEBUG
      unsubscribe();
    };
  }, [setObjects]);
};