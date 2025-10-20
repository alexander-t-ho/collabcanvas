# CollabCanvas 🎨

A real-time collaborative canvas application with AI-powered design assistance. Built with React, TypeScript, Firebase, and OpenAI GPT-4.

🚀 **Live Demo**: [https://collabcanvas-6y555l93x-alexander-hos-projects.vercel.app](https://collabcanvas-6y555l93x-alexander-hos-projects.vercel.app)

---

## ✨ Features

### 🤖 AI Agent (NEW!)
- **Natural Language Canvas Manipulation**: Create and edit shapes using conversational commands
- **10+ Command Types**: Create, move, resize, rotate, layer, arrange, group, delete
- **Smart Shapes**: AI can create clouds, stars, suns, castles, smiley faces, fish, and more
- **Image Analysis**: Upload designs and AI recreates them on canvas
- **Contextual Suggestions**: AI suggests next steps after each action
- **Preview System**: Review complex operations before execution (3+ objects)
- **Progress Tracking**: Real-time progress bar for large operations

### 🎨 Shape Tools
- **Basic Shapes**: Rectangles, circles, ellipses
- **Advanced Shapes**: 
  - **Polygons** (3-64 sides) with customizable vertices
  - **Stars** (preset 5-point with custom vertices)
  - **Hearts** (35-vertex smooth curves)
- **Lines**: Straight or curved with draggable control points
- **Text**: Fully customizable with font controls
- **Images**: Upload and display with compression

### 🔧 Editing Capabilities
- **Transform Tools**: Resize, rotate, move all shapes
- **Visual Bounding Boxes**: 8-handle resize controls
- **Rotation with Shift-Snap**: Hold shift for 45° increments
- **Custom Vertices**: Drag polygon points to create custom shapes
- **Circle ↔ Ellipse**: Convert between circles and ellipses
- **Alignment Guides**: Snap to other objects and X/Y axes
- **Z-Index Layering**: Bring to front, send to back
- **Grouping**: Combine multiple objects into groups

### 🎨 Advanced Features
- **Shape Dropdown**: Organized menu for all shape types
- **Export Dropdown**: PNG images or React/CSS code
- **Undo/Redo**: Comprehensive history system (infinite undo)
- **Grid System**: Origin-centered coordinate system (press R to reset)
- **Real-time Chat**: Team messaging with AI mode toggle
- **Multi-Select**: Shift+drag to select multiple objects
- **Duplicate**: Clone any object

### 👥 Collaboration
- **Real-time Cursors**: See collaborators' mouse positions
- **Online Presence**: Google Docs-style user indicators
- **Shared AI**: All users see AI-generated content instantly
- **Collaborative Undo/Redo**: Synced history across users

---

## 🤖 AI Commands

### Creation
```
"Make a red circle"
"Create a blue rectangle"
"Draw a 5-point star"
"Make a smiley face"
```

### Manipulation
```
"Move the square to 200, 200"
"Resize the circle to 150, 150"
"Rotate the star 45 degrees"
"Make it twice as big"
```

### Layering
```
"Put the circle in front of the square"
"Send the rectangle to the back"
"Bring the star forward"
```

### Layout
```
"Arrange these shapes horizontally"
"Create a 3x3 grid of circles"
"Space them evenly"
```

### Complex Shapes
```
"Draw a sun"
"Make a castle"
"Create a smiley face"
"Build a fish"
"Draw a cloud"
```

### Advanced
```
"Create a login form"
"Build a navigation bar with 4 items"
"Make a card layout"
"Group all the shapes together"
```

---

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Konva.js** for canvas rendering
- **React-Konva** for React integration
- **OpenAI GPT-4** for AI agent
- **Inline CSS** with modern design system

### Backend (Firebase)
- **Authentication**: Email/password with user management
- **Firestore**: Canvas objects with real-time sync
- **Realtime Database**: Undo/redo history and user presence
- **Storage**: Image file storage
- **Security Rules**: Scoped permissions for all collections

### Project Structure
```
src/
├── components/
│   ├── Auth/
│   │   └── Login.tsx
│   ├── Canvas/
│   │   ├── Canvas.tsx              # Main canvas
│   │   ├── CanvasObject.tsx        # Standard shapes
│   │   ├── PolygonShape.tsx        # Polygon rendering
│   │   ├── EllipseShape.tsx        # Ellipse rendering
│   │   ├── InteractiveLine.tsx     # Line with control points
│   │   ├── Toolbar.tsx             # Main toolbar
│   │   ├── ShapeDropdown.tsx       # Shape creation menu
│   │   ├── ExportDropdown.tsx      # Export options
│   │   ├── ChatWindow.tsx          # AI chat interface
│   │   ├── BaseEditor.tsx          # Common editing controls
│   │   ├── PolygonEditor.tsx       # Polygon properties
│   │   ├── EllipseEditor.tsx       # Ellipse properties
│   │   ├── PolygonDialog.tsx       # Polygon creation dialog
│   │   ├── ExportCode.tsx          # Code export modal
│   │   └── ...other editors
│   └── Collaboration/
│       ├── CursorOverlay.tsx
│       └── RemoteCursor.tsx
├── contexts/
│   ├── AuthContext.tsx
│   ├── CanvasContext.tsx
│   └── UserProfileContext.tsx
├── hooks/
│   ├── usePresence.ts
│   ├── useCursorSync.ts
│   ├── useRealtimeSync.ts
│   └── useMessageSync.ts
├── services/
│   └── aiService.ts                # OpenAI integration
├── types/
│   └── index.ts
└── utils/
    ├── colors.ts
    ├── helpers.ts
    └── exportCode.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- Firebase project with Auth, Firestore, Realtime DB
- OpenAI API key (for AI features)

### Installation

1. **Clone and install**
```bash
git clone https://github.com/alexander-t-ho/collabcanvas.git
cd collabcanvas
npm install
```

2. **Configure environment variables**

Create `.env.local`:
```env
# Firebase
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# OpenAI (for AI features)
REACT_APP_OPENAI_API_KEY=your_openai_key
```

3. **Deploy Firebase rules**
```bash
firebase deploy --only firestore:rules
firebase deploy --only database
```

4. **Run development server**
```bash
npm start
```

### Production Deployment

```bash
npm run build
vercel --prod
```

---

## 🎯 Key Features Explained

### Polygon Tool
- Create any polygon from 3 to 64 sides
- Preset templates: Triangle, Square, Pentagon, Hexagon, Octagon, Star ⭐, Heart ❤️
- Drag vertices to create custom shapes
- Edit individual side lengths
- Full transform controls (rotate, resize, layer)

### Ellipse Tool
- Convert any circle to ellipse
- Independent horizontal/vertical radius control
- Convert back to circle
- Same editing capabilities as all shapes

### AI Agent
- **GPT-4 Powered**: Natural language understanding
- **Function Calling**: Precise canvas manipulation
- **100 Object Limit**: Can create up to 100 objects per command
- **Conversation Memory**: Remembers context for follow-up commands
- **Smart Positioning**: Understands "next to", "behind", "in front of"
- **Auto-Grouping**: Complex shapes automatically grouped

### Undo/Redo System
- Infinite undo (no limit)
- Tracks every action individually
- Works across all object types
- Collaborative (synced across users)
- Debug logging for transparency

---

## 📚 Documentation

- **AI Agent Guide**: See `AI_AGENT_IMPLEMENTATION.md`
- **Testing Guide**: See `AI_TESTING_GUIDE.md`
- **Firebase Rules**: See `FIREBASE_RULES.md`

---

## 🎨 Custom Shapes Available

**AI can create these instantly**:
- ☁️ Cloud
- ☀️ Sun
- ⭐ Star (3-64 points)
- 🏰 Castle
- 😊 Smiley Face
- 🐟 Fish
- ❤️ Heart

**AI can decompose and create any shape using basic components**:
- Trees, houses, cars, robots, rockets, flowers, etc.

---

## 🔑 Keyboard Shortcuts

- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo
- **Delete/Backspace**: Delete selected object(s)
- **Enter**: Confirm line placement (when drawing)
- **Escape**: Cancel line drawing
- **R**: Reset view to origin
- **Shift + Rotate**: Snap to 45° angles

---

## 🌟 Recent Updates

### Latest Release
- ✅ Polygon tool with customizable vertices
- ✅ Ellipse shapes with conversion from circles
- ✅ Star and Heart presets
- ✅ Fish template
- ✅ Improved undo system (infinite undo)
- ✅ AI understanding of layering and positioning
- ✅ Shape and Export dropdowns (cleaner UI)
- ✅ Comprehensive debug logging
- ✅ Fixed Firestore permission errors

---

## 🐛 Known Issues

- Angle editing for polygons: Work in progress (see `angle-feature` branch)
- Undo may require 2-3 second wait between rapid clicks

---

## 🛠️ Development

### Branches
- `main`: Production-ready code
- `test`: Active development and testing
- `features`: Experimental polygon features
- `angle-feature`: Polygon angle editing (WIP)
- `undo`: Undo system debugging

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

---

## 📊 Project Stats

- **Lines of Code**: 10,000+
- **Components**: 30+
- **AI Functions**: 12
- **Custom Shapes**: 6+ templates
- **Supported Polygon Sides**: 3-64
- **Max Objects per AI Command**: 100

---

## 🙏 Credits

Built by Alexander Ho for the Gauntlet AI project.

**Technologies**:
- React & TypeScript
- Firebase Suite
- OpenAI GPT-4
- Konva.js
- Vercel

---

## 📄 License

This project is for educational and demonstration purposes.

---

## 🔗 Links

- **Live App**: https://collabcanvas-6y555l93x-alexander-hos-projects.vercel.app
- **GitHub**: https://github.com/alexander-t-ho/collabcanvas
- **Documentation**: See `/docs` folder

---

**Made with ❤️ and powered by AI** 🤖✨
