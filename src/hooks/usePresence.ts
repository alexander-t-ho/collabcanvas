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

    // Use a simpler path structure that's less likely to have permission issues
    const presenceRef = ref(rtdb, `users/${currentUser.uid}/presence`);
    const allUsersRef = ref(rtdb, 'users');

    // Set user as online with error handling
    const userData = {
      uid: currentUser.uid,
      displayName: currentUser.displayName || 'Anonymous',
      email: currentUser.email || '',
      cursorColor: currentUser.cursorColor || '#3b82f6',
      online: true,
      lastSeen: Date.now(),
      timestamp: Date.now()
    };
    
    console.log('🔥 PRESENCE: Setting user online:', userData);
    
    // Set presence immediately and handle errors
    set(presenceRef, userData)
      .then(() => {
        console.log('✅ PRESENCE: User set online successfully');
      })
      .catch((error) => {
        console.error('❌ PRESENCE: Error setting user online:', error);
        console.error('❌ PRESENCE: Error details:', (error as any).code, (error as any).message);
      });

    // Remove presence on disconnect
    onDisconnect(presenceRef).remove().then(() => {
      console.log('✅ PRESENCE: onDisconnect handler set');
    }).catch((error) => {
      console.error('❌ PRESENCE: Error setting onDisconnect:', error);
    });

    // Listen to all users and filter for online ones
    const unsubscribe = onValue(allUsersRef, (snapshot) => {
      console.log('🔥 PRESENCE: Raw users snapshot received');
      console.log('🔥 PRESENCE: Snapshot exists:', snapshot.exists());
      
      if (!snapshot.exists()) {
        console.log('⚠️ PRESENCE: No users data found');
        setOnlineUsers([]);
        return;
      }
      
      const users: PresenceData[] = [];
      const allUsersData = snapshot.val();
      
      if (!allUsersData) {
        console.log('⚠️ PRESENCE: Users data is null/undefined');
        setOnlineUsers([]);
        return;
      }
      
      console.log('🔥 PRESENCE: Processing users data:', Object.keys(allUsersData).length, 'users found');
      
      Object.keys(allUsersData).forEach((userId) => {
        const userData = allUsersData[userId];
        const presence = userData?.presence;
        
        console.log(`🔥 PRESENCE: Processing user ${userId}:`, presence);
        
        if (presence && presence.online) {
          const processedUser: PresenceData = {
            userId: presence.uid || userId,
            name: presence.displayName || 'Anonymous',
            color: presence.cursorColor || '#3b82f6',
            online: true,
            lastSeen: presence.lastSeen || Date.now()
          };
          users.push(processedUser);
          console.log(`✅ PRESENCE: Added online user:`, processedUser);
        } else {
          console.log(`⚠️ PRESENCE: Skipping user ${userId} - not online or no presence data`);
        }
      });

      console.log('🔥 PRESENCE: Final online users array:', users);
      console.log('🔥 PRESENCE: Total online users:', users.length);
      setOnlineUsers(users);
    }, (error) => {
      console.error('❌ PRESENCE: Error listening to users:', error);
      console.error('❌ PRESENCE: Error details:', (error as any).code, (error as any).message);
      
      // Don't set empty array on error - keep existing users to avoid flickering
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

  return { onlineUsers };
};