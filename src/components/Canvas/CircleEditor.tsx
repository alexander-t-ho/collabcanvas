import React from 'react';
import { CanvasObject } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';
import BaseEditor from './BaseEditor';

interface Props {
  object: CanvasObject;
}

const CircleEditor: React.FC<Props> = ({ object }) => {
  const { updateObject, objects } = useCanvas();

  const radius = object.width / 2; // Assuming width is diameter

  const handleRadiusChange = (value: number) => {
    const newDiameter = Math.max(10, value * 2);
    updateObject(object.id, { 
      width: newDiameter, 
      height: newDiameter 
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

  const handleConvertToEllipse = () => {
    const radius = object.width / 2;
    updateObject(object.id, {
      type: 'ellipse',
      radiusX: radius,
      radiusY: radius,
      focus1: { x: -radius * 0.5, y: 0 },
      focus2: { x: radius * 0.5, y: 0 }
    });
  };

  return (
    <BaseEditor 
      object={object} 
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
    >
      {/* Radius */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Radius
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="5"
            max="200"
            value={radius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="5"
            max="200"
            value={Math.round(radius)}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
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

      {/* Convert to Ellipse */}
      <button
        onClick={handleConvertToEllipse}
        style={{
          width: '100%',
          padding: '10px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '12px',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(139, 92, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.3)';
        }}
      >
        ⭕ → ⬭ Convert to Ellipse
      </button>
    </BaseEditor>
  );
};

export default CircleEditor;
