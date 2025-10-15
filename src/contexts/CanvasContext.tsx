import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
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
  saveCanvas: () => void;
  setObjects: (objects: CanvasObject[]) => void;
  setDrawingMode: (mode: 'none' | 'line') => void;
  setTempLineStart: (point: { x: number; y: number } | null) => void;
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
  const [history, setHistory] = useState<CanvasObject[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  const historyIndexRef = useRef(-1); // Use ref to avoid stale closures
  const historyRef = useRef<CanvasObject[][]>([]); // Use ref for history
  const { currentUser } = useAuth();

  // Sync refs with state
  historyIndexRef.current = historyIndex;
  historyRef.current = history;

  // Save state to history (for undo/redo)
  const saveToHistory = useCallback((newObjects: CanvasObject[]) => {
    if (isUndoRedo) return;
    
    const currentIndex = historyIndexRef.current;
    
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newObjects)));
      const trimmedHistory = newHistory.slice(-50);
      historyRef.current = trimmedHistory;
      return trimmedHistory;
    });
    
    setHistoryIndex(prev => {
      const newIndex = Math.min(prev + 1, 49);
      historyIndexRef.current = newIndex;
      return newIndex;
    });
  }, [isUndoRedo]);

  const addObject = useCallback(async (object: Omit<CanvasObject, 'id' | 'createdAt' | 'lastModified'>) => {
    if (!currentUser) return;
    
    const newObject: CanvasObject = {
      ...object,
      id: generateId(),
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    
    try {
      const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', newObject.id);
      await setDoc(objectRef, newObject);
    } catch (error) {
      console.error('Error adding object:', error);
    }
  }, [currentUser]);

  const updateObject = useCallback(async (id: string, updates: Partial<CanvasObject>) => {
    if (!currentUser) return;
    
    try {
      setObjectsState(prev => {
        const existingObject = prev.find(obj => obj.id === id);
        if (!existingObject) return prev;
        
        const updatedObjects = prev.map(obj => 
          obj.id === id ? { ...obj, ...updates, lastModified: Date.now() } : obj
        );
        
        // Save to history after update
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
    
    console.log('Deleting object from Firestore:', id); // DEBUG
    
    try {
      // Delete from Firestore
      const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', id);
      await deleteDoc(objectRef);
      console.log('Object deleted successfully from Firestore'); // DEBUG
      
      if (selectedId === id) setSelectedId(null);
    } catch (error) {
      console.error('Error deleting object from Firestore:', error);
    }
  }, [currentUser, selectedId]);

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
    const minX = Math.min(...selectedObjects.map(obj => obj.x));
    const minY = Math.min(...selectedObjects.map(obj => obj.y));
    const maxX = Math.max(...selectedObjects.map(obj => obj.x + obj.width));
    const maxY = Math.max(...selectedObjects.map(obj => obj.y + obj.height));

    const groupObject: Omit<CanvasObject, 'id' | 'createdAt' | 'lastModified'> = {
      type: 'group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      fill: '#000000',
      groupedObjects: [...selectedIds],
      nickname: `Group of ${selectedIds.length}`,
      zIndex: Math.max(...selectedObjects.map(obj => obj.zIndex || 0)) + 1,
      shadow: false,
      createdBy: currentUser.uid,
    };

    await addObject(groupObject);
    clearSelection();
  }, [currentUser, selectedIds, objects, addObject]);

  const setObjects = useCallback((newObjects: CanvasObject[]) => {
    setObjectsState(prev => {
      const prevJson = JSON.stringify(prev);
      const newJson = JSON.stringify(newObjects);
      
      if (prevJson === newJson) return prev;
      
      if (!isUndoRedo) {
        saveToHistory(newObjects);
      }
      
      return newObjects;
    });
  }, [isUndoRedo, saveToHistory]);

  // Undo function
  const undo = useCallback(() => {
    console.log('UNDO CALLED');
    
    const currentIndex = historyIndexRef.current;
    const currentHistory = historyRef.current;
    
    console.log('UNDO: Index:', currentIndex, 'History length:', currentHistory.length);
    
    if (currentIndex <= 0 || currentHistory.length === 0) {
      console.log('UNDO: No history available');
      return;
    }
    
    const previousState = currentHistory[currentIndex - 1];
    if (!previousState) {
      console.error('UNDO: Previous state is undefined');
      return;
    }
    
    console.log('UNDO: Restoring', previousState.length, 'objects');
    
    // Set flag to prevent realtime sync from overwriting
    setIsUndoRedo(true);
    
    // Update index
    setHistoryIndex(currentIndex - 1);
    historyIndexRef.current = currentIndex - 1;
    
    // Update local state immediately
    setObjectsState(previousState);
    
    // Sync to Firestore after a delay to ensure local state is set first
    setTimeout(() => {
      previousState.forEach(obj => {
        const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
        setDoc(objectRef, obj).catch(console.error);
      });
      
      // Delete removed objects
      const previousIds = previousState.map(obj => obj.id);
      objects.forEach(obj => {
        if (!previousIds.includes(obj.id)) {
          const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
          deleteDoc(objectRef).catch(console.error);
        }
      });
      
      // Clear flag after sync completes
      setTimeout(() => setIsUndoRedo(false), 500);
    }, 100);
    
    console.log('UNDO: Complete');
  }, [objects]);

  // Redo function - redo all changes (collaborative)
  const redo = useCallback(() => {
    try {
      const currentIndex = historyIndexRef.current;
      const currentHistory = historyRef.current;
      
      if (currentIndex >= currentHistory.length - 1 || currentHistory.length === 0) {
        return;
      }
      
      setIsUndoRedo(true);
      const nextState = currentHistory[currentIndex + 1];
      
      if (!nextState) {
        setIsUndoRedo(false);
        return;
      }
      
      setHistoryIndex(currentIndex + 1);
      historyIndexRef.current = currentIndex + 1;
      setObjectsState(nextState);
      
      // Sync all objects to Firestore
      nextState.forEach(obj => {
        const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
        setDoc(objectRef, obj).catch(console.error);
      });
      
      // Delete objects that don't exist in next state
      const nextIds = nextState.map(obj => obj.id);
      objects.forEach(obj => {
        if (!nextIds.includes(obj.id)) {
          const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
          deleteDoc(objectRef).catch(console.error);
        }
      });
      
      setTimeout(() => setIsUndoRedo(false), 200);
    } catch (error) {
      console.error('REDO: Error:', error);
      setIsUndoRedo(false);
    }
  }, [objects]);

  // Save canvas state
  const saveCanvas = useCallback(() => {
    const canvasData = {
      objects,
      timestamp: Date.now(),
      savedBy: currentUser?.uid || 'unknown'
    };
    
    // Create a downloadable JSON file
    const dataStr = JSON.stringify(canvasData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collabcanvas-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('💾 SAVE: Canvas saved with', objects.length, 'objects');
  }, [objects, currentUser]);

  const value = {
    objects,
    selectedId,
    selectedIds,
    drawingMode,
    tempLineStart,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
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
    saveCanvas,
    setObjects,
    setDrawingMode,
    setTempLineStart
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};