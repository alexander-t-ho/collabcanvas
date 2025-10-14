export interface User {
    uid: string;
    displayName: string;
    email: string;
    cursorColor: string;
  }
  
  export interface CanvasObject {
    id: string;
    type: 'rectangle' | 'circle' | 'text';
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    createdBy: string;
    createdAt: number;
    lastModified: number;
  }
  
  export interface CursorPosition {
    userId: string;
    name: string;
    color: string;
    x: number;
    y: number;
    lastUpdated: number;
  }
  
  export interface PresenceData {
    userId: string;
    name: string;
    color: string;
    online: boolean;
    lastSeen: number;
  }