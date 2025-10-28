import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onDataUpload: (data: Array<{ ds: string; y: number }>) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataUpload }) => {
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const processExcelFile = useCallback((file: File) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        setUploadStatus('Processing file...');
        setError('');

        // Send file to backend for processing
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:8001/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid data format received from server');
        }

        // Validate data format
        const validData = result.data.every((row: any) => 
          row.ds && row.y !== undefined && !isNaN(row.y)
        );

        if (!validData) {
          throw new Error('Data must contain "ds" (date) and "y" (numeric value) columns');
        }

        onDataUpload(result.data);
        setUploadStatus(`Successfully uploaded ${result.data.length} records`);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error processing file');
        setUploadStatus('');
      }
    };

    reader.readAsArrayBuffer(file);
  }, [onDataUpload]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      setError('Please select a valid Excel file (.xls or .xlsx)');
      return;
    }

    const file = acceptedFiles[0];
    processExcelFile(file);
  }, [processExcelFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the Excel file here...</p>
        ) : (
          <div>
            <p>Drag & drop an Excel file here, or click to select</p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Supported formats: .xls, .xlsx (max 10MB)
            </p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
              Your file should contain columns named "ds" (date) and "y" (value)
            </p>
          </div>
        )}
      </div>

      {uploadStatus && (
        <div className="success" style={{ marginTop: '10px' }}>
          {uploadStatus}
        </div>
      )}

      {error && (
        <div className="error" style={{ marginTop: '10px' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>Data Format Requirements:</h4>
        <ul>
          <li><strong>ds</strong>: Date column (YYYY-MM-DD format preferred)</li>
          <li><strong>y</strong>: Numeric value to forecast</li>
        </ul>
        <p>Example:</p>
        <table style={{ fontSize: '12px', marginTop: '10px' }}>
          <thead>
            <tr>
              <th style={{ padding: '5px', border: '1px solid #ddd' }}>ds</th>
              <th style={{ padding: '5px', border: '1px solid #ddd' }}>y</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '5px', border: '1px solid #ddd' }}>2023-01-01</td>
              <td style={{ padding: '5px', border: '1px solid #ddd' }}>100</td>
            </tr>
            <tr>
              <td style={{ padding: '5px', border: '1px solid #ddd' }}>2023-01-02</td>
              <td style={{ padding: '5px', border: '1px solid #ddd' }}>105</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileUpload;