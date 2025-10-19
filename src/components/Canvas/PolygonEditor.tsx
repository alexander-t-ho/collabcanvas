import React, { useState } from 'react';
import { CanvasObject } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';
import BaseEditor from './BaseEditor';

interface Props {
  object: CanvasObject;
}

const PolygonEditor: React.FC<Props> = ({ object }) => {
  const { updateObject, objects } = useCanvas();
  const [showSideEditor, setShowSideEditor] = useState(false);

  const sides = object.sides || 3;
  const baseSideLength = object.sideLength || 100;
  const customLengths = object.customSideLengths || [];
  const selectedSide = object.selectedSide;

  const handleSidesChange = (newSides: number) => {
    // Clamp between 3 and 64
    const clampedSides = Math.max(3, Math.min(64, newSides));
    updateObject(object.id, {
      sides: clampedSides,
      customSideLengths: [] // Reset custom lengths when changing sides
    });
  };

  const handleBaseSideLengthChange = (length: number) => {
    updateObject(object.id, {
      sideLength: Math.max(10, length),
      customSideLengths: [] // Reset custom lengths
    });
  };

  const handleCustomSideLengthChange = (sideIndex: number, length: number) => {
    const newCustomLengths = customLengths.length > 0 
      ? [...customLengths]
      : Array(sides).fill(baseSideLength);
    
    newCustomLengths[sideIndex] = Math.max(10, length);
    
    updateObject(object.id, {
      customSideLengths: newCustomLengths
    });
  };

  const handleResetSide = (sideIndex: number) => {
    if (customLengths.length === 0) return;
    
    const newCustomLengths = [...customLengths];
    newCustomLengths[sideIndex] = baseSideLength;
    
    // Check if all are back to base length
    const allDefault = newCustomLengths.every(l => l === baseSideLength);
    
    updateObject(object.id, {
      customSideLengths: allDefault ? [] : newCustomLengths
    });
  };

  const handleMoveUp = () => {
    const currentZ = object.zIndex || 0;
    updateObject(object.id, { zIndex: currentZ + 1 });
  };

  const handleMoveDown = () => {
    const currentZ = object.zIndex || 0;
    updateObject(object.id, { zIndex: currentZ - 1 });
  };

  return (
    <BaseEditor 
      object={object} 
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
    >
      {/* Polygon-specific controls */}
      <div style={{ 
        padding: '12px', 
        background: '#f9fafb', 
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        <h4 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '13px', 
          fontWeight: '600',
          color: '#1f2937'
        }}>
          Polygon Properties
        </h4>

        {/* Number of Sides */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            fontSize: '11px', 
            color: '#6b7280', 
            display: 'block', 
            marginBottom: '4px',
            fontWeight: '500'
          }}>
            Number of Sides (3-64)
          </label>
          <input
            type="number"
            min="3"
            max="64"
            value={sides}
            onChange={(e) => handleSidesChange(parseInt(e.target.value) || 3)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '10px', 
            color: '#9ca3af'
          }}>
            Triangle (3), Square (4), Pentagon (5), Hexagon (6), etc.
          </p>
        </div>

        {/* Base Side Length */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            fontSize: '11px', 
            color: '#6b7280', 
            display: 'block', 
            marginBottom: '4px',
            fontWeight: '500'
          }}>
            Base Side Length
          </label>
          <input
            type="number"
            min="10"
            value={Math.round(baseSideLength)}
            onChange={(e) => handleBaseSideLengthChange(parseInt(e.target.value) || 100)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '10px', 
            color: '#9ca3af'
          }}>
            Default length for all sides
          </p>
        </div>

        {/* Individual Side Editor */}
        <button
          onClick={() => setShowSideEditor(!showSideEditor)}
          style={{
            width: '100%',
            padding: '10px',
            background: showSideEditor ? '#3b82f6' : '#f3f4f6',
            color: showSideEditor ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: showSideEditor ? '12px' : '0',
            transition: 'all 0.2s ease'
          }}
        >
          {showSideEditor ? '▼' : '▶'} Edit Individual Sides
        </button>

        {showSideEditor && (
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '8px'
          }}>
            <p style={{ 
              margin: '0 0 8px 0', 
              fontSize: '10px', 
              color: '#9ca3af'
            }}>
              Click a vertex on the canvas or adjust here:
            </p>
            
            {Array.from({ length: sides }).map((_, idx) => {
              const currentLength = customLengths[idx] || baseSideLength;
              const isSelected = selectedSide === idx;
              
              return (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px',
                    padding: '6px',
                    background: isSelected ? '#fef3c7' : 'transparent',
                    borderRadius: '4px',
                    border: isSelected ? '2px solid #f59e0b' : '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '500',
                    color: isSelected ? '#92400e' : '#6b7280',
                    minWidth: '50px'
                  }}>
                    Side {idx + 1}:
                  </span>
                  <input
                    type="number"
                    min="10"
                    value={Math.round(currentLength)}
                    onChange={(e) => handleCustomSideLengthChange(idx, parseInt(e.target.value) || 10)}
                    onClick={() => updateObject(object.id, { selectedSide: idx })}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '11px',
                      boxSizing: 'border-box',
                      background: isSelected ? '#fffbeb' : 'white'
                    }}
                  />
                  {customLengths[idx] && customLengths[idx] !== baseSideLength && (
                    <button
                      onClick={() => handleResetSide(idx)}
                      style={{
                        padding: '4px 8px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                      title="Reset to base length"
                    >
                      ↻
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {customLengths.length > 0 && (
          <button
            onClick={() => updateObject(object.id, { customSideLengths: [] })}
            style={{
              width: '100%',
              padding: '8px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Reset All Sides to Base Length
          </button>
        )}

        <p style={{ 
          margin: '12px 0 0 0', 
          fontSize: '10px', 
          color: '#9ca3af',
          fontStyle: 'italic'
        }}>
          💡 Tip: Drag vertices on the canvas to adjust individual side lengths
        </p>
      </div>
    </BaseEditor>
  );
};

export default PolygonEditor;

