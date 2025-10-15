import React, { useState, useEffect } from 'react';
import { CanvasObject } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';
import BaseEditor from './BaseEditor';

interface Props {
  object: CanvasObject;
}

const RectangleEditor: React.FC<Props> = ({ object }) => {
  const { updateObject, objects } = useCanvas();
  const [widthInput, setWidthInput] = useState(String(object.width));
  const [heightInput, setHeightInput] = useState(String(object.height));

  // Update local input when object changes from elsewhere
  useEffect(() => {
    setWidthInput(String(object.width));
    setHeightInput(String(object.height));
  }, [object.width, object.height]);

  const handleWidthBlur = () => {
    const value = parseInt(widthInput) || 1;
    const width = Math.max(1, value);
    setWidthInput(String(width));
    updateObject(object.id, { width });
  };

  const handleHeightBlur = () => {
    const value = parseInt(heightInput) || 1;
    const height = Math.max(1, value);
    setHeightInput(String(height));
    updateObject(object.id, { height });
  };

  const handleCornerRadiusChange = (value: number) => {
    updateObject(object.id, { cornerRadius: Math.max(0, value) });
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
      {/* Corner Radius */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Corner Radius
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="0"
            max="50"
            value={object.cornerRadius || 0}
            onChange={(e) => handleCornerRadiusChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="0"
            max="50"
            value={object.cornerRadius || 0}
            onChange={(e) => handleCornerRadiusChange(Number(e.target.value))}
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

      {/* Width */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Width
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="1"
            value={widthInput}
            onChange={(e) => setWidthInput(e.target.value)}
            onBlur={handleWidthBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleWidthBlur();
                e.currentTarget.blur();
              }
            }}
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

      {/* Height */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Height
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="1"
            value={heightInput}
            onChange={(e) => setHeightInput(e.target.value)}
            onBlur={handleHeightBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleHeightBlur();
                e.currentTarget.blur();
              }
            }}
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

export default RectangleEditor;
