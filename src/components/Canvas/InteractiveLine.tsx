import React, { useRef } from 'react';
import { Group, Line, Circle } from 'react-konva';
import { CanvasObject } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';

interface Props {
  object: CanvasObject;
  isSelected: boolean;
}

const InteractiveLine: React.FC<Props> = ({ object, isSelected }) => {
  const { updateObject, selectObject } = useCanvas();
  const groupRef = useRef<any>(null);

  const startX = object.x;
  const startY = object.y;
  const endX = object.x2 || object.x + object.width;
  const endY = object.y2 || object.y;
  const controlX = object.controlX || (startX + endX) / 2;
  const controlY = object.controlY || (startY + endY) / 2;

  // Handle dragging the entire line
  const handleLineDragEnd = (e: any) => {
    const deltaX = e.target.x();
    const deltaY = e.target.y();
    
    updateObject(object.id, {
      x: startX + deltaX,
      y: startY + deltaY,
      x2: endX + deltaX,
      y2: endY + deltaY,
      controlX: controlX + deltaX,
      controlY: controlY + deltaY,
    });

    // Reset the group position
    e.target.x(0);
    e.target.y(0);
  };

  // Handle dragging control points
  const handleControlPointDrag = (pointType: 'start' | 'end' | 'control') => (e: any) => {
    const newX = e.target.x();
    const newY = e.target.y();

    switch (pointType) {
      case 'start':
        updateObject(object.id, { x: newX, y: newY });
        break;
      case 'end':
        updateObject(object.id, { x2: newX, y2: newY });
        break;
      case 'control':
        updateObject(object.id, { 
          controlX: newX, 
          controlY: newY,
          curved: true // Make the line curved when control point is moved
        });
        break;
    }
  };

  // Generate points for the line (straight or curved)
  const getLinePoints = () => {
    if (object.curved && object.controlX !== undefined && object.controlY !== undefined) {
      // Generate points for quadratic curve
      const points = [];
      const steps = 20;
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Quadratic Bézier curve formula
        const x = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * controlX + Math.pow(t, 2) * endX;
        const y = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * endY;
        points.push(x, y);
      }
      
      return points;
    } else {
      // Straight line
      return [startX, startY, endX, endY];
    }
  };

  return (
    <Group
      ref={groupRef}
      draggable
      onDragEnd={handleLineDragEnd}
      onClick={() => selectObject(object.id)}
    >
      {/* Main line */}
      <Line
        points={getLinePoints()}
        stroke={object.fill}
        strokeWidth={object.strokeWidth || 3}
        lineCap="round"
        lineJoin="round"
        tension={object.curved ? 0.5 : 0}
      />
      
      {/* Control points - only show when selected */}
      {isSelected && (
        <>
          {/* Start point */}
          <Circle
            x={startX}
            y={startY}
            radius={6}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={2}
            draggable
            onDragEnd={handleControlPointDrag('start')}
          />
          
          {/* End point */}
          <Circle
            x={endX}
            y={endY}
            radius={6}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={2}
            draggable
            onDragEnd={handleControlPointDrag('end')}
          />
          
          {/* Control point (middle) */}
          <Circle
            x={controlX}
            y={controlY}
            radius={6}
            fill={object.curved ? "#ef4444" : "#10b981"}
            stroke="white"
            strokeWidth={2}
            draggable
            onDragEnd={handleControlPointDrag('control')}
          />
          
          {/* Helper lines to control point */}
          <Line
            points={[startX, startY, controlX, controlY, endX, endY]}
            stroke="#94a3b8"
            strokeWidth={1}
            dash={[5, 5]}
            opacity={0.5}
          />
        </>
      )}
    </Group>
  );
};

export default InteractiveLine;
