import React, { useState, useEffect, useRef } from 'react';
import { useMessageSync } from '../../hooks/useMessageSync';
import { callOpenAI, executeAIAction } from '../../services/aiService';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';

const ChatWindow: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, loading, sendMessage } = useMessageSync();
  const { objects, addObject, updateObject, deleteObject } = useCanvas();
  const { currentUser } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;

    const messageText = inputValue.trim();
    setInputValue('');

    if (isAIMode) {
      // AI Mode: Send to AI and execute commands
      setIsLoading(true);
      try {
        // Send user message to chat
        await sendMessage(`🤖 AI: ${messageText}`, false);
        
        const aiResponse = await callOpenAI(messageText, objects);
        
        if (aiResponse.success && aiResponse.actions.length > 0) {
          // Execute each AI action
          for (const action of aiResponse.actions) {
            await executeAIAction(
              action.type,
              action.data,
              objects,
              addObject,
              updateObject,
              deleteObject
            );
          }
          
          // Send AI response to chat
          await sendMessage(`✅ AI: ${aiResponse.message}`, true);
        } else {
          // Send AI response (no actions)
          await sendMessage(`🤖 AI: ${aiResponse.message}`, true);
        }
      } catch (error) {
        console.error('AI Error:', error);
        await sendMessage('❌ AI: Sorry, I encountered an error processing that request.', true);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Normal chat mode
      try {
        await sendMessage(messageText, false);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          zIndex: 999
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        }}
        title="Open Chat"
      >
        💬
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '380px',
        height: '500px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 999,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '16px 20px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {isAIMode ? '🤖 AI Assistant' : '💬 Team Chat'}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
            {isAIMode ? 'AI is ready to help' : `${messages.length} messages`}
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 20px' }}>
            <p style={{ margin: 0, fontSize: '24px', marginBottom: '8px' }}>💬</p>
            <p style={{ margin: 0, fontSize: '14px' }}>No messages yet</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
              Start a conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.userId === currentUser?.uid;
            const isAI = msg.isAI;
            
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isCurrentUser ? 'flex-end' : 'flex-start'
                }}
              >
                {/* User name and time */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}
                >
                  {!isCurrentUser && (
                    <>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isAI ? '#8b5cf6' : msg.userColor
                        }}
                      />
                      <span style={{ fontWeight: '500' }}>{msg.userName}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatTimestamp(msg.timestamp)}</span>
                </div>
                
                {/* Message bubble */}
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: isCurrentUser 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : isAI
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                      : 'white',
                    color: isCurrentUser || isAI ? 'white' : '#1f2937',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    wordWrap: 'break-word',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        
        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b7280',
              fontSize: '14px',
              padding: '8px'
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e5e7eb',
                borderTopColor: '#8b5cf6',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            AI is thinking...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* AI Mode Toggle */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          background: 'white',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <button
          onClick={() => setIsAIMode(!isAIMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: isAIMode 
              ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
              : '#f3f4f6',
            color: isAIMode ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: isAIMode ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: '16px' }}>🤖</span>
          {isAIMode ? 'AI Mode Active' : 'Enable AI Mode'}
        </button>
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          background: 'white',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isAIMode ? "Ask AI to create shapes..." : "Type a message..."}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              background: isLoading ? '#f9fafb' : 'white'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '12px 20px',
              background: isAIMode
                ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: (!inputValue.trim() || isLoading) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: (!inputValue.trim() || isLoading) ? 0.5 : 1,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
        
        {isAIMode && (
          <p
            style={{
              margin: '8px 0 0 0',
              fontSize: '11px',
              color: '#9ca3af',
              textAlign: 'center'
            }}
          >
            💡 Try: "Create a blue rectangle" or "Add a text that says Hello"
          </p>
        )}
      </div>

      {/* CSS Animation for loading spinner */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ChatWindow;

