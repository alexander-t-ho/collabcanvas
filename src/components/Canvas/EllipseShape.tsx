import React, { useRef, useEffect } from 'react';
import { Ellipse, Circle, Group, Transformer } from 'react-konva';
import { useCanvas } from '../../contexts/CanvasContext';
import { CanvasObject } from '../../types';

interface EllipseShapeProps {
  object: CanvasObject;
  isSelected: boolean;
}

const EllipseShape: React.FC<EllipseShapeProps> = ({ object, isSelected }) => {
  const { updateObject, saveHistoryNow, selectObject } = useCanvas();
  const groupRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [isDraggingFocus, setIsDraggingFocus] = React.useState(false);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current && !isDraggingFocus) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isDraggingFocus]);

  const radiusX = object.radiusX || object.width / 2;
  const radiusY = object.radiusY || object.height / 2;
  const focus1 = object.focus1 || { x: -radiusX * 0.5, y: 0 };
  const focus2 = object.focus2 || { x: radiusX * 0.5, y: 0 };

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    selectObject(object.id);
  };

  const handleFocusDragStart = (e: any) => {
    e.cancelBubble = true;
    setIsDraggingFocus(true);
    
    if (groupRef.current) {
      groupRef.current.draggable(false);
    }
    
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  };

  const handleFocus1Drag = (e: any) => {
    e.cancelBubble = true;
    e.evt?.stopPropagation();
    
    const newX = e.target.x();
    const newY = e.target.y();
    
    // Calculate new radii based on focus point distance
    const distance = Math.sqrt(newX * newX + newY * newY);
    
    updateObject(object.id, {
      focus1: { x: newX, y: newY },
      radiusX: Math.max(Math.abs(newX), radiusX),
      radiusY: Math.max(Math.abs(newY), radiusY),
      width: Math.max(Math.abs(newX), radiusX) * 2,
      height: Math.max(Math.abs(newY), radiusY) * 2
    });
  };

  const handleFocus2Drag = (e: any) => {
    e.cancelBubble = true;
    e.evt?.stopPropagation();
    
    const newX = e.target.x();
    const newY = e.target.y();
    
    updateObject(object.id, {
      focus2: { x: newX, y: newY },
      radiusX: Math.max(Math.abs(newX), radiusX),
      radiusY: Math.max(Math.abs(newY), radiusY),
      width: Math.max(Math.abs(newX), radiusX) * 2,
      height: Math.max(Math.abs(newY), radiusY) * 2
    });
  };

  const handleFocusDragEnd = () => {
    setIsDraggingFocus(false);
    
    if (groupRef.current) {
      groupRef.current.draggable(true);
    }
    
    saveHistoryNow();
  };

  const handleTransform = (e: any) => {
    const node = groupRef.current;
    if (!node) return;

    const rotation = node.rotation();
    
    if (e.evt?.shiftKey) {
      const snappedRotation = Math.round(rotation / 45) * 45;
      node.rotation(snappedRotation);
    }
  };

  const handleTransformEnd = (e: any) => {
    const node = groupRef.current;
    if (!node) return;

    let rotation = node.rotation();

    if (e.evt?.shiftKey) {
      rotation = Math.round(rotation / 45) * 45;
    }

    updateObject(object.id, {
      rotation: Math.round(rotation)
    });

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
        {/* Ellipse shape */}
        <Ellipse
          radiusX={radiusX}
          radiusY={radiusY}
          fill={object.fill}
          opacity={object.opacity ?? 1}
          shadowEnabled={object.shadow || false}
          shadowBlur={object.shadow ? 15 : 0}
          shadowOffset={object.shadow ? { x: 5, y: 5 } : { x: 0, y: 0 }}
          shadowOpacity={object.shadow ? 0.5 : 0}
        />

        {/* Focus points (when selected) */}
        {isSelected && (
          <>
            {/* Focus point 1 */}
            <Circle
              x={focus1.x}
              y={focus1.y}
              radius={8}
              fill="#8b5cf6"
              stroke="#ffffff"
              strokeWidth={2}
              draggable
              onDragStart={handleFocusDragStart}
              onDragMove={handleFocus1Drag}
              onDragEnd={handleFocusDragEnd}
              onMouseEnter={(e) => {
                e.target.setAttr('radius', 10);
                e.target.getLayer()?.batchDraw();
              }}
              onMouseLeave={(e) => {
                e.target.setAttr('radius', 8);
                e.target.getLayer()?.batchDraw();
              }}
            />
            
            {/* Focus point 2 */}
            <Circle
              x={focus2.x}
              y={focus2.y}
              radius={8}
              fill="#8b5cf6"
              stroke="#ffffff"
              strokeWidth={2}
              draggable
              onDragStart={handleFocusDragStart}
              onDragMove={handleFocus2Drag}
              onDragEnd={handleFocusDragEnd}
              onMouseEnter={(e) => {
                e.target.setAttr('radius', 10);
                e.target.getLayer()?.batchDraw();
              }}
              onMouseLeave={(e) => {
                e.target.setAttr('radius', 8);
                e.target.getLayer()?.batchDraw();
              }}
            />
          </>
        )}
      </Group>
      
      {/* Transformer for rotation */}
      {isSelected && !isDraggingFocus && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          resizeEnabled={false}
          borderEnabled={false}
          anchorSize={8}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        />
      )}
    </>
  );
};

export default EllipseShape;

