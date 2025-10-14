import React, { useEffect } from 'react';
import { useCursorSync } from '../../hooks/useCursorSync';
import RemoteCursor from './RemoteCursor';
import { CursorPosition } from '../../types';

interface Props {
  stageRef: React.RefObject<any>;
}

const CursorOverlay: React.FC<Props> = ({ stageRef }) => {
  const { remoteCursors, updateCursorPosition } = useCursorSync();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleMouseMove = (e: MouseEvent) => {
      const stage = stageRef.current;
      const pointerPosition = stage.getPointerPosition();
      
      if (pointerPosition) {
        // Convert screen coordinates to canvas coordinates
        const scale = stage.scaleX();
        const canvasX = (pointerPosition.x - stage.x()) / scale;
        const canvasY = (pointerPosition.y - stage.y()) / scale;
        
        updateCursorPosition(canvasX, canvasY);
      }
    };

    const container = stage.container();
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [stageRef, updateCursorPosition]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 999 }}>
      {remoteCursors.map((cursor: CursorPosition) => (
        <RemoteCursor key={cursor.userId} cursor={cursor} stageRef={stageRef} />
      ))}
    </div>
  );
};

export default CursorOverlay;