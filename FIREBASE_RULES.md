# Firebase Security Rules

This document contains the Firebase security rules that need to be deployed for the CollabCanvas application to work properly.

## Firestore Security Rules

Navigate to Firebase Console → Firestore Database → Rules and replace the content with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read all users but only write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Canvas objects - authenticated users can create, read, update, and delete
    match /canvases/{canvasId}/objects/{objectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // Cursor positions - users can read all cursors but only write their own
    match /canvases/{canvasId}/cursors/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Realtime Database Security Rules

Navigate to Firebase Console → Realtime Database → Rules and replace the content with:

```json
{
  "rules": {
    "presence": {
      "$canvasId": {
        "$userId": {
          ".read": "auth != null",
          ".write": "auth.uid == $userId"
        }
      }
    }
  }
}
```

## How to Deploy Rules

### Option 1: Firebase Console (Recommended for MVP)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database → Rules
4. Copy and paste the Firestore rules above
5. Click "Publish"
6. Navigate to Realtime Database → Rules
7. Copy and paste the Realtime Database rules above
8. Click "Publish"

### Option 2: Firebase CLI (For Production)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore` and `firebase init database`
4. Update the generated rule files with the rules above
5. Deploy: `firebase deploy --only firestore:rules,database`

## Rule Explanations

### Firestore Rules
- **Users collection**: Allows all authenticated users to read user profiles (for display names, cursor colors) but only allows users to modify their own profile
- **Canvas objects**: Allows all authenticated users to create, read, update, and delete canvas objects (rectangles, circles, etc.)
- **Cursor positions**: Allows all authenticated users to read cursor positions (for multiplayer cursors) but only allows users to update their own cursor position

### Realtime Database Rules
- **Presence data**: Allows all authenticated users to read presence information (who's online) but only allows users to update their own presence status

## Security Considerations

### Current MVP Rules
- **Authentication required**: All operations require user authentication
- **Last-write-wins**: No conflict resolution, simpler for MVP
- **No object ownership**: Any authenticated user can modify any object
- **Public canvas**: Single shared canvas accessible to all users

### Production Enhancements (Future)
Consider implementing these for production:
- Object ownership validation
- Canvas permissions (view/edit roles)
- Rate limiting for rapid updates
- Input validation for object properties
- Audit logging for security events

## Testing Rules

You can test your security rules using the Firebase Console:

1. Go to Firestore Database → Rules
2. Click on "Rules playground"
3. Test different scenarios:
   - Authenticated vs unauthenticated users
   - Reading vs writing operations
   - Different user IDs accessing different documents

## Common Issues

### Issue: "Missing or insufficient permissions"
**Solution**: Ensure the user is authenticated and rules are deployed correctly

### Issue: Realtime Database not working
**Solution**: Check that the database URL in your config matches the rules path structure

### Issue: Rules too restrictive
**Solution**: Start with the rules above, then gradually tighten security as needed
