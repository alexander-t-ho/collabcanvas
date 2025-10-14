#!/bin/bash

# Firebase Project: collabcanvas-3071a
# Update Vercel environment variables to match Firebase project

echo "🔥 Updating Vercel Firebase Configuration for collabcanvas-3071a"
echo ""

# Remove existing variables
echo "📝 Removing old environment variables..."
vercel env rm REACT_APP_FIREBASE_API_KEY --yes 2>/dev/null || true
vercel env rm REACT_APP_FIREBASE_AUTH_DOMAIN --yes 2>/dev/null || true
vercel env rm REACT_APP_FIREBASE_PROJECT_ID --yes 2>/dev/null || true
vercel env rm REACT_APP_FIREBASE_STORAGE_BUCKET --yes 2>/dev/null || true
vercel env rm REACT_APP_FIREBASE_MESSAGING_SENDER_ID --yes 2>/dev/null || true
vercel env rm REACT_APP_FIREBASE_APP_ID --yes 2>/dev/null || true
vercel env rm REACT_APP_FIREBASE_DATABASE_URL --yes 2>/dev/null || true

echo "✅ Old variables removed"
echo ""
echo "🔑 Please get your Firebase configuration from:"
echo "   https://console.firebase.google.com/project/collabcanvas-3071a/settings/general"
echo ""
echo "📋 Then run these commands one by one:"
echo ""
echo "vercel env add REACT_APP_FIREBASE_API_KEY"
echo "vercel env add REACT_APP_FIREBASE_AUTH_DOMAIN"
echo "vercel env add REACT_APP_FIREBASE_PROJECT_ID"
echo "vercel env add REACT_APP_FIREBASE_STORAGE_BUCKET"
echo "vercel env add REACT_APP_FIREBASE_MESSAGING_SENDER_ID"  
echo "vercel env add REACT_APP_FIREBASE_APP_ID"
echo "vercel env add REACT_APP_FIREBASE_DATABASE_URL"
echo ""
