import React from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePresence } from '../../hooks/usePresence';

const Toolbar: React.FC = () => {
  const { addObject, drawingMode, setDrawingMode } = useCanvas();
  const { currentUser, logout } = useAuth();
  const { onlineUsers } = usePresence();

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

  const handleImport = () => {
    // This will be handled by the parent component
    const event = new CustomEvent('openImageImport');
    window.dispatchEvent(event);
  };

  // Filter out current user - only show others
  const otherUsers = onlineUsers.filter(user => user.userId !== currentUser?.uid);

  const OnlineStatus: React.FC = () => {
    if (otherUsers.length === 0) return null;

    const maxVisible = 3;
    const visibleUsers = otherUsers.slice(0, maxVisible);
    const overflowCount = otherUsers.length - maxVisible;

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '2px',
        marginRight: '12px'
      }}>
        {visibleUsers.map((user, index) => (
          <div
            key={user.userId}
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
              marginLeft: index > 0 ? '-10px' : '0',
              zIndex: maxVisible - index,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)';
              e.currentTarget.style.zIndex = '10';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.zIndex = String(maxVisible - index);
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
            }}
            title={`${user.name} is online`}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {overflowCount > 0 && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6b7280, #4b5563)',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              cursor: 'pointer',
              marginLeft: '-10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
            }}
            title={`+${overflowCount} more online`}
          >
            +{overflowCount}
          </div>
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
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
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
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
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
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {drawingMode === 'line' ? 'Drawing Line...' : 'Draw Line'}
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
      </div>

      {/* Right side - Online status and logout */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <OnlineStatus />
        
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