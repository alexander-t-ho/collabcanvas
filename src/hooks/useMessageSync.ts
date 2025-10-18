import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ChatMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../contexts/UserProfileContext';

const CANVAS_ID = 'default'; // Match other components
const MESSAGE_LIMIT = 100;

export const useMessageSync = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { userProfile } = useUserProfile();

  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, 'canvases', CANVAS_ID, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('timestamp', 'asc'),
      limit(MESSAGE_LIMIT)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: ChatMessage[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userColor: data.userColor,
          message: data.message,
          timestamp: data.timestamp?.toMillis() || Date.now(),
          isAI: data.isAI || false
        });
      });
      
      setMessages(newMessages);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const sendMessage = async (message: string, isAI: boolean = false) => {
    if (!currentUser || !userProfile || !message.trim()) {
      console.log('Cannot send - missing data:', { 
        hasUser: !!currentUser, 
        hasProfile: !!userProfile, 
        hasMessage: !!message.trim() 
      });
      return;
    }

    try {
      console.log('Adding message to Firestore:', {
        userId: currentUser.uid,
        userName: userProfile.displayName || currentUser.email,
        message: message.trim()
      });
      
      const messagesRef = collection(db, 'canvases', CANVAS_ID, 'messages');
      const docRef = await addDoc(messagesRef, {
        userId: currentUser.uid,
        userName: userProfile.displayName || currentUser.email || 'Anonymous',
        userColor: userProfile.cursorColor || '#3b82f6',
        message: message.trim(),
        timestamp: Timestamp.now(),
        isAI
      });
      
      console.log('Message added with ID:', docRef.id);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    sendMessage
  };
};

