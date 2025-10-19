import React, { useState, useRef, useEffect } from 'react';

interface ShapeDropdownProps {
  onCreateRectangle: () => void;
  onCreateCircle: () => void;
  onCreateLine: () => void;
  onCreateText: () => void;
  onCreatePolygon: () => void;
  drawingMode: string;
}

const ShapeDropdown: React.FC<ShapeDropdownProps> = ({
  onCreateRectangle,
  onCreateCircle,
  onCreateLine,
  onCreateText,
  onCreatePolygon,
  drawingMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const shapes = [
    { name: 'Rectangle', icon: '▭', action: onCreateRectangle, color: '#3b82f6' },
    { name: 'Circle', icon: '●', action: onCreateCircle, color: '#10b981' },
    { name: 'Line', icon: '/', action: onCreateLine, color: '#f59e0b', active: drawingMode === 'line' },
    { name: 'Text', icon: 'T', action: onCreateText, color: '#06b6d4' },
    { name: 'Polygon', icon: '⬡', action: onCreatePolygon, color: '#ec4899' }
  ];

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 16px',
          background: isOpen ? '#3b82f6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b3f9a 100%)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          }
        }}
      >
        <span style={{ fontSize: '16px' }}>+</span> Add Shape {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e5e7eb',
            zIndex: 1001,
            minWidth: '200px',
            overflow: 'hidden'
          }}
        >
          {shapes.map((shape, idx) => (
            <button
              key={idx}
              onClick={() => {
                shape.action();
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: shape.active ? '#fef3c7' : 'white',
                border: 'none',
                borderTop: idx > 0 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.2s ease',
                color: shape.active ? '#92400e' : '#1f2937',
                fontWeight: shape.active ? '600' : '500'
              }}
              onMouseEnter={(e) => {
                if (!shape.active) {
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!shape.active) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <span 
                style={{ 
                  fontSize: '20px',
                  color: shape.color,
                  width: '24px',
                  textAlign: 'center'
                }}
              >
                {shape.icon}
              </span>
              <span style={{ flex: 1 }}>
                {shape.name}
                {shape.active && <span style={{ fontSize: '11px', marginLeft: '6px', color: '#f59e0b' }}>●</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShapeDropdown;

