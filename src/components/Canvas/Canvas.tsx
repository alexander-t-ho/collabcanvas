import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import Toolbar from './Toolbar';
import CanvasObject from './CanvasObject';
import CursorOverlay from '../Collaboration/CursorOverlay';

const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 3000;

const Canvas: React.FC = () => {
  const { objects, selectedId, selectObject } = useCanvas();
  const { currentUser, logout } = useAuth();
  const stageRef = useRef<any>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  // Handle canvas click to deselect
  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      selectObject(null);
    }
  };

  // Handle zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clampedScale = Math.max(0.1, Math.min(3, newScale));

    setStageScale(clampedScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Will be handled by Firebase sync hook
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Toolbar />
      
      {/* Logout button */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
        <button onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Logout ({currentUser?.displayName})
        </button>
      </div>
      
      <CursorOverlay stageRef={stageRef} />
      
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        draggable
        onClick={handleStageClick}
        onWheel={handleWheel}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#f5f5f5"
          />
          
          {objects.map(obj => (
            <CanvasObject key={obj.id} object={obj} isSelected={obj.id === selectedId} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;