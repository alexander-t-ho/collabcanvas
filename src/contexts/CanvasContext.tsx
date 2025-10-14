import React, { createContext, useContext, useState, useCallback } from 'react';
import { CanvasObject } from '../types';
import { generateId } from '../utils/helpers';

interface CanvasContextType {
  objects: CanvasObject[];
  selectedId: string | null;
  addObject: (object: Omit<CanvasObject, 'id' | 'createdAt' | 'lastModified'>) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setObjects: (objects: CanvasObject[]) => void;
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

  const addObject = useCallback((object: Omit<CanvasObject, 'id' | 'createdAt' | 'lastModified'>) => {
    const newObject: CanvasObject = {
      ...object,
      id: generateId(),
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    setObjectsState(prev => [...prev, newObject]);
  }, []);

  const updateObject = useCallback((id: string, updates: Partial<CanvasObject>) => {
    setObjectsState(prev => 
      prev.map(obj => 
        obj.id === id ? { ...obj, ...updates, lastModified: Date.now() } : obj
      )
    );
  }, []);

  const deleteObject = useCallback((id: string) => {
    setObjectsState(prev => prev.filter(obj => obj.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const selectObject = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const setObjects = useCallback((newObjects: CanvasObject[]) => {
    setObjectsState(newObjects);
  }, []);

  const value = {
    objects,
    selectedId,
    addObject,
    updateObject,
    deleteObject,
    selectObject,
    setObjects
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};