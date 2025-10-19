import React, { useState, useRef, useEffect } from 'react';

interface ExportDropdownProps {
  onExportPNG: () => void;
  onExportCode: () => void;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportPNG,
  onExportCode
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

  const exportOptions = [
    { name: 'Export as PNG', icon: '📥', action: onExportPNG, description: 'Download canvas as image' },
    { name: 'Export as Code', icon: '</>', action: onExportCode, description: 'Get React/CSS code' }
  ];

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 16px',
          background: isOpen ? '#10b981' : '#10b981',
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
          e.currentTarget.style.background = '#059669';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#10b981';
        }}
      >
        <span style={{ fontSize: '16px' }}>📥</span> Export {isOpen ? '▲' : '▼'}
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
            minWidth: '220px',
            overflow: 'hidden'
          }}
        >
          {exportOptions.map((option, idx) => (
            <button
              key={idx}
              onClick={() => {
                option.action();
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'white',
                border: 'none',
                borderTop: idx > 0 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px', width: '24px' }}>{option.icon}</span>
                <span style={{ fontWeight: '500', color: '#1f2937' }}>{option.name}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '34px' }}>
                {option.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;

