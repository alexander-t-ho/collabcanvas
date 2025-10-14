import React, { useRef, useEffect } from 'react';
import { Rect, Circle, Text as KonvaText, Transformer } from 'react-konva';
import { CanvasObject as CanvasObjectType } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';

interface Props {
  object: CanvasObjectType;
  isSelected: boolean;
}

const CanvasObject: React.FC<Props> = ({ object, isSelected }) => {
  const { updateObject, selectObject } = useCanvas();
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: any) => {
    updateObject(object.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = (e: any) => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    updateObject(object.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
    });
  };

  const renderShape = () => {
    switch (object.type) {
      case 'rectangle':
        return (
          <Rect
            ref={shapeRef}
            x={object.x}
            y={object.y}
            width={object.width}
            height={object.height}
            fill={object.fill}
            draggable
            onClick={() => selectObject(object.id)}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        );
      case 'circle':
        return (
          <Circle
            ref={shapeRef}
            x={object.x}
            y={object.y}
            radius={object.width / 2}
            fill={object.fill}
            draggable
            onClick={() => selectObject(object.id)}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        );
      case 'text':
        return (
          <KonvaText
            ref={shapeRef}
            x={object.x}
            y={object.y}
            text="Sample Text"
            fontSize={24}
            fill={object.fill}
            draggable
            onClick={() => selectObject(object.id)}
            onDragEnd={handleDragEnd}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderShape()}
      {isSelected && <Transformer ref={transformerRef} />}
    </>
  );
};

export default CanvasObject;