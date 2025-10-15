import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import Toolbar from './Toolbar';
import CanvasObject from './CanvasObject';
import RectangleEditor from './RectangleEditor';
import CircleEditor from './CircleEditor';
import LineEditor from './LineEditor';
import ImageEditor from './ImageEditor';
import GroupEditor from './GroupEditor';
import ImageImport from './ImageImport';
import CursorOverlay from '../Collaboration/CursorOverlay';

const GRID_SIZE = 25; // Grid cell size in pixels

const Canvas: React.FC = () => {
  const { 
    objects, 
    selectedId,
    selectedIds,
    selectObject,
    addToSelection,
    clearSelection,
    drawingMode, 
    setDrawingMode, 
    tempLineStart, 
    setTempLineStart,
    addObject
  } = useCanvas();
  const { currentUser } = useAuth();
  const stageRef = useRef<any>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [gridLines, setGridLines] = useState<React.ReactNode[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [alignmentGuides, setAlignmentGuides] = useState<React.ReactNode[]>([]);
  const [showImageImport, setShowImageImport] = useState(false);

  // Generate grid lines based on current view
  const generateGridLines = useCallback((): React.ReactNode[] => {
    const lines: React.ReactNode[] = [];
    const stage = stageRef.current;
    
    if (!stage) return lines;

    // Calculate visible area
    const scale = stage.scaleX();
    const viewBox = {
      x: -stagePosition.x / scale,
      y: -stagePosition.y / scale,
      width: window.innerWidth / scale,
      height: window.innerHeight / scale
    };

    // Add some padding to draw grid lines outside visible area
    const padding = GRID_SIZE * 10;
    const startX = Math.floor((viewBox.x - padding) / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil((viewBox.x + viewBox.width + padding) / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor((viewBox.y - padding) / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil((viewBox.y + viewBox.height + padding) / GRID_SIZE) * GRID_SIZE;

    // Vertical lines
    for (let x = startX; x <= endX; x += GRID_SIZE) {
      lines.push(
        <Line
          key={`vertical-${x}`}
          points={[x, startY, x, endY]}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      lines.push(
        <Line
          key={`horizontal-${y}`}
          points={[startX, y, endX, y]}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      );
    }

    return lines;
  }, [stagePosition.x, stagePosition.y, stageScale]);

  // Update grid when position or scale changes
  useEffect(() => {
    setGridLines(generateGridLines());
  }, [generateGridLines]);

  // Generate alignment guides for object being dragged
  const generateAlignmentGuides = useCallback((draggedObject: any, draggedPos: { x: number, y: number }) => {
    const guides: React.ReactNode[] = [];
    const threshold = 100;

    objects.forEach((obj, index) => {
      if (obj.id === draggedObject?.id) return;

      const objCenterX = obj.x + obj.width / 2;
      const objCenterY = obj.y + obj.height / 2;
      const draggedCenterX = draggedPos.x + (draggedObject?.width || 0) / 2;
      const draggedCenterY = draggedPos.y + (draggedObject?.height || 0) / 2;

      // Vertical alignment (same X)
      if (Math.abs(objCenterX - draggedCenterX) < threshold) {
        guides.push(
          <Line
            key={`v-${index}`}
            points={[objCenterX, Math.min(obj.y, draggedPos.y) - 50, objCenterX, Math.max(obj.y + obj.height, draggedPos.y + (draggedObject?.height || 0)) + 50]}
            stroke="#ff4444"
            strokeWidth={1}
            dash={[5, 5]}
            opacity={0.8}
          />
        );
      }

      // Horizontal alignment (same Y)
      if (Math.abs(objCenterY - draggedCenterY) < threshold) {
        guides.push(
          <Line
            key={`h-${index}`}
            points={[Math.min(obj.x, draggedPos.x) - 50, objCenterY, Math.max(obj.x + obj.width, draggedPos.x + (draggedObject?.width || 0)) + 50, objCenterY]}
            stroke="#ff4444"
            strokeWidth={1}
            dash={[5, 5]}
            opacity={0.8}
          />
        );
      }
    });

    return guides;
  }, [objects]);

  // Handle mouse movement for line drawing and alignment guides
  const handleMouseMove = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    const scale = stage.scaleX();
    const canvasX = (pos.x - stage.x()) / scale;
    const canvasY = (pos.y - stage.y()) / scale;
    
    setMousePosition({ x: canvasX, y: canvasY });
  };

  // Handle canvas click for selection and line drawing
  const handleStageClick = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    // If we clicked on the stage itself (not an object)
    if (e.target === stage) {
      if (drawingMode === 'line' && currentUser) {
        // Get click position in canvas coordinates
        const pos = stage.getPointerPosition();
        const scale = stage.scaleX();
        const canvasX = (pos.x - stage.x()) / scale;
        const canvasY = (pos.y - stage.y()) / scale;

        if (!tempLineStart) {
          // First click - set start point
          setTempLineStart({ x: canvasX, y: canvasY });
        } else {
          // Second click - create the line
          const lineLength = Math.sqrt(
            Math.pow(canvasX - tempLineStart.x, 2) + 
            Math.pow(canvasY - tempLineStart.y, 2)
          );
          
          // Calculate control point for initial straight line (middle point)
          const controlX = (tempLineStart.x + canvasX) / 2;
          const controlY = (tempLineStart.y + canvasY) / 2;

          addObject({
            type: 'line',
            x: tempLineStart.x,
            y: tempLineStart.y,
            x2: canvasX,
            y2: canvasY,
            width: lineLength,
            height: 0,
            controlX,
            controlY,
            curved: false, // Start as straight line
            fill: '#' + Math.floor(Math.random() * 16777215).toString(16),
            strokeWidth: 3,
            nickname: '',
            zIndex: 0,
            shadow: false,
            createdBy: currentUser.uid,
          });

          // Reset drawing mode
          setTempLineStart(null);
          setDrawingMode('none');
        }
      } else {
        // Normal click - check for multi-select modifier
        const isMultiSelect = e.evt?.ctrlKey || e.evt?.metaKey;
        if (!isMultiSelect) {
          clearSelection();
        }
      }
    }
  };

  // Handle zoom with improved constraints
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clampedScale = Math.max(0.1, Math.min(5, newScale)); // Allow more zoom range

    setStageScale(clampedScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Delete is now handled by individual editors
      }
      
      // Reset view with 'R' key
      if (e.key === 'r' || e.key === 'R') {
        setStageScale(1);
        setStagePosition({ x: 0, y: 0 });
      }

      // Cancel line drawing with Escape
      if (e.key === 'Escape' && drawingMode === 'line') {
        setDrawingMode('none');
        setTempLineStart(null);
      }
    };
    
    const handleImageImportEvent = () => {
      setShowImageImport(true);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openImageImport', handleImageImportEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openImageImport', handleImageImportEvent);
    };
  }, [selectedId, drawingMode, setDrawingMode, setTempLineStart]);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden', 
      position: 'relative',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Toolbar />
      <div style={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'hidden'
      }}>
      <CursorOverlay stageRef={stageRef} />
      
      <Stage
        ref={stageRef}
        width={window.innerWidth}
          height={window.innerHeight - 60} // Account for toolbar height
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        draggable
        onClick={handleStageClick}
          onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      >
          {/* Grid Layer */}
          <Layer>
            {gridLines}
          </Layer>
          
          {/* Alignment Guides Layer */}
        <Layer>
            {alignmentGuides}
          </Layer>
          
          {/* Objects Layer */}
          <Layer>
            {objects
              .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) // Sort by zIndex
              .map(obj => (
                <CanvasObject 
                  key={obj.id} 
                  object={obj} 
                  isSelected={selectedIds.includes(obj.id)}
                  onDrag={(position) => {
                    const guides = generateAlignmentGuides(obj, position);
                    setAlignmentGuides(guides);
                  }}
                  onDragEnd={() => setAlignmentGuides([])}
                />
              ))}
            
            
            {/* Preview line while drawing - follows cursor */}
            {drawingMode === 'line' && tempLineStart && (
              <Line
                points={[tempLineStart.x, tempLineStart.y, mousePosition.x, mousePosition.y]}
                stroke="#94a3b8"
                strokeWidth={2}
                dash={[10, 5]}
                opacity={0.7}
                lineCap="round"
              />
            )}
        </Layer>
      </Stage>
        
        {/* Mini controls in bottom right */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px',
          color: '#6b7280',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {drawingMode === 'line' ? (
            <div>
              {!tempLineStart ? (
                <span style={{ color: '#f59e0b', fontWeight: '500' }}>
                  Click to start drawing line
                </span>
              ) : (
                <span style={{ color: '#dc2626', fontWeight: '500' }}>
                  Click to finish line | ESC to cancel
                </span>
              )}
            </div>
          ) : (
            <span>Zoom: {Math.round(stageScale * 100)}% | Press R to reset view</span>
          )}
        </div>

        {/* Shape Editors - Fixed position on left */}
        {selectedId && (() => {
          const selectedObject = objects.find(obj => obj.id === selectedId);
          if (selectedObject) {
            if (selectedObject.type === 'rectangle') {
              return <RectangleEditor object={selectedObject} />;
            } else if (selectedObject.type === 'circle') {
              return <CircleEditor object={selectedObject} />;
            } else if (selectedObject.type === 'line') {
              return <LineEditor object={selectedObject} />;
            } else if (selectedObject.type === 'image') {
              return <ImageEditor object={selectedObject} />;
            } else if (selectedObject.type === 'group') {
              return <GroupEditor object={selectedObject} />;
            }
          }
          return null;
        })()}

        {/* Image Import Modal */}
        {showImageImport && (
          <ImageImport onClose={() => setShowImageImport(false)} />
        )}
      </div>
    </div>
  );
};

export default Canvas;