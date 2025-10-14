import { useEffect, useCallback, useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { CursorPosition } from '../types';
import { throttle } from '../utils/helpers';

const CANVAS_ID = 'default';

export const useCursorSync = () => {
  const { currentUser } = useAuth();
  const [remoteCursors, setRemoteCursors] = useState<CursorPosition[]>([]);

  // Listen to cursor updates from other users
  useEffect(() => {
    if (!currentUser) return;

    const cursorsRef = collection(db, 'canvases', CANVAS_ID, 'cursors');
    const unsubscribe = onSnapshot(cursorsRef, (snapshot) => {
      const cursors: CursorPosition[] = [];
      
      snapshot.forEach((doc) => {
        const cursor = doc.data() as CursorPosition;
        // Don't show own cursor
        if (cursor.userId !== currentUser.uid) {
          cursors.push(cursor);
        }
      });

      setRemoteCursors(cursors);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Throttled cursor update function
  const updateCursorPosition = useCallback(
    throttle(async (x: number, y: number) => {
      if (!currentUser) return;

      try {
        const cursorRef = doc(db, 'canvases', CANVAS_ID, 'cursors', currentUser.uid);
        await setDoc(cursorRef, {
          userId: currentUser.uid,
          name: currentUser.displayName,
          color: currentUser.cursorColor,
          x,
          y,
          lastUpdated: Date.now()
        });
      } catch (error) {
        console.error('Error updating cursor:', error);
      }
    }, 50), // Update every 50ms
    [currentUser]
  );

  // Clean up cursor on unmount
  useEffect(() => {
    return () => {
      if (currentUser) {
        const cursorRef = doc(db, 'canvases', CANVAS_ID, 'cursors', currentUser.uid);
        deleteDoc(cursorRef).catch(console.error);
      }
    };
  }, [currentUser]);

  return { remoteCursors, updateCursorPosition };
};