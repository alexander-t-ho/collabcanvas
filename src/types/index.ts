export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  cursorColor: string;
}

export interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: number;
  lastModified: number;
  // Common properties for all shapes
  nickname?: string; // User-defined name for the shape
  zIndex?: number; // Layering order
  shadow?: boolean; // Shadow effect toggle
  rotation?: number; // Rotation in degrees
  // Line-specific properties
  x2?: number; // End point for lines
  y2?: number; // End point for lines
  strokeWidth?: number; // Line thickness
  // Curve properties
  controlX?: number; // Control point X for curves
  controlY?: number; // Control point Y for curves
  curved?: boolean; // Whether the line is curved
  // Rectangle-specific properties
  cornerRadius?: number; // Corner radius for rectangles
  // Image-specific properties
  src?: string; // Image source URL or data URL
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