import React, { createContext, useContext, useState, useCallback } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CanvasObject } from '../types';
import { generateId } from '../utils/helpers';
import { useAuth } from './AuthContext';

const CANVAS_ID = 'default';

interface CanvasContextType {
  objects: CanvasObject[];
  selectedId: string | null;
  drawingMode: 'none' | 'line';
  tempLineStart: { x: number; y: number } | null;
  addObject: (object: Omit<CanvasObject, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>;
  updateObject: (id: string, updates: Partial<CanvasObject>) => Promise<void>;
  deleteObject: (id: string) => Promise<void>;
  selectObject: (id: string | null) => void;
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
  const [drawingMode, setDrawingMode] = useState<'none' | 'line'>('none');
  const [tempLineStart, setTempLineStart] = useState<{ x: number; y: number } | null>(null);
  const { currentUser } = useAuth();

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
      // Update local state optimistically
      setObjectsState(prev => 
        prev.map(obj => 
          obj.id === id ? { ...obj, ...updates, lastModified: Date.now() } : obj
        )
      );
      
      // Find the object
      const existingObject = objects.find(obj => obj.id === id);
      if (!existingObject) return;
      
      // Update Firestore
      const updatedObject = { ...existingObject, ...updates, lastModified: Date.now() };
      const objectRef = doc(db, 'canvases', CANVAS_ID, 'objects', id);
      await setDoc(objectRef, updatedObject);
      console.log('Object updated successfully in Firestore'); // DEBUG
    } catch (error) {
      console.error('Error updating object in Firestore:', error);
    }
  }, [currentUser, objects]);

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
  }, []);

  const setObjects = useCallback((newObjects: CanvasObject[]) => {
    setObjectsState(newObjects);
  }, []);

  const value = {
    objects,
    selectedId,
    drawingMode,
    tempLineStart,
    addObject,
    updateObject,
    deleteObject,
    selectObject,
    setObjects,
    setDrawingMode,
    setTempLineStart
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};