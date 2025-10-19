import React from 'react';
import { CanvasObject } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';
import BaseEditor from './BaseEditor';

interface Props {
  object: CanvasObject;
}

const EllipseEditor: React.FC<Props> = ({ object }) => {
  const { updateObject, objects } = useCanvas();

  const radiusX = object.radiusX || object.width / 2;
  const radiusY = object.radiusY || object.height / 2;

  const handleRadiusXChange = (value: number) => {
    updateObject(object.id, { 
      radiusX: Math.max(10, value),
      width: Math.max(20, value * 2)
    });
  };

  const handleRadiusYChange = (value: number) => {
    updateObject(object.id, { 
      radiusY: Math.max(10, value),
      height: Math.max(20, value * 2)
    });
  };

  const handleConvertToCircle = () => {
    const avgRadius = (radiusX + radiusY) / 2;
    updateObject(object.id, {
      type: 'circle',
      width: avgRadius * 2,
      height: avgRadius * 2,
      radiusX: undefined,
      radiusY: undefined,
      focus1: undefined,
      focus2: undefined
    });
  };

  const handleMoveUp = () => {
    const maxZ = Math.max(...objects.map(obj => obj.zIndex || 0));
    updateObject(object.id, { zIndex: maxZ + 1 });
  };

  const handleMoveDown = () => {
    const minZ = Math.min(...objects.map(obj => obj.zIndex || 0));
    updateObject(object.id, { zIndex: minZ - 1 });
  };

  return (
    <BaseEditor 
      object={object} 
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
    >
      {/* Horizontal Radius */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Horizontal Radius (X)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="10"
            max="300"
            value={radiusX}
            onChange={(e) => handleRadiusXChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="10"
            max="300"
            value={Math.round(radiusX)}
            onChange={(e) => handleRadiusXChange(Number(e.target.value))}
            style={{
              width: '50px',
              padding: '4px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '11px'
            }}
          />
          <span style={{ color: '#9ca3af', fontSize: '10px' }}>px</span>
        </div>
      </div>

      {/* Vertical Radius */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Vertical Radius (Y)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="10"
            max="300"
            value={radiusY}
            onChange={(e) => handleRadiusYChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="10"
            max="300"
            value={Math.round(radiusY)}
            onChange={(e) => handleRadiusYChange(Number(e.target.value))}
            style={{
              width: '50px',
              padding: '4px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '11px'
            }}
          />
          <span style={{ color: '#9ca3af', fontSize: '10px' }}>px</span>
        </div>
      </div>

      {/* Convert back to Circle */}
      <button
        onClick={handleConvertToCircle}
        style={{
          width: '100%',
          padding: '10px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '12px',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
        }}
      >
        ⬭ → ⭕ Convert to Circle
      </button>

      <p style={{ 
        margin: '4px 0 0 0', 
        fontSize: '10px', 
        color: '#9ca3af',
        fontStyle: 'italic'
      }}>
        💡 Tip: Drag focus points on canvas to reshape ellipse
      </p>
    </BaseEditor>
  );
};

export default EllipseEditor;

