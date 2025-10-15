import React, { useEffect, useRef } from 'react';
import { CanvasObject } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';
import BaseEditor from './BaseEditor';

interface Props {
  object: CanvasObject;
}

const TextEditor: React.FC<Props> = ({ object }) => {
  const { updateObject, objects } = useCanvas();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Listen for focus event from double-click
  useEffect(() => {
    const handleFocusEvent = (e: any) => {
      if (e.detail.objectId === object.id && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    };
    
    window.addEventListener('focusTextEditor', handleFocusEvent as EventListener);
    return () => window.removeEventListener('focusTextEditor', handleFocusEvent as EventListener);
  }, [object.id]);

  const handleTextChange = (value: string) => {
    // Live update as user types
    updateObject(object.id, { text: value });
  };

  const handleFontSizeChange = (value: number) => {
    updateObject(object.id, { fontSize: Math.max(8, Math.min(200, value)) });
  };

  const handleFontFamilyChange = (value: string) => {
    updateObject(object.id, { fontFamily: value });
  };

  const handleFontStyleChange = (value: string) => {
    updateObject(object.id, { fontStyle: value });
  };

  const handleTextAlignChange = (value: string) => {
    updateObject(object.id, { textAlign: value });
  };

  const handleWidthChange = (value: number) => {
    updateObject(object.id, { width: Math.max(50, value) });
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
      {/* Text Content */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '600',
          color: '#374151',
          fontSize: '12px'
        }}>
          ✏️ Text Content (Double-click text to edit)
        </label>
        <textarea
          ref={textareaRef}
          value={object.text || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter text..."
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            minHeight: '80px',
            resize: 'vertical',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
          }}
        />
      </div>

      {/* Font Size */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Font Size
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="8"
            max="200"
            value={object.fontSize || 24}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="8"
            max="200"
            value={object.fontSize || 24}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            style={{
              width: '60px',
              padding: '4px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '11px'
            }}
          />
          <span style={{ color: '#9ca3af', fontSize: '10px' }}>px</span>
        </div>
      </div>

      {/* Font Family */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Font Family
        </label>
        <select
          value={object.fontFamily || 'Arial'}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '11px',
            boxSizing: 'border-box'
          }}
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
          <option value="Verdana">Verdana</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
        </select>
      </div>

      {/* Font Style */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Font Style
        </label>
        <select
          value={object.fontStyle || 'normal'}
          onChange={(e) => handleFontStyleChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '11px',
            boxSizing: 'border-box'
          }}
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="italic">Italic</option>
          <option value="bold italic">Bold Italic</option>
        </select>
      </div>

      {/* Text Alignment */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Text Alignment
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleTextAlignChange('left')}
            style={{
              flex: 1,
              padding: '6px',
              background: object.textAlign === 'left' ? '#3b82f6' : '#f3f4f6',
              color: object.textAlign === 'left' ? 'white' : '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500'
            }}
          >
            Left
          </button>
          <button
            onClick={() => handleTextAlignChange('center')}
            style={{
              flex: 1,
              padding: '6px',
              background: object.textAlign === 'center' ? '#3b82f6' : '#f3f4f6',
              color: object.textAlign === 'center' ? 'white' : '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500'
            }}
          >
            Center
          </button>
          <button
            onClick={() => handleTextAlignChange('right')}
            style={{
              flex: 1,
              padding: '6px',
              background: object.textAlign === 'right' ? '#3b82f6' : '#f3f4f6',
              color: object.textAlign === 'right' ? 'white' : '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500'
            }}
          >
            Right
          </button>
        </div>
      </div>

      {/* Text Width */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Text Box Width
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="50"
            value={Math.round(object.width)}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
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

export default TextEditor;

