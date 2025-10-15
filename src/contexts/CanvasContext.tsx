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

  // Save state to history (for undo/redo) - only if not during undo/redo operation
  const saveToHistory = useCallback((newObjects: CanvasObject[]) => {
    if (isUndoRedo) {
      console.log('⏭️ SKIP HISTORY: During undo/redo, not saving');
      return;
    }
    
    const currentIndex = historyIndexRef.current;
    console.log('💾 SAVE HISTORY: Starting save. Current index:', currentIndex);
    
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newObjects)));
      const trimmedHistory = newHistory.slice(-50);
      console.log('💾 SAVE HISTORY: New history length:', trimmedHistory.length);
      historyRef.current = trimmedHistory;
      return trimmedHistory;
    });
    
    setHistoryIndex(prev => {
      const newIndex = Math.min(prev + 1, 49);
      console.log('💾 SAVE HISTORY: New index:', newIndex);
      historyIndexRef.current = newIndex;
      return newIndex;
    });
    
    console.log('✅ SAVE HISTORY: Complete');
  }, [isUndoRedo]);

  const addObject = useCallback(async (object: Omit<CanvasObject, 'id' | 'createdAt' | 'lastModified'>) => {
    if (!currentUser) return;
    
    const newObject: CanvasObject = {
      ...object,
      id: generateId(),
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    
    console.log('Adding object to Firestore:', newObject); // DEBUG
    
    try {
      // Write to Firestore
      const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', newObject.id);
      await setDoc(objectRef, newObject);
      console.log('Object added successfully to Firestore'); // DEBUG
    } catch (error) {
      console.error('Error adding object to Firestore:', error);
    }
  }, [currentUser]);

  const updateObject = useCallback(async (id: string, updates: Partial<CanvasObject>) => {
    if (!currentUser) return;
    
    console.log('Updating object in Firestore:', id, updates); // DEBUG
    
    try {
      // Get current state to avoid stale closure
      setObjectsState(prev => {
        const existingObject = prev.find(obj => obj.id === id);
        if (!existingObject) return prev;
        
        // Update local state optimistically
        const updatedObjects = prev.map(obj => 
          obj.id === id ? { ...obj, ...updates, lastModified: Date.now() } : obj
        );
        
        // Save to history after update
        if (!isUndoRedo) {
          console.log('💾 HISTORY: Saving after update');
          saveToHistory(updatedObjects);
        }
        
        // Update Firestore asynchronously
        const updatedObject = { ...existingObject, ...updates, lastModified: Date.now() };
        const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', id);
        setDoc(objectRef, updatedObject).then(() => {
          console.log('Object updated successfully in Firestore'); // DEBUG
        }).catch((error) => {
          console.error('Error updating object in Firestore:', error);
        });
        
        return updatedObjects;
      });
    } catch (error) {
      console.error('Error updating object in Firestore:', error);
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
      // Check if this is actually a change
      const prevJson = JSON.stringify(prev);
      const newJson = JSON.stringify(newObjects);
      
      if (prevJson === newJson) {
        console.log('⏭️ HISTORY: No change detected, skipping save');
        return prev;
      }
      
      console.log('💾 HISTORY: Objects changed, saving state with', newObjects.length, 'objects');
      
      // Save to history when objects are set from Firestore
      if (!isUndoRedo) {
        console.log('💾 HISTORY: Saving state with', newObjects.length, 'objects. History index:', historyIndexRef.current);
        saveToHistory(newObjects);
      } else {
        console.log('⏭️ HISTORY: Skipping save during undo/redo operation');
      }
      
      return newObjects;
    });
  }, [isUndoRedo, saveToHistory]);

  // Undo function
  const undo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    const currentHistory = historyRef.current;
    
    console.log('⏪ UNDO: Attempting undo. Current index:', currentIndex, 'History length:', currentHistory.length);
    
    if (currentIndex > 0) {
      setIsUndoRedo(true);
      const previousState = currentHistory[currentIndex - 1];
      console.log('⏪ UNDO: Restoring state with', previousState.length, 'objects');
      setHistoryIndex(currentIndex - 1);
      historyIndexRef.current = currentIndex - 1;
      setObjectsState(previousState);
      
      // Sync to Firestore
      previousState.forEach(obj => {
        const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
        setDoc(objectRef, obj).catch(console.error);
      });
      
      // Clean up deleted objects
      const currentIds = previousState.map(obj => obj.id);
      objects.forEach(obj => {
        if (!currentIds.includes(obj.id)) {
          console.log('⏪ UNDO: Deleting object', obj.id);
          const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
          deleteDoc(objectRef).catch(console.error);
        }
      });
      
      console.log('✅ UNDO: Complete. New index:', currentIndex - 1);
      setTimeout(() => setIsUndoRedo(false), 100);
    } else {
      console.log('⚠️ UNDO: No history to undo. Index:', currentIndex);
    }
  }, [objects]);

  // Redo function
  const redo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    const currentHistory = historyRef.current;
    
    console.log('⏩ REDO: Attempting redo. Current index:', currentIndex, 'History length:', currentHistory.length);
    
    if (currentIndex < currentHistory.length - 1) {
      setIsUndoRedo(true);
      const nextState = currentHistory[currentIndex + 1];
      console.log('⏩ REDO: Restoring state with', nextState.length, 'objects');
      setHistoryIndex(currentIndex + 1);
      historyIndexRef.current = currentIndex + 1;
      setObjectsState(nextState);
      
      // Sync to Firestore
      nextState.forEach(obj => {
        const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
        setDoc(objectRef, obj).catch(console.error);
      });
      
      // Clean up deleted objects
      const currentIds = nextState.map(obj => obj.id);
      objects.forEach(obj => {
        if (!currentIds.includes(obj.id)) {
          console.log('⏩ REDO: Deleting object', obj.id);
          const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', obj.id);
          deleteDoc(objectRef).catch(console.error);
        }
      });
      
      console.log('✅ REDO: Complete. New index:', currentIndex + 1);
      setTimeout(() => setIsUndoRedo(false), 100);
    } else {
      console.log('⚠️ REDO: No history to redo. Index:', currentIndex, 'Length:', currentHistory.length);
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
  
  // Debug canUndo/canRedo
  console.log('📊 CONTEXT: historyIndex:', historyIndex, 'history.length:', history.length);
  console.log('📊 CONTEXT: canUndo:', historyIndex > 0, 'canRedo:', historyIndex < history.length - 1);

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};