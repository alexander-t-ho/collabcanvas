import React from 'react';
import { useCanvas } from '../../contexts/CanvasContext';

const MultiSelectEditor: React.FC = () => {
  const { selectedIds, objects, deleteObject, clearSelection, createGroup } = useCanvas();

  const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));

  const handleDeleteAll = async () => {
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected objects?`)) {
      // Delete all selected objects
      for (const id of selectedIds) {
        await deleteObject(id);
      }
      clearSelection();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      left: 20,
      top: 80,
      width: 280,
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      padding: '16px',
      zIndex: 1001,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '12px'
    }}>
      <div style={{ 
        fontWeight: '600', 
        marginBottom: '16px', 
        color: '#374151',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '8px',
        fontSize: '14px'
      }}>
        Multi-Select ({selectedIds.length} objects)
      </div>

      {/* Summary of selected objects */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: '500',
          color: '#6b7280'
        }}>
          Selected Objects:
        </label>
        <div style={{
          maxHeight: '150px',
          overflowY: 'auto',
          background: '#f9fafb',
          borderRadius: '4px',
          padding: '8px',
          border: '1px solid #e5e7eb'
        }}>
          {selectedObjects.map((obj, index) => (
            <div 
              key={obj.id} 
              style={{ 
                padding: '4px 0',
                borderBottom: index < selectedObjects.length - 1 ? '1px solid #e5e7eb' : 'none',
                fontSize: '11px',
                color: '#4b5563'
              }}
            >
              <span style={{ fontWeight: '600', color: '#374151' }}>
                {obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}
              </span>
              {obj.nickname && (
                <span style={{ marginLeft: '4px', color: '#6b7280' }}>
                  - {obj.nickname}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={createGroup}
          style={{
            width: '100%',
            padding: '10px',
            background: '#8b5cf6',
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
            e.currentTarget.style.background = '#7c3aed';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#8b5cf6';
          }}
        >
          📦 Group Objects
        </button>

        <button
          onClick={handleDeleteAll}
          style={{
            width: '100%',
            padding: '10px',
            background: '#ef4444',
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
            e.currentTarget.style.background = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ef4444';
          }}
        >
          🗑️ Delete All Selected
        </button>

        <button
          onClick={clearSelection}
          style={{
            width: '100%',
            padding: '8px',
            background: '#f3f4f6',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '12px',
            fontFamily: 'inherit',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e5e7eb';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          Clear Selection
        </button>
      </div>

      <div style={{
        marginTop: '12px',
        padding: '8px',
        background: '#eff6ff',
        borderRadius: '4px',
        fontSize: '10px',
        color: '#1e40af',
        lineHeight: '1.4'
      }}>
        💡 <strong>Tip:</strong> Hold Shift and drag on empty canvas to select multiple objects
      </div>
    </div>
  );
};

export default MultiSelectEditor;

