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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ForecastChartProps {
  data: ForecastData;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  const { historical, forecast } = data;

  // Combine historical and forecast data for chart
  const allDates = [
    ...historical.map(d => d.ds),
    ...forecast.map(d => d.ds)
  ];

  const historicalValues = [
    ...historical.map(d => d.y),
    ...new Array(forecast.length).fill(null)
  ];

  const forecastValues = [
    ...new Array(historical.length).fill(null),
    ...forecast.map(d => d.yhat)
  ];

  const upperBound = [
    ...new Array(historical.length).fill(null),
    ...forecast.map(d => d.yhat_upper)
  ];

  const lowerBound = [
    ...new Array(historical.length).fill(null),
    ...forecast.map(d => d.yhat_lower)
  ];

  const chartData = {
    labels: allDates,
    datasets: [
      {
        label: 'Historical Data',
        data: historicalValues,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        pointRadius: 2,
      },
      {
        label: 'Forecast',
        data: forecastValues,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        pointRadius: 2,
        borderDash: [5, 5],
      },
      {
        label: 'Upper Bound',
        data: upperBound,
        borderColor: 'rgba(255, 99, 132, 0.3)',
        backgroundColor: 'transparent',
        fill: false,
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        label: 'Lower Bound',
        data: lowerBound,
        borderColor: 'rgba(255, 99, 132, 0.3)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: '-1',
        pointRadius: 0,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Time Series Forecast',
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => {
            return `Date: ${context[0].label}`;
          },
          label: (context: any) => {
            if (context.dataset.label === 'Upper Bound' || context.dataset.label === 'Lower Bound') {
              return `${context.dataset.label}: ${context.raw !== null ? context.raw.toFixed(2) : 'N/A'}`;
            }
            return `${context.dataset.label}: ${context.raw !== null ? context.raw.toFixed(2) : 'N/A'}`;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
        ticks: {
          maxTicksLimit: 20,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Value',
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ForecastChart;