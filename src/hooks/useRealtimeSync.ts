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
    console.log('REALTIME SYNC: Setting up listener');
    
    const objectsRef = collection(db, 'canvases', CANVAS_ID, 'objects');
    const q = query(objectsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('REALTIME SYNC: Received', snapshot.size, 'objects');
      
      const updatedObjects: CanvasObject[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        updatedObjects.push({ id: doc.id, ...data } as CanvasObject);
      });

      console.log('REALTIME SYNC: Setting objects to state');
      setObjects(updatedObjects);
    }, (error) => {
      console.error('REALTIME SYNC: Error:', error);
    });

    return () => {
      console.log('REALTIME SYNC: Cleanup');
      unsubscribe();
    };
  }, [setObjects]);
};