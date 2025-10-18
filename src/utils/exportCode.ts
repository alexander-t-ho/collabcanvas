import { CanvasObject } from '../types';

export function exportAsReact(objects: CanvasObject[]): string {
  const components = objects
    .filter(obj => obj.type !== 'group') // Skip group objects
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
    .map((obj, index) => {
      const style = generateStyleObject(obj);
      const styleString = JSON.stringify(style, null, 2).replace(/"([^"]+)":/g, '$1:');
      
      switch (obj.type) {
        case 'rectangle':
          return `  <div style={${styleString}} />`;
        case 'circle':
          return `  <div style={${styleString}} />`;
        case 'text':
          return `  <div style={${styleString}}>\n    ${obj.text || 'Text'}\n  </div>`;
        case 'line':
          return `  {/* Line: Complex shape - consider using SVG */}`;
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');

  return `import React from 'react';

const CanvasExport = () => {
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#fafafa'
    }}>
${components}
    </div>
  );
};

export default CanvasExport;`;
}

export function exportAsCSS(objects: CanvasObject[]): string {
  const cssRules = objects
    .filter(obj => obj.type !== 'group')
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
    .map((obj, index) => {
      const className = obj.nickname 
        ? obj.nickname.toLowerCase().replace(/\s+/g, '-')
        : `${obj.type}-${index}`;
      
      const style = generateStyleObject(obj);
      const cssProps = Object.entries(style)
        .map(([key, value]) => {
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          return `  ${cssKey}: ${value};`;
        })
        .join('\n');
      
      let htmlComment = '';
      if (obj.type === 'text') {
        htmlComment = `\n<!-- HTML: <div class="${className}">${obj.text || 'Text'}</div> -->`;
      } else {
        htmlComment = `\n<!-- HTML: <div class="${className}"></div> -->`;
      }
      
      return `.${className} {
${cssProps}
}${htmlComment}`;
    })
    .join('\n\n');

  return `/* Canvas Export - CSS */
/* Position elements relative to a container */

.canvas-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #fafafa;
}

${cssRules}`;
}

function generateStyleObject(obj: CanvasObject): Record<string, string> {
  const style: Record<string, string> = {
    position: 'absolute',
    left: `${Math.round(obj.x)}px`,
    top: `${Math.round(obj.y)}px`,
    width: `${Math.round(obj.width)}px`,
    height: `${Math.round(obj.height)}px`,
    zIndex: `${obj.zIndex || 0}`
  };

  // Transform for center origin
  style.transform = `translate(-50%, -50%)`;
  
  if (obj.rotation) {
    style.transform += ` rotate(${obj.rotation}deg)`;
  }

  // Background color
  if (obj.fill) {
    if (obj.type === 'text') {
      style.color = obj.fill;
    } else {
      style.backgroundColor = obj.fill;
    }
  }

  // Border radius
  if (obj.type === 'rectangle' && obj.cornerRadius) {
    style.borderRadius = `${obj.cornerRadius}px`;
  } else if (obj.type === 'circle') {
    style.borderRadius = '50%';
  }

  // Text properties
  if (obj.type === 'text') {
    style.fontSize = `${obj.fontSize || 24}px`;
    style.fontFamily = obj.fontFamily || 'Arial';
    style.fontWeight = obj.fontStyle?.includes('bold') ? 'bold' : 'normal';
    style.fontStyle = obj.fontStyle?.includes('italic') ? 'italic' : 'normal';
    style.textAlign = obj.textAlign || 'left';
    style.display = 'flex';
    style.alignItems = 'center';
    style.justifyContent = obj.textAlign === 'center' ? 'center' : obj.textAlign === 'right' ? 'flex-end' : 'flex-start';
    style.padding = '8px';
    style.boxSizing = 'border-box';
  }

  // Opacity
  if (obj.opacity !== undefined && obj.opacity !== 1) {
    style.opacity = `${obj.opacity}`;
  }

  // Shadow
  if (obj.shadow) {
    style.boxShadow = '5px 5px 15px rgba(0, 0, 0, 0.5)';
  }

  return style;
}

