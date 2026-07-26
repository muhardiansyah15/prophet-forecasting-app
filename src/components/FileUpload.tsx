import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { API_BASE_URL, DataPoint } from '../App';

interface FileUploadProps {
  onDataUpload: (data: DataPoint[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataUpload }) => {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File | Blob, filename: string) => {
    setError(null);
    setStatus('Uploading and parsing…');
    try {
      const formData = new FormData();
      formData.append('file', file, filename);
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Upload failed');
      }
      const result = await response.json();
      setStatus(`Parsed ${result.data.length.toLocaleString()} data points from ${filename}`);
      onDataUpload(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStatus(null);
    }
  }, [onDataUpload]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (!/\.(xls|xlsx|csv)$/i.test(file.name)) {
      setError('Please upload an Excel (.xls/.xlsx) or CSV file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    uploadFile(file, file.name);
  }, [uploadFile]);

  const loadSample = async () => {
    setError(null);
    setStatus('Loading sample dataset…');
    try {
      const res = await fetch(`${process.env.PUBLIC_URL}/samples/sample_sales_data.xlsx`);
      if (!res.ok) throw new Error('Could not load the sample dataset');
      const blob = await res.blob();
      await uploadFile(blob, 'sample_sales_data.xlsx');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sample');
      setStatus(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <div className="file-upload">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dz-icon" aria-hidden="true">{isDragActive ? '📂' : '📄'}</div>
        <p>{isDragActive ? 'Drop the file here…' : 'Drag & drop a file here, or click to browse'}</p>
        <p className="dz-hint">.xlsx · .xls · .csv — max 10MB</p>
      </div>

      <div className="upload-extra">
        <span>No data at hand?</span>
        <button type="button" className="link-btn" onClick={loadSample}>
          Try the sample sales dataset →
        </button>
      </div>

      {status && (
        <div className="alert alert-ok" role="status">
          <span aria-hidden="true">✅</span> {status}
        </div>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          <span aria-hidden="true">⚠️</span> {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
