import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onDataUpload: (data: Array<{ ds: string; y: number }>) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataUpload }) => {
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Reset states
    setError(null);
    setUploadStatus(null);

    // Validate file type
    if (!file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
      setError('Please upload an Excel file (.xls or .xlsx)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      setUploadStatus('Uploading and processing...');

      const response = await fetch('http://localhost:8001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadStatus(`Successfully processed ${result.data.length} data points`);
      onDataUpload(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadStatus(null);
    }
  }, [onDataUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  return (
    <div className="file-upload">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <div className="dropzone-content">
            <span className="dropzone-icon active">📁</span>
            <p>Drop the Excel file here...</p>
          </div>
        ) : (
          <div className="dropzone-content">
            <span className="dropzone-icon">📄</span>
            <p>Drag & drop an Excel file here, or click to select</p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Supported formats: .xls, .xlsx (max 10MB)
            </p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              Required columns: 'ds' (date) and 'y' (value)
            </p>
          </div>
        )}
      </div>

      {uploadStatus && (
        <div className="success" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="success-icon">✅</span>
          {uploadStatus}
        </div>
      )}

      {error && (
        <div className="error" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;