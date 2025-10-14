import React, { useState, useEffect } from 'react';
import { CursorPosition } from '../../types';

interface Props {
  cursor: CursorPosition;
  stageRef: React.RefObject<any>;
}

const RemoteCursor: React.FC<Props> = ({ cursor, stageRef }) => {
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updatePosition = () => {
      const scale = stage.scaleX();
      const screenX = cursor.x * scale + stage.x();
      const screenY = cursor.y * scale + stage.y();
      
      setScreenPosition({ x: screenX, y: screenY });
    };

    updatePosition();

    // Update position when stage transforms
    const interval = setInterval(updatePosition, 16); // ~60fps

    return () => clearInterval(interval);
  }, [cursor.x, cursor.y, stageRef]);

  return (
    <div
      style={{
        position: 'absolute',
        left: screenPosition.x,
        top: screenPosition.y,
        pointerEvents: 'none',
        transition: 'all 0.1s ease-out'
      }}
    >
      {/* Cursor SVG */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill={cursor.color}>
        <path d="M5 3l14 9-6 1-1 6z" />
      </svg>
      
      {/* Name label */}
      <div
        style={{
          marginTop: 2,
          marginLeft: 12,
          padding: '2px 8px',
          background: cursor.color,
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap'
        }}
      >
        {cursor.name}
      </div>
    </div>
  );
};

export default RemoteCursor;