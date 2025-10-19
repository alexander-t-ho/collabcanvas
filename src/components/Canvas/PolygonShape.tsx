import React, { useRef } from 'react';
import { Line, Circle, Group } from 'react-konva';
import { useCanvas } from '../../contexts/CanvasContext';
import { CanvasObject } from '../../types';

interface PolygonShapeProps {
  object: CanvasObject;
  isSelected: boolean;
}

const PolygonShape: React.FC<PolygonShapeProps> = ({ object, isSelected }) => {
  const { updateObject, saveHistoryNow, selectObject } = useCanvas();
  const groupRef = useRef<any>(null);

  const sides = object.sides || 3;
  const baseSideLength = object.sideLength || 100;
  const customLengths = object.customSideLengths || [];
  const selectedSide = object.selectedSide;

  // Calculate polygon points
  const calculatePolygonPoints = (): number[] => {
    const points: number[] = [];
    const angleStep = (2 * Math.PI) / sides;
    
    // For regular polygon, calculate radius from side length
    const radius = baseSideLength / (2 * Math.sin(Math.PI / sides));
    
    for (let i = 0; i <= sides; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      
      // If custom side lengths exist, adjust vertex positions
      const currentRadius = customLengths[i % sides] 
        ? (customLengths[i % sides] / (2 * Math.sin(Math.PI / sides)))
        : radius;
      
      const x = Math.cos(angle) * currentRadius;
      const y = Math.sin(angle) * currentRadius;
      
      points.push(x, y);
    }
    
    return points;
  };

  // Calculate vertex positions for control points
  const calculateVertices = (): Array<{ x: number; y: number; index: number }> => {
    const vertices: Array<{ x: number; y: number; index: number }> = [];
    const angleStep = (2 * Math.PI) / sides;
    const radius = baseSideLength / (2 * Math.sin(Math.PI / sides));
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const currentRadius = customLengths[i] 
        ? (customLengths[i] / (2 * Math.sin(Math.PI / sides)))
        : radius;
      
      vertices.push({
        x: Math.cos(angle) * currentRadius,
        y: Math.sin(angle) * currentRadius,
        index: i
      });
    }
    
    return vertices;
  };

  const points = calculatePolygonPoints();
  const vertices = calculateVertices();

  const handleVertexDragStart = (e: any) => {
    // Disable polygon dragging when dragging a vertex
    if (groupRef.current) {
      groupRef.current.draggable(false);
    }
  };

  const handleVertexDrag = (index: number, e: any) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    // Calculate new side length based on vertex position
    const distance = Math.sqrt(newX * newX + newY * newY);
    const newSideLength = distance * 2 * Math.sin(Math.PI / sides);
    
    // Update custom side length
    const newCustomLengths = [...(customLengths.length > 0 ? customLengths : Array(sides).fill(baseSideLength))];
    newCustomLengths[index] = Math.round(newSideLength);
    
    updateObject(object.id, {
      customSideLengths: newCustomLengths
    });
  };

  const handleVertexDragEnd = () => {
    // Re-enable polygon dragging
    if (groupRef.current) {
      groupRef.current.draggable(true);
    }
    saveHistoryNow();
  };

  const handleSideClick = (index: number) => {
    updateObject(object.id, {
      selectedSide: selectedSide === index ? undefined : index
    });
  };

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    selectObject(object.id);
  };

  return (
    <Group
      ref={groupRef}
      x={object.x}
      y={object.y}
      rotation={object.rotation || 0}
      draggable
      onClick={handleClick}
      onDragEnd={(e) => {
        updateObject(object.id, {
          x: Math.round(e.target.x()),
          y: Math.round(e.target.y())
        });
        setTimeout(() => saveHistoryNow(), 300);
      }}
    >
      {/* Polygon shape */}
      <Line
        points={points}
        closed
        fill={object.fill}
        opacity={object.opacity ?? 1}
        shadowEnabled={object.shadow || false}
        shadowBlur={object.shadow ? 15 : 0}
        shadowOffset={object.shadow ? { x: 5, y: 5 } : { x: 0, y: 0 }}
        shadowOpacity={object.shadow ? 0.5 : 0}
      />

      {/* Vertex control points (when selected) */}
      {isSelected && vertices.map((vertex, idx) => (
        <React.Fragment key={idx}>
          {/* Highlight selected side */}
          {selectedSide === idx && (
            <Line
              points={[
                vertex.x, 
                vertex.y, 
                vertices[(idx + 1) % sides].x, 
                vertices[(idx + 1) % sides].y
              ]}
              stroke="#f59e0b"
              strokeWidth={4}
              opacity={0.8}
            />
          )}
          
          {/* Vertex control point */}
          <Circle
            x={vertex.x}
            y={vertex.y}
            radius={6}
            fill={selectedSide === idx ? '#f59e0b' : '#3b82f6'}
            stroke="#ffffff"
            strokeWidth={2}
            draggable
            onDragStart={handleVertexDragStart}
            onDragMove={(e) => handleVertexDrag(idx, e)}
            onDragEnd={handleVertexDragEnd}
            onClick={(e) => {
              e.cancelBubble = true;
              handleSideClick(idx);
            }}
          />
        </React.Fragment>
      ))}
    </Group>
  );
};

export default PolygonShape;

