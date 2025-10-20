import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref as dbRef, set as dbSet, onValue, get } from 'firebase/database';
import { db, rtdb } from '../firebase/config';
import { CanvasObject } from '../types';
import { generateId } from '../utils/helpers';
import { useAuth } from './AuthContext';

const CANVAS_ID = 'default';

interface CanvasContextType {
  objects: CanvasObject[];
  selectedId: string | null;
  selectedIds: string[];
  drawingMode: 'none' | 'line';
  tempLineStart: { x: number; y: number } | null;
  canUndo: boolean;
  canRedo: boolean;
  addObject: (object: Omit<CanvasObject, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>;
  updateObject: (id: string, updates: Partial<CanvasObject>) => Promise<void>;
  updateObjectLive: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => Promise<void>;
  selectObject: (id: string | null) => void;
  selectMultiple: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  createGroup: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  exportCanvasAsPNG: (stage: any) => void;
  setObjects: (objects: CanvasObject[]) => void;
  setDrawingMode: (mode: 'none' | 'line') => void;
  setTempLineStart: (point: { x: number; y: number } | null) => void;
  saveHistoryNow: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) throw new Error('useCanvas must be used within CanvasProvider');
  return context;
};

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [objects, setObjectsState] = useState<CanvasObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawingMode, setDrawingMode] = useState<'none' | 'line'>('none');
  const [tempLineStart, setTempLineStart] = useState<{ x: number; y: number } | null>(null);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  const historyIndexRef = useRef(0);
  const saveHistoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUndoRedoTime = useRef(0); // Track when last undo/redo happened
  const { currentUser } = useAuth();

  // Listen to history index changes from Firebase
  useEffect(() => {
    const indexRef = dbRef(rtdb, `canvases/${CANVAS_ID}/historyIndex`);
    const unsubscribe = onValue(indexRef, async (snapshot) => {
      const index = snapshot.val();
      if (index !== null && index !== historyIndexRef.current && !isUndoRedo) {
        // Another user changed the history index - restore that state
        try {
          const fbHistoryRef = dbRef(rtdb, `canvases/${CANVAS_ID}/history`);
          const historySnapshot = await get(fbHistoryRef);
          const historyData = historySnapshot.val() || [];
          
          if (historyData[index]) {
            setIsUndoRedo(true);
            setHistoryIndex(index);
            historyIndexRef.current = index;
            
            // Don't update local state - let Firestore sync handle it
            // This prevents the bounce by avoiding duplicate updates
            
            setTimeout(() => setIsUndoRedo(false), 1000);
          }
        } catch (error) {
          console.error('Error syncing history:', error);
        }
      }
    });
    return () => unsubscribe();
  }, [isUndoRedo]);

  // Sync ref with state
  historyIndexRef.current = historyIndex;

  // Save state to history in Firebase - debounced for performance
  const saveToHistory = useCallback((newObjects: CanvasObject[], immediate = false) => {
    if (isUndoRedo) {
      console.log('⏸️ SAVE_HISTORY: Skipped (undo/redo in progress)');
      return;
    }
    
    // Also skip if undo/redo happened within last 2 seconds
    const timeSinceLastUndoRedo = Date.now() - lastUndoRedoTime.current;
    if (timeSinceLastUndoRedo < 2000) {
      console.log('⏸️ SAVE_HISTORY: Skipped (recent undo/redo -', timeSinceLastUndoRedo, 'ms ago)');
      return;
    }
    
    const doSave = async () => {
    const currentIndex = historyIndexRef.current;
      
      console.log('💾 SAVE_HISTORY: Saving', newObjects.length, 'objects at index', currentIndex);
    
      try {
        // Get current history from Firebase
        const fbHistoryRef = dbRef(rtdb, `canvases/${CANVAS_ID}/history`);
        const snapshot = await get(fbHistoryRef);
        const currentHistory = snapshot.val() || [];
        
        console.log('📚 SAVE_HISTORY: Current history length:', currentHistory.length);
        
        // Don't save if it's the same as current state
        if (currentIndex >= 0 && currentIndex < currentHistory.length) {
          const currentState = currentHistory[currentIndex];
          if (JSON.stringify(currentState) === JSON.stringify(newObjects)) {
            console.log('⏭️ SAVE_HISTORY: Skipped (no changes)');
            return;
          }
        }
        
        // Remove any history after current index (for redo)
        const newHistory = currentHistory.slice(0, currentIndex + 1);
        // Add new state
        newHistory.push(JSON.parse(JSON.stringify(newObjects)));
        
        // Don't trim - keep all history for better undo
        console.log('📝 SAVE_HISTORY: New history length:', newHistory.length);
        
        // Save to Firebase
        await dbSet(dbRef(rtdb, `canvases/${CANVAS_ID}/history`), newHistory);
        
        // Update index
        const newIndex = newHistory.length - 1;
        await dbSet(dbRef(rtdb, `canvases/${CANVAS_ID}/historyIndex`), newIndex);
        
        console.log('✅ SAVE_HISTORY: Saved successfully. New index:', newIndex);
        
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
      } catch (error) {
        console.error('❌ SAVE_HISTORY Error:', error);
      }
    };
    
    if (immediate) {
      // Save immediately for discrete actions
      doSave();
    } else {
      // Clear existing timeout
      if (saveHistoryTimeoutRef.current) {
        clearTimeout(saveHistoryTimeoutRef.current);
      }
      
      // Debounce: only save after 500ms of no changes
      saveHistoryTimeoutRef.current = setTimeout(doSave, 500);
    }
  }, [isUndoRedo, lastUndoRedoTime]);
  
  // Force save history immediately
  const saveHistoryNow = useCallback(() => {
    if (saveHistoryTimeoutRef.current) {
      clearTimeout(saveHistoryTimeoutRef.current);
    }
    saveToHistory(objects, true);
  }, [objects, saveToHistory]);

  const addObject = useCallback(async (object: Omit<CanvasObject, 'id' | 'createdAt' | 'lastModified'>) => {
    if (!currentUser) return;
    
    // Ensure required fields are present
    const newObject: CanvasObject = {
      ...object,
      id: generateId(),
      createdAt: Date.now(),
      lastModified: Date.now(),
      width: object.width || 100,
      height: object.height || 100
    };
    
    try {
      // Save current state to history BEFORE adding (synchronously)
      console.log('➕ ADD_OBJECT: Saving current state to history');
      setObjectsState(prev => {
        // Save current state before modification
        saveToHistory(prev, true);
        return prev;
      });
      
      // Small delay to ensure history save completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now add to Firestore
      const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', newObject.id);
      await setDoc(objectRef, newObject);
      
      console.log('✅ ADD_OBJECT: Object added, waiting for sync');
      
      // Let realtime sync update the local state
    } catch (error) {
      console.error('❌ ADD_OBJECT Error:', error);
    }
  }, [currentUser, saveToHistory]);

  const updateObject = useCallback(async (id: string, updates: Partial<CanvasObject>) => {
    if (!currentUser) return;
    
    try {
      setObjectsState(prev => {
        const existingObject = prev.find(obj => obj.id === id);
        if (!existingObject) return prev;
        
        const updatedObjects = prev.map(obj => 
          obj.id === id ? { ...obj, ...updates, lastModified: Date.now() } : obj
        );
        
        // Save to history (debounced) - only if not during undo/redo
        if (!isUndoRedo) {
          saveToHistory(updatedObjects);
        }
        
        // Update Firestore asynchronously
        const updatedObject = { ...existingObject, ...updates, lastModified: Date.now() };
        const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', id);
        setDoc(objectRef, updatedObject).catch(console.error);
        
        return updatedObjects;
      });
    } catch (error) {
      console.error('Error updating object:', error);
    }
  }, [currentUser, isUndoRedo, saveToHistory]);

  // For real-time dragging updates - only updates local state, no Firestore
  const updateObjectLive = useCallback((id: string, updates: Partial<CanvasObject>) => {
    setObjectsState(prev => 
      prev.map(obj => 
        obj.id === id ? { ...obj, ...updates } : obj
      )
    );
  }, []);

  const deleteObject = useCallback(async (id: string) => {
    if (!currentUser) return;
    
    console.log('🗑️ DELETE: Deleting object:', id);
    
    try {
      // IMPORTANT: Save history BEFORE deleting
      console.log('💾 DELETE: Saving history before delete...');
      await saveHistoryNow();
      
      // Small delay to ensure history is saved
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('🗑️ DELETE: Now deleting from Firestore...');
      
      // Delete from Firestore
      const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', id);
      await deleteDoc(objectRef);
      
      console.log('✅ DELETE: Object deleted successfully');
      
      if (selectedId === id) setSelectedId(null);
      
      // Let realtime sync update the local state
    } catch (error) {
      console.error('❌ DELETE Error:', error);
    }
  }, [currentUser, selectedId, saveHistoryNow]);

  const selectObject = useCallback((id: string | null) => {
    setSelectedId(id);
    setSelectedIds(id ? [id] : []);
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(ids);
    setSelectedId(ids.length === 1 ? ids[0] : null);
  }, []);

  const addToSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev;
      const newSelection = [...prev, id];
      setSelectedId(newSelection.length === 1 ? newSelection[0] : null);
      return newSelection;
    });
  }, []);

  const removeFromSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelection = prev.filter(selectedId => selectedId !== id);
      setSelectedId(newSelection.length === 1 ? newSelection[0] : null);
      return newSelection;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setSelectedIds([]);
  }, []);

  const createGroup = useCallback(async () => {
    if (!currentUser || selectedIds.length < 2) return;

    const selectedObjects = objects.filter(obj => selectedIds.includes(obj.id));
    
    // Calculate bounds of all objects
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedObjects.forEach(obj => {
      if (obj.type === 'line') {
        // For lines, check both start and end points
        minX = Math.min(minX, obj.x, obj.x2 || obj.x);
        minY = Math.min(minY, obj.y, obj.y2 || obj.y);
        maxX = Math.max(maxX, obj.x, obj.x2 || obj.x);
        maxY = Math.max(maxY, obj.y, obj.y2 || obj.y);
      } else if (obj.type === 'circle') {
        // For circles, x,y is center, radius is width/2
        const radius = obj.width / 2;
        minX = Math.min(minX, obj.x - radius);
        minY = Math.min(minY, obj.y - radius);
        maxX = Math.max(maxX, obj.x + radius);
        maxY = Math.max(maxY, obj.y + radius);
      } else {
        // For rectangles, images, text: x,y is center (due to offset)
        const halfWidth = obj.width / 2;
        const halfHeight = obj.height / 2;
        minX = Math.min(minX, obj.x - halfWidth);
        minY = Math.min(minY, obj.y - halfHeight);
        maxX = Math.max(maxX, obj.x + halfWidth);
        maxY = Math.max(maxY, obj.y + halfHeight);
      }
    });
    
    // Add padding
    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Calculate width, height, and TRUE center from the bounds
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + (width / 2);
    const centerY = minY + (height / 2);

    const groupObject: Omit<CanvasObject, 'id' | 'createdAt' | 'lastModified'> = {
      type: 'group',
      x: centerX,
      y: centerY,
      width: width,
      height: height,
      fill: '#000000',
      groupedObjects: [...selectedIds],
      nickname: `Group of ${selectedIds.length}`,
      zIndex: Math.max(...selectedObjects.map(obj => obj.zIndex || 0)) + 1,
      shadow: false,
      createdBy: currentUser.uid,
    };

    await addObject(groupObject);
    clearSelection();
  }, [currentUser, selectedIds, objects, addObject, clearSelection]);

  const setObjects = useCallback((newObjects: CanvasObject[]) => {
    // Skip updates during undo/redo to prevent bouncing
    if (isUndoRedo) {
      console.log('⏸️ REALTIME SYNC: Skipping update during undo/redo');
      return;
    }
    
    // Also skip if undo/redo happened recently
    const timeSinceLastUndoRedo = Date.now() - lastUndoRedoTime.current;
    if (timeSinceLastUndoRedo < 3000) {
      console.log('⏸️ REALTIME SYNC: Skipping update (recent undo/redo -', timeSinceLastUndoRedo, 'ms ago)');
      return;
    }
    
    setObjectsState(prev => {
      const prevJson = JSON.stringify(prev);
      const newJson = JSON.stringify(newObjects);
      
      if (prevJson === newJson) return prev;
      
      console.log('🔄 REALTIME SYNC: Updating objects from Firestore');
      
      // DON'T save to history from realtime sync - only save from user actions
      // This prevents the undo-redo loop
      
      return newObjects;
    });
  }, [isUndoRedo]);

  // Undo function - collaborative version
  const undo = useCallback(async () => {
    console.log('🔄 UNDO CALLED');
    
    const currentIndex = historyIndexRef.current;
    
    console.log('📊 UNDO: Current Index:', currentIndex);
    
    if (currentIndex <= 0) {
      console.log('⚠️ UNDO: No history available (at index 0)');
      return;
    }
    
    // Record timestamp to block saves
    lastUndoRedoTime.current = Date.now();
    
    try {
      // Get history from Firebase
      const fbHistoryRef = dbRef(rtdb, `canvases/${CANVAS_ID}/history`);
      const snapshot = await get(fbHistoryRef);
      const historyData = snapshot.val() || [];
      
      console.log('📚 UNDO: History length:', historyData.length, 'Current index:', currentIndex);
      
      if (!historyData || historyData.length === 0 || currentIndex >= historyData.length) {
        console.log('❌ UNDO: Invalid history data');
        return;
      }
      
      const previousState = historyData[currentIndex - 1];
    if (!previousState) {
        console.error('❌ UNDO: Previous state is undefined at index', currentIndex - 1);
      return;
    }
    
      console.log('✅ UNDO: Found previous state with', previousState.length, 'objects');
      console.log('📦 UNDO: Previous state:', previousState);
    
      // Set flag to prevent history saves during undo
    setIsUndoRedo(true);
    
      // Update index in Firebase
      const newIndex = currentIndex - 1;
      console.log('📝 UNDO: Updating index:', currentIndex, '→', newIndex);
      await dbSet(dbRef(rtdb, `canvases/${CANVAS_ID}/historyIndex`), newIndex);
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
    
    // Update local state immediately
    setObjectsState(previousState);
      clearSelection();
      
      // Sync to Firestore - do this synchronously to avoid race conditions
      const syncToFirestore = async () => {
        const previousIds = previousState.map((obj: CanvasObject) => obj.id);
        const currentObjects = objects;
        
        // Delete removed objects first
        for (const obj of currentObjects) {
        if (!previousIds.includes(obj.id)) {
            const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
            await deleteDoc(objectRef).catch(console.error);
          }
        }
        
        // Then update/add objects
        for (const obj of previousState) {
          const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
          await setDoc(objectRef, obj).catch(console.error);
        }
      };
      
      // Wait for sync to complete
      await syncToFirestore();
      
      // Clear flag
      setIsUndoRedo(false);
      console.log('✅ UNDO: Complete');
    } catch (error) {
      console.error('❌ UNDO: Error:', error);
      setIsUndoRedo(false);
    }
  }, [objects, clearSelection]);

  // Redo function - collaborative version
  const redo = useCallback(async () => {
    console.log('🔄 REDO CALLED');
    
    const currentIndex = historyIndexRef.current;
    
    console.log('📊 REDO: Current Index:', currentIndex);
    
    // Record timestamp to block saves
    lastUndoRedoTime.current = Date.now();
    
    try {
      // Get history from Firebase
      const fbHistoryRef = dbRef(rtdb, `canvases/${CANVAS_ID}/history`);
      const snapshot = await get(fbHistoryRef);
      const historyData = snapshot.val() || [];
      
      if (!historyData || currentIndex >= historyData.length - 1) {
        // console.log('REDO: No future history available');
        return;
      }
      
      const nextState = historyData[currentIndex + 1];
      if (!nextState) {
        // console.log('REDO: Next state is undefined');
        return;
      }
      
      // console.log('REDO: Restoring', nextState.length, 'objects');
      
      setIsUndoRedo(true);
      
      // Update index in Firebase
      const newIndex = currentIndex + 1;
      await dbSet(dbRef(rtdb, `canvases/${CANVAS_ID}/historyIndex`), newIndex);
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      
      // Update local state immediately
      setObjectsState(nextState);
      clearSelection();
      
      // Sync to Firestore - do this synchronously to avoid race conditions
      const syncToFirestore = async () => {
        const nextIds = nextState.map((obj: CanvasObject) => obj.id);
        const currentObjects = objects;
        
        // Delete removed objects first
        for (const obj of currentObjects) {
          if (!nextIds.includes(obj.id)) {
        const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
            await deleteDoc(objectRef).catch(console.error);
          }
        }
        
        // Then update/add objects
        for (const obj of nextState) {
          const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
          await setDoc(objectRef, obj).catch(console.error);
        }
      };
      
      // Wait for sync to complete
      await syncToFirestore();
      
      // Clear flag
      setIsUndoRedo(false);
      console.log('✅ REDO: Complete');
    } catch (error) {
      console.error('❌ REDO: Error:', error);
      setIsUndoRedo(false);
    }
  }, [objects, clearSelection]);

  // Export canvas as PNG
  const exportCanvasAsPNG = useCallback((stage: any) => {
    if (!stage) return;
    
    try {
      // Get the stage's current state
      const oldScale = stage.scaleX();
      const oldPosition = { x: stage.x(), y: stage.y() };
      
      // Calculate bounding box of all objects
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      objects.forEach(obj => {
        if (obj.type === 'group') return; // Skip group containers
        
        const objMinX = obj.x - (obj.width || 0) / 2;
        const objMinY = obj.y - (obj.height || 0) / 2;
        const objMaxX = obj.x + (obj.width || 0) / 2;
        const objMaxY = obj.y + (obj.height || 0) / 2;
        
        minX = Math.min(minX, objMinX);
        minY = Math.min(minY, objMinY);
        maxX = Math.max(maxX, objMaxX);
        maxY = Math.max(maxY, objMaxY);
      });
      
      // Add padding
      const padding = 50;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // If no objects, use default canvas size
      if (!isFinite(minX)) {
        minX = 0;
        minY = 0;
        maxX = 1920;
        maxY = 1080;
      }
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Create a temporary canvas with white background
      const canvas = document.createElement('canvas');
      canvas.width = width * 2; // 2x for high DPI
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Temporarily reset stage position and scale for export
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: -minX, y: -minY });
        
        // Export stage to data URL
        const stageDataURL = stage.toDataURL({
          pixelRatio: 2, // Higher quality
          mimeType: 'image/png',
          x: 0,
          y: 0,
          width: width,
          height: height
        });
        
        // Restore original position and scale
        stage.scale({ x: oldScale, y: oldScale });
        stage.position(oldPosition);
        
        // Draw the stage image on top of white background
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          
          // Get final data URL with white background
          const finalDataURL = canvas.toDataURL('image/png');
          
          // Download the image
          const link = document.createElement('a');
          link.download = `collabcanvas-${Date.now()}.png`;
          link.href = finalDataURL;
          link.click();
        };
        img.src = stageDataURL;
      } else {
        // Fallback: restore original position and scale
        stage.scale({ x: oldScale, y: oldScale });
        stage.position(oldPosition);
        throw new Error('Could not get canvas context');
      }
    } catch (error) {
      console.error('Error exporting canvas:', error);
      alert('Failed to export canvas. Please try again.');
    }
  }, [objects]);

  // Get canUndo and canRedo from Firebase
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  useEffect(() => {
    const checkHistory = async () => {
      try {
        const fbHistoryRef = dbRef(rtdb, `canvases/${CANVAS_ID}/history`);
        const snapshot = await get(fbHistoryRef);
        const historyData = snapshot.val() || [];
        
        const undoAvailable = historyIndex > 0;
        const redoAvailable = historyIndex < historyData.length - 1;
        
        console.log('🔍 CHECK_HISTORY: Index:', historyIndex, 'History length:', historyData.length);
        console.log('🔍 CHECK_HISTORY: canUndo:', undoAvailable, 'canRedo:', redoAvailable);
        
        setCanUndo(undoAvailable);
        setCanRedo(redoAvailable);
      } catch (error) {
        console.error('❌ CHECK_HISTORY Error:', error);
      }
    };
    
    checkHistory();
  }, [historyIndex]);

  const value = {
    objects,
    selectedId,
    selectedIds,
    drawingMode,
    tempLineStart,
    canUndo,
    canRedo,
    addObject,
    updateObject,
    updateObjectLive,
    deleteObject,
    selectObject,
    selectMultiple,
    addToSelection,
    removeFromSelection,
    clearSelection,
    createGroup,
    undo,
    redo,
    exportCanvasAsPNG,
    setObjects,
    setDrawingMode,
    setTempLineStart,
    saveHistoryNow
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};