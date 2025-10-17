import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import Toolbar from './Toolbar';
import CanvasObject from './CanvasObject';
import RectangleEditor from './RectangleEditor';
import CircleEditor from './CircleEditor';
import LineEditor from './LineEditor';
import ImageEditor from './ImageEditor';
import TextEditor from './TextEditor';
import GroupEditor from './GroupEditor';
import MultiSelectEditor from './MultiSelectEditor';
import ImageImport from './ImageImport';
import CursorOverlay from '../Collaboration/CursorOverlay';
import ChatWindow from './ChatWindow';

const GRID_SIZE = 25; // Grid cell size in pixels (25 pixels = 1 unit)

const Canvas: React.FC = () => {
  const { 
    objects, 
    selectedId,
    selectedIds,
    clearSelection,
    selectMultiple,
    drawingMode, 
    setDrawingMode, 
    tempLineStart, 
    setTempLineStart,
    addObject,
    deleteObject,
    undo,
    redo,
    canUndo,
    canRedo
  } = useCanvas();
  const { currentUser } = useAuth();
  const stageRef = useRef<any>(null);
  const [stageScale, setStageScale] = useState(1.3); // Start at 130% (new 100%)
  const [stagePosition, setStagePosition] = useState({ 
    x: window.innerWidth / 2, 
    y: (window.innerHeight - 60) / 2 // Account for toolbar height
  });
  const [gridLines, setGridLines] = useState<React.ReactNode[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [alignmentGuides, setAlignmentGuides] = useState<React.ReactNode[]>([]);
  const [showImageImport, setShowImageImport] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [showAxes, setShowAxes] = useState(true);

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
      height: (window.innerHeight - 60) / scale
    };

    // Add some padding to draw grid lines outside visible area
    const padding = GRID_SIZE * 10;
    const startX = Math.floor((viewBox.x - padding) / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil((viewBox.x + viewBox.width + padding) / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor((viewBox.y - padding) / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil((viewBox.y + viewBox.height + padding) / GRID_SIZE) * GRID_SIZE;

    // Vertical lines
    for (let x = startX; x <= endX; x += GRID_SIZE) {
      // Skip the Y-axis line (x=0) as we'll draw it separately
      if (x === 0 && showAxes) continue;
      
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
      // Skip the X-axis line (y=0) as we'll draw it separately
      if (y === 0 && showAxes) continue;
      
      lines.push(
        <Line
          key={`horizontal-${y}`}
          points={[startX, y, endX, y]}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      );
    }

    // Draw origin axes if enabled (0,0)
    if (showAxes) {
      // Y-axis (vertical line at x=0)
      lines.push(
        <Line
          key="axis-y"
          points={[0, startY, 0, endY]}
          stroke="#3b82f6"
          strokeWidth={2}
          opacity={0.6}
        />
      );
      
      // X-axis (horizontal line at y=0)
      lines.push(
        <Line
          key="axis-x"
          points={[startX, 0, endX, 0]}
          stroke="#3b82f6"
          strokeWidth={2}
          opacity={0.6}
        />
      );
    }

    return lines;
  }, [stagePosition.x, stagePosition.y, showAxes]);

  // Update grid when position or scale changes
  useEffect(() => {
    setGridLines(generateGridLines());
  }, [generateGridLines]);

  // Generate alignment guides for object being dragged
  const generateAlignmentGuides = useCallback((draggedObject: any, draggedPos: { x: number, y: number }) => {
    const guides: React.ReactNode[] = [];
    const snapThreshold = 10; // Only show guides when within 10px (snapping range)
    const stage = stageRef.current;
    if (!stage) return guides;

    // Calculate visible area for guide lines
    const scale = stage.scaleX();
    const viewBox = {
      x: -stagePosition.x / scale,
      y: -stagePosition.y / scale,
      width: window.innerWidth / scale,
      height: window.innerHeight / scale
    };

    const draggedCenterX = draggedPos.x;
    const draggedCenterY = draggedPos.y;

    // Check alignment with X-axis (Y = 0)
    const distanceToXAxis = Math.abs(draggedCenterY);
    if (distanceToXAxis < snapThreshold) {
      guides.push(
        <Line
          key="axis-x-guide"
          points={[
            viewBox.x,
            0,
            viewBox.x + viewBox.width,
            0
          ]}
          stroke="#f59e0b"
          strokeWidth={3}
          dash={[10, 5]}
          opacity={1}
        />
      );
      guides.push(
        <Circle
          key="axis-x-marker"
          x={draggedCenterX}
          y={0}
          radius={6}
          fill="#f59e0b"
          opacity={0.9}
        />
      );
    }

    // Check alignment with Y-axis (X = 0)
    const distanceToYAxis = Math.abs(draggedCenterX);
    if (distanceToYAxis < snapThreshold) {
      guides.push(
        <Line
          key="axis-y-guide"
          points={[
            0,
            viewBox.y,
            0,
            viewBox.y + viewBox.height
          ]}
          stroke="#f59e0b"
          strokeWidth={3}
          dash={[10, 5]}
          opacity={1}
        />
      );
      guides.push(
        <Circle
          key="axis-y-marker"
          x={0}
          y={draggedCenterY}
          radius={6}
          fill="#f59e0b"
          opacity={0.9}
        />
      );
    }

    // Check alignment with origin (0, 0)
    if (distanceToXAxis < snapThreshold && distanceToYAxis < snapThreshold) {
      guides.push(
        <Circle
          key="origin-marker"
          x={0}
          y={0}
          radius={8}
          fill="#ef4444"
          opacity={0.9}
        />
      );
    }

    objects.forEach((obj, index) => {
      if (obj.id === draggedObject?.id) return;

      // Objects with offset store their center in x, y
      const objCenterX = obj.x;
      const objCenterY = obj.y;

      const distanceX = Math.abs(objCenterX - draggedCenterX);
      const distanceY = Math.abs(objCenterY - draggedCenterY);

      // Vertical alignment (same X center) - Only show when snapping
      if (distanceX < snapThreshold) {
        guides.push(
          <Line
            key={`v-${index}`}
            points={[
              objCenterX, 
              viewBox.y, 
              objCenterX, 
              viewBox.y + viewBox.height
            ]}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[10, 5]}
            opacity={0.9}
          />
        );
        
        // Add indicator circles at object centers
        guides.push(
          <Circle
            key={`v-marker-obj-${index}`}
            x={objCenterX}
            y={objCenterY}
            radius={5}
            fill="#3b82f6"
            opacity={0.8}
          />
        );
        guides.push(
          <Circle
            key={`v-marker-drag-${index}`}
            x={draggedCenterX}
            y={draggedCenterY}
            radius={5}
            fill="#3b82f6"
            opacity={0.8}
          />
        );
      }

      // Horizontal alignment (same Y center) - Only show when snapping
      if (distanceY < snapThreshold) {
        guides.push(
          <Line
            key={`h-${index}`}
            points={[
              viewBox.x, 
              objCenterY, 
              viewBox.x + viewBox.width, 
              objCenterY
            ]}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[10, 5]}
            opacity={0.9}
          />
        );
        
        // Add indicator circles at object centers
        guides.push(
          <Circle
            key={`h-marker-obj-${index}`}
            x={objCenterX}
            y={objCenterY}
            radius={5}
            fill="#3b82f6"
            opacity={0.8}
          />
        );
        guides.push(
          <Circle
            key={`h-marker-drag-${index}`}
            x={draggedCenterX}
            y={draggedCenterY}
            radius={5}
            fill="#3b82f6"
            opacity={0.8}
          />
        );
      }
    });

    return guides;
  }, [objects, stagePosition.x, stagePosition.y]);

  // Handle mouse movement for line drawing and alignment guides
  const handleMouseMove = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    const scale = stage.scaleX();
    const canvasX = (pos.x - stage.x()) / scale;
    const canvasY = (pos.y - stage.y()) / scale;
    
    setMousePosition({ x: canvasX, y: canvasY });

    // Update selection rectangle if selecting
    if (isSelecting && selectionStart) {
      setSelectionEnd({ x: canvasX, y: canvasY });
    }
  };

  // Handle mouse down for selection rectangle
  const handleStageMouseDown = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    // If we clicked on the stage itself (not an object)
    if (e.target === stage) {
      // Check if shift key is pressed and no objects are selected
      if (e.evt?.shiftKey && selectedIds.length === 0) {
        const pos = stage.getPointerPosition();
        const scale = stage.scaleX();
        const canvasX = (pos.x - stage.x()) / scale;
        const canvasY = (pos.y - stage.y()) / scale;
        
        setIsSelecting(true);
        setSelectionStart({ x: canvasX, y: canvasY });
        setSelectionEnd({ x: canvasX, y: canvasY });
      }
    }
  };

  // Handle mouse up for selection rectangle
  const handleStageMouseUp = (e: any) => {
    if (isSelecting && selectionStart && selectionEnd) {
      // Calculate selection rectangle bounds
      const x1 = Math.min(selectionStart.x, selectionEnd.x);
      const y1 = Math.min(selectionStart.y, selectionEnd.y);
      const x2 = Math.max(selectionStart.x, selectionEnd.x);
      const y2 = Math.max(selectionStart.y, selectionEnd.y);

      // Find all objects within the selection rectangle
      const selectedObjectIds = objects
        .filter(obj => {
          // Check if object's bounding box intersects with selection rectangle
          const objLeft = obj.x - (obj.width / 2);
          const objRight = obj.x + (obj.width / 2);
          const objTop = obj.y - (obj.height / 2);
          const objBottom = obj.y + (obj.height / 2);

          return (
            objLeft < x2 &&
            objRight > x1 &&
            objTop < y2 &&
            objBottom > y1
          );
        })
        .map(obj => obj.id);

      // Select all objects within rectangle
      if (selectedObjectIds.length > 0) {
        selectMultiple(selectedObjectIds);
      }

      // Reset selection state
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
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
    if (!stage) return;
    
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    
    if (!pointer) return;
    
    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    // Zoom in/out based on wheel direction
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    setStageScale(clampedScale);
    
    // Adjust position to zoom towards cursor
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    
    setStagePosition(newPos);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo with Ctrl+Z (Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
          // console.log('⏪ Undo triggered');
        }
      }
      
      // Redo with Ctrl+Y or Ctrl+Shift+Z
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (canRedo) {
          redo();
          // console.log('⏩ Redo triggered');
        }
      }
      
      // Delete selected object(s) with Delete or Backspace
      // But NOT when editing text in a text box
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedId || selectedIds.length > 0)) {
        // Check if user is currently editing text
        const activeElement = document.activeElement;
        const isEditingText = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );
        
        // If editing text in a text box, don't delete the object
        if (isEditingText) {
          return;
        }
        
        // Check if selected object is a text box (to be extra safe)
        const selectedObject = objects.find(obj => obj.id === selectedId);
        if (selectedObject && selectedObject.type === 'text') {
          // For text objects, only delete if explicitly confirmed or not actively editing
          return;
        }
        
        e.preventDefault();
        if (selectedIds.length > 1) {
          // Delete all selected objects
          if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected objects?`)) {
            selectedIds.forEach(id => {
              deleteObject(id);
            });
            clearSelection();
          }
        } else if (selectedId) {
          // Delete single object
          deleteObject(selectedId);
        }
      }
      
      // Reset view with 'R' key - center the origin (0,0)
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setStageScale(1.3); // Reset to 130% (new 100%)
        setStagePosition({ 
          x: window.innerWidth / 2, 
          y: (window.innerHeight - 60) / 2 
        });
      }

      // Confirm line placement with Enter
      if (e.key === 'Enter' && drawingMode === 'line' && tempLineStart && mousePosition) {
        e.preventDefault();
        if (!currentUser) return;
        
        const stage = stageRef.current;
        if (!stage) return;
        
        const scale = stage.scaleX();
        const canvasX = (mousePosition.x - stage.x()) / scale;
        const canvasY = (mousePosition.y - stage.y()) / scale;
        
        const lineLength = Math.sqrt(
          Math.pow(canvasX - tempLineStart.x, 2) + 
          Math.pow(canvasY - tempLineStart.y, 2)
        );
        
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
          curved: false,
          fill: '#' + Math.floor(Math.random() * 16777215).toString(16),
          strokeWidth: 3,
          nickname: '',
          zIndex: 0,
          shadow: false,
          createdBy: currentUser.uid,
        });

        setTempLineStart(null);
        setDrawingMode('none');
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
  }, [selectedId, selectedIds, objects, drawingMode, setDrawingMode, setTempLineStart, tempLineStart, mousePosition, currentUser, addObject, deleteObject, clearSelection, undo, redo, canUndo, canRedo]);

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
      <Toolbar stageRef={stageRef} />
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
        draggable={!isSelecting}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
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
          
          {/* Selection Rectangle Layer */}
          <Layer>
            {isSelecting && selectionStart && selectionEnd && (
              <Rect
                x={Math.min(selectionStart.x, selectionEnd.x)}
                y={Math.min(selectionStart.y, selectionEnd.y)}
                width={Math.abs(selectionEnd.x - selectionStart.x)}
                height={Math.abs(selectionEnd.y - selectionStart.y)}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[5, 5]}
              />
            )}
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
        
        {/* Zoom controls on left side */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px',
          color: '#6b7280',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* Axis Toggle */}
          <button
            onClick={() => setShowAxes(!showAxes)}
            style={{
              width: '32px',
              height: '32px',
              background: showAxes ? '#3b82f6' : '#e5e7eb',
              color: showAxes ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={showAxes ? 'Hide X/Y Axes' : 'Show X/Y Axes'}
          >
            XY
          </button>

          <div style={{
            width: '1px',
            height: '24px',
            background: '#e5e7eb'
          }} />

          {/* Zoom Out */}
          <button
            onClick={() => {
              const newScale = Math.max(0.1, stageScale - 0.1);
              setStageScale(newScale);
            }}
            style={{
              width: '32px',
              height: '32px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
            }}
            title="Zoom Out"
          >
            −
          </button>

          {/* Zoom Display */}
          <span style={{ minWidth: '60px', textAlign: 'center', fontWeight: '500' }}>
            {Math.round((stageScale / 1.3) * 100)}%
          </span>

          {/* Zoom In */}
          <button
            onClick={() => {
              const newScale = Math.min(5, stageScale + 0.1);
              setStageScale(newScale);
            }}
            style={{
              width: '32px',
              height: '32px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
            }}
            title="Zoom In"
          >
            +
          </button>
          
          <div style={{
            width: '1px',
            height: '24px',
            background: '#e5e7eb'
          }} />
          
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Press R to reset</span>
        </div>

        {/* Shape Editors - Fixed position on left */}
        {selectedIds.length > 1 ? (
          <MultiSelectEditor />
        ) : selectedId ? (() => {
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
            } else if (selectedObject.type === 'text') {
              return <TextEditor object={selectedObject} />;
            } else if (selectedObject.type === 'group') {
              return <GroupEditor object={selectedObject} />;
            }
          }
          return null;
        })() : null}

        {/* Image Import Modal */}
        {showImageImport && (
          <ImageImport onClose={() => setShowImageImport(false)} />
        )}

        {/* Chat Window with AI Integration */}
        <ChatWindow />
      </div>
    </div>
  );
};

export default Canvas;