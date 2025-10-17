import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import { processAICommand, AICommandResult } from '../../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can help you create and manipulate objects on the canvas. Try commands like:\n• "Create a blue rectangle at the center"\n• "Add a red circle"\n• "Create a login form"\n• "Arrange shapes in a horizontal row"',
      timestamp: Date.now()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { objects, addObject, updateObject } = useCanvas();
  const { currentUser } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Execute AI actions
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
              cornerRadius: 0,
              zIndex: 0,
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
              zIndex: 0,
              shadow: false,
              createdBy: currentUser.uid
            });
            break;

          case 'moveShape':
            // Find matching object
            const moveObj = objects.find(obj => 
              obj.fill?.includes(action.data.identifier) ||
              obj.type === action.data.identifier ||
              obj.text?.toLowerCase().includes(action.data.identifier.toLowerCase())
            );
            if (moveObj) {
              await updateObject(moveObj.id, {
                x: action.data.x,
                y: action.data.y
              });
            }
            break;

          case 'resizeShape':
            const resizeObj = objects.find(obj =>
              obj.fill?.includes(action.data.identifier) ||
              obj.type === action.data.identifier
            );
            if (resizeObj) {
              await updateObject(resizeObj.id, {
                width: action.data.width,
                height: action.data.height
              });
            }
            break;

          case 'rotateShape':
            const rotateObj = objects.find(obj =>
              obj.fill?.includes(action.data.identifier) ||
              obj.type === action.data.identifier
            );
            if (rotateObj) {
              await updateObject(rotateObj.id, {
                rotation: action.data.degrees
              });
            }
            break;

          case 'arrangeShapes':
            const spacing = action.data.spacing || 20;
            const startX = action.data.startX || -200;
            const startY = action.data.startY || 0;
            
            if (action.data.arrangement === 'horizontal') {
              objects.forEach(async (obj, index) => {
                await updateObject(obj.id, {
                  x: startX + (index * (100 + spacing)),
                  y: startY
                });
              });
            } else if (action.data.arrangement === 'vertical') {
              objects.forEach(async (obj, index) => {
                await updateObject(obj.id, {
                  x: startX,
                  y: startY + (index * (100 + spacing))
                });
              });
            } else if (action.data.arrangement === 'grid') {
              const cols = 3;
              objects.forEach(async (obj, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                await updateObject(obj.id, {
                  x: startX + (col * (100 + spacing)),
                  y: startY + (row * (100 + spacing))
                });
              });
            }
            break;

          case 'createComplex':
            await createComplexElement(action.data);
            break;

          case 'deleteShape':
            // Find and delete matching object
            const deleteObj = objects.find(obj =>
              obj.fill?.includes(action.data.identifier) ||
              obj.type === action.data.identifier
            );
            if (deleteObj) {
              // Would call deleteObject here
            }
            break;

          case 'getCanvasState':
            // Return current state
            console.log('Canvas state:', objects);
            break;
        }
      } catch (error) {
        console.error('Error executing action:', error);
      }
    }
  };

  // Create complex UI elements
  const createComplexElement = async (data: any) => {
    if (!currentUser) return;

    const x = data.x || 0;
    const y = data.y || 0;

    switch (data.type) {
      case 'login-form':
        // Create form background
        await addObject({
          type: 'rectangle',
          x: x,
          y: y,
          width: 300,
          height: 250,
          fill: '#ffffff',
          cornerRadius: 8,
          nickname: 'form-bg',
          zIndex: 0,
          shadow: true,
          createdBy: currentUser.uid
        });

        // Title
        await addObject({
          type: 'text',
          x: x,
          y: y - 90,
          width: 200,
          height: 40,
          fill: '#000000',
          text: 'Login',
          fontSize: 24,
          fontFamily: 'Arial',
          fontStyle: 'bold',
          textAlign: 'center',
          nickname: '',
          zIndex: 1,
          shadow: false,
          createdBy: currentUser.uid
        });

        // Username field
        await addObject({
          type: 'rectangle',
          x: x,
          y: y - 30,
          width: 260,
          height: 40,
          fill: '#f3f4f6',
          cornerRadius: 4,
          nickname: 'username',
          zIndex: 1,
          shadow: false,
          createdBy: currentUser.uid
        });

        await addObject({
          type: 'text',
          x: x - 90,
          y: y - 30,
          width: 200,
          height: 30,
          fill: '#6b7280',
          text: 'Username',
          fontSize: 14,
          fontFamily: 'Arial',
          fontStyle: 'normal',
          textAlign: 'left',
          nickname: '',
          zIndex: 2,
          shadow: false,
          createdBy: currentUser.uid
        });

        // Password field
        await addObject({
          type: 'rectangle',
          x: x,
          y: y + 30,
          width: 260,
          height: 40,
          fill: '#f3f4f6',
          cornerRadius: 4,
          nickname: 'password',
          zIndex: 1,
          shadow: false,
          createdBy: currentUser.uid
        });

        await addObject({
          type: 'text',
          x: x - 90,
          y: y + 30,
          width: 200,
          height: 30,
          fill: '#6b7280',
          text: 'Password',
          fontSize: 14,
          fontFamily: 'Arial',
          fontStyle: 'normal',
          textAlign: 'left',
          nickname: '',
          zIndex: 2,
          shadow: false,
          createdBy: currentUser.uid
        });

        // Submit button
        await addObject({
          type: 'rectangle',
          x: x,
          y: y + 85,
          width: 260,
          height: 40,
          fill: '#3b82f6',
          cornerRadius: 6,
          nickname: 'submit',
          zIndex: 1,
          shadow: false,
          createdBy: currentUser.uid
        });

        await addObject({
          type: 'text',
          x: x,
          y: y + 85,
          width: 200,
          height: 30,
          fill: '#ffffff',
          text: 'Login',
          fontSize: 16,
          fontFamily: 'Arial',
          fontStyle: 'bold',
          textAlign: 'center',
          nickname: '',
          zIndex: 2,
          shadow: false,
          createdBy: currentUser.uid
        });
        break;

      case 'nav-bar':
        const itemCount = data.options?.itemCount || 4;
        const navWidth = 800;
        const itemWidth = navWidth / itemCount;

        // Nav background
        await addObject({
          type: 'rectangle',
          x: x,
          y: y,
          width: navWidth,
          height: 60,
          fill: '#1f2937',
          cornerRadius: 0,
          nickname: 'nav-bg',
          zIndex: 0,
          shadow: true,
          createdBy: currentUser.uid
        });

        // Nav items
        const menuItems = ['Home', 'About', 'Services', 'Contact'];
        for (let i = 0; i < itemCount; i++) {
          await addObject({
            type: 'text',
            x: x - (navWidth / 2) + (itemWidth / 2) + (i * itemWidth),
            y: y,
            width: itemWidth - 20,
            height: 30,
            fill: '#ffffff',
            text: menuItems[i] || `Item ${i + 1}`,
            fontSize: 16,
            fontFamily: 'Arial',
            fontStyle: 'normal',
            textAlign: 'center',
            nickname: '',
            zIndex: 1,
            shadow: false,
            createdBy: currentUser.uid
          });
        }
        break;

      case 'card':
        // Card background
        await addObject({
          type: 'rectangle',
          x: x,
          y: y,
          width: 300,
          height: 400,
          fill: '#ffffff',
          cornerRadius: 12,
          nickname: 'card-bg',
          zIndex: 0,
          shadow: true,
          createdBy: currentUser.uid
        });

        // Image placeholder
        await addObject({
          type: 'rectangle',
          x: x,
          y: y - 100,
          width: 280,
          height: 160,
          fill: '#e5e7eb',
          cornerRadius: 8,
          nickname: 'card-image',
          zIndex: 1,
          shadow: false,
          createdBy: currentUser.uid
        });

        // Title
        await addObject({
          type: 'text',
          x: x,
          y: y + 20,
          width: 260,
          height: 30,
          fill: '#000000',
          text: data.options?.title || 'Card Title',
          fontSize: 20,
          fontFamily: 'Arial',
          fontStyle: 'bold',
          textAlign: 'center',
          nickname: '',
          zIndex: 1,
          shadow: false,
          createdBy: currentUser.uid
        });

        // Description
        await addObject({
          type: 'text',
          x: x,
          y: y + 60,
          width: 260,
          height: 80,
          fill: '#6b7280',
          text: 'This is a card description with some sample text.',
          fontSize: 14,
          fontFamily: 'Arial',
          fontStyle: 'normal',
          textAlign: 'center',
          nickname: '',
          zIndex: 1,
          shadow: false,
          createdBy: currentUser.uid
        });

        // Button
        await addObject({
          type: 'rectangle',
          x: x,
          y: y + 150,
          width: 120,
          height: 40,
          fill: '#3b82f6',
          cornerRadius: 6,
          nickname: 'card-button',
          zIndex: 1,
          shadow: false,
          createdBy: currentUser.uid
        });

        await addObject({
          type: 'text',
          x: x,
          y: y + 150,
          width: 100,
          height: 30,
          fill: '#ffffff',
          text: 'Learn More',
          fontSize: 14,
          fontFamily: 'Arial',
          fontStyle: 'normal',
          textAlign: 'center',
          nickname: '',
          zIndex: 2,
          shadow: false,
          createdBy: currentUser.uid
        });
        break;

      case 'button-group':
        const buttons = data.options?.buttonLabels || ['Button 1', 'Button 2', 'Button 3'];
        const buttonSpacing = 10;
        const buttonWidth = 120;

        buttons.forEach(async (label: string, index: number) => {
          const buttonX = x + (index - Math.floor(buttons.length / 2)) * (buttonWidth + buttonSpacing);
          
          await addObject({
            type: 'rectangle',
            x: buttonX,
            y: y,
            width: buttonWidth,
            height: 40,
            fill: '#3b82f6',
            cornerRadius: 6,
            nickname: `button-${index}`,
            zIndex: 0,
            shadow: false,
            createdBy: currentUser.uid
          });

          await addObject({
            type: 'text',
            x: buttonX,
            y: y,
            width: buttonWidth - 10,
            height: 30,
            fill: '#ffffff',
            text: label,
            fontSize: 14,
            fontFamily: 'Arial',
            fontStyle: 'normal',
            textAlign: 'center',
            nickname: '',
            zIndex: 1,
            shadow: false,
            createdBy: currentUser.uid
          });
        });
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const result = await processAICommand(input, objects);
      
      if (result.success && result.actions.length > 0) {
        await executeAIActions(result);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message || 'Done! I\'ve executed your commands.',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* AI Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          cursor: 'pointer',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002,
          transition: 'transform 0.2s ease',
          fontFamily: 'system-ui'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="AI Assistant"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* AI Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          right: 20,
          bottom: 100,
          width: 400,
          height: 600,
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            fontWeight: '600',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            AI Canvas Assistant
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                <div style={{
                  background: msg.role === 'user' ? '#667eea' : '#f3f4f6',
                  color: msg.role === 'user' ? 'white' : '#1f2937',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div style={{
                alignSelf: 'flex-start',
                background: '#f3f4f6',
                padding: '12px 16px',
                borderRadius: '16px 16px 16px 0',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to create something..."
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '24px',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: input.trim() && !isProcessing ? '#667eea' : '#d1d5db',
                color: 'white',
                border: 'none',
                cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease'
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChat;

