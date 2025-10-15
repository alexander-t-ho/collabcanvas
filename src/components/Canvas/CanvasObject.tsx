import React, { useRef, useEffect, useState } from 'react';
import { Rect, Circle, Image as KonvaImage, Transformer } from 'react-konva';
import { CanvasObject as CanvasObjectType } from '../../types';
import { useCanvas } from '../../contexts/CanvasContext';
import InteractiveLine from './InteractiveLine';

interface Props {
  object: CanvasObjectType;
  isSelected: boolean;
  onDrag?: (position: { x: number; y: number }) => void;
  onDragEnd?: () => void;
}

const CanvasObject: React.FC<Props> = ({ object, isSelected, onDrag, onDragEnd }) => {
  const { updateObject, updateObjectLive, selectObject, selectedIds, addToSelection, removeFromSelection } = useCanvas();
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Handle click with multi-selection support
  const handleClick = (e: any) => {
    const isMultiSelect = e.evt?.ctrlKey || e.evt?.metaKey;
    
    if (isMultiSelect) {
      // Multi-select mode: add/remove from selection
      if (selectedIds.includes(object.id)) {
        removeFromSelection(object.id);
      } else {
        addToSelection(object.id);
      }
    } else {
      // Single select mode
      selectObject(object.id);
    }
  };
  useEffect(() => {
    if (object.type === 'image' && object.src) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
      };
      img.src = object.src;
    }
  }, [object.type, object.src]);

  const handleDragMove = (e: any) => {
    if (onDrag && (object.type === 'rectangle' || object.type === 'circle' || object.type === 'image')) {
      const newX = e.target.x();
      const newY = e.target.y();
      onDrag({ x: newX, y: newY });
      
      // Update local state immediately for real-time feedback
      updateObjectLive(object.id, { x: newX, y: newY });
    }
  };

  const handleDragEnd = (e: any) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    if (object.type === 'line') {
      // For lines, we need to update both start and end points
      const deltaX = newX - object.x;
      const deltaY = newY - object.y;
      
      updateObject(object.id, {
        x: newX,
        y: newY,
        x2: (object.x2 || 0) + deltaX,
        y2: (object.y2 || 0) + deltaY,
      });
    } else {
      updateObject(object.id, {
        x: newX,
        y: newY,
      });
    }

    // Clear alignment guides
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const handleTransformEnd = (e: any) => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    node.scaleX(1);
    node.scaleY(1);

    if (object.type === 'line') {
      // For lines, scaling affects the end points
      const newWidth = Math.max(5, node.width() * scaleX);
      const newHeight = Math.max(5, node.height() * scaleY);
      
      updateObject(object.id, {
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
        x2: node.x() + newWidth,
        y2: node.y() + newHeight,
        rotation: rotation * 180 / Math.PI, // Convert radians to degrees
      });
    } else {
      updateObject(object.id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: rotation * 180 / Math.PI, // Convert radians to degrees
      });
    }
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
            cornerRadius={object.cornerRadius || 0}
            rotation={object.rotation || 0} // Add rotation
            shadowEnabled={object.shadow || false}
            shadowBlur={object.shadow ? 15 : 0}
            shadowOffset={object.shadow ? { x: 5, y: 5 } : { x: 0, y: 0 }}
            shadowOpacity={object.shadow ? 0.5 : 0}
            draggable
            onClick={handleClick}
            onDragMove={handleDragMove}
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
            rotation={object.rotation || 0} // Add rotation
            shadowEnabled={object.shadow || false}
            shadowBlur={object.shadow ? 15 : 0}
            shadowOffset={object.shadow ? { x: 5, y: 5 } : { x: 0, y: 0 }}
            shadowOpacity={object.shadow ? 0.5 : 0}
            draggable
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        );
      case 'line':
        return (
          <InteractiveLine
            object={object}
            isSelected={isSelected}
          />
        );
      case 'image':
        return image ? (
          <KonvaImage
            ref={shapeRef}
            x={object.x}
            y={object.y}
            width={object.width}
            height={object.height}
            image={image}
            rotation={object.rotation || 0} // Add rotation
            shadowEnabled={object.shadow || false}
            shadowBlur={object.shadow ? 15 : 0}
            shadowOffset={object.shadow ? { x: 5, y: 5 } : { x: 0, y: 0 }}
            shadowOpacity={object.shadow ? 0.5 : 0}
            draggable
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        ) : null;
      case 'group':
        // Groups render as a dashed border around grouped objects
        return (
          <Rect
            ref={shapeRef}
            x={object.x}
            y={object.y}
            width={object.width}
            height={object.height}
            fill="transparent"
            stroke={isSelected ? "#3b82f6" : "#94a3b8"}
            strokeWidth={2}
            dash={[10, 5]}
            opacity={0.8}
            draggable
            onClick={handleClick}
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
      {isSelected && object.type !== 'line' && object.type !== 'group' && <Transformer ref={transformerRef} />}
    </>
  );
};

export default CanvasObject;