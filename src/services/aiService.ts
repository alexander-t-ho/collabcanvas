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
      description: 'Move an existing shape to a new position',
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
      name: 'resizeShape',
      description: 'Resize an existing shape',
      parameters: {
        type: 'object',
        properties: {
          identifier: {
            type: 'string',
            description: 'Description of the shape to resize'
          },
          width: {
            type: 'number',
            description: 'New width in pixels'
          },
          height: {
            type: 'number',
            description: 'New height in pixels'
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

// Process AI command
export async function processAICommand(
  userMessage: string,
  canvasObjects: CanvasObject[]
): Promise<AICommandResult> {
  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an AI assistant that helps users create and manipulate objects on a collaborative canvas. 
The canvas has a coordinate system where (0, 0) is at the center of the screen.
Positive X goes right, positive Y goes down.
When creating multiple objects, space them appropriately.
For colors, use standard hex codes like #FF0000 for red, #0000FF for blue, etc.
Current canvas state: ${JSON.stringify(canvasObjects.length)} objects.`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      tools,
      tool_choice: 'auto'
    });

    const result: AICommandResult = {
      success: false,
      message: '',
      actions: []
    };

    const choice = response.choices[0];
    
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      // Process each tool call
      for (const toolCall of choice.message.tool_calls) {
        // Type guard to ensure it's a function call
        if (toolCall.type === 'function' && toolCall.function) {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          
          result.actions.push({
            type: functionName,
            data: args
          });
        }
      }
      
      result.success = result.actions.length > 0;
      result.message = choice.message.content || 'Commands executed successfully';
    } else if (choice.message.content) {
      result.message = choice.message.content;
    } else {
      result.message = 'I couldn\'t process that command. Try being more specific.';
    }

    return result;
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred processing your command',
      actions: []
    };
  }
}

