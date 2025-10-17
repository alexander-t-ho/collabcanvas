# 🤖 AI Canvas Agent

## Overview

The AI Canvas Agent allows users to create and manipulate canvas objects using natural language through OpenAI's GPT-4 function calling.

## Setup Instructions

### 1. Add OpenAI API Key

Create a `.env.local` file in the project root (if it doesn't exist) and add your OpenAI API key:

```bash
REACT_APP_OPENAI_API_KEY=sk-your-actual-key-here
```

**Important:** Never commit your `.env.local` file to GitHub. It's already in `.gitignore`.

### 2. Install Dependencies

The OpenAI SDK is already included in `package.json`. If you need to reinstall:

```bash
npm install
```

### 3. Run the Application

```bash
npm start
```

## Features

### 9 AI Commands Supported

1. **createShape** - Create rectangles and circles
2. **createText** - Add text elements
3. **moveShape** - Move objects to new positions
4. **resizeShape** - Change object dimensions
5. **rotateShape** - Rotate objects by degrees
6. **arrangeShapes** - Organize objects in patterns (horizontal, vertical, grid)
7. **createComplex** - Build complex UI elements (forms, nav bars, cards)
8. **deleteShape** - Remove objects from canvas
9. **getCanvasState** - Query current canvas state

### Example Commands

#### Creation Commands
- "Create a blue rectangle at position 100, 200"
- "Add a red circle in the center"
- "Make a 200x300 rectangle"
- "Create yellow text that says Hello World"

#### Manipulation Commands
- "Move the blue rectangle to the center"
- "Resize the circle to be twice as big" (200x200)
- "Rotate the text 45 degrees"
- "Make the rectangle 300 pixels wide"

#### Layout Commands
- "Arrange these shapes in a horizontal row"
- "Create a grid of 3x3 squares"
- "Space these elements evenly"
- "Organize vertically with 30 pixel spacing"

#### Complex Commands
- "Create a login form with username and password fields"
- "Build a navigation bar with 4 menu items"
- "Make a card layout with title, image, and description"
- "Create a button group with Save, Cancel, and Delete buttons"

## How It Works

### Architecture

1. **User Input** → AI Chat Interface
2. **OpenAI GPT-4** → Processes natural language with function calling
3. **AI Service** → Translates function calls to canvas actions
4. **Canvas Context** → Executes actions (addObject, updateObject, etc.)
5. **Firebase Sync** → All users see changes in real-time

### Function Calling Flow

```typescript
User: "Create a blue rectangle"
  ↓
OpenAI GPT-4 Function Call:
{
  name: "createShape",
  arguments: {
    type: "rectangle",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    color: "#0000FF"
  }
}
  ↓
Canvas Context: addObject(...)
  ↓
Firebase: Real-time sync to all users
```

### Real-Time Collaboration

- All AI-generated objects are synced through Firebase Firestore
- Multiple users can use the AI simultaneously
- Changes appear instantly for all connected users
- Each object tracks the creator (`createdBy` field)

## Complex Element Templates

### Login Form
Creates:
- Form background (white rounded rectangle)
- "Login" title text
- Username input field (gray rectangle + label)
- Password input field (gray rectangle + label)
- Submit button (blue rectangle + white text)

### Navigation Bar
Creates:
- Dark nav background (full width)
- 4 menu items evenly spaced
- White text labels for each item

### Card Layout
Creates:
- Card background (white rounded)
- Image placeholder (gray rectangle)
- Title text (bold, centered)
- Description text (smaller, gray)
- "Learn More" button

### Button Group
Creates:
- Multiple buttons side-by-side
- Custom labels for each button
- Consistent styling

## Performance

- **Latency**: < 2 seconds for single-step commands
- **Breadth**: 9 distinct command types
- **Complexity**: Multi-object creation in single command
- **Reliability**: Error handling and fallbacks
- **UX**: Visual feedback, message history, processing indicator

## Security Considerations

### Current Implementation (Demo)
- OpenAI API calls made directly from browser
- Uses `dangerouslyAllowBrowser: true` flag
- API key in environment variable

### Production Recommendations
- Move OpenAI calls to backend (Node.js/Express, Firebase Functions, etc.)
- Implement rate limiting per user
- Add request validation and sanitization
- Use server-side API key management
- Add usage monitoring and cost controls

## Limitations

- Object identification by color/type is basic (e.g., "blue rectangle")
- Complex arrangements may need refinement
- No undo for AI actions (use canvas undo feature)
- API costs apply per request

## Future Enhancements

- [ ] Voice input for commands
- [ ] AI-suggested layouts
- [ ] Smart object grouping
- [ ] Style recommendations
- [ ] Template library
- [ ] Multi-step workflows with confirmation
- [ ] Undo/redo specific to AI actions
- [ ] Better object identification (by nickname, ID)
- [ ] Batch operations optimization

## Testing

Test the AI agent with these scenarios:

1. **Single object creation**: "Create a red circle"
2. **Positioned creation**: "Add a blue square at 200, 100"
3. **Text creation**: "Create text that says Welcome"
4. **Movement**: "Move the circle to the center"
5. **Arrangement**: "Arrange all shapes horizontally"
6. **Complex**: "Create a login form"
7. **Multiple users**: Have 2+ users issue commands simultaneously
8. **Multi-step**: "Create 3 circles then arrange them vertically"

## Troubleshooting

### AI not responding
- Check OpenAI API key is set correctly in `.env.local`
- Verify internet connection
- Check browser console for errors
- Ensure API key has sufficient credits

### Objects not appearing
- Check Firebase connection
- Verify user is authenticated
- Check browser console for errors
- Ensure proper permissions in Firestore rules

### Slow responses
- OpenAI API latency varies
- Check network speed
- Consider caching common patterns
- Optimize function schemas

## Cost Management

OpenAI API pricing (as of 2024):
- GPT-4-turbo: ~$0.01 per request (varies by token count)
- Function calling adds minimal cost
- Monitor usage in OpenAI dashboard
- Set up billing alerts

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables
3. Test with simple commands first
4. Check OpenAI API status
5. Review Firebase connection

---

Built with ❤️ using OpenAI GPT-4, React, TypeScript, and Firebase

