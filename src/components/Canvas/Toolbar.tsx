import React, { useState, useMemo, useEffect } from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { usePresence } from '../../hooks/usePresence';
import UserProfileDropdown from './UserProfileDropdown';
import UserInfoDropdown from './UserInfoDropdown';
import { PresenceData } from '../../types';

const Toolbar: React.FC = () => {
  const { addObject, drawingMode, setDrawingMode, selectedIds, createGroup, saveCanvas, undo, redo, canUndo, canRedo } = useCanvas();
  const { currentUser, logout } = useAuth();
  const { userProfile } = useUserProfile();
  const { onlineUsers } = usePresence();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState<PresenceData | null>(null);
  const [, forceUpdate] = useState({});

  // Force component to re-render when onlineUsers changes
  useEffect(() => {
    forceUpdate({});
  }, [onlineUsers]);

  // Memoize the count to ensure it updates
  const totalOnlineCount = useMemo(() => onlineUsers.length, [onlineUsers]);

  // Filter out current user - only show others
  const otherUsers = useMemo(() => {
    return onlineUsers.filter(user => user.userId !== currentUser?.uid);
  }, [onlineUsers, currentUser]);

  // DEBUG: Log what we're actually seeing
  console.log('TOOLBAR: onlineUsers array:', onlineUsers);
  console.log('TOOLBAR: onlineUsers.length:', onlineUsers.length);
  console.log('TOOLBAR: totalOnlineCount:', totalOnlineCount);
  console.log('TOOLBAR: otherUsers.length:', otherUsers.length);

  const handleCreateRectangle = () => {
    if (!currentUser) return;
    
    addObject({
      type: 'rectangle',
      x: Math.random() * 500 + 100,
      y: Math.random() * 500 + 100,
      width: 100,
      height: 100,
      fill: '#' + Math.floor(Math.random()*16777215).toString(16),
      cornerRadius: 0,
      nickname: '',
      zIndex: 0,
      shadow: false,
      createdBy: currentUser.uid,
    });
  };

  const handleCreateCircle = () => {
    if (!currentUser) return;
    
    addObject({
      type: 'circle',
      x: Math.random() * 500 + 150, // Center position for circle
      y: Math.random() * 500 + 150,
      width: 100, // We'll use width as diameter for circles
      height: 100,
      fill: '#' + Math.floor(Math.random()*16777215).toString(16),
      nickname: '',
      zIndex: 0,
      shadow: false,
      createdBy: currentUser.uid,
    });
  };

  const handleCreateLine = () => {
    setDrawingMode('line');
  };

  const handleCreateText = () => {
    if (!currentUser) return;
    
    addObject({
      type: 'text',
      x: Math.random() * 500 + 100,
      y: Math.random() * 500 + 100,
      width: 200,
      height: 50,
      fill: '#000000',
      text: 'Double-click to edit',
      fontSize: 24,
      fontFamily: 'Arial',
      fontStyle: 'normal',
      textAlign: 'left',
      nickname: '',
      zIndex: 0,
      shadow: false,
      createdBy: currentUser.uid,
    });
  };

  const handleImport = () => {
    // This will be handled by the parent component
    const event = new CustomEvent('openImageImport');
    window.dispatchEvent(event);
  };

  // Enhanced OnlineStatus component with user count
  const EnhancedOnlineStatus: React.FC = () => {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginRight: '12px',
        position: 'relative'
      }}>
        {/* Other users circles */}
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '-4px' }}>
          {otherUsers.slice(0, 3).map((user, index) => (
            <div
              key={user.userId}
              onClick={(e) => {
                e.stopPropagation();
                setShowUserInfo(showUserInfo?.userId === user.userId ? null : user);
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: user.color,
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                cursor: 'pointer',
                position: 'relative',
                marginLeft: index > 0 ? '-8px' : '0',
                zIndex: 10 - index,
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`${user.name} - Click for info`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        
        {/* Online count */}
        <span style={{
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {totalOnlineCount} online
        </span>
        
        {/* User Info Dropdown */}
        {showUserInfo && (
          <UserInfoDropdown 
            user={showUserInfo} 
            onClose={() => setShowUserInfo(null)} 
          />
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      zIndex: 1000,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Left side - Branding and tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1f2937',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          CollabCanvas
        </h1>
        
        <div style={{
          width: '1px',
          height: '24px',
          backgroundColor: '#e5e7eb'
        }} />

        <button
          onClick={handleCreateRectangle}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            whiteSpace: 'nowrap'
          }}
          title="Add Rectangle"
        >
          Add Rectangle
        </button>

        <button
          onClick={handleCreateCircle}
          style={{
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            whiteSpace: 'nowrap'
          }}
          title="Add Circle"
        >
          Add Circle
        </button>

        <button
          onClick={handleCreateLine}
          style={{
            padding: '8px 16px',
            background: drawingMode === 'line' ? '#dc2626' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            whiteSpace: 'nowrap'
          }}
          title={drawingMode === 'line' ? 'Drawing Line...' : 'Draw Line'}
        >
          {drawingMode === 'line' ? 'Drawing...' : 'Draw Line'}
        </button>

        <button
          onClick={handleCreateText}
          style={{
            padding: '8px 16px',
            background: '#06b6d4',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0891b2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#06b6d4';
          }}
        >
          Add Text
        </button>

        <button
          onClick={handleImport}
          style={{
            padding: '8px 16px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          Import Image
        </button>

        <button
          onClick={saveCanvas}
          style={{
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#059669';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#10b981';
          }}
          title="Save canvas as JSON file"
        >
          💾 Save
        </button>

        <button
          onClick={() => {
            console.log('UNDO BUTTON CLICKED! canUndo:', canUndo);
            undo();
          }}
          style={{
            padding: '8px 16px',
            background: canUndo ? '#f59e0b' : '#d1d5db',
            color: canUndo ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '6px',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            fontWeight: '500',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'background 0.2s ease',
            opacity: canUndo ? 1 : 0.6,
            pointerEvents: canUndo ? 'auto' : 'none'
          }}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>

        <button
          onClick={() => {
            console.log('REDO BUTTON CLICKED! canRedo:', canRedo);
            redo();
          }}
          style={{
            padding: '8px 16px',
            background: canRedo ? '#f59e0b' : '#d1d5db',
            color: canRedo ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '6px',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            fontWeight: '500',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'background 0.2s ease',
            opacity: canRedo ? 1 : 0.6,
            pointerEvents: canRedo ? 'auto' : 'none'
          }}
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>

        <button
          onClick={createGroup}
          disabled={selectedIds.length < 2}
          style={{
            padding: '8px 16px',
            background: selectedIds.length >= 2 ? '#8b5cf6' : '#d1d5db',
            color: selectedIds.length >= 2 ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedIds.length >= 2 ? 'pointer' : 'not-allowed',
            fontWeight: '500',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (selectedIds.length >= 2) {
              e.currentTarget.style.background = '#7c3aed';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedIds.length >= 2) {
              e.currentTarget.style.background = '#8b5cf6';
            }
          }}
        >
          Group ({selectedIds.length})
      </button>
      </div>

      {/* Right side - Online status, user profile, and logout */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <EnhancedOnlineStatus />
        
        {/* Divider */}
        <div style={{
          width: '1px',
          height: '24px',
          backgroundColor: '#e5e7eb',
          marginRight: '12px'
        }} />
        
        {/* User Profile */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: userProfile?.photoURL ? 'transparent' : (userProfile?.cursorColor || '#3b82f6'),
              border: '2px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginRight: '12px',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <span style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {(userProfile?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {showProfileDropdown && (
            <UserProfileDropdown onClose={() => setShowProfileDropdown(false)} />
          )}
        </div>
        
      <button 
          onClick={logout}
          style={{
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            color: '#6b7280',
            cursor: 'pointer',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e5e7eb';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          Logout
      </button>
      </div>
    </div>
  );
};

export default Toolbar;