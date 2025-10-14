import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { PresenceData } from '../types';

const CANVAS_ID = 'default';

export const usePresence = () => {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    console.log('Setting presence for user:', currentUser); // DEBUG

    const presenceRef = ref(rtdb, `presence/${CANVAS_ID}/${currentUser.uid}`);
    const allPresenceRef = ref(rtdb, `presence/${CANVAS_ID}`);

    // Set user as online
    const userData = {
      userId: currentUser.uid,
      name: currentUser.displayName,
      color: currentUser.cursorColor || '#3b82f6', // Fallback color
      online: true,
      lastSeen: serverTimestamp()
    };
    
    console.log('Setting presence data:', userData); // DEBUG
    set(presenceRef, userData);

    // Remove presence on disconnect
    onDisconnect(presenceRef).remove();

    // Listen to all presence updates
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      const users: PresenceData[] = [];
      
      console.log('Presence snapshot:', snapshot.val()); // DEBUG
      
      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val() as PresenceData;
        if (user.online) {
          users.push(user);
        }
      });

      console.log('Online users:', users); // DEBUG
      setOnlineUsers(users);
    });

    return () => {
      unsubscribe();
      set(presenceRef, {
        userId: currentUser.uid,
        name: currentUser.displayName,
        color: currentUser.cursorColor || '#3b82f6',
        online: false,
        lastSeen: serverTimestamp()
      });
    };
  }, [currentUser]);

  return { onlineUsers };
};