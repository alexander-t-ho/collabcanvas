import React from 'react';
import { usePresence } from '../../hooks/usePresence';
import { useAuth } from '../../contexts/AuthContext';

const PresenceIndicator: React.FC = () => {
  const { onlineUsers } = usePresence();
  const { currentUser, logout } = useAuth();

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 1000,
      background: 'white',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      minWidth: '200px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontWeight: 'bold' }}>{onlineUsers.length} online</span>
        <button onClick={logout} style={{ padding: '4px 8px', fontSize: '12px' }}>
          Logout
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {onlineUsers.map(user => (
          <div key={user.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: user.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '14px' }}>
              {user.name} {user.userId === currentUser?.uid && '(you)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresenceIndicator;