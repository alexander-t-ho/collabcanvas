import React from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';

const Toolbar: React.FC = () => {
  const { addObject, deleteObject, selectedId } = useCanvas();
  const { currentUser } = useAuth();

  const handleCreateRectangle = () => {
    if (!currentUser) return;
    
    addObject({
      type: 'rectangle',
      x: Math.random() * 500 + 100,
      y: Math.random() * 500 + 100,
      width: 100,
      height: 100,
      fill: '#' + Math.floor(Math.random()*16777215).toString(16),
      createdBy: currentUser.uid,
    });
  };

  const handleDelete = () => {
    if (selectedId) {
      deleteObject(selectedId);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 1000,
      background: 'white',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      display: 'flex',
      gap: '10px'
    }}>
      <button onClick={handleCreateRectangle} style={{ padding: '8px 16px' }}>
        Add Rectangle
      </button>
      <button 
        onClick={handleDelete} 
        disabled={!selectedId}
        style={{ padding: '8px 16px' }}
      >
        Delete
      </button>
    </div>
  );
};

export default Toolbar;