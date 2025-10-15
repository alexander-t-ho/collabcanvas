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
      console.log('🔥 PRESENCE: No current user, skipping presence setup');
      setOnlineUsers([]);
      return;
    }

    console.log('🔥 PRESENCE: Setting up for user:', currentUser);

    // Use the original simpler path structure
    const presenceRef = ref(rtdb, `presence/default/${currentUser.uid}`);
    const allPresenceRef = ref(rtdb, 'presence/default');

    // Set user as online with comprehensive data
    const userData = {
      userId: currentUser.uid,
      name: currentUser.displayName || 'Anonymous',
      color: currentUser.cursorColor || '#3b82f6',
      online: true,
      lastSeen: Date.now(),
      email: currentUser.email || '',
      timestamp: Date.now()
    };
    
    console.log('🔥 PRESENCE: Setting user online with data:', userData);
    
    // Set presence immediately
    set(presenceRef, userData)
      .then(() => {
        console.log('✅ PRESENCE: User set online successfully');
        
        // Force an immediate read to verify it worked
        onValue(presenceRef, (snapshot) => {
          console.log('🔥 PRESENCE: Verification read:', snapshot.exists(), snapshot.val());
        }, { onlyOnce: true });
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

    // Listen to all presence updates with simpler processing
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      console.log('🔥 PRESENCE: Raw presence snapshot received');
      console.log('🔥 PRESENCE: Snapshot exists:', snapshot.exists());
      console.log('🔥 PRESENCE: Snapshot value:', snapshot.val());
      
      if (!snapshot.exists()) {
        console.log('⚠️ PRESENCE: No presence data found');
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
      
      console.log('🔥 PRESENCE: Processing presence data with keys:', Object.keys(data));
      
      // Process each user in the presence data
      Object.keys(data).forEach((userId) => {
        const user = data[userId];
        console.log(`🔥 PRESENCE: Processing user ${userId}:`, user);
        
        if (user && user.online === true) {
          const processedUser: PresenceData = {
            userId: user.userId || userId,
            name: user.name || 'Anonymous',
            color: user.color || '#3b82f6',
            online: true,
            lastSeen: user.lastSeen || Date.now()
          };
          users.push(processedUser);
          console.log(`✅ PRESENCE: Added online user:`, processedUser);
        } else {
          console.log(`⚠️ PRESENCE: Skipping user ${userId} - not online or invalid data. Online status:`, user?.online);
        }
      });

      console.log('🔥 PRESENCE: Final online users array:', users);
      console.log('🔥 PRESENCE: Total online users COUNT:', users.length);
      setOnlineUsers(users);
      
      // Extra verification log
      console.log('🔥 PRESENCE: State should now show', users.length, 'users');
    }, (error) => {
      console.error('❌ PRESENCE: Error listening to presence:', error);
      console.log('❌ PRESENCE: Keeping existing users due to error');
    });

    return () => {
      console.log('🔥 PRESENCE: Cleaning up for user:', currentUser.uid);
      unsubscribe();
      
      // Set user as offline
      set(presenceRef, {
        ...userData,
        online: false,
        lastSeen: Date.now()
      }).then(() => {
        console.log('✅ PRESENCE: User set offline successfully');
      }).catch((error) => {
        console.error('❌ PRESENCE: Error setting user offline:', error);
      });
    };
  }, [currentUser]);

  // Add extra logging when onlineUsers changes
  useEffect(() => {
    console.log('🔥 PRESENCE: onlineUsers state changed to:', onlineUsers.length, 'users');
    console.log('🔥 PRESENCE: Full users array:', onlineUsers);
  }, [onlineUsers]);

  return { onlineUsers };
};