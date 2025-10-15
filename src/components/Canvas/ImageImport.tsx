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
        if (!file.type.startsWith('image/')) continue;
        
        console.log('🔥 IMAGE: Processing image:', file.name, 'Size:', file.size);
        
        // Step 1: Create data URL for INSTANT display
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          
          // Step 2: Compress image
          const compressedDataUrl = await compressImageToDataUrl(dataUrl, 0.6); // Lower quality for smaller size
          console.log('🔥 IMAGE: Image compressed for Firestore');
          
          // Step 3: Get dimensions
          const img = new Image();
          img.onload = async () => {
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

            console.log('🔥 IMAGE: Adding to canvas immediately with compressed data URL');
            
            // Step 4: Add image immediately with compressed data URL
            // Compressed data URLs are small enough for Firestore and display instantly
            await addObject({
              type: 'image',
              x: Math.random() * 300 + 100,
              y: Math.random() * 300 + 100,
              width,
              height,
              fill: '#ffffff',
              src: compressedDataUrl, // Use compressed data URL - small enough for Firestore
              nickname: file.name.replace(/\.[^/.]+$/, ''),
              zIndex: 0,
              shadow: false,
              cornerRadius: 0,
              createdBy: currentUser.uid,
            });
            
            console.log('✅ IMAGE: Image added to canvas and will persist in Firestore');
          };
          
          img.src = compressedDataUrl;
        };
        
        reader.readAsDataURL(file);
      }
      
      console.log('✅ IMAGE: All images processed');
      
    } catch (error) {
      console.error('❌ IMAGE: Error processing images:', error);
      alert('Failed to process images. Please try again.');
    } finally {
      setUploading(false);
      onClose();
    }
  };

  // Compress image to data URL with smaller size for Firestore
  const compressImageToDataUrl = (dataUrl: string, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Aggressively reduce size to keep under Firestore limits
        const maxSize = 400; // Smaller max size
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use lower quality and JPEG for smaller size
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        console.log('🔥 IMAGE: Original size:', dataUrl.length, 'Compressed size:', compressedDataUrl.length);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = dataUrl;
    });
  };

  // Compress image to reduce file size
  const compressImage = (file: File, quality: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Set canvas size to image size (or smaller for compression)
        const maxSize = 800; // Max width/height
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original if compression fails
          }
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
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
