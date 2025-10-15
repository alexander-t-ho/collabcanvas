import React, { useRef, useEffect, useState } from 'react';
import { Rect, Circle, Image as KonvaImage, Transformer, Text } from 'react-konva';
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
  const [isEditingText, setIsEditingText] = useState(false);

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
      if (selectedIds.includes(object.id)) {
        removeFromSelection(object.id);
      } else {
        addToSelection(object.id);
      }
    } else {
      selectObject(object.id);
    }
  };

  // Handle double-click for text - enable editing on canvas
  const handleDoubleClick = (e: any) => {
    if (object.type === 'text') {
      e.cancelBubble = true;
      setIsEditingText(true);
      
      // Create a temporary HTML text input at the text position
      const textNode = shapeRef.current;
      if (!textNode) return;
      
      const stage = textNode.getStage();
      const textPosition = textNode.absolutePosition();
      const stageBox = stage.container().getBoundingClientRect();
      
      // Calculate position accounting for stage transform
      const scale = stage.scaleX();
      const rotation = object.rotation || 0;
      
      const areaPosition = {
        x: stageBox.left + textPosition.x * scale + stage.x(),
        y: stageBox.top + textPosition.y * scale + stage.y(),
      };

      // Create textarea at the exact position
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      textarea.value = object.text || '';
      textarea.style.position = 'absolute';
      textarea.style.left = `${areaPosition.x}px`;
      textarea.style.top = `${areaPosition.y}px`;
      textarea.style.width = `${object.width * scale}px`;
      textarea.style.fontSize = `${(object.fontSize || 24) * scale}px`;
      textarea.style.fontFamily = object.fontFamily || 'Arial';
      textarea.style.fontWeight = object.fontStyle?.includes('bold') ? 'bold' : 'normal';
      textarea.style.fontStyle = object.fontStyle?.includes('italic') ? 'italic' : 'normal';
      textarea.style.color = object.fill;
      textarea.style.background = 'white';
      textarea.style.border = '2px solid #3b82f6';
      textarea.style.borderRadius = '4px';
      textarea.style.padding = '4px';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.overflow = 'hidden';
      textarea.style.lineHeight = '1.2';
      textarea.style.transform = `rotate(${rotation}deg)`;
      textarea.style.transformOrigin = 'top left';
      textarea.style.zIndex = '1000';
      textarea.style.caretColor = '#ef4444'; // Red blinking cursor
      textarea.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';

      textarea.focus();
      textarea.select();

      const removeTextarea = () => {
        textarea.parentNode?.removeChild(textarea);
        setIsEditingText(false);
      };

      textarea.addEventListener('blur', () => {
        updateObject(object.id, { text: textarea.value });
        removeTextarea();
      });

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          removeTextarea();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          updateObject(object.id, { text: textarea.value });
          removeTextarea();
        }
        // Stop propagation to prevent canvas shortcuts
        e.stopPropagation();
      });

      // Update text live as user types
      textarea.addEventListener('input', () => {
        updateObject(object.id, { text: textarea.value });
      });
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
        rotation,
      });
    } else if (object.type === 'text') {
      // For text with offset, only change width not font size
      const newWidth = Math.max(50, node.width() * scaleX);
      
      // Position is at center due to offset
      const centerX = node.x();
      const centerY = node.y();
      
      updateObject(object.id, {
        x: centerX,
        y: centerY,
        width: newWidth,
        // Font size stays the same - only text box width changes
        rotation,
      });
    } else if (object.type === 'rectangle' || object.type === 'image') {
      // For rectangles and images with offset, we need to adjust position
      const newWidth = Math.max(5, node.width() * scaleX);
      const newHeight = Math.max(5, node.height() * scaleY);
      
      // When using offsetX/offsetY, Konva position is at the center
      // We need to convert back to top-left corner for storage
      const centerX = node.x();
      const centerY = node.y();
      const topLeftX = centerX; // Keep center as position for consistency
      const topLeftY = centerY;
      
      updateObject(object.id, {
        x: topLeftX,
        y: topLeftY,
        width: newWidth,
        height: newHeight,
        rotation,
      });
    } else {
      updateObject(object.id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation,
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
            rotation={object.rotation || 0}
            offsetX={object.width / 2}
            offsetY={object.height / 2}
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
            rotation={object.rotation || 0}
            // Circles naturally rotate around center, no offset needed
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
            rotation={object.rotation || 0}
            offsetX={object.width / 2} // Rotate around center
            offsetY={object.height / 2} // Rotate around center
            cornerRadius={object.cornerRadius || 0} // Add corner radius support
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
      case 'text':
        return (
          <Text
            ref={shapeRef}
            x={object.x}
            y={object.y}
            width={object.width}
            text={object.text || 'Double-click to edit'}
            fontSize={object.fontSize || 24}
            fontFamily={object.fontFamily || 'Arial'}
            fontStyle={object.fontStyle || 'normal'}
            fill={object.fill}
            align={object.textAlign || 'left'}
            rotation={object.rotation || 0}
            offsetX={object.width / 2}
            offsetY={(object.fontSize || 24) / 2}
            visible={!isEditingText}
            shadowEnabled={object.shadow || false}
            shadowBlur={object.shadow ? 15 : 0}
            shadowOffset={object.shadow ? { x: 5, y: 5 } : { x: 0, y: 0 }}
            shadowOpacity={object.shadow ? 0.5 : 0}
            draggable
            onClick={handleClick}
            onDblClick={handleDoubleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        );
      case 'group':
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