# AI Agent Testing Guide

## Quick Test Commands

### 1. Basic Shape Creation (PRIORITY)
Test these first to ensure basic functionality works:

```
✅ "make a red circle"
✅ "create a blue rectangle"
✅ "make a green square"
✅ "create a yellow circle"
```

**Expected**: Each command should create a shape at the center (0,0) with default size 120x120.

---

### 2. Relative Positioning (PRIORITY)
Test contextual understanding:

```
Step 1: "make a red circle"
Step 2: "make a blue square next to it"
Step 3: "create a green circle below the square"
Step 4: "put a yellow rectangle above the red circle"
```

**Expected**: 
- Blue square appears 150-200px to the RIGHT of red circle
- Green circle appears 100-150px BELOW blue square
- Yellow rectangle appears 100-150px ABOVE red circle

---

### 3. Custom Sizes and Positions
```
✅ "create a 200x200 purple square"
✅ "make a red circle at position 100, 100"
✅ "create a 300x150 blue rectangle at -200, 50"
```

**Expected**: Shapes created with specified dimensions and coordinates.

---

### 4. Text Creation
```
✅ "add text that says Hello World"
✅ "create text that says Welcome at position 0, -100"
✅ "make large text that says TITLE"
```

**Expected**: Text objects appear at specified positions with default or custom styling.

---

### 5. Shape Manipulation
```
Step 1: "create a blue rectangle"
Step 2: "move the blue rectangle to 200, 100"
Step 3: "resize the blue rectangle to 300, 200"
Step 4: "rotate the blue rectangle 45 degrees"
```

**Expected**: Rectangle moves, resizes, and rotates as commanded.

---

### 6. Multiple Objects in One Command
```
✅ "create a red circle and a blue square next to it"
✅ "make three green circles in a row"
✅ "create 5 rectangles"
```

**Expected**: Multiple objects created with appropriate spacing.

---

### 7. Arrangement Commands
```
Step 1: Create 3-4 shapes manually or via AI
Step 2: "arrange these shapes horizontally"
Step 3: Create 3-4 more shapes
Step 4: "arrange them vertically"
Step 5: Create 6-9 shapes
Step 6: "arrange them in a grid"
```

**Expected**: All shapes on canvas rearrange according to specified pattern.

---

### 8. Complex UI Generation (ADVANCED)

#### Login Form
```
✅ "create a login form"
```

**Expected**: 
- Title: "Login"
- Username field (gray background)
- Password field (gray background)
- Submit button (blue with shadow)
- All properly aligned vertically

#### Navigation Bar
```
✅ "build a navigation bar with 4 menu items"
✅ "create a nav bar"
```

**Expected**:
- Dark background (800px wide, 60px tall)
- 4 menu items: Home, About, Services, Contact
- White text, evenly spaced

#### Card Layout
```
✅ "make a card layout"
✅ "create a card with title Product Showcase"
```

**Expected**:
- White card background with shadow
- Image placeholder (gray)
- Title text
- Description text
- All layered properly

---

### 9. Delete Commands
```
Step 1: "create a red circle"
Step 2: "delete the red circle"
Step 3: "create a blue square"
Step 4: "remove the blue square"
```

**Expected**: Shapes are removed from canvas.

---

### 10. Conversational Flow
Test that AI remembers context across multiple messages:

```
Conversation 1:
You: "make a red circle"
AI: [Creates circle]
You: "make it bigger"
AI: [Should resize the red circle]

Conversation 2:
You: "create a blue square"
AI: [Creates square]
You: "put a green circle next to it"
AI: [Creates circle to the right of square]
You: "now add text above them that says Shapes"
AI: [Creates text above the shapes]
```

**Expected**: AI understands "it", "them", "next to it" based on previous commands.

---

## Color Testing

Test that AI understands these colors correctly:

```
✅ red → #FF0000
✅ blue → #0000FF
✅ green → #00FF00
✅ yellow → #FFFF00
✅ purple → #800080
✅ orange → #FFA500
✅ black → #000000
✅ white → #FFFFFF
✅ gray → #808080
✅ pink → #FFC0CB
```

Test command: `"make a [COLOR] circle"` for each color.

---

## Multi-User Real-Time Testing

1. Open CollabCanvas in **2 different browser windows** (or 2 devices)
2. Log in as different users in each window
3. In **Window 1**: Use AI to create shapes
4. In **Window 2**: Watch shapes appear in real-time
5. In **Window 2**: Use AI to create different shapes
6. In **Window 1**: Watch those shapes appear
7. Both users should see all shapes immediately

**Expected**: Real-time synchronization works for all AI-generated objects.

---

## Performance Testing

Time how long each command takes:

| Command | Target Time | Actual Time |
|---------|-------------|-------------|
| "make a red circle" | < 2s | _____ |
| "create a blue square next to it" | < 2s | _____ |
| "create a login form" | < 4s | _____ |
| "arrange these shapes horizontally" | < 2s | _____ |

---

## Error Handling Tests

Test that these scenarios are handled gracefully:

### Invalid Commands
```
❌ "asdfghjkl" → Should respond with helpful message
❌ "delete everything" → Should explain what it can do
❌ "" (empty message) → Should not send
```

### Network Issues
1. Disconnect internet
2. Try AI command
3. Should show error message
4. Reconnect internet
5. Retry command - should work

### API Key Issues
If API key is invalid, should show appropriate error message.

---

## Chat Window Testing

### UI Elements
- [ ] Chat button appears in bottom-right corner
- [ ] Clicking button opens chat window
- [ ] Chat window shows message history
- [ ] AI Mode toggle button works
- [ ] Message input field accepts typing
- [ ] Send button is enabled when text is entered
- [ ] Enter key sends message
- [ ] Messages appear for both current user and other users
- [ ] AI messages are visually distinct

### Message Display
- [ ] User messages appear on the right (purple gradient)
- [ ] Other user messages appear on the left (white)
- [ ] AI messages appear on the left (purple gradient)
- [ ] Timestamps are shown
- [ ] User names/colors are shown for other users
- [ ] Messages auto-scroll to bottom

---

## Common Issues & Solutions

### Issue: "AI is not responding"
**Solution**: 
1. Check browser console for errors
2. Verify OpenAI API key is set in `.env`
3. Check internet connection
4. Verify Firestore rules allow message writes

### Issue: "Shapes not appearing"
**Solution**:
1. Check if shapes are created off-screen (try zoom out)
2. Verify user is authenticated
3. Check Firestore console for objects
4. Look for JavaScript errors in console

### Issue: "Wrong colors"
**Solution**:
- AI might interpret color names differently
- Try using explicit hex codes: "create a #FF0000 circle"

### Issue: "Relative positioning not working"
**Solution**:
- Try being more explicit: "create a blue square 150 pixels to the right of the red circle"
- Make sure previous command completed successfully

---

## Success Criteria

### ✅ Minimum Requirements (MUST PASS)
- [ ] Basic creation works ("make a red circle")
- [ ] Relative positioning works ("make another next to it")
- [ ] At least 6 command types functional
- [ ] Real-time sync works for AI-generated objects
- [ ] Complex UI generation works (login form)
- [ ] Response time < 2 seconds for simple commands

### ⭐ Stretch Goals (NICE TO HAVE)
- [ ] Response time < 1.5 seconds for simple commands
- [ ] AI understands all 10+ color names correctly
- [ ] Conversational context works for 5+ exchanges
- [ ] Complex UI layouts are visually polished
- [ ] Multi-user AI works with 3+ concurrent users

---

## Reporting Issues

When reporting issues, include:
1. Exact command used
2. Expected behavior
3. Actual behavior
4. Browser console errors (if any)
5. Screenshot of canvas state
6. Browser and OS version

---

## Next Steps After Testing

1. Document any bugs found
2. Test edge cases (very large shapes, negative coordinates, etc.)
3. Test with multiple users simultaneously
4. Monitor OpenAI API usage and costs
5. Consider adding user feedback for each command
6. Optimize prompts based on common errors

---

## Quick Demo Script

Use this script for a quick demo:

```
1. "make a red circle"
   → Shows basic creation

2. "make a blue square next to it"
   → Shows contextual understanding

3. "create a login form"
   → Shows complex UI generation

4. "arrange these shapes horizontally"
   → Shows layout commands

5. Open in second browser window
   → Shows real-time collaboration
```

**Demo time: ~2 minutes**

---

Good luck testing! 🚀

