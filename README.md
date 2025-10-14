# CollabCanvas MVP

Real-time collaborative canvas application with multiplayer support, built with React, TypeScript, and Firebase.

## ✨ Features

- ✅ **Real-time collaboration** with multiple users
- ✅ **Multiplayer cursors** with user names and colors
- ✅ **Canvas objects**: Create, move, resize, and delete rectangles
- ✅ **Pan and zoom** canvas with smooth interactions
- ✅ **Presence awareness**: See who's online in real-time
- ✅ **State persistence**: All changes automatically saved
- ✅ **User authentication**: Secure email/password signup and login
- ✅ **Responsive design**: Works on desktop browsers

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/collabcanvas.git
   cd collabcanvas
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication → Email/Password
   - Create Firestore Database (start in test mode)
   - Create Realtime Database (start in test mode)
   - Register a web app and get configuration

4. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp env-example.md .env.local
   
   # Edit .env.local with your Firebase configuration
   ```

5. **Deploy Firebase security rules:**
   - Follow instructions in `FIREBASE_RULES.md`

6. **Start the development server:**
   ```bash
   npm start
   ```

7. **Open your browser:**
   - Go to `http://localhost:3000`
   - Create an account or sign in
   - Open multiple browser windows to test multiplayer features!

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   React Client  │    │   React Client  │
│   (Browser A)   │    │   (Browser B)   │    │   (Browser C)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │      Firebase           │
                    │  ┌─────────────────────┐ │
                    │  │    Firestore DB     │ │  ← Canvas Objects
                    │  │  (Objects & Cursors)│ │  ← Cursor Positions
                    │  └─────────────────────┘ │
                    │  ┌─────────────────────┐ │
                    │  │   Realtime DB      │ │  ← Presence Data
                    │  │   (Presence)       │ │
                    │  └─────────────────────┘ │
                    │  ┌─────────────────────┐ │
                    │  │   Authentication   │ │  ← User Management
                    │  └─────────────────────┘ │
                    └─────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Konva.js** - 2D canvas rendering
- **React Konva** - React bindings for Konva

### Backend
- **Firebase Authentication** - User management
- **Firestore** - Document database for canvas objects and cursors
- **Realtime Database** - Real-time presence system

### Development
- **Create React App** - Build tooling
- **ESLint** - Code linting
- **Firebase CLI** - Deployment and rules

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   └── Login.tsx           # Authentication UI
│   ├── Canvas/
│   │   ├── Canvas.tsx          # Main canvas component
│   │   ├── CanvasObject.tsx    # Individual canvas objects
│   │   └── Toolbar.tsx         # Canvas toolbar
│   └── Collaboration/
│       ├── CursorOverlay.tsx   # Cursor management
│       ├── RemoteCursor.tsx    # Remote user cursors
│       └── PresenceIndicator.tsx # Online users list
├── contexts/
│   ├── AuthContext.tsx         # Authentication state
│   └── CanvasContext.tsx       # Canvas state management
├── hooks/
│   ├── useCursorSync.ts        # Cursor synchronization
│   ├── usePresence.ts          # Presence management
│   └── useRealtimeSync.ts      # Object synchronization
├── firebase/
│   └── config.ts               # Firebase configuration
├── types/
│   └── index.ts                # TypeScript definitions
├── utils/
│   ├── colors.ts               # Color utilities
│   └── helpers.ts              # Helper functions
└── App.tsx                     # Main application
```

## 🎮 How to Use

1. **Sign Up/Login**: Create an account or sign in with existing credentials
2. **Create Objects**: Click "Add Rectangle" to create new objects on the canvas
3. **Interact with Objects**: 
   - Click to select objects
   - Drag to move objects
   - Use corner handles to resize selected objects
   - Press Delete/Backspace to remove selected objects
4. **Navigate Canvas**: 
   - Drag empty areas to pan
   - Use mouse wheel to zoom in/out
5. **Collaborate**: 
   - Open multiple browser windows/tabs
   - See other users' cursors in real-time
   - Watch objects update live as others edit them
   - Check the presence indicator to see who's online

## 🚀 Deployment

### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Build the project
npm run build

# Initialize Firebase hosting
firebase login
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Vercel (Alternative)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## 🔧 Configuration

### Environment Variables
All Firebase configuration should be placed in `.env.local`:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
REACT_APP_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
```

### Firebase Security Rules
See `FIREBASE_RULES.md` for detailed security rule configuration.

## 🧪 Testing Multiplayer Features

1. **Open multiple browser windows**:
   ```bash
   # Terminal 1
   npm start
   
   # Open multiple browser windows/tabs to http://localhost:3000
   # Use incognito/private browsing for separate user sessions
   ```

2. **Test scenarios**:
   - Create accounts in different windows
   - Create objects in one window, verify they appear in others
   - Move objects in one window, watch real-time updates
   - Move cursor in one window, see cursor appear in others
   - Close one window, verify presence updates in remaining windows

## ⚡ Performance

- **60 FPS** canvas rendering with Konva.js
- **Sub-100ms** object synchronization via Firestore
- **50ms throttled** cursor updates for smooth performance
- **Optimistic updates** for responsive local interactions

## 🐛 Known Limitations

- **Single canvas**: MVP supports one shared canvas
- **Rectangle objects only**: Limited to rectangle shapes
- **No undo/redo**: No action history management
- **Last-write-wins**: Simple conflict resolution
- **Desktop only**: Not optimized for mobile/touch
- **No object ownership**: Any user can modify any object

## 🔒 Security

- **Authentication required**: All operations require user login
- **Firestore security rules**: Prevent unauthorized access
- **Input validation**: Client-side validation for user inputs
- **Rate limiting**: Throttled updates prevent spam

## 🛣️ Roadmap

### Phase 2 (Post-MVP)
- Multiple shape types (circles, lines, text)
- Object ownership and permissions
- Undo/redo functionality
- Multiple canvas support
- Enhanced UI/UX design

### Phase 3 (Advanced)
- Mobile/touch support
- Voice/video chat integration
- Comments and annotations
- Export to PNG/SVG
- Version history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly with multiple users
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

### Common Issues

**Firebase permissions error**
- Ensure Firebase security rules are deployed correctly
- Check that user is authenticated
- Verify Firestore and Realtime Database are created

**Objects not syncing**
- Check browser console for Firebase errors
- Verify internet connection
- Ensure `.env.local` has correct Firebase config

**Performance issues**
- Limit number of objects on canvas (< 100 for best performance)
- Close unnecessary browser tabs
- Check if multiple users are creating objects rapidly

### Getting Help
- Check the `FIREBASE_RULES.md` for setup instructions
- Review browser console for error messages
- Test with Firebase console to verify data flow
- Open GitHub issues for bugs or feature requests

---

**Built with ❤️ for real-time collaboration**