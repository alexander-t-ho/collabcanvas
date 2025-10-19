import React, { useState } from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';

interface PolygonDialogProps {
  onClose: () => void;
}

const PolygonDialog: React.FC<PolygonDialogProps> = ({ onClose }) => {
  const { addObject } = useCanvas();
  const { currentUser } = useAuth();
  const [sides, setSides] = useState(6);

  const handleCreate = () => {
    if (!currentUser) return;

    // Clamp sides between 3 and 64
    const clampedSides = Math.max(3, Math.min(64, sides));

    addObject({
      type: 'polygon',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: '#' + Math.floor(Math.random()*16777215).toString(16),
      sides: clampedSides,
      sideLength: 80,
      nickname: '',
      zIndex: 0,
      shadow: false,
      createdBy: currentUser.uid,
    });

    onClose();
  };

  const presets = [
    { name: 'Triangle', sides: 3 },
    { name: 'Square', sides: 4 },
    { name: 'Pentagon', sides: 5 },
    { name: 'Hexagon', sides: 6 },
    { name: 'Octagon', sides: 8 },
    { name: 'Decagon', sides: 10 },
    { name: 'Dodecagon', sides: 12 }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
          Create Polygon
        </h2>

        {/* Number of Sides Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            fontSize: '13px', 
            color: '#6b7280', 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            Number of Sides (3-64)
          </label>
          <input
            type="number"
            min="3"
            max="64"
            value={sides}
            onChange={(e) => setSides(Math.max(3, Math.min(64, parseInt(e.target.value) || 3)))}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#ec4899';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreate();
              }
            }}
          />
        </div>

        {/* Preset Buttons */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            fontSize: '13px', 
            color: '#6b7280', 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            Quick Presets
          </label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '8px'
          }}>
            {presets.map((preset) => (
              <button
                key={preset.sides}
                onClick={() => setSides(preset.sides)}
                style={{
                  padding: '8px',
                  background: sides === preset.sides ? '#ec4899' : '#f3f4f6',
                  color: sides === preset.sides ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (sides !== preset.sides) {
                    e.currentTarget.style.background = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sides !== preset.sides) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
              >
                {preset.name}
                <br />
                <span style={{ fontSize: '9px', opacity: 0.8 }}>({preset.sides})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCreate}
            style={{
              flex: 1,
              padding: '12px',
              background: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#db2777';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ec4899';
            }}
          >
            Create Polygon
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
          >
            Cancel
          </button>
        </div>

        <p style={{ 
          margin: '12px 0 0 0', 
          fontSize: '11px', 
          color: '#9ca3af',
          textAlign: 'center'
        }}>
          💡 After creating, you can customize individual side lengths in the editor
        </p>
      </div>
    </div>
  );
};

export default PolygonDialog;

