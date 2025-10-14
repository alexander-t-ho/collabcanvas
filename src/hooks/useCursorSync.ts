import { useEffect, useCallback, useState, useRef } from 'react';
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

const CANVAS_ID = 'default';

export const useCursorSync = () => {
  const { currentUser } = useAuth();
  const [remoteCursors, setRemoteCursors] = useState<CursorPosition[]>([]);
  const lastUpdateRef = useRef<number>(0);

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
  const updateCursorPosition = useCallback(async (x: number, y: number) => {
    if (!currentUser) return;

    // Throttle updates to 50ms
    const now = Date.now();
    if (now - lastUpdateRef.current < 50) return;
    lastUpdateRef.current = now;

    try {
      const cursorRef = doc(db, 'canvases', CANVAS_ID, 'cursors', currentUser.uid);
      await setDoc(cursorRef, {
        userId: currentUser.uid,
        name: currentUser.displayName,
        color: currentUser.cursorColor,
        x,
        y,
        lastUpdated: now
      });
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }, [currentUser]);

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