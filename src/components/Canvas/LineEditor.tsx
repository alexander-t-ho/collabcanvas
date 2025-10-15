import React from 'react';
import { CanvasObject } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';
import BaseEditor from './BaseEditor';

interface Props {
  object: CanvasObject;
}

const LineEditor: React.FC<Props> = ({ object }) => {
  const { updateObject, objects } = useCanvas();

  const handleStrokeWidthChange = (value: number) => {
    updateObject(object.id, { strokeWidth: Math.max(1, Math.min(20, value)) });
  };

  const handleLengthChange = (value: number) => {
    if (!object.x2 || !object.y2) return;
    
    const currentLength = Math.sqrt(Math.pow(object.x2 - object.x, 2) + Math.pow(object.y2 - object.y, 2));
    if (currentLength === 0) return;
    
    const ratio = Math.max(10, value) / currentLength;
    const newX2 = object.x + (object.x2 - object.x) * ratio;
    const newY2 = object.y + (object.y2 - object.y) * ratio;
    
    updateObject(object.id, { 
      x2: newX2, 
      y2: newY2,
      // Update control point to maintain curve shape
      controlX: object.curved ? object.x + (newX2 - object.x) / 2 : undefined,
      controlY: object.curved ? object.y + (newY2 - object.y) / 2 : undefined,
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
      {/* Line Thickness */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Line Thickness
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="1"
            max="20"
            value={object.strokeWidth || 3}
            onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="1"
            max="20"
            value={object.strokeWidth || 3}
            onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
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

      {/* Line Length Info */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Length
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="10"
            max="1000"
            value={object.x2 && object.y2 ? 
              Math.round(Math.sqrt(Math.pow(object.x2 - object.x, 2) + Math.pow(object.y2 - object.y, 2)))
              : 0
            }
            onChange={(e) => handleLengthChange(Number(e.target.value))}
            style={{
              flex: 1,
              padding: '6px',
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

export default LineEditor;
