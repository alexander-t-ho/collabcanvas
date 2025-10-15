import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { PresenceData } from '../types';

const CANVAS_ID = 'default';

export const usePresence = () => {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      console.log('🔥 PRESENCE: No current user, skipping presence setup');
      setOnlineUsers([]);
      return;
    }

    console.log('🔥 PRESENCE: ============ STARTING PRESENCE SETUP ============');
    console.log('🔥 PRESENCE: Current user:', currentUser);
    console.log('🔥 PRESENCE: Database URL:', rtdb.app.options.databaseURL);

    // Use the simpler path structure
    const presenceRef = ref(rtdb, `presence/${CANVAS_ID}/${currentUser.uid}`);
    const allPresenceRef = ref(rtdb, `presence/${CANVAS_ID}`);

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
    
    console.log('🔥 PRESENCE: Attempting to set user online with data:', userData);
    
    // Set presence immediately with comprehensive error handling
    set(presenceRef, userData)
      .then(() => {
        console.log('✅ PRESENCE: ========== USER SET ONLINE SUCCESSFULLY ==========');
        setError(null);
        
        // Force an immediate read to verify it worked
        onValue(presenceRef, (snapshot) => {
          console.log('🔥 PRESENCE: Verification read - exists:', snapshot.exists());
          console.log('🔥 PRESENCE: Verification read - data:', snapshot.val());
          
          if (!snapshot.exists()) {
            console.error('❌ PRESENCE: WARNING - User was set but verification read shows no data!');
            setError('Verification failed - data not persisted');
          }
        }, { onlyOnce: true });
      })
      .catch((error: any) => {
        console.error('❌ PRESENCE: ========== CRITICAL ERROR SETTING USER ONLINE ==========');
        console.error('❌ PRESENCE: Error object:', error);
        console.error('❌ PRESENCE: Error message:', error?.message);
        console.error('❌ PRESENCE: Error code:', error?.code);
        setError(`Failed to set presence: ${error?.message || 'Unknown error'}`);
      });

    // Remove presence on disconnect
    onDisconnect(presenceRef).remove().then(() => {
      console.log('✅ PRESENCE: onDisconnect handler set successfully');
    }).catch((error: any) => {
      console.error('❌ PRESENCE: Error setting onDisconnect:', error);
      setError(`Failed to set disconnect handler: ${error?.message}`);
    });

    // Listen to all presence updates
    let listenerActive = false;
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      if (!listenerActive) {
        console.log('🔥 PRESENCE: ========== LISTENER ACTIVATED ==========');
        listenerActive = true;
      }
      
      console.log('🔥 PRESENCE: ========== NEW SNAPSHOT RECEIVED ==========');
      console.log('🔥 PRESENCE: Snapshot exists:', snapshot.exists());
      console.log('🔥 PRESENCE: Snapshot value:', JSON.stringify(snapshot.val(), null, 2));
      
      if (!snapshot.exists()) {
        console.log('⚠️ PRESENCE: No presence data found - this might be the first user');
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
      
      const userIds = Object.keys(data);
      console.log('🔥 PRESENCE: Found user IDs:', userIds);
      console.log('🔥 PRESENCE: Total users in database:', userIds.length);
      
      // Process each user in the presence data
      userIds.forEach((userId) => {
        const user = data[userId];
        console.log(`🔥 PRESENCE: -------- Processing user ${userId} --------`);
        console.log(`🔥 PRESENCE: User data:`, user);
        console.log(`🔥 PRESENCE: User online status:`, user?.online);
        console.log(`🔥 PRESENCE: User online type:`, typeof user?.online);
        
        if (user && user.online === true) {
          const processedUser: PresenceData = {
            userId: user.userId || userId,
            name: user.name || 'Anonymous',
            color: user.color || '#3b82f6',
            online: true,
            lastSeen: user.lastSeen || Date.now()
          };
          users.push(processedUser);
          console.log(`✅ PRESENCE: Added user to online list:`, processedUser);
        } else {
          console.log(`⚠️ PRESENCE: Skipping user ${userId} - online=${user?.online}`);
        }
      });

      console.log('🔥 PRESENCE: ========== FINAL RESULTS ==========');
      console.log('🔥 PRESENCE: Total online users COUNT:', users.length);
      console.log('🔥 PRESENCE: Full users array:', JSON.stringify(users, null, 2));
      console.log('🔥 PRESENCE: Setting state with', users.length, 'users');
      console.log('🔥 PRESENCE: ======================================');
      
      setOnlineUsers(users);
      setError(null);
    }, (error: any) => {
      console.error('❌ PRESENCE: ========== ERROR IN LISTENER ==========');
      console.error('❌ PRESENCE: Listener error:', error);
      console.error('❌ PRESENCE: Error message:', error?.message);
      console.error('❌ PRESENCE: Error code:', error?.code);
      setError(`Listener error: ${error?.message || 'Unknown error'}`);
    });

    return () => {
      console.log('🔥 PRESENCE: ========== CLEANING UP ==========');
      console.log('🔥 PRESENCE: Cleaning up for user:', currentUser.uid);
      unsubscribe();
      
      // Set user as offline
      set(presenceRef, {
        ...userData,
        online: false,
        lastSeen: Date.now()
      }).then(() => {
        console.log('✅ PRESENCE: User set offline successfully');
      }).catch((error: any) => {
        console.error('❌ PRESENCE: Error setting user offline:', error);
      });
    };
  }, [currentUser]);

  // Add extra logging when onlineUsers changes
  useEffect(() => {
    console.log('🔥 PRESENCE: ========== STATE CHANGED ==========');
    console.log('🔥 PRESENCE: onlineUsers state updated to:', onlineUsers.length, 'users');
    console.log('🔥 PRESENCE: Full state:', onlineUsers);
    console.log('🔥 PRESENCE: Error state:', error);
    console.log('🔥 PRESENCE: =====================================');
  }, [onlineUsers, error]);

  return { onlineUsers, error };
};