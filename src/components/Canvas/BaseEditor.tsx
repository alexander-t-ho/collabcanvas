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
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);

  // Convert hex to HSL
  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 100, l: 50 };
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Update color from HSL sliders
  const updateColorFromHSL = (h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l);
    handleColorChange(hex);
  };

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
    const rotation = isNaN(value) ? 0 : Math.round(value);
    updateObject(object.id, { rotation });
  };

  const handleShadowToggle = () => {
    updateObject(object.id, { shadow: !object.shadow });
  };

  const handleOpacityChange = (value: number) => {
    const opacity = Math.max(0, Math.min(1, value));
    updateObject(object.id, { opacity });
  };

  const handleDuplicate = () => {
    // Create a copy of the object with all properties
    const duplicatedObject: any = {
      ...object,
      // Offset position to the right
      x: object.x + 50,
      y: object.y + 50,
      // Update nickname
      nickname: object.nickname ? `${object.nickname} Copy` : '',
      // Increase z-index to place on top
      zIndex: (object.zIndex || 0) + 1,
    };
    
    // For lines, also offset the end point and control point
    if (object.type === 'line') {
      if (object.x2 !== undefined) duplicatedObject.x2 = object.x2 + 50;
      if (object.y2 !== undefined) duplicatedObject.y2 = object.y2 + 50;
      if (object.controlX !== undefined) duplicatedObject.controlX = object.controlX + 50;
      if (object.controlY !== undefined) duplicatedObject.controlY = object.controlY + 50;
    }
    
    // For groups, don't duplicate (groups are complex and would need special handling)
    if (object.type === 'group') {
      alert('Cannot duplicate groups directly. Please ungroup first, then duplicate individual objects.');
      return;
    }
    
    // Remove properties that shouldn't be duplicated
    delete duplicatedObject.id;
    delete duplicatedObject.createdAt;
    delete duplicatedObject.lastModified;
    
    addObject(duplicatedObject);
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
              marginTop: '8px',
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '12px'
            }}>
              <h4 style={{ 
                margin: '0 0 10px 0', 
                fontSize: '12px', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Color Picker
              </h4>
              
              {/* Native Color Wheel - Compact */}
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="color"
                  value={object.fill}
                  onChange={(e) => {
                    handleColorChange(e.target.value);
                    const hsl = hexToHSL(e.target.value);
                    setHue(hsl.h);
                    setSaturation(hsl.s);
                    setLightness(hsl.l);
                  }}
                  style={{
                    width: '100%',
                    height: '80px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
              </div>
              
              {/* Editable Hex Code - Prominent */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '6px', 
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  ✏️ Edit Hex Code
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: object.fill,
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }} />
                  <input
                    type="text"
                    value={object.fill}
                    onChange={(e) => {
                      handleColorChange(e.target.value);
                      const hsl = hexToHSL(e.target.value);
                      setHue(hsl.h);
                      setSaturation(hsl.s);
                      setLightness(hsl.l);
                    }}
                    placeholder="#000000"
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '2px solid #3b82f6',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      backgroundColor: 'white',
                      color: '#1f2937',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }}
                  />
                </div>
                <div style={{ 
                  fontSize: '9px', 
                  color: '#9ca3af', 
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  Type any hex color code (e.g., #FF5733)
                </div>
              </div>
              
              {/* HSL Sliders - Compact */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ 
                  marginBottom: '4px', 
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#6b7280',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Hue</span>
                  <span style={{ fontSize: '9px' }}>{hue}°</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hue}
                  onChange={(e) => {
                    const newHue = Number(e.target.value);
                    setHue(newHue);
                    updateColorFromHSL(newHue, saturation, lightness);
                  }}
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ 
                  marginBottom: '4px', 
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#6b7280',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Saturation</span>
                  <span style={{ fontSize: '9px' }}>{saturation}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={saturation}
                  onChange={(e) => {
                    const newSat = Number(e.target.value);
                    setSaturation(newSat);
                    updateColorFromHSL(hue, newSat, lightness);
                  }}
                  style={{
                    width: '100%',
                    height: '6px',
                    background: `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`,
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ 
                  marginBottom: '4px', 
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#6b7280',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Lightness</span>
                  <span style={{ fontSize: '9px' }}>{lightness}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lightness}
                  onChange={(e) => {
                    const newLight = Number(e.target.value);
                    setLightness(newLight);
                    updateColorFromHSL(hue, saturation, newLight);
                  }}
                  style={{
                    width: '100%',
                    height: '6px',
                    background: `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))`,
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              
              {/* Quick color presets - Compact */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#6b7280'
                }}>
                  Quick Colors
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                  {['#000000', '#ffffff', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
                    '#ec4899', '#06b6d4', '#14b8a6', '#84cc16', '#f97316', '#6366f1', '#a855f7', '#d1d5db'].map(color => (
                    <div
                      key={color}
                      onClick={() => {
                        handleColorChange(color);
                        const hsl = hexToHSL(color);
                        setHue(hsl.h);
                        setSaturation(hsl.s);
                        setLightness(hsl.l);
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        background: color,
                        border: object.fill === color ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowColorPicker(false)}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                }}
              >
                Done
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
          Rotation (degrees) - Hold Shift while rotating to snap to 45°
        </label>
        <input
          type="number"
          value={Math.round(object.rotation || 0)}
          onChange={(e) => {
            const val = e.target.value === '' ? 0 : Math.round(parseFloat(e.target.value)) || 0;
            handleRotationChange(val);
          }}
          min={-360}
          max={360}
          step={1}
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

      {/* Opacity Slider */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Opacity
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round((object.opacity ?? 1) * 100)}
            onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
            style={{ 
              flex: 1,
              accentColor: '#3b82f6'
            }}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={Math.round((object.opacity ?? 1) * 100)}
            onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
            style={{
              width: '50px',
              padding: '4px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '11px'
            }}
          />
          <span style={{ color: '#9ca3af', fontSize: '10px' }}>%</span>
        </div>
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
