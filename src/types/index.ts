export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  cursorColor: string;
}

export interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'image' | 'group' | 'text' | 'polygon';
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
  opacity?: number; // 0 to 1, default 1
  // Line-specific properties
  x2?: number;
  y2?: number;
  strokeWidth?: number;
  arrowStart?: boolean; // Arrow at start point (left)
  arrowEnd?: boolean;   // Arrow at end point (right)
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
  // Polygon-specific properties
  sides?: number; // Number of sides (3-64)
  sideLength?: number; // Base side length (default for all sides)
  customSideLengths?: number[]; // Custom length for each side (overrides sideLength)
  selectedSide?: number; // Index of currently selected side for editing (0-based)
  customVertices?: Array<{ x: number; y: number }>; // Custom vertex positions for free-form shapes
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

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  message: string;
  timestamp: number;
  isAI?: boolean;
}