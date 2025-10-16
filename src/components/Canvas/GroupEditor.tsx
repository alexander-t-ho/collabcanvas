import React from 'react';
import { CanvasObject } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';
import BaseEditor from './BaseEditor';

interface Props {
  object: CanvasObject;
}

const GroupEditor: React.FC<Props> = ({ object }) => {
  const { updateObject, objects, deleteObject, selectObject } = useCanvas();

  const handleMoveUp = () => {
    const maxZ = Math.max(...objects.map(obj => obj.zIndex || 0));
    // Move the group forward
    updateObject(object.id, { zIndex: maxZ + 1 });
    
    // Move all grouped objects forward
    if (object.groupedObjects) {
      object.groupedObjects.forEach(objId => {
        const groupedObj = objects.find(o => o.id === objId);
        if (groupedObj) {
          updateObject(objId, { zIndex: (groupedObj.zIndex || 0) + 1 });
        }
      });
    }
  };

  const handleMoveDown = () => {
    const minZ = Math.min(...objects.map(obj => obj.zIndex || 0));
    // Move the group backward
    updateObject(object.id, { zIndex: minZ - 1 });
    
    // Move all grouped objects backward
    if (object.groupedObjects) {
      object.groupedObjects.forEach(objId => {
        const groupedObj = objects.find(o => o.id === objId);
        if (groupedObj) {
          updateObject(objId, { zIndex: (groupedObj.zIndex || 0) - 1 });
        }
      });
    }
  };

  const handleRemoveFromGroup = (objectId: string) => {
    if (!object.groupedObjects) return;
    const newGroupedObjects = object.groupedObjects.filter(id => id !== objectId);
    if (newGroupedObjects.length === 0) {
      deleteObject(object.id);
    } else {
      updateObject(object.id, { groupedObjects: newGroupedObjects });
    }
  };

  const handleUngroupAll = () => {
    deleteObject(object.id);
  };

  const groupedCanvasObjects = object.groupedObjects
    ?.map(id => objects.find(obj => obj.id === id))
    .filter(Boolean) as CanvasObject[];

  return (
    <BaseEditor
      object={object}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      hideColorPicker={true}
    >
      {/* Ungroup Button - Above the list */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={handleUngroupAll}
          style={{
            width: '100%',
            padding: '10px',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            fontFamily: 'inherit',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#d97706';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f59e0b';
          }}
        >
          📦 Ungroup All Objects
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          color: '#374151',
          fontSize: '12px'
        }}>
          Objects in Group ({groupedCanvasObjects.length})
        </label>
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          maxHeight: '150px',
          overflowY: 'auto',
          backgroundColor: '#f9fafb'
        }}>
          {groupedCanvasObjects.map(obj => (
            <div
              key={obj.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderBottom: '1px solid #e5e7eb',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onDoubleClick={() => selectObject(obj.id)}
            >
              <span style={{ fontSize: '12px', color: '#374151' }}>
                {obj.nickname || `${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}`}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFromGroup(obj.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '0 4px'
                }}
                title="Remove from group"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: '6px',
          fontSize: '10px',
          color: '#6b7280',
          fontStyle: 'italic'
        }}>
          💡 Double-click to select individual object
        </div>
      </div>
    </BaseEditor>
  );
};

export default GroupEditor;

