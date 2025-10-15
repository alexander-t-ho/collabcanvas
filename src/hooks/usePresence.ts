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
    if (!currentUser) {
      console.log('No current user, skipping presence setup');
      return;
    }

    console.log('Setting presence for user:', currentUser);

    const presenceRef = ref(rtdb, `presence/${CANVAS_ID}/${currentUser.uid}`);
    const allPresenceRef = ref(rtdb, `presence/${CANVAS_ID}`);

    // Set user as online with error handling
    const userData = {
      userId: currentUser.uid,
      name: currentUser.displayName || 'Anonymous',
      color: currentUser.cursorColor || '#3b82f6',
      online: true,
      lastSeen: Date.now() // Use regular timestamp instead of serverTimestamp for debugging
    };
    
    console.log('Setting presence data:', userData);
    
    set(presenceRef, userData).then(() => {
      console.log('Presence set successfully');
    }).catch((error) => {
      console.error('Error setting presence:', error);
    });

    // Remove presence on disconnect
    onDisconnect(presenceRef).remove().catch((error) => {
      console.error('Error setting onDisconnect:', error);
    });

    // Listen to all presence updates
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      console.log('Raw presence snapshot:', snapshot.exists(), snapshot.val());
      
      if (!snapshot.exists()) {
        console.log('No presence data found');
        setOnlineUsers([]);
        return;
      }
      
      const users: PresenceData[] = [];
      const data = snapshot.val();
      
      Object.keys(data || {}).forEach((userId) => {
        const user = data[userId] as PresenceData;
        console.log('Processing user:', userId, user);
        
        if (user && user.online) {
          users.push({
            userId: user.userId || userId,
            name: user.name || 'Anonymous',
            color: user.color || '#3b82f6',
            online: true,
            lastSeen: user.lastSeen || Date.now()
          });
        }
      });

      console.log('Final online users array:', users);
      setOnlineUsers(users);
    }, (error) => {
      console.error('Error listening to presence:', error);
    });

    return () => {
      console.log('Cleaning up presence for user:', currentUser.uid);
      unsubscribe();
      
      // Set user as offline
      set(presenceRef, {
        userId: currentUser.uid,
        name: currentUser.displayName || 'Anonymous',
        color: currentUser.cursorColor || '#3b82f6',
        online: false,
        lastSeen: Date.now()
      }).catch((error) => {
        console.error('Error setting offline status:', error);
      });
    };
  }, [currentUser]);

  return { onlineUsers };
};