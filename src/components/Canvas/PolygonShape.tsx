import React, { useRef, useEffect } from 'react';
import { Line, Circle, Group, Transformer } from 'react-konva';
import { useCanvas } from '../../contexts/CanvasContext';
import { CanvasObject } from '../../types';

interface PolygonShapeProps {
  object: CanvasObject;
  isSelected: boolean;
}

const PolygonShape: React.FC<PolygonShapeProps> = ({ object, isSelected }) => {
  const { updateObject, saveHistoryNow, selectObject } = useCanvas();
  const groupRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [isDraggingVertex, setIsDraggingVertex] = React.useState(false);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current && !isDraggingVertex) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isDraggingVertex]);

  const sides = object.sides || 3;
  const baseSideLength = object.sideLength || 100;
  const customLengths = object.customSideLengths || [];
  const customVertices = object.customVertices || [];
  const selectedSide = object.selectedSide;

  // Calculate polygon points
  const calculatePolygonPoints = (): number[] => {
    const points: number[] = [];
    
    // If custom vertices exist, use them
    if (customVertices.length === sides) {
      for (let i = 0; i <= sides; i++) {
        const vertex = customVertices[i % sides];
        points.push(vertex.x, vertex.y);
      }
      return points;
    }
    
    // Otherwise use regular polygon calculation
    const angleStep = (2 * Math.PI) / sides;
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
    // If custom vertices exist, use them
    if (customVertices.length === sides) {
      return customVertices.map((v, i) => ({ ...v, index: i }));
    }
    
    // Otherwise use regular polygon calculation
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
    e.cancelBubble = true;
    setIsDraggingVertex(true);
    
    // Disable polygon dragging when dragging a vertex
    if (groupRef.current) {
      groupRef.current.draggable(false);
    }
    
    // Detach transformer during vertex drag
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  };

  const handleVertexDrag = (index: number, e: any) => {
    e.cancelBubble = true;
    
    // Stop all event propagation to prevent group movement
    e.evt?.stopPropagation();
    e.evt?.preventDefault();
    
    const newX = e.target.x();
    const newY = e.target.y();
    
    // Initialize custom vertices if not already set
    const currentVertices = customVertices.length === sides 
      ? [...customVertices]
      : vertices.map(v => ({ x: v.x, y: v.y }));
    
    // Update the dragged vertex position
    currentVertices[index] = { x: newX, y: newY };
    
    updateObject(object.id, {
      customVertices: currentVertices,
      selectedSide: index // Also select this side
    });
  };

  const handleVertexDragEnd = (e: any) => {
    e.cancelBubble = true;
    e.evt?.stopPropagation();
    
    setIsDraggingVertex(false);
    
    // Re-enable polygon dragging
    if (groupRef.current) {
      groupRef.current.draggable(true);
    }
    
    saveHistoryNow();
  };

  const handleVertexClick = (index: number, e: any) => {
    e.cancelBubble = true;
    // Select this side for editing in the panel
    handleSideClick(index);
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

  const handleTransform = (e: any) => {
    const node = groupRef.current;
    if (!node) return;

    // Get rotation
    const rotation = node.rotation();
    
    // Snap to 45° if shift is pressed
    if (e.evt?.shiftKey) {
      const snappedRotation = Math.round(rotation / 45) * 45;
      node.rotation(snappedRotation);
    }
    
    // Get scale
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Update sideLength based on scale
    if (scaleX !== 1 || scaleY !== 1) {
      const avgScale = (scaleX + scaleY) / 2;
      const newSideLength = baseSideLength * avgScale;
      
      updateObject(object.id, {
        sideLength: Math.round(newSideLength),
        width: object.width * scaleX,
        height: object.height * scaleY
      });
      
      // Reset scale to 1 to prevent compound scaling
      node.scaleX(1);
      node.scaleY(1);
    }
  };

  const handleTransformEnd = (e: any) => {
    const node = groupRef.current;
    if (!node) return;

    let rotation = node.rotation();
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Apply shift-snap for final rotation
    if (e.evt?.shiftKey) {
      rotation = Math.round(rotation / 45) * 45;
    }

    const updates: any = {
      rotation: Math.round(rotation)
    };

    // Apply final scale if changed
    if (scaleX !== 1 || scaleY !== 1) {
      const avgScale = (scaleX + scaleY) / 2;
      updates.sideLength = Math.round(baseSideLength * avgScale);
      updates.width = Math.round(object.width * scaleX);
      updates.height = Math.round(object.height * scaleY);
      
      // If custom vertices exist, scale them too
      if (customVertices.length === sides) {
        updates.customVertices = customVertices.map(v => ({
          x: v.x * avgScale,
          y: v.y * avgScale
        }));
      }
      
      // Reset scale
      node.scaleX(1);
      node.scaleY(1);
    }

    updateObject(object.id, updates);
    setTimeout(() => saveHistoryNow(), 300);
  };

  return (
    <>
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
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
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
            radius={8}
            fill={selectedSide === idx ? '#f59e0b' : '#3b82f6'}
            stroke="#ffffff"
            strokeWidth={2}
            draggable
            onDragStart={handleVertexDragStart}
            onDragMove={(e) => handleVertexDrag(idx, e)}
            onDragEnd={handleVertexDragEnd}
            onClick={(e) => handleVertexClick(idx, e)}
            onMouseEnter={(e) => {
              e.target.setAttr('radius', 10);
              e.target.getLayer()?.batchDraw();
            }}
            onMouseLeave={(e) => {
              e.target.setAttr('radius', 8);
              e.target.getLayer()?.batchDraw();
            }}
          />
        </React.Fragment>
      ))}
      </Group>
      
      {/* Transformer for rotation and resize handles */}
      {isSelected && !isDraggingVertex && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          resizeEnabled={true}
          borderEnabled={true}
          borderStroke="#3b82f6"
          borderStrokeWidth={2}
          anchorSize={8}
          anchorStroke="#3b82f6"
          anchorFill="#ffffff"
          anchorCornerRadius={2}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          keepRatio={false}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'middle-right', 'bottom-center', 'middle-left']}
        />
      )}
    </>
  );
};

export default PolygonShape;

