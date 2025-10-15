import React, { useState } from 'react';
import { CanvasObject } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';

interface Props {
  object: CanvasObject;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: React.ReactNode;
  hideColorPicker?: boolean;
}

const BaseEditor: React.FC<Props> = ({ object, onMoveUp, onMoveDown, children, hideColorPicker }) => {
  const { updateObject, addObject, deleteObject } = useCanvas();
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleNicknameChange = (value: string) => {
    updateObject(object.id, { nickname: value });
  };

  const handleColorChange = (value: string) => {
    // Ensure it's a valid hex color
    const hexColor = value.startsWith('#') ? value : `#${value}`;
    if (/^#[0-9A-F]{6}$/i.test(hexColor)) {
      updateObject(object.id, { fill: hexColor });
    }
  };

  const handleRotationChange = (value: number) => {
    updateObject(object.id, { rotation: value });
  };

  const handleShadowToggle = () => {
    updateObject(object.id, { shadow: !object.shadow });
  };

  const handleDuplicate = () => {
    addObject({
      type: object.type,
      x: object.x + 20,
      y: object.y + 20,
      width: object.width,
      height: object.height,
      fill: object.fill,
      nickname: object.nickname ? `${object.nickname} Copy` : undefined,
      cornerRadius: object.cornerRadius,
      strokeWidth: object.strokeWidth,
      x2: object.x2 ? object.x2 + 20 : undefined,
      y2: object.y2 ? object.y2 + 20 : undefined,
      controlX: object.controlX ? object.controlX + 20 : undefined,
      controlY: object.controlY ? object.controlY + 20 : undefined,
      curved: object.curved,
      shadow: object.shadow,
      zIndex: (object.zIndex || 0) + 1,
      createdBy: object.createdBy,
    });
  };

  return (
    <div style={{
      position: 'fixed',
      left: 20,
      top: 80, // Under the toolbar
      width: 280,
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '16px',
      zIndex: 1001,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '12px',
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto'
    }}>
      <div style={{ 
        fontWeight: '600', 
        marginBottom: '16px', 
        color: '#374151',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>{object.type.charAt(0).toUpperCase() + object.type.slice(1)} Properties</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={onMoveUp}
            style={{
              width: '24px',
              height: '24px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px'
            }}
            title="Move forward"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            style={{
              width: '24px',
              height: '24px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px'
            }}
            title="Move backward"
          >
            ↓
          </button>
        </div>
      </div>

      {/* Nickname */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Nickname
        </label>
        <input
          type="text"
          value={object.nickname || ''}
          onChange={(e) => handleNicknameChange(e.target.value)}
          placeholder="Enter a name..."
          style={{
            width: '100%',
            padding: '6px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '11px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Color - conditionally rendered */}
      {!hideColorPicker && (
        <div style={{ marginBottom: '12px', position: 'relative' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '4px', 
            fontWeight: '500',
            color: '#6b7280'
          }}>
            Color
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              onClick={() => setShowColorPicker(!showColorPicker)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                background: object.fill,
                border: '2px solid #d1d5db',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              title="Click to open color wheel"
            />
            <input
              type="text"
              value={object.fill}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#000000"
              style={{
                flex: 1,
                padding: '6px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}
            />
          </div>
          
          {/* Color Wheel Picker */}
          {showColorPicker && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1003,
              width: '250px'
            }}>
              {/* Color Wheel using native HTML5 color input */}
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="color"
                  value={object.fill}
                  onChange={(e) => {
                    handleColorChange(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    height: '150px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
              </div>
              
              {/* Quick color presets */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#6b7280'
                }}>
                  Quick Colors
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
                  {['#000000', '#ffffff', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
                    '#ec4899', '#06b6d4', '#14b8a6', '#84cc16', '#f97316', '#6366f1', '#a855f7', '#d1d5db'].map(color => (
                    <div
                      key={color}
                      onClick={() => {
                        handleColorChange(color);
                        setShowColorPicker(false);
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        background: color,
                        border: object.fill === color ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowColorPicker(false)}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  marginTop: '8px'
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rotation */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Rotation (degrees)
        </label>
        <input
          type="number"
          value={Math.round(object.rotation || 0)}
          onChange={(e) => handleRotationChange(Number(e.target.value))}
          min={-360}
          max={360}
          style={{
            width: '100%',
            padding: '6px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '11px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Shadow Toggle */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontWeight: '500',
          color: '#6b7280'
        }}>
          <input
            type="checkbox"
            checked={object.shadow || false}
            onChange={handleShadowToggle}
            style={{ margin: 0 }}
          />
          Drop Shadow
        </label>
      </div>

      {/* Shape-specific controls */}
      {children}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleDuplicate}
          style={{
            flex: 1,
            padding: '8px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '12px',
            fontFamily: 'inherit',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4f46e5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6366f1';
          }}
        >
          Duplicate
        </button>
        
        <button
          onClick={() => deleteObject(object.id)}
          style={{
            flex: 1,
            padding: '8px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '12px',
            fontFamily: 'inherit',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ef4444';
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default BaseEditor;
