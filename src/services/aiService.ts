import OpenAI from 'openai';
import { CanvasObject } from '../types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo - in production, use a backend
});

// Define the function schemas for the AI
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'createShape',
      description: 'Create a new shape (rectangle or circle) on the canvas',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle'],
            description: 'The type of shape to create'
          },
          x: {
            type: 'number',
            description: 'X coordinate position (0 is center)'
          },
          y: {
            type: 'number',
            description: 'Y coordinate position (0 is center)'
          },
          width: {
            type: 'number',
            description: 'Width of the shape in pixels'
          },
          height: {
            type: 'number',
            description: 'Height of the shape in pixels'
          },
          color: {
            type: 'string',
            description: 'Hex color code (e.g., #FF0000 for red)'
          }
        },
        required: ['type', 'x', 'y', 'width', 'height', 'color']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createText',
      description: 'Create a text element on the canvas',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text content to display'
          },
          x: {
            type: 'number',
            description: 'X coordinate position (0 is center)'
          },
          y: {
            type: 'number',
            description: 'Y coordinate position (0 is center)'
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels (default: 24)'
          },
          color: {
            type: 'string',
            description: 'Hex color code for text (e.g., #000000 for black)'
          }
        },
        required: ['text', 'x', 'y']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'moveShape',
      description: 'Move an existing shape to a new position on the X/Y plane',
      parameters: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description: 'Description of the shape to move (e.g., "blue rectangle", "circle")'
          },
          x: {
            type: 'number',
            description: 'New X coordinate position'
          },
          y: {
            type: 'number',
            description: 'New Y coordinate position'
          }
        },
        required: ['identifier', 'x', 'y']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'changeLayer',
      description: 'Change the z-index/layer of a shape (bring to front, send to back, move forward, move backward)',
      parameters: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description: 'Description of the shape to layer (e.g., "blue circle", "rectangle")'
          },
          action: {
            type: 'string',
            enum: ['front', 'back', 'forward', 'backward'],
            description: 'Layer action: "front" (bring to front), "back" (send to back), "forward" (move up one layer), "backward" (move down one layer)'
          }
        },
        required: ['identifier', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'resizeShape',
      description: 'Resize an existing shape to new dimensions. For "make X bigger/smaller by Y", calculate new size: if current size is 120 and user says "bigger by 50", use 170. For circles, width = diameter.',
      parameters: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description: 'Description of the shape to resize (e.g., "blue circle", "rectangle")'
          },
          width: {
            type: 'number',
            description: 'New width in pixels (for circles, this is the diameter)'
          },
          height: {
            type: 'number',
            description: 'New height in pixels (for circles, use same as width)'
          }
        },
        required: ['identifier', 'width', 'height']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rotateShape',
      description: 'Rotate an existing shape',
      parameters: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description: 'Description of the shape to rotate'
          },
          degrees: {
            type: 'number',
            description: 'Degrees to rotate (0-360)'
          }
        },
        required: ['identifier', 'degrees']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'arrangeShapes',
      description: 'Arrange multiple shapes in a pattern (horizontal, vertical, or grid)',
      parameters: {
        type: 'object',
        properties: {
          arrangement: {
            type: 'string',
            enum: ['horizontal', 'vertical', 'grid'],
            description: 'How to arrange the shapes'
          },
          spacing: {
            type: 'number',
            description: 'Space between shapes in pixels (default: 20)'
          },
          startX: {
            type: 'number',
            description: 'Starting X position (default: -200)'
          },
          startY: {
            type: 'number',
            description: 'Starting Y position (default: 0)'
          }
        },
        required: ['arrangement']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createComplex',
      description: 'Create complex UI elements like forms, navigation bars, or card layouts',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['login-form', 'nav-bar', 'card', 'button-group'],
            description: 'Type of complex element to create'
          },
          x: {
            type: 'number',
            description: 'X coordinate for center of the element (default: 0)'
          },
          y: {
            type: 'number',
            description: 'Y coordinate for center of the element (default: 0)'
          },
          options: {
            type: 'object',
            description: 'Additional options specific to the element type',
            properties: {
              itemCount: { type: 'number' },
              title: { type: 'string' },
              buttonLabels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        required: ['type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'deleteShape',
      description: 'Delete a shape from the canvas',
      parameters: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description: 'Description of the shape to delete'
          }
        },
        required: ['identifier']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getCanvasState',
      description: 'Get the current state of the canvas including all objects',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
];

// Type for AI command result
export interface AICommandResult {
  success: boolean;
  message: string;
  actions: Array<{
    type: string;
    data: any;
  }>;
}

// Store conversation history for context
let conversationHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

// Process AI command
export async function processAICommand(
  userMessage: string,
  canvasObjects: CanvasObject[]
): Promise<AICommandResult> {
  try {
    // Get info about recently created objects for context (without z-index to avoid AI second-guessing)
    const recentObjects = canvasObjects.slice(-5).map(obj => ({
      type: obj.type,
      color: obj.fill,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height
    }));

    // Build system message with current context
    const systemMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
      role: 'system',
      content: `You are an AI assistant that helps users create and manipulate objects on a collaborative canvas.

COORDINATE SYSTEM (IMPORTANT):
- Origin (0, 0) is at the CENTER of the screen
- Positive X goes RIGHT (range: -500 to 500)
- Positive Y goes UP (range: -300 to 300) - THIS IS INVERTED FROM SCREEN COORDINATES
- In the internal system, positive Y is DOWN, but users see it as UP
- When user says Y=200, you must use Y=-200 in the function call
- When user says Y=-100, you must use Y=100 in the function call
- ALWAYS INVERT THE Y COORDINATE: user_y_value * -1

POSITIONING RULES:
- When user says "next to" or "beside", add 150-200 to X coordinate
- When user says "below" or "under", ADD 100-150 to Y coordinate (in canvas coords, which moves it DOWN visually)
- When user says "above", SUBTRACT 100-150 from Y coordinate (in canvas coords, which moves it UP visually)

LAYERING (Z-INDEX) RULES:
- "in front of" or "on top of" = ALWAYS use changeLayer with action: "front"
- "behind" or "below" (in layer sense) = ALWAYS use changeLayer with action: "back"
- "bring forward" = ALWAYS use changeLayer with action: "forward"
- "send backward" = ALWAYS use changeLayer with action: "backward"
- DO NOT confuse spatial positioning with layering!
- CRITICAL: NEVER respond with text like "already in front". ALWAYS execute the changeLayer function.
- Users cannot see z-index values - they see visual stacking. Trust their command.
- If user says "put X in front of Y", call changeLayer(X, "front") NO MATTER WHAT.
- Do NOT check z-index or make any assumptions. Just execute the command.

COLOR CODES (use exact hex):
- red: #FF0000
- blue: #0000FF  
- green: #00FF00
- yellow: #FFFF00
- purple: #800080
- orange: #FFA500
- black: #000000
- white: #FFFFFF
- gray: #808080
- pink: #FFC0CB

DEFAULT SIZES:
- Small shapes: 80x80
- Medium shapes (default): 120x120
- Large shapes: 200x200
- Text: fontSize 24, width 200

CURRENT CANVAS STATE (REAL-TIME):
- Total objects: ${canvasObjects.length}
- Recent objects: ${JSON.stringify(recentObjects)}
- DO NOT analyze or check layer order - just execute layer commands when requested

IMPORTANT RULES:
1. For basic commands like "make a red circle", create it at origin (0, 0) with default size (120x120)
2. For relative positioning ("next to it", "beside the last one"), use the LAST object's position and add appropriate offset
3. Always use proper hex color codes
4. Circles use width as diameter (height is ignored)
5. When creating multiple objects in one command, space them 150-200 pixels apart
6. For "login form", "nav bar", etc., use the createComplex function
7. **Y-AXIS EXAMPLES**: 
   - User says "move to 200, 200" (top right) → use x: 200, y: -200
   - User says "move to 200, -200" (bottom right) → use x: 200, y: 200
   - User says "create at 0, 100" (above center) → use x: 0, y: -100
   - User says "create at 0, -100" (below center) → use x: 0, y: 100
8. **RELATIVE SIZING**: 
   - "make X bigger by Y" → look at recent objects to find X's current size, add Y
   - "make X smaller by Y" → look at recent objects to find X's current size, subtract Y
   - "make X twice as big" → find current size, multiply by 2
   - For circles: width and height should be the same (diameter)`
    };

    // Add to conversation history
    if (conversationHistory.length === 0 || conversationHistory[0].role !== 'system') {
      conversationHistory = [systemMessage];
    } else {
      conversationHistory[0] = systemMessage; // Update system message with latest state
    }

    // Add user message
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Keep only last exchanges to avoid token limits
    // Keep system message + last 4 complete exchanges (user + assistant + tools)
    if (conversationHistory.length > 20) {
      // Find the last complete exchange boundary
      const systemMsg = conversationHistory[0];
      let recentMessages = conversationHistory.slice(-15);
      
      // Make sure we don't break tool message pairs
      // Remove any orphaned tool messages at the start
      while (recentMessages.length > 0 && recentMessages[0].role === 'tool') {
        recentMessages = recentMessages.slice(1);
      }
      
      conversationHistory = [systemMsg, ...recentMessages];
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: conversationHistory,
      tools,
      tool_choice: 'auto',
      temperature: 0.7
    });

    const result: AICommandResult = {
      success: false,
      message: '',
      actions: []
    };

    const choice = response.choices[0];
    
    // Add assistant response to conversation history
    conversationHistory.push(choice.message);
    
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      // Process each tool call and add tool responses
      for (const toolCall of choice.message.tool_calls) {
        // Type guard to ensure it's a function call
        if (toolCall.type === 'function' && toolCall.function) {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          
          result.actions.push({
            type: functionName,
            data: args
          });

          // Add tool response message to conversation history
          conversationHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ success: true, function: functionName, args })
          });
        }
      }
      
      result.success = result.actions.length > 0;
      result.message = result.actions.length === 1 
        ? `Executed ${result.actions[0].type}`
        : `Executed ${result.actions.length} actions successfully`;
    } else if (choice.message.content) {
      result.message = choice.message.content;
    } else {
      result.message = 'I couldn\'t process that command. Try being more specific.';
    }

    return result;
  } catch (error) {
    console.error('AI Service Error:', error);
    
    // If there's an error with the conversation history, reset it
    if (error instanceof Error && error.message.includes('tool')) {
      console.log('Resetting conversation history due to tool message error');
      conversationHistory = [];
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred processing your command',
      actions: []
    };
  }
}

// Export function to reset conversation history manually
export function resetConversationHistory() {
  conversationHistory = [];
}

