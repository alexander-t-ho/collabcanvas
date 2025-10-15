import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { PresenceData } from '../types';

const CANVAS_ID = 'default';

export const usePresence = () => {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);

  console.log('PRESENCE HOOK: Called. currentUser:', currentUser?.displayName || 'none');
  console.log('PRESENCE HOOK: onlineUsers state:', onlineUsers.length);

  useEffect(() => {
    console.log('PRESENCE EFFECT: Running. currentUser:', currentUser?.displayName || 'none');
    
    if (!currentUser) {
      console.log('PRESENCE: No current user');
      setOnlineUsers([]);
      return;
    }

    console.log('PRESENCE: Setting up for user:', currentUser.displayName);

    const presenceRef = ref(rtdb, `presence/default/${currentUser.uid}`);
    const allPresenceRef = ref(rtdb, 'presence/default');

    const userData = {
      userId: currentUser.uid,
      name: currentUser.displayName || 'Anonymous',
      color: currentUser.cursorColor || '#3b82f6',
      online: true,
      lastSeen: Date.now()
    };
    
    console.log('PRESENCE: Setting user online:', userData);
    
    // Set user online
    set(presenceRef, userData)
      .then(() => console.log('PRESENCE: User set online SUCCESS'))
      .catch(err => console.error('PRESENCE: Set online FAILED:', err));
      
    onDisconnect(presenceRef).remove()
      .then(() => console.log('PRESENCE: onDisconnect set'))
      .catch(err => console.error('PRESENCE: onDisconnect FAILED:', err));

    // Listen to all users
    console.log('PRESENCE: Setting up listener on presence/default');
    
    // First, try a one-time read to test if Firebase is working
    onValue(allPresenceRef, (snapshot) => {
      console.log('PRESENCE: ONE-TIME READ - exists:', snapshot.exists());
      console.log('PRESENCE: ONE-TIME READ - data:', snapshot.val());
    }, { onlyOnce: true });
    
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      console.log('========== PRESENCE LISTENER FIRED ==========');
      console.log('PRESENCE: Snapshot exists:', snapshot.exists());
      
      if (!snapshot.exists()) {
        console.log('PRESENCE: No data in snapshot');
        setOnlineUsers([]);
        return;
      }
      
      const users: PresenceData[] = [];
      const data = snapshot.val();
      
      const keys = Object.keys(data || {});
      console.log('PRESENCE: Total keys:', keys.length);
      console.log('PRESENCE: Keys:', keys);
      
      keys.forEach((userId) => {
        const user = data[userId];
        console.log(`PRESENCE: User ${userId}:`, user);
        
        if (user && user.online === true) {
          const processedUser: PresenceData = {
            userId: user.userId || userId,
            name: user.name || 'Anonymous',
            color: user.color || '#3b82f6',
            online: true,
            lastSeen: user.lastSeen || Date.now()
          };
          users.push(processedUser);
          console.log('PRESENCE: Added user:', processedUser.name);
        } else {
          console.log(`PRESENCE: Skipped user ${userId} - online:`, user?.online);
        }
      });

      console.log('PRESENCE: Final count:', users.length, 'users');
      console.log('PRESENCE: Setting state with users:', users);
      setOnlineUsers(users);
      console.log('========== PRESENCE UPDATE COMPLETE ==========');
    }, (error) => {
      console.error('PRESENCE LISTENER ERROR:', error);
    });

    return () => {
      console.log('PRESENCE: Cleanup');
      unsubscribe();
      set(presenceRef, { ...userData, online: false }).catch(console.error);
    };
  }, [currentUser]);

  console.log('PRESENCE HOOK: Returning onlineUsers.length:', onlineUsers.length);

  return { onlineUsers };
};