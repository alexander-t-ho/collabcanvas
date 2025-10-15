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
      setOnlineUsers([]);
      return;
    }

    console.log('🔥 PRESENCE: Setting up for user:', currentUser);

    const presenceRef = ref(rtdb, `presence/${CANVAS_ID}/${currentUser.uid}`);
    const allPresenceRef = ref(rtdb, `presence/${CANVAS_ID}`);

    // Set user as online with error handling
    const userData = {
      userId: currentUser.uid,
      name: currentUser.displayName || 'Anonymous',
      color: currentUser.cursorColor || '#3b82f6',
      online: true,
      lastSeen: Date.now(),
      timestamp: Date.now() // Add timestamp for debugging
    };
    
    console.log('🔥 PRESENCE: Setting user online:', userData);
    
    // Set presence immediately and handle errors
    set(presenceRef, userData)
      .then(() => {
        console.log('✅ PRESENCE: User set online successfully');
      })
      .catch((error) => {
        console.error('❌ PRESENCE: Error setting user online:', error);
      });

    // Remove presence on disconnect
    onDisconnect(presenceRef).remove().then(() => {
      console.log('✅ PRESENCE: onDisconnect handler set');
    }).catch((error) => {
      console.error('❌ PRESENCE: Error setting onDisconnect:', error);
    });

    // Listen to all presence updates with enhanced logging
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      console.log('🔥 PRESENCE: Raw snapshot received');
      console.log('🔥 PRESENCE: Snapshot exists:', snapshot.exists());
      console.log('🔥 PRESENCE: Snapshot value:', snapshot.val());
      
      if (!snapshot.exists()) {
        console.log('⚠️ PRESENCE: No presence data found, setting empty array');
        setOnlineUsers([]);
        return;
      }
      
      const users: PresenceData[] = [];
      const data = snapshot.val();
      
      if (!data) {
        console.log('⚠️ PRESENCE: Data is null/undefined');
        setOnlineUsers([]);
        return;
      }
      
      console.log('🔥 PRESENCE: Processing presence data:', data);
      
      Object.keys(data).forEach((userId) => {
        const user = data[userId] as PresenceData;
        console.log(`🔥 PRESENCE: Processing user ${userId}:`, user);
        
        if (user && user.online) {
          const processedUser = {
            userId: user.userId || userId,
            name: user.name || 'Anonymous',
            color: user.color || '#3b82f6',
            online: true,
            lastSeen: user.lastSeen || Date.now()
          };
          users.push(processedUser);
          console.log(`✅ PRESENCE: Added online user:`, processedUser);
        } else {
          console.log(`⚠️ PRESENCE: Skipping user ${userId} - not online or invalid data`);
        }
      });

      console.log('🔥 PRESENCE: Final online users array:', users);
      console.log('🔥 PRESENCE: Total online users:', users.length);
      setOnlineUsers(users);
    }, (error) => {
      console.error('❌ PRESENCE: Error listening to presence:', error);
      // Set empty array on error to avoid showing stale data
      setOnlineUsers([]);
    });

    return () => {
      console.log('🔥 PRESENCE: Cleaning up for user:', currentUser.uid);
      unsubscribe();
      
      // Set user as offline
      set(presenceRef, {
        userId: currentUser.uid,
        name: currentUser.displayName || 'Anonymous',
        color: currentUser.cursorColor || '#3b82f6',
        online: false,
        lastSeen: Date.now()
      }).then(() => {
        console.log('✅ PRESENCE: User set offline successfully');
      }).catch((error) => {
        console.error('❌ PRESENCE: Error setting user offline:', error);
      });
    };
  }, [currentUser]);

  return { onlineUsers };
};