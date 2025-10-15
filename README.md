# CollabCanvas

A real-time collaborative canvas application built with React, TypeScript, and Firebase.

🚀 **Live Demo**: [https://collabcanvas-five.vercel.app](https://collabcanvas-five.vercel.app)

## 🎯 Features

### Core Functionality
- **Real-time Collaboration**: See other users' cursors and edits in real-time
- **Online Status**: View who's currently online with Google Docs-style presence indicators
- **User Authentication**: Secure email/password authentication with Firebase Auth
- **User Profiles**: Customizable display names, profile photos, and password management

### Canvas Tools
- **Infinite Canvas**: Pan and zoom with dynamic grid pattern
- **Shape Creation**:
  - Rectangles with customizable corner radius
  - Circles with adjustable radius
  - Lines with curved/straight options
  - Image imports with drag-and-drop support

### Shape Editing
- **Transform Controls**: Resize, rotate, and position shapes
- **Property Editors**: Dedicated panels for each shape type
  - Color picker with hex code input
  - Rotation controls (degrees)
  - Corner radius sliders (rectangles and images)
  - Line thickness controls
  - Size adjustments (width, height, radius, length)
- **Visual Effects**:
  - Drop shadows with prominence controls
  - Z-index layering (move forward/backward)
  - Custom nicknames for all shapes
- **Alignment Guides**: Visual cues when aligning objects (within 100px)

### Advanced Line Features
- **Interactive Drawing**: Click-to-draw with real-time preview
- **Curved Lines**: Drag control point to create arcs
- **Endpoint Control**: Individual endpoint manipulation
- **Line Body Dragging**: Click line body to move entire line

### Image Features
- **Instant Upload**: Fast image loading with compression
- **Permanent Storage**: Images persist across sessions
- **Corner Radius**: Round image corners like rectangles
- **Cross-User Visibility**: All users see uploaded images in real-time

## 🏗️ Architecture

### Frontend
```
src/
├── components/
│   ├── Auth/
│   │   └── Login.tsx              # Authentication UI
│   ├── Canvas/
│   │   ├── Canvas.tsx              # Main canvas with Konva
│   │   ├── CanvasObject.tsx        # Renders individual objects
│   │   ├── Toolbar.tsx             # Top toolbar with tools and status
│   │   ├── InteractiveLine.tsx     # Line component with control points
│   │   ├── BaseEditor.tsx          # Shared editor controls
│   │   ├── RectangleEditor.tsx     # Rectangle-specific controls
│   │   ├── CircleEditor.tsx        # Circle-specific controls
│   │   ├── LineEditor.tsx          # Line-specific controls
│   │   ├── ImageEditor.tsx         # Image-specific controls
│   │   ├── ImageImport.tsx         # Image upload modal
│   │   └── UserProfileDropdown.tsx # User profile management
│   └── Collaboration/
│       ├── CursorOverlay.tsx       # Other users' cursors
│       └── RemoteCursor.tsx        # Individual cursor component
├── contexts/
│   ├── AuthContext.tsx             # Authentication state
│   ├── CanvasContext.tsx           # Canvas objects and operations
│   └── UserProfileContext.tsx      # User profile management
├── hooks/
│   ├── usePresence.ts              # Online user tracking
│   ├── useCursorSync.ts            # Cursor position sync
│   └── useRealtimeSync.ts          # Firestore object sync
├── types/
│   └── index.ts                    # TypeScript interfaces
└── utils/
    ├── colors.ts                   # Color generation utilities
    └── helpers.ts                  # Helper functions
```

### Backend (Firebase)
- **Firebase Authentication**: Email/password auth with user management
- **Firestore Database**: Canvas objects storage with real-time sync
- **Realtime Database**: User presence and cursor positions
- **Firebase Storage**: Image file storage (optional for large images)

### Data Models

#### CanvasObject
```typescript
{
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  rotation?: number;
  nickname?: string;
  zIndex?: number;
  shadow?: boolean;
  cornerRadius?: number;        // For rectangles and images
  x2?: number;                  // Line endpoint
  y2?: number;                  // Line endpoint
  strokeWidth?: number;         // Line thickness
  controlX?: number;            // Curve control point
  controlY?: number;            // Curve control point
  curved?: boolean;             // Line curvature flag
  src?: string;                 // Image data URL
}
```

#### PresenceData
```typescript
{
  userId: string;
  name: string;
  color: string;
  online: boolean;
  lastSeen: number;
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase project with:
  - Authentication enabled (Email/Password)
  - Firestore Database
  - Realtime Database
  - Storage (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/alexander-t-ho/collabcanvas.git
cd collabcanvas
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**

Create a `.env.local` file in the root directory:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

4. **Deploy Firebase Rules**

Deploy Firestore rules:
```bash
firebase deploy --only firestore
```

Deploy Realtime Database rules:
```bash
firebase deploy --only database
```

5. **Run the development server**
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Deployment

Deploy to Vercel:
```bash
vercel --prod
```

Ensure all Firebase environment variables are configured in Vercel:
- Go to your Vercel project settings
- Add all `REACT_APP_FIREBASE_*` variables
- Redeploy

## 🎨 Usage

### Creating Shapes
1. Click toolbar buttons to add rectangles, circles, or images
2. Click "Draw Line" and click twice on canvas to create a line
3. Click "Import Image" to upload images (drag-and-drop or file browser)

### Editing Shapes
1. Click any shape to select it
2. Edit panel appears on the left with controls:
   - Nickname, color, rotation, shadow
   - Shape-specific properties (corner radius, thickness, etc.)
   - Duplicate and delete buttons
   - Z-index controls (move forward/backward)

### Line Editing
- **Drag blue endpoints**: Move line endpoints independently
- **Drag green/red control point**: Create curved lines (arcs)
- **Click line body**: Move entire line

### Collaboration
- See other users' cursors in real-time
- Online status shows active collaborators with colored circles
- All edits sync instantly across all users

## 🔧 Technical Stack

- **Frontend**: React 18, TypeScript
- **Canvas Rendering**: Konva.js, React-Konva
- **Backend**: Firebase (Auth, Firestore, Realtime Database, Storage)
- **Deployment**: Vercel
- **Styling**: Inline CSS with modern design system

## 📝 License

This project was created as part of a Gauntlet AI project.

## 🤝 Contributing

This is a private project for demonstration purposes.

## 📞 Support

For issues or questions, please open an issue on GitHub.
