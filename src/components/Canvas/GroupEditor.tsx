import React from 'react';
import { CanvasObject } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';
import BaseEditor from './BaseEditor';

interface Props {
  object: CanvasObject;
}

const GroupEditor: React.FC<Props> = ({ object }) => {
  const { updateObject, objects, deleteObject } = useCanvas();

  const groupedObjects = objects.filter(obj => 
    object.groupedObjects?.includes(obj.id)
  ).sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)); // Sort by z-index, highest first

  const handleRemoveFromGroup = (objectId: string) => {
    const updatedGroupedObjects = object.groupedObjects?.filter(id => id !== objectId) || [];
    
    if (updatedGroupedObjects.length <= 1) {
      // If only one object left, delete the group
      deleteObject(object.id);
    } else {
      // Update the group
      updateObject(object.id, { groupedObjects: updatedGroupedObjects });
    }
  };

  const handleMoveUp = () => {
    const currentZ = object.zIndex || 0;
    const maxZ = Math.max(...objects.map(obj => obj.zIndex || 0));
    if (currentZ < maxZ) {
      updateObject(object.id, { zIndex: currentZ + 1 });
      // Move all grouped objects up as well
      object.groupedObjects?.forEach(objId => {
        const obj = objects.find(o => o.id === objId);
        if (obj) {
          updateObject(objId, { zIndex: (obj.zIndex || 0) + 1 });
        }
      });
    }
  };

  const handleMoveDown = () => {
    const currentZ = object.zIndex || 0;
    const minZ = Math.min(...objects.map(obj => obj.zIndex || 0));
    if (currentZ > minZ) {
      updateObject(object.id, { zIndex: currentZ - 1 });
      // Move all grouped objects down as well
      object.groupedObjects?.forEach(objId => {
        const obj = objects.find(o => o.id === objId);
        if (obj) {
          updateObject(objId, { zIndex: (obj.zIndex || 0) - 1 });
        }
      });
    }
  };

  return (
    <BaseEditor 
      object={object} 
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      hideColorPicker={true} // Groups don't have colors
    >
      {/* Group Members List */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Group Members ({groupedObjects.length})
        </label>
        
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          background: '#f9fafb'
        }}>
          {groupedObjects.map((obj, index) => (
            <div
              key={obj.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: index < groupedObjects.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                {/* Object type indicator */}
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: obj.type === 'circle' ? '50%' : '2px',
                    background: obj.type === 'image' ? '#e5e7eb' : obj.fill,
                    border: '1px solid #d1d5db',
                    flexShrink: 0
                  }}
                >
                  {obj.type === 'image' && (
                    <span style={{ fontSize: '10px', lineHeight: '14px' }}>🖼️</span>
                  )}
                  {obj.type === 'line' && (
                    <span style={{ fontSize: '10px', lineHeight: '14px', color: 'white' }}>─</span>
                  )}
                </div>
                
                {/* Object info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {obj.nickname || `${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}`}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#9ca3af'
                  }}>
                    Layer {obj.zIndex || 0}
                  </div>
                </div>
              </div>
              
              {/* Remove button */}
              <button
                onClick={() => handleRemoveFromGroup(obj.id)}
                style={{
                  width: '20px',
                  height: '20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                }}
                title="Remove from group"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ungroup All Button */}
      <button
        onClick={() => deleteObject(object.id)}
        style={{
          width: '100%',
          padding: '8px',
          background: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '12px',
          fontFamily: 'inherit',
          marginBottom: '8px',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#d97706';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f59e0b';
        }}
      >
        Ungroup All
      </button>
    </BaseEditor>
  );
};

export default GroupEditor;
