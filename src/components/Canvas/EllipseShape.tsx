import React, { useRef, useEffect } from 'react';
import { Ellipse, Group, Transformer } from 'react-konva';
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

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const radiusX = object.radiusX || object.width / 2;
  const radiusY = object.radiusY || object.height / 2;

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    selectObject(object.id);
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

      </Group>
      
      {/* Transformer for rotation */}
      {isSelected && (
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

