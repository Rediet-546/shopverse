import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';
import { FaChartLine, FaChartBar, FaChartPie, FaDownload } from 'react-icons/fa';
import { formatCurrency } from '../../utils/helpers';
import '../../styles/dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

const DashboardChart = ({ 
  type = 'line',
  data,
  options = {},
  title = '',
  height = 300,
  showDownload = false,
  className = ''
}) => {
  const chartRef = useRef();
  const [chartData, setChartData] = useState(data);
  const [chartOptions, setChartOptions] = useState(options);

  useEffect(() => {
    setChartData(data);
  }, [data]);

  useEffect(() => {
    setChartOptions(options);
  }, [options]);

  // Default options based on chart type
  const getDefaultOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.9)',
          titleColor: '#2d3748',
          bodyColor: '#4a5568',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8
        }
      }
    };

    if (type === 'line' || type === 'bar') {
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.05)'
            },
            ticks: {
              callback: function(value) {
                return formatCurrency(value);
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      };
    }

    if (type === 'pie' || type === 'doughnut') {
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          }
        }
      };
    }

    return baseOptions;
  };

  const mergedOptions = {
    ...getDefaultOptions(),
    ...chartOptions
  };

  const renderChart = () => {
    if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
      return (
        <div className="chart-placeholder">
          <p>No data available</p>
        </div>
      );
    }

    switch (type) {
      case 'line':
        return <Line ref={chartRef} data={chartData} options={mergedOptions} />;
      case 'bar':
        return <Bar ref={chartRef} data={chartData} options={mergedOptions} />;
      case 'pie':
        return <Pie ref={chartRef} data={chartData} options={mergedOptions} />;
      case 'doughnut':
        return <Doughnut ref={chartRef} data={chartData} options={mergedOptions} />;
      case 'radar':
        return <Radar ref={chartRef} data={chartData} options={mergedOptions} />;
      default:
        return <Line ref={chartRef} data={chartData} options={mergedOptions} />;
    }
  };

  const getChartIcon = () => {
    switch (type) {
      case 'line':
        return <FaChartLine />;
      case 'bar':
        return <FaChartBar />;
      case 'pie':
      case 'doughnut':
        return <FaChartPie />;
      default:
        return <FaChartLine />;
    }
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const link = document.createElement('a');
      link.download = `chart-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className={`dashboard-chart ${className}`}>
      {(title || showDownload) && (
        <div className="chart-header">
          {title && (
            <div className="chart-title">
              {getChartIcon()}
              <h3>{title}</h3>
            </div>
          )}
          {showDownload && (
            <button className="chart-download-btn" onClick={handleDownload}>
              <FaDownload /> Download
            </button>
          )}
        </div>
      )}
      <div className="chart-wrapper" style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default DashboardChart;