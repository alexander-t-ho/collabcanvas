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
    console.log('🔥 REALTIME SYNC: Setting up Firestore listener...'); 
    
    const objectsRef = collection(db, 'canvases', CANVAS_ID, 'objects');
    const q = query(objectsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('🔥 REALTIME SYNC: Firestore snapshot received -', snapshot.size, 'objects'); 
      
      const updatedObjects: CanvasObject[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔥 REALTIME SYNC: Object from Firestore:', doc.id, data.type);
        updatedObjects.push({ id: doc.id, ...data } as CanvasObject);
      });

      console.log('🔥 REALTIME SYNC: Setting', updatedObjects.length, 'objects to state');
      setObjects(updatedObjects);
      console.log('✅ REALTIME SYNC: State updated');
    }, (error) => {
      console.error('❌ REALTIME SYNC: Firestore listener error:', error);
      alert(`Firestore sync error: ${error.message || error}`);
    });

    return () => {
      console.log('🔥 REALTIME SYNC: Cleaning up Firestore listener'); 
      unsubscribe();
    };
  }, [setObjects]);
};