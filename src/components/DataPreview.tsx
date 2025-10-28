import React from 'react';

interface DataPreviewProps {
  data: Array<{ ds: string; y: number }>;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="data-preview">
        <p>No data to preview</p>
      </div>
    );
  }

  return (
    <div className="data-preview">
      <table>
        <thead>
          <tr>
            <th>Date (ds)</th>
            <th>Value (y)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.ds}</td>
              <td>{typeof row.y === 'number' ? row.y.toFixed(2) : row.y}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataPreview;