import React, { useState, useRef } from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import { useAuth } from '../../contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';

interface Props {
  onClose: () => void;
}

const ImageImport: React.FC<Props> = ({ onClose }) => {
  const { addObject } = useCanvas();
  const { currentUser } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageToFirebase = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const fileName = `images/${currentUser?.uid}/${timestamp}_${file.name}`;
    const imageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !currentUser) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          // Convert to data URL for faster loading (no Firebase Storage upload)
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            
            // Create image element to get dimensions
            const img = new Image();
            img.onload = () => {
              // Calculate dimensions to fit within reasonable bounds
              const maxWidth = 300;
              const maxHeight = 300;
              let { width, height } = img;
              
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }

              addObject({
                type: 'image',
                x: Math.random() * 300 + 100,
                y: Math.random() * 300 + 100,
                width,
                height,
                fill: '#ffffff', // Not used for images but required by type
                src: dataUrl, // Use data URL for immediate loading
                nickname: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                zIndex: 0,
                shadow: false,
                createdBy: currentUser.uid,
              });
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
        }
      }
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Failed to process images. Please try again.');
    } finally {
      setUploading(false);
      onClose();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90vw',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            border: 'none',
            background: '#f3f4f6',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#6b7280'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
        >
          ×
        </button>

        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          Import Images
        </h2>

        {/* Drag and drop area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${isDragging ? '#3b82f6' : '#d1d5db'}`,
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            background: isDragging ? '#eff6ff' : '#f9fafb',
            cursor: 'pointer',
            marginBottom: '16px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{
            fontSize: '48px',
            marginBottom: '12px',
            color: isDragging ? '#3b82f6' : '#9ca3af'
          }}>
            📁
          </div>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: '500',
            color: '#374151',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {isDragging ? 'Drop your images here' : 'Drag and drop images here'}
          </p>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            or click to browse your files
          </p>
        </div>

        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {/* Browse button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '12px',
            background: uploading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.currentTarget.style.background = '#2563eb';
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.currentTarget.style.background = '#3b82f6';
            }
          }}
        >
          {uploading ? 'Uploading...' : 'Browse Files'}
        </button>

        <p style={{
          margin: '12px 0 0 0',
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          Supports JPG, PNG, GIF, WebP and other image formats
        </p>
      </div>
    </div>
  );
};

export default ImageImport;
