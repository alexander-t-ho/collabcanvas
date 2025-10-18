import React, { useState, useEffect, useRef } from 'react';
import { useMessageSync } from '../../hooks/useMessageSync';
import { processAICommand, processAICommandWithImage, AICommandResult } from '../../services/aiService';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';

const ChatWindow: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { messages, loading, sendMessage } = useMessageSync();
  const { objects, addObject, updateObject, deleteObject, selectMultiple } = useCanvas();
  const { currentUser } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 4MB for OpenAI)
    if (file.size > 4 * 1024 * 1024) {
      alert('Image must be smaller than 4MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
      setInputValue('Recreate this design on the canvas');
    };
    reader.readAsDataURL(file);
  };

  const executeAIActions = async (result: AICommandResult) => {
    if (!currentUser) return;

    for (const action of result.actions) {
      try {
        switch (action.type) {
          case 'createShape':
            await addObject({
              type: action.data.type,
              x: action.data.x,
              y: action.data.y,
              width: action.data.width,
              height: action.data.height,
              fill: action.data.color,
              nickname: '',
              cornerRadius: action.data.type === 'rectangle' ? 5 : 0,
              zIndex: objects.length,
              shadow: false,
              createdBy: currentUser.uid
            });
            break;

          case 'createText':
            await addObject({
              type: 'text',
              x: action.data.x,
              y: action.data.y,
              width: 200,
              height: 50,
              fill: action.data.color || '#000000',
              text: action.data.text,
              fontSize: action.data.fontSize || 24,
              fontFamily: 'Arial',
              fontStyle: 'normal',
              textAlign: 'left',
              nickname: '',
              zIndex: objects.length,
              shadow: false,
              createdBy: currentUser.uid
            });
            break;

          case 'moveShape':
            const moveObj = objects.find(obj => {
              const identifier = action.data.identifier.toLowerCase();
              const objType = obj.type?.toLowerCase();
              const objNickname = obj.nickname?.toLowerCase();
              const objText = obj.text?.toLowerCase();
              
              // Match by nickname (highest priority for groups)
              if (objNickname && identifier.includes(objNickname)) return true;
              
              // Match by type
              if (objType && identifier.includes(objType)) return true;
              
              // Match by text content
              if (objText && identifier.includes(objText)) return true;
              
              return false;
            });
            
            if (moveObj) {
              console.log('Moving object:', moveObj.nickname || moveObj.type, 'to', action.data.x, action.data.y);
              await updateObject(moveObj.id, {
                x: action.data.x,
                y: action.data.y
              });
              
              // If it's a group, also move all grouped objects
              if (moveObj.type === 'group' && moveObj.groupedObjects) {
                const deltaX = action.data.x - moveObj.x;
                const deltaY = action.data.y - moveObj.y;
                console.log('Moving grouped objects by delta:', deltaX, deltaY);
                
                for (const groupedId of moveObj.groupedObjects) {
                  const groupedObj = objects.find(o => o.id === groupedId);
                  if (groupedObj) {
                    await updateObject(groupedId, {
                      x: groupedObj.x + deltaX,
                      y: groupedObj.y + deltaY
                    });
                  }
                }
              }
            } else {
              console.log('Could not find object to move:', action.data.identifier);
            }
            break;

          case 'resizeShape':
            const resizeObj = objects.find(obj => {
              const identifier = action.data.identifier.toLowerCase();
              const objType = obj.type?.toLowerCase();
              const objNickname = obj.nickname?.toLowerCase();
              const objColor = obj.fill?.toLowerCase();
              const objText = obj.text?.toLowerCase();
              
              // Match by nickname (highest priority)
              if (objNickname && identifier.includes(objNickname)) return true;
              
              // Match by type (circle, rectangle, etc.)
              if (objType && identifier.includes(objType)) return true;
              
              // Match by color name
              const colorMap: { [key: string]: string } = {
                'red': '#ff0000', 'blue': '#0000ff', 'green': '#00ff00',
                'yellow': '#ffff00', 'purple': '#800080', 'orange': '#ffa500',
                'black': '#000000', 'white': '#ffffff', 'gray': '#808080', 'grey': '#808080',
                'pink': '#ffc0cb'
              };
              for (const [colorName, colorHex] of Object.entries(colorMap)) {
                if (identifier.includes(colorName) && objColor === colorHex.toLowerCase()) {
                  // Also check if type matches (e.g., "blue circle")
                  if (objType && identifier.includes(objType)) return true;
                  // Or just color match if no type specified
                  if (!identifier.includes('circle') && !identifier.includes('rectangle') && !identifier.includes('text')) return true;
                }
              }
              
              // Match by text content
              if (objText && identifier.includes(objText)) return true;
              
              return false;
            });
            
            if (resizeObj) {
              console.log('Resizing object:', resizeObj, 'to', action.data.width, 'x', action.data.height);
              await updateObject(resizeObj.id, {
                width: action.data.width,
                height: action.data.height
              });
            } else {
              console.log('Could not find object to resize:', action.data.identifier, 'in', objects);
            }
            break;

          case 'rotateShape':
            const rotateObj = objects.find(obj => {
              const identifier = action.data.identifier.toLowerCase();
              const objType = obj.type?.toLowerCase();
              const objNickname = obj.nickname?.toLowerCase();
              const objText = obj.text?.toLowerCase();
              
              // Match by nickname (highest priority for groups)
              if (objNickname && identifier.includes(objNickname)) return true;
              
              // Match by type
              if (objType && identifier.includes(objType)) return true;
              
              // Match by text content
              if (objText && identifier.includes(objText)) return true;
              
              return false;
            });
            
            if (rotateObj) {
              console.log('Rotating object:', rotateObj.nickname || rotateObj.type, 'to', action.data.degrees, 'degrees');
              await updateObject(rotateObj.id, {
                rotation: action.data.degrees
              });
              
              // If it's a group, also rotate all grouped objects
              if (rotateObj.type === 'group' && rotateObj.groupedObjects) {
                console.log('Rotating grouped objects:', rotateObj.groupedObjects);
                for (const groupedId of rotateObj.groupedObjects) {
                  await updateObject(groupedId, {
                    rotation: action.data.degrees
                  });
                }
              }
            } else {
              console.log('Could not find object to rotate:', action.data.identifier);
            }
            break;

          case 'changeLayer':
            // Use fresh objects array to get current state
            const layerObj = objects.find(obj => {
              const identifier = action.data.identifier.toLowerCase();
              const objType = obj.type?.toLowerCase();
              const objNickname = obj.nickname?.toLowerCase();
              const objText = obj.text?.toLowerCase();
              
              // Match by nickname (highest priority)
              if (objNickname && identifier.includes(objNickname)) return true;
              
              // Match by type
              if (objType && identifier.includes(objType)) return true;
              
              // Match by text content
              if (objText && identifier.includes(objText)) return true;
              
              return false;
            });
            if (layerObj) {
              const currentZIndex = layerObj.zIndex || 0;
              const maxZIndex = Math.max(...objects.map(obj => obj.zIndex || 0));
              const minZIndex = Math.min(...objects.map(obj => obj.zIndex || 0));
              let newZIndex = currentZIndex;
              let shouldUpdate = true;

              switch (action.data.action) {
                case 'front':
                  // Bring to front - only if not already at front
                  if (currentZIndex >= maxZIndex && objects.length > 1) {
                    // Already at front, but still update to ensure it stays on top
                    newZIndex = maxZIndex + 1;
                  } else {
                    newZIndex = maxZIndex + 1;
                  }
                  break;
                case 'back':
                  // Send to back - only if not already at back
                  if (currentZIndex <= minZIndex && objects.length > 1) {
                    // Already at back, but still update
                    newZIndex = minZIndex - 1;
                  } else {
                    newZIndex = minZIndex - 1;
                  }
                  break;
                case 'forward':
                  // Move forward one layer
                  newZIndex = currentZIndex + 1;
                  break;
                case 'backward':
                  // Move backward one layer
                  newZIndex = currentZIndex - 1;
                  break;
              }

              if (shouldUpdate) {
                await updateObject(layerObj.id, {
                  zIndex: newZIndex
                });
              }
            }
            break;

          case 'arrangeShapes':
            // Arrange existing shapes in specified pattern
            const shapesToArrange = objects.filter(obj => 
              obj.type === 'rectangle' || obj.type === 'circle'
            );
            
            const spacing = action.data.spacing || 200; // Default 200px center-to-center spacing
            const startX = action.data.startX || -200;
            const startY = action.data.startY || 0;

            if (action.data.arrangement === 'horizontal') {
              shapesToArrange.forEach((obj, idx) => {
                updateObject(obj.id, {
                  x: startX + (idx * spacing),
                  y: startY
                });
              });
            } else if (action.data.arrangement === 'vertical') {
              shapesToArrange.forEach((obj, idx) => {
                updateObject(obj.id, {
                  x: startX,
                  y: startY + (idx * spacing)
                });
              });
            } else if (action.data.arrangement === 'grid') {
              const gridSize = Math.ceil(Math.sqrt(shapesToArrange.length));
              shapesToArrange.forEach((obj, idx) => {
                const row = Math.floor(idx / gridSize);
                const col = idx % gridSize;
                updateObject(obj.id, {
                  x: startX + (col * spacing),
                  y: startY + (row * spacing)
                });
              });
            }
            break;

          case 'createComplex':
            // Create complex UI elements
            const complexType = action.data.type;
            const complexX = action.data.x || 0;
            const complexY = action.data.y || 0;

            if (complexType === 'login-form') {
              // Create a login form with username, password, and submit button
              // Title
              await addObject({
                type: 'text',
                x: complexX,
                y: complexY - 150,
                width: 200,
                height: 40,
                fill: '#1f2937',
                text: 'Login',
                fontSize: 32,
                fontFamily: 'Arial',
                fontStyle: 'bold',
                textAlign: 'center',
                nickname: 'Login Title',
                zIndex: objects.length,
                shadow: false,
                createdBy: currentUser.uid
              });

              // Username field background
              await addObject({
                type: 'rectangle',
                x: complexX,
                y: complexY - 70,
                width: 300,
                height: 50,
                fill: '#f3f4f6',
                nickname: 'Username Field',
                cornerRadius: 8,
                zIndex: objects.length,
                shadow: false,
                createdBy: currentUser.uid
              });

              // Username label
              await addObject({
                type: 'text',
                x: complexX - 100,
                y: complexY - 70,
                width: 100,
                height: 30,
                fill: '#6b7280',
                text: 'Username',
                fontSize: 14,
                fontFamily: 'Arial',
                fontStyle: 'normal',
                textAlign: 'left',
                nickname: 'Username Label',
                zIndex: objects.length + 1,
                shadow: false,
                createdBy: currentUser.uid
              });

              // Password field background
              await addObject({
                type: 'rectangle',
                x: complexX,
                y: complexY,
                width: 300,
                height: 50,
                fill: '#f3f4f6',
                nickname: 'Password Field',
                cornerRadius: 8,
                zIndex: objects.length,
                shadow: false,
                createdBy: currentUser.uid
              });

              // Password label
              await addObject({
                type: 'text',
                x: complexX - 100,
                y: complexY,
                width: 100,
                height: 30,
                fill: '#6b7280',
                text: 'Password',
                fontSize: 14,
                fontFamily: 'Arial',
                fontStyle: 'normal',
                textAlign: 'left',
                nickname: 'Password Label',
                zIndex: objects.length + 1,
                shadow: false,
                createdBy: currentUser.uid
              });

              // Submit button
              await addObject({
                type: 'rectangle',
                x: complexX,
                y: complexY + 80,
                width: 300,
                height: 50,
                fill: '#3b82f6',
                nickname: 'Submit Button',
                cornerRadius: 8,
                zIndex: objects.length,
                shadow: true,
                createdBy: currentUser.uid
              });

              // Submit button text
              await addObject({
                type: 'text',
                x: complexX,
                y: complexY + 80,
                width: 200,
                height: 30,
                fill: '#ffffff',
                text: 'Login',
                fontSize: 18,
                fontFamily: 'Arial',
                fontStyle: 'bold',
                textAlign: 'center',
                nickname: 'Submit Text',
                zIndex: objects.length + 1,
                shadow: false,
                createdBy: currentUser.uid
              });
            } else if (complexType === 'nav-bar') {
              // Create a navigation bar
              const itemCount = action.data.options?.itemCount || 4;
              const navWidth = 800;
              const itemWidth = navWidth / itemCount;

              // Nav bar background
              await addObject({
                type: 'rectangle',
                x: complexX,
                y: complexY,
                width: navWidth,
                height: 60,
                fill: '#1f2937',
                nickname: 'Nav Bar',
                cornerRadius: 0,
                zIndex: objects.length,
                shadow: true,
                createdBy: currentUser.uid
              });

              // Nav items
              const navItems = ['Home', 'About', 'Services', 'Contact'];
              for (let i = 0; i < itemCount; i++) {
                await addObject({
                  type: 'text',
                  x: complexX - navWidth / 2 + itemWidth / 2 + (i * itemWidth),
                  y: complexY,
                  width: itemWidth - 20,
                  height: 30,
                  fill: '#ffffff',
                  text: navItems[i] || `Item ${i + 1}`,
                  fontSize: 16,
                  fontFamily: 'Arial',
                  fontStyle: 'normal',
                  textAlign: 'center',
                  nickname: `Nav Item ${i + 1}`,
                  zIndex: objects.length + 1,
                  shadow: false,
                  createdBy: currentUser.uid
                });
              }
            } else if (complexType === 'card') {
              // Create a card layout
              // Card background
              await addObject({
                type: 'rectangle',
                x: complexX,
                y: complexY,
                width: 300,
                height: 400,
                fill: '#ffffff',
                nickname: 'Card',
                cornerRadius: 12,
                zIndex: objects.length,
                shadow: true,
                createdBy: currentUser.uid
              });

              // Card image placeholder
              await addObject({
                type: 'rectangle',
                x: complexX,
                y: complexY - 100,
                width: 280,
                height: 160,
                fill: '#e5e7eb',
                nickname: 'Card Image',
                cornerRadius: 8,
                zIndex: objects.length + 1,
                shadow: false,
                createdBy: currentUser.uid
              });

              // Card title
              await addObject({
                type: 'text',
                x: complexX,
                y: complexY + 40,
                width: 260,
                height: 40,
                fill: '#1f2937',
                text: action.data.options?.title || 'Card Title',
                fontSize: 24,
                fontFamily: 'Arial',
                fontStyle: 'bold',
                textAlign: 'center',
                nickname: 'Card Title',
                zIndex: objects.length + 1,
                shadow: false,
                createdBy: currentUser.uid
              });

              // Card description
              await addObject({
                type: 'text',
                x: complexX,
                y: complexY + 100,
                width: 260,
                height: 60,
                fill: '#6b7280',
                text: 'This is a card description with some content.',
                fontSize: 14,
                fontFamily: 'Arial',
                fontStyle: 'normal',
                textAlign: 'center',
                nickname: 'Card Description',
                zIndex: objects.length + 1,
                shadow: false,
                createdBy: currentUser.uid
              });
            }
            break;

          case 'createGroup':
            // Find all objects matching the identifiers
            const objectsToGroup: string[] = [];
            
            for (const identifier of action.data.objectIdentifiers) {
              const obj = objects.find(o => {
                const id = identifier.toLowerCase();
                const objNickname = o.nickname?.toLowerCase();
                const objType = o.type?.toLowerCase();
                const objText = o.text?.toLowerCase();
                
                // Match by nickname (best for specific objects)
                if (objNickname && id.includes(objNickname)) return true;
                // Match by text
                if (objText && id.includes(objText)) return true;
                // Match by type
                if (objType && id.includes(objType)) return true;
                
                return false;
              });
              
              if (obj) {
                objectsToGroup.push(obj.id);
              }
            }
            
            console.log('Grouping objects:', objectsToGroup);
            
            if (objectsToGroup.length >= 2) {
              // Select the objects and create group
              selectMultiple(objectsToGroup);
              
              // Wait a bit for selection to register
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Create the group using the context method
              const selectedObjects = objects.filter(obj => objectsToGroup.includes(obj.id));
              
              if (selectedObjects.length >= 2) {
                // Calculate bounds of all objects
                const minX = Math.min(...selectedObjects.map(obj => obj.x - (obj.width || 0) / 2));
                const maxX = Math.max(...selectedObjects.map(obj => obj.x + (obj.width || 0) / 2));
                const minY = Math.min(...selectedObjects.map(obj => obj.y - (obj.height || 0) / 2));
                const maxY = Math.max(...selectedObjects.map(obj => obj.y + (obj.height || 0) / 2));
                
                const padding = 20;
                const groupWidth = (maxX - minX) + padding * 2;
                const groupHeight = (maxY - minY) + padding * 2;
                const groupCenterX = (minX + maxX) / 2;
                const groupCenterY = (minY + maxY) / 2;
                
                await addObject({
                  type: 'group',
                  x: groupCenterX,
                  y: groupCenterY,
                  width: groupWidth,
                  height: groupHeight,
                  fill: 'transparent',
                  groupedObjects: objectsToGroup,
                  nickname: action.data.groupName || 'Group',
                  zIndex: Math.max(...selectedObjects.map(obj => obj.zIndex || 0)) + 1,
                  shadow: false,
                  createdBy: currentUser.uid
                });
              }
            } else {
              console.log('Not enough objects found to group. Found:', objectsToGroup.length);
            }
            break;

          case 'deleteShape':
            const deleteObj = objects.find(obj => {
              const identifier = action.data.identifier.toLowerCase();
              const objNickname = obj.nickname?.toLowerCase();
              const objType = obj.type?.toLowerCase();
              
              // Match by nickname
              if (objNickname && identifier.includes(objNickname)) return true;
              // Match by type
              if (objType && identifier.includes(objType)) return true;
              
              return false;
            });
            if (deleteObj) {
              await deleteObject(deleteObj.id);
            }
            break;

          case 'getCanvasState':
            // This just returns info, no action needed
            break;
        }
      } catch (error) {
        console.error('Error executing action:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) {
      console.log('Cannot send message:', { hasInput: !!inputValue.trim(), hasUser: !!currentUser });
      return;
    }

    const messageText = inputValue.trim();
    console.log('Sending message:', messageText, 'AI Mode:', isAIMode);
    setInputValue('');

    if (isAIMode) {
      // AI Mode: Send to AI and execute commands
      setIsLoading(true);
      try {
        // Send user message to chat
        console.log('Sending AI query to chat...');
        await sendMessage(`🤖 AI: ${messageText}`, false);
        
        // Use image-based processing if image is uploaded
        const aiResponse = uploadedImage 
          ? await processAICommandWithImage(messageText, uploadedImage, objects)
          : await processAICommand(messageText, objects);
        console.log('AI Response:', aiResponse);
        
        // Clear uploaded image after processing
        if (uploadedImage) {
          setUploadedImage(null);
        }
        
        if (aiResponse.success && aiResponse.actions.length > 0) {
          console.log('Executing', aiResponse.actions.length, 'actions:', aiResponse.actions);
          // Execute AI actions
          await executeAIActions(aiResponse);
          
          // Send AI response to chat
          await sendMessage(`✅ AI: ${aiResponse.message}`, true);
        } else {
          // Send AI response (no actions)
          await sendMessage(`🤖 AI: ${aiResponse.message}`, true);
        }
      } catch (error) {
        console.error('AI Error:', error);
        await sendMessage('❌ AI: Sorry, I encountered an error processing that request.', true);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Normal chat mode
      try {
        console.log('Sending regular message to Firestore...');
        await sendMessage(messageText, false);
        console.log('Message sent successfully!');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          zIndex: 999
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        }}
        title="Open Chat"
      >
        💬
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '380px',
        height: '500px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 999,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '16px 20px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {isAIMode ? '🤖 AI Assistant' : '💬 Team Chat'}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
            {isAIMode ? 'AI is ready to help' : `${messages.length} messages`}
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 20px' }}>
            <p style={{ margin: 0, fontSize: '24px', marginBottom: '8px' }}>💬</p>
            <p style={{ margin: 0, fontSize: '14px' }}>No messages yet</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
              Start a conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.userId === currentUser?.uid;
            const isAI = msg.isAI;
            
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isCurrentUser ? 'flex-end' : 'flex-start'
                }}
              >
                {/* User name and time */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}
                >
                  {!isCurrentUser && (
                    <>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isAI ? '#8b5cf6' : msg.userColor
                        }}
                      />
                      <span style={{ fontWeight: '500' }}>{msg.userName}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatTimestamp(msg.timestamp)}</span>
                </div>
                
                {/* Message bubble */}
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: isCurrentUser 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : isAI
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                      : 'white',
                    color: isCurrentUser || isAI ? 'white' : '#1f2937',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    wordWrap: 'break-word',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        
        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b7280',
              fontSize: '14px',
              padding: '8px'
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #e5e7eb',
                borderTopColor: '#8b5cf6',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            AI is thinking...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* AI Mode Toggle */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          background: 'white',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <button
          onClick={() => setIsAIMode(!isAIMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: isAIMode 
              ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
              : '#f3f4f6',
            color: isAIMode ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: isAIMode ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: '16px' }}>🤖</span>
          {isAIMode ? 'AI Mode Active' : 'Enable AI Mode'}
        </button>
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          background: 'white',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px'
        }}
      >
        {/* Image Preview */}
        {uploadedImage && (
          <div style={{
            marginBottom: '12px',
            position: 'relative',
            display: 'inline-block'
          }}>
            <img 
              src={uploadedImage} 
              alt="Uploaded" 
              style={{
                maxWidth: '200px',
                maxHeight: '150px',
                borderRadius: '8px',
                border: '2px solid #8b5cf6'
              }}
            />
            <button
              onClick={() => setUploadedImage(null)}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          {/* Image Upload Button (only in AI mode) */}
          {isAIMode && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                style={{
                  padding: '12px',
                  background: uploadedImage ? '#8b5cf6' : '#f3f4f6',
                  color: uploadedImage ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                title="Upload image to recreate design"
              >
                🖼️
              </button>
            </>
          )}

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAIMode ? (uploadedImage ? "Describe what to recreate..." : "Ask AI to create shapes...") : "Type a message..."}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              background: isLoading ? '#f9fafb' : 'white'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '12px 20px',
              background: isAIMode
                ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: (!inputValue.trim() || isLoading) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: (!inputValue.trim() || isLoading) ? 0.5 : 1,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
        
        {isAIMode && !uploadedImage && (
          <p
            style={{
              margin: '8px 0 0 0',
              fontSize: '11px',
              color: '#9ca3af',
              textAlign: 'center'
            }}
          >
            💡 Try: "Create a blue rectangle" or click 🖼️ to upload a design
          </p>
        )}
        
        {isAIMode && uploadedImage && (
          <p
            style={{
              margin: '8px 0 0 0',
              fontSize: '11px',
              color: '#8b5cf6',
              textAlign: 'center',
              fontWeight: '500'
            }}
          >
            🎨 Image uploaded! AI will analyze and recreate the design
          </p>
        )}
      </div>

      {/* CSS Animation for loading spinner */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ChatWindow;

