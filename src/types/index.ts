export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  cursorColor: string;
}

export interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'image' | 'group' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: number;
  lastModified: number;
  // Common properties for all shapes
  nickname?: string;
  zIndex?: number;
  shadow?: boolean;
  rotation?: number;
  // Line-specific properties
  x2?: number;
  y2?: number;
  strokeWidth?: number;
  // Curve properties
  controlX?: number;
  controlY?: number;
  curved?: boolean;
  // Rectangle-specific properties
  cornerRadius?: number;
  // Image-specific properties
  src?: string;
  // Group-specific properties
  groupedObjects?: string[];
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string; // 'normal' | 'bold' | 'italic' | 'bold italic'
  textAlign?: string; // 'left' | 'center' | 'right'
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