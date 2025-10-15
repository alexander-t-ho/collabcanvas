import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { PresenceData } from '../types';

const CANVAS_ID = 'default';

export const usePresence = () => {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setOnlineUsers([]);
      return;
    }

    const presenceRef = ref(rtdb, `presence/default/${currentUser.uid}`);
    const allPresenceRef = ref(rtdb, 'presence/default');

    const userData = {
      userId: currentUser.uid,
      name: currentUser.displayName || 'Anonymous',
      color: currentUser.cursorColor || '#3b82f6',
      online: true,
      lastSeen: Date.now()
    };
    
    // Set user online
    set(presenceRef, userData).catch(console.error);
    onDisconnect(presenceRef).remove().catch(console.error);

    // Listen to all users
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      console.log('PRESENCE: Snapshot exists:', snapshot.exists());
      
      if (!snapshot.exists()) {
        setOnlineUsers([]);
        return;
      }
      
      const users: PresenceData[] = [];
      const data = snapshot.val();
      
      console.log('PRESENCE: Raw data keys:', Object.keys(data || {}));
      console.log('PRESENCE: Total keys:', Object.keys(data || {}).length);
      
      Object.keys(data || {}).forEach((userId) => {
        const user = data[userId];
        console.log('PRESENCE: User', userId, 'online:', user?.online, 'data:', user);
        
        if (user && user.online === true) {
          users.push({
            userId: user.userId || userId,
            name: user.name || 'Anonymous',
            color: user.color || '#3b82f6',
            online: true,
            lastSeen: user.lastSeen || Date.now()
          });
        }
      });

      console.log('PRESENCE: Final count:', users.length, 'users');
      setOnlineUsers(users);
    });

    return () => {
      unsubscribe();
      set(presenceRef, { ...userData, online: false }).catch(console.error);
    };
  }, [currentUser]);

  return { onlineUsers };
};