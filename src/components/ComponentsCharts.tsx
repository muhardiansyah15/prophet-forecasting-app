import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { ForecastData } from '../App';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const BLUE = '#2a78d6';
const GRID = '#e1e0d9';
const INK_MUTED = '#898781';

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) =>
          ` ${Number(context.raw).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: INK_MUTED, maxTicksLimit: 12, maxRotation: 0 } },
    y: { grid: { color: GRID, drawBorder: false }, ticks: { color: INK_MUTED } },
  },
};

interface ComponentsChartsProps {
  components: NonNullable<ForecastData['components']>;
  changepoints: string[];
}

const ComponentsCharts: React.FC<ComponentsChartsProps> = ({ components, changepoints }) => {
  const { trend, weekly, yearly } = components;

  return (
    <div className="components-grid">
      <section className="card">
        <div className="card-head"><h2>Trend</h2></div>
        <p className="card-sub">
          Long-term direction learned by Prophet
          {changepoints.length > 0 && <> · {changepoints.length} trend changepoint{changepoints.length > 1 ? 's' : ''} detected</>}
        </p>
        <div className="chart-box small">
          <Line
            data={{
              labels: trend.map(t => t.ds),
              datasets: [{
                data: trend.map(t => t.value),
                borderColor: BLUE,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 3,
                tension: 0.15,
              }],
            }}
            options={baseOptions as any}
          />
        </div>
      </section>

      {weekly.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Weekly pattern</h2></div>
          <p className="card-sub">Average effect of each day of the week</p>
          <div className="chart-box small">
            <Bar
              data={{
                labels: weekly.map(w => w.label),
                datasets: [{
                  data: weekly.map(w => w.value),
                  backgroundColor: BLUE,
                  borderRadius: 4,
                  maxBarThickness: 34,
                }],
              }}
              options={baseOptions as any}
            />
          </div>
        </section>
      )}

      {yearly.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Yearly pattern</h2></div>
          <p className="card-sub">Average seasonal effect per month</p>
          <div className="chart-box small">
            <Bar
              data={{
                labels: yearly.map(y => y.label),
                datasets: [{
                  data: yearly.map(y => y.value),
                  backgroundColor: BLUE,
                  borderRadius: 4,
                  maxBarThickness: 26,
                }],
              }}
              options={baseOptions as any}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default ComponentsCharts;
