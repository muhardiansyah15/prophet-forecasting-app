import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { ForecastPoint } from '../App';

const PAGE_SIZE = 10;

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

interface ForecastTableProps {
  forecast: ForecastPoint[];
}

const ForecastTable: React.FC<ForecastTableProps> = ({ forecast }) => {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? forecast : forecast.slice(0, PAGE_SIZE);

  const downloadCsv = () => {
    const header = 'date,forecast,lower_bound,upper_bound';
    const lines = forecast.map(
      p => `${p.ds},${p.yhat.toFixed(4)},${p.yhat_lower.toFixed(4)},${p.yhat_upper.toFixed(4)}`
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'forecast.csv');
  };

  return (
    <div>
      <div className="table-wrap">
        <table className="fc-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Forecast</th>
              <th>Lower bound</th>
              <th>Upper bound</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.ds}>
                <td>{p.ds}</td>
                <td>{fmt(p.yhat)}</td>
                <td>{fmt(p.yhat_lower)}</td>
                <td>{fmt(p.yhat_upper)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="actions">
        {forecast.length > PAGE_SIZE && (
          <button className="btn btn-outline" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show first 10 only' : `Show all ${forecast.length} rows`}
          </button>
        )}
        <button className="btn btn-outline" onClick={downloadCsv}>
          ⬇ Download CSV
        </button>
      </div>
    </div>
  );
};

export default ForecastTable;
