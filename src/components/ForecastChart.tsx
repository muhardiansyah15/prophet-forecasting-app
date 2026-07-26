import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ForecastData } from '../App';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const BLUE = '#2a78d6';
const ORANGE = '#eb6834';
const BAND = 'rgba(42, 120, 214, 0.12)';
const GRID = '#e1e0d9';
const INK_MUTED = '#898781';

interface ForecastChartProps {
  data: ForecastData;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  const { historical, fitted, forecast } = data;

  const labels = [...fitted.map(d => d.ds), ...forecast.map(d => d.ds)];
  const n = fitted.length;

  const actual = [...historical.map(d => d.y), ...new Array(forecast.length).fill(null)];
  const forecastLine = [
    ...new Array(Math.max(0, n - 1)).fill(null),
    // join the two segments visually at the last fitted point
    fitted.length ? fitted[n - 1].yhat : null,
    ...forecast.map(d => d.yhat),
  ];
  const upper = [...fitted.map(d => d.yhat_upper), ...forecast.map(d => d.yhat_upper)];
  const lower = [...fitted.map(d => d.yhat_lower), ...forecast.map(d => d.yhat_lower)];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Historical',
        data: actual,
        borderColor: BLUE,
        backgroundColor: BLUE,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.15,
      },
      {
        label: 'Forecast',
        data: forecastLine,
        borderColor: ORANGE,
        backgroundColor: ORANGE,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.15,
      },
      {
        label: 'Uncertainty interval',
        data: upper,
        borderColor: 'transparent',
        backgroundColor: BAND,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: '+1',
        borderWidth: 0,
      },
      {
        label: '_lower',
        data: lower,
        borderColor: 'transparent',
        backgroundColor: BAND,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          color: '#52514e',
          filter: (item: any) => item.text !== '_lower',
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        filter: (item: any) => item.dataset.label !== '_lower' && item.dataset.label !== 'Uncertainty interval',
        callbacks: {
          label: (context: any) =>
            context.raw === null
              ? ''
              : ` ${context.dataset.label}: ${Number(context.raw).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        },
      },
    },
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 12, color: INK_MUTED, maxRotation: 0 },
      },
      y: {
        grid: { color: GRID, drawBorder: false },
        ticks: { color: INK_MUTED },
      },
    },
  };

  return <Line data={chartData} options={options as any} />;
};

export default ForecastChart;
