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
import { usePresence } from './usePresence';
import { CursorPosition } from '../types';

const CANVAS_ID = 'default';

export const useCursorSync = () => {
  const { currentUser } = useAuth();
  const { onlineUsers } = usePresence();
  const [remoteCursors, setRemoteCursors] = useState<CursorPosition[]>([]);
  const lastUpdateRef = useRef<number>(0);

  // Listen to cursor updates from other users
  useEffect(() => {
    if (!currentUser) {
      setRemoteCursors([]);
      return;
    }

    const cursorsRef = collection(db, 'canvases', CANVAS_ID, 'cursors');
    const unsubscribe = onSnapshot(cursorsRef, (snapshot) => {
      const cursors: CursorPosition[] = [];
      const onlineUserIds = onlineUsers.map(u => u.userId);
      
      snapshot.forEach((docSnapshot) => {
        const cursor = docSnapshot.data() as CursorPosition;
        // Only show cursor if user is online and not self
        if (cursor.userId !== currentUser.uid && onlineUserIds.includes(cursor.userId)) {
          cursors.push(cursor);
        } else if (!onlineUserIds.includes(cursor.userId) && cursor.userId !== currentUser.uid) {
          // Clean up stale cursors (but not during the snapshot listener to avoid errors)
          // Schedule deletion after snapshot processing
          setTimeout(() => {
            deleteDoc(docSnapshot.ref).catch((err) => {
              // Ignore errors for already-deleted cursors
              if (!err.message?.includes('NOT_FOUND')) {
                console.error('Error cleaning up cursor:', err);
              }
            });
          }, 100);
        }
      });

      setRemoteCursors(cursors);
    }, (error) => {
      // Handle snapshot errors gracefully
      console.error('Cursor sync error:', error);
    });

    return () => unsubscribe();
  }, [currentUser, onlineUsers]);

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