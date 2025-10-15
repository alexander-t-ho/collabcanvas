import React from 'react';
import { PresenceData } from '../../types';

interface Props {
  user: PresenceData;
  onClose: () => void;
}

const UserInfoDropdown: React.FC<Props> = ({ user, onClose }) => {
  return (
    <div 
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: '0',
        width: '250px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1002,
        padding: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        color: '#374151'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: user.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '4px'
          }}>
            {user.name}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#9ca3af'
          }}>
            Online Now
          </div>
        </div>
      </div>

      {/* User Info */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          marginBottom: '4px',
          fontWeight: '500'
        }}>
          User Color
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '4px',
            background: user.color,
            border: '1px solid #d1d5db'
          }} />
          <span style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#374151'
          }}>
            {user.color.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          marginBottom: '4px',
          fontWeight: '500'
        }}>
          User ID
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#6b7280',
          background: '#f3f4f6',
          padding: '6px 8px',
          borderRadius: '4px',
          wordBreak: 'break-all'
        }}>
          {user.userId}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: '8px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '12px',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#2563eb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#3b82f6';
        }}
      >
        Close
      </button>
    </div>
  );
};

export default UserInfoDropdown;

