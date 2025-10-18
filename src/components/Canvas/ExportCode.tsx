import React, { useState } from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import { exportAsReact, exportAsCSS } from '../../utils/exportCode';

interface ExportCodeProps {
  onClose: () => void;
}

const ExportCode: React.FC<ExportCodeProps> = ({ onClose }) => {
  const { objects } = useCanvas();
  const [exportType, setExportType] = useState<'react' | 'css'>('react');
  const [copied, setCopied] = useState(false);

  const code = exportType === 'react' ? exportAsReact(objects) : exportAsCSS(objects);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = exportType === 'react' ? 'CanvasExport.jsx' : 'canvas-export.css';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            Export as Code
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            ×
          </button>
        </div>

        {/* Export Type Selector */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setExportType('react')}
              style={{
                padding: '8px 16px',
                background: exportType === 'react' ? '#3b82f6' : '#f3f4f6',
                color: exportType === 'react' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              React/JSX
            </button>
            <button
              onClick={() => setExportType('css')}
              style={{
                padding: '8px 16px',
                background: exportType === 'css' ? '#3b82f6' : '#f3f4f6',
                color: exportType === 'css' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              CSS
            </button>
          </div>
        </div>

        {/* Code Display */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <pre
            style={{
              background: '#1f2937',
              color: '#f3f4f6',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.6',
              margin: 0,
              overflow: 'auto',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
            }}
          >
            {code}
          </pre>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '12px', color: '#6b7280', alignSelf: 'center' }}>
            {objects.length} object{objects.length !== 1 ? 's' : ''} • {exportType === 'react' ? 'React Component' : 'CSS Styles'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '10px 20px',
                background: copied ? '#10b981' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
            >
              💾 Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportCode;

