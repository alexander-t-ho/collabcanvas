import React, { useState } from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';

interface PolygonDialogProps {
  onClose: () => void;
}

const PolygonDialog: React.FC<PolygonDialogProps> = ({ onClose }) => {
  const { addObject } = useCanvas();
  const { currentUser } = useAuth();
  const [sides, setSides] = useState<number | ''>(6);

  const createStar = () => {
    if (!currentUser) return;
    
    // Create 5-point star using polygon with custom vertices
    const starPoints = 5;
    const outerRadius = 80;
    const innerRadius = 35;
    const totalVertices = starPoints * 2;
    
    const starVertices: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < totalVertices; i++) {
      const angle = (i * Math.PI) / starPoints - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      
      starVertices.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
    
    addObject({
      type: 'polygon',
      x: 0,
      y: 0,
      width: outerRadius * 2,
      height: outerRadius * 2,
      fill: '#' + Math.floor(Math.random()*16777215).toString(16),
      sides: totalVertices,
      sideLength: 50,
      customVertices: starVertices,
      nickname: '5-Point Star',
      zIndex: 0,
      shadow: false,
      createdBy: currentUser.uid,
    });
    
    onClose();
  };

  const createHeart = () => {
    if (!currentUser) return;
    
    // Create heart using polygon with many vertices for smooth curves
    const heartVertices: Array<{ x: number; y: number }> = [];
    const scale = 1;
    
    // Left half of heart (from top center, going left and down)
    const leftPoints = [
      { x: 0, y: -60 * scale },       // Top center dip
      { x: -15, y: -75 * scale },     // Left top curve start
      { x: -35, y: -85 * scale },     // Left top curve
      { x: -55, y: -80 * scale },     // Left top outer
      { x: -70, y: -65 * scale },     // Left outer curve
      { x: -75, y: -45 * scale },     // Left side top
      { x: -75, y: -25 * scale },     // Left side mid
      { x: -70, y: -5 * scale },      // Left side bottom start
      { x: -60, y: 10 * scale },      // Left bottom curve
      { x: -45, y: 25 * scale },      // Left bottom mid
      { x: -30, y: 38 * scale },      // Approaching bottom point
      { x: -15, y: 50 * scale },      // Near bottom point
      { x: 0, y: 65 * scale }         // Bottom point
    ];
    
    // Right half of heart (mirror of left, going right and up)
    const rightPoints = [
      { x: 15, y: 50 * scale },       // Near bottom point
      { x: 30, y: 38 * scale },       // Approaching bottom point
      { x: 45, y: 25 * scale },       // Right bottom mid
      { x: 60, y: 10 * scale },       // Right bottom curve
      { x: 70, y: -5 * scale },       // Right side bottom start
      { x: 75, y: -25 * scale },      // Right side mid
      { x: 75, y: -45 * scale },      // Right side top
      { x: 70, y: -65 * scale },      // Right outer curve
      { x: 55, y: -80 * scale },      // Right top outer
      { x: 35, y: -85 * scale },      // Right top curve
      { x: 15, y: -75 * scale }       // Right top curve start
    ];
    
    heartVertices.push(...leftPoints, ...rightPoints);
    
    addObject({
      type: 'polygon',
      x: 0,
      y: 0,
      width: 150,
      height: 130,
      fill: '#FF1493',
      sides: heartVertices.length,
      sideLength: 10,
      customVertices: heartVertices,
      nickname: 'Heart',
      zIndex: 0,
      shadow: true,
      createdBy: currentUser.uid,
    });
    
    onClose();
  };

  const handleCreate = () => {
    if (!currentUser) return;

    // Clamp sides between 3 and 64
    const currentValue = sides === '' ? 3 : sides;
    const clampedSides = Math.max(3, Math.min(64, currentValue as number));

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
    { name: 'Star', sides: 10, isSpecial: true },
    { name: 'Heart', sides: 0, isSpecial: true }
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
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setSides('' as any); // Allow empty string for easier editing
              } else {
                const num = parseInt(value);
                if (!isNaN(num)) {
                  setSides(num);
                }
              }
            }}
            onBlur={(e) => {
              // Clamp on blur and reset border color
              const currentValue = sides === '' ? 3 : sides;
              const clamped = Math.max(3, Math.min(64, currentValue as number));
              setSides(clamped);
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#ec4899';
            }}
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
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (preset.isSpecial) {
                    if (preset.name === 'Star') {
                      createStar();
                    } else if (preset.name === 'Heart') {
                      createHeart();
                    }
                  } else {
                    setSides(preset.sides);
                  }
                }}
                style={{
                  padding: '8px',
                  background: !preset.isSpecial && sides === preset.sides ? '#ec4899' : preset.isSpecial ? '#f97316' : '#f3f4f6',
                  color: (!preset.isSpecial && sides === preset.sides) || preset.isSpecial ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!preset.isSpecial && sides !== preset.sides) {
                    e.currentTarget.style.background = '#e5e7eb';
                  } else if (preset.isSpecial) {
                    e.currentTarget.style.background = '#ea580c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!preset.isSpecial && sides !== preset.sides) {
                    e.currentTarget.style.background = '#f3f4f6';
                  } else if (preset.isSpecial) {
                    e.currentTarget.style.background = '#f97316';
                  }
                }}
              >
                {preset.name}
                {!preset.isSpecial && (
                  <>
                    <br />
                    <span style={{ fontSize: '9px', opacity: 0.8 }}>({preset.sides})</span>
                  </>
                )}
                {preset.isSpecial && (
                  <>
                    <br />
                    <span style={{ fontSize: '9px', opacity: 0.8 }}>⭐</span>
                  </>
                )}
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

