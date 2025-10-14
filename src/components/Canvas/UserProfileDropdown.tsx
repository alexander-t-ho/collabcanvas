import React, { useState, useRef } from 'react';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onClose: () => void;
}

const UserProfileDropdown: React.FC<Props> = ({ onClose }) => {
  const { userProfile, updateUserProfile, updateUserPhoto, changePassword, loading } = useUserProfile();
  const { currentUser } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await updateUserPhoto(file);
        setError('');
      } catch (error) {
        setError('Failed to update photo');
        console.error('Error updating photo:', error);
      }
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await changePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      setError('');
      alert('Password changed successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
      console.error('Error changing password:', error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        width: '300px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb',
        padding: '20px',
        zIndex: 1000,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Profile Header */}
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: userProfile?.photoURL ? 'transparent' : (userProfile?.cursorColor || '#3b82f6'),
                border: '3px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => fileInputRef.current?.click()}
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
                  fontSize: '24px',
                  fontWeight: '600'
                }}>
                  {(userProfile?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
              
              {/* Camera icon overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>
                <span style={{ color: 'white', fontSize: '10px' }}>📷</span>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </div>
          
          <h3 style={{ 
            margin: '0 0 4px 0', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1f2937' 
          }}>
            {userProfile?.displayName || 'Anonymous User'}
          </h3>
          
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: '#6b7280' 
          }}>
            {userProfile?.email}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '12px',
            fontSize: '14px',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        {/* Password Change Section */}
        {!showPasswordChange ? (
          <button
            onClick={() => setShowPasswordChange(true)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
          >
            {loading ? 'Loading...' : 'Change Password'}
          </button>
        ) : (
          <div style={{ marginBottom: '12px' }}>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '8px',
                boxSizing: 'border-box'
              }}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '8px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Close
        </button>
      </div>
    </>
  );
};

export default UserProfileDropdown;
