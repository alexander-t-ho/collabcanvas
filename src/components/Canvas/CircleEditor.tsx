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
    </BaseEditor>
  );
};

export default CircleEditor;
