import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

function generateMonthRange(year, fromMonth, toMonth) {
  const months = [];
  const from = parseInt(fromMonth);
  const to = parseInt(toMonth);
  for (let m = from; m <= to; m++) {
    months.push(`${year}-${m.toString().padStart(2, '0')}`);
  }
  return months;
}

const normalizeMembershipType = (type) => type.toLowerCase().trim();

const displayNames = {
  'standard membership': 'Standard Membership',
  'standard': 'Standard Membership',
  'premium membership': 'Premium Membership',
  'premium': 'Premium Membership',
  'family membership': 'Family Membership',
  'family': 'Family Membership'
};

function DashboardCharts({ darkMode }) {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [fromMonth, setFromMonth] = useState('01'); // numeric strings
  const [toMonth, setToMonth] = useState('12');
  const [chartType, setChartType] = useState('bar');
  const [membershipType, setMembershipType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const membershipTypeColors = useMemo(() => ({
    'Standard Membership': darkMode ? 'rgba(3, 28, 28, 0.8)' : 'rgba(3, 28, 28, 0.8)',
    'Premium Membership': darkMode ? 'rgba(180, 120, 255, 0.8)' : 'rgba(153, 102, 255, 0.8)',
    'Family Membership': darkMode ? 'rgba(236, 137, 16, 0.8)' : 'rgba(239, 133, 28, 0.8)',
    'Unknown Membership': darkMode ? 'rgba(128, 128, 128, 0.8)' : 'rgba(128, 128, 128, 0.8)',
    'All Memberships': darkMode ? 'rgba(80, 180, 250, 0.8)' : 'rgba(54, 162, 235, 0.8)'
  }), [darkMode]);

  const getColorForMembershipType = useCallback((type) => {
    return membershipTypeColors[type] || membershipTypeColors['Unknown Membership'];
  }, [membershipTypeColors]);

  const processChartData = useCallback((rawData) => {
    if (!rawData || rawData.length === 0) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

    const filteredByDate = rawData.filter(item => {
      const [year, month] = item.month.split('-');
      return year === selectedYear &&
             parseInt(month) >= parseInt(fromMonth) &&
             parseInt(month) <= parseInt(toMonth);
    });

    const cleanedData = filteredByDate.map(item => {
      const normalized = normalizeMembershipType(item.membership_type);
      const display = displayNames[normalized] || 'Unknown Membership';
      return {
        month: item.month,
        membership_type: display,
        total: parseFloat(item.total)
      };
    });

    const allMonths = generateMonthRange(selectedYear, fromMonth, toMonth);

    const groupedData = {};

    cleanedData.forEach(({ month, membership_type, total }) => {
      if (!groupedData[membership_type]) groupedData[membership_type] = {};
      if (!groupedData[membership_type][month]) groupedData[membership_type][month] = 0;
      groupedData[membership_type][month] += total;
    });

    // Remove unknown membership
    delete groupedData['Unknown Membership'];

    // Sum totals per month across membership types
    const totalPerMonth = {};
    allMonths.forEach(month => {
      totalPerMonth[month] = Object.values(groupedData).reduce((sum, membershipTotals) => {
        return sum + (membershipTotals[month] || 0);
      }, 0);
    });

    // Filter out months with zero total
    const filteredMonths = allMonths.filter(month => totalPerMonth[month] > 0);

    const typesToUse = membershipType
      ? [displayNames[normalizeMembershipType(membershipType)] || null].filter(Boolean)
      : Object.keys(groupedData).filter(type => type !== 'Unknown Membership');

    const datasets = typesToUse.map(type => {
      const monthTotals = groupedData[type] || {};
      const data = filteredMonths.map(month => monthTotals[month] || 0);
      return {
        label: type,
        data,
        backgroundColor: getColorForMembershipType(type),
        borderColor: getColorForMembershipType(type).replace('0.8', '1'),
        borderWidth: 2,
        fill: chartType === 'line',
        tension: 0.3,
        minBarLength: 5
      };
    });

    setChartData({
      labels: filteredMonths,
      datasets
    });
  }, [chartType, membershipType, getColorForMembershipType, selectedYear, fromMonth, toMonth]);

  const fetchMonthlyIncome = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/payments/monthly', {
        params: {
          year: selectedYear,
          fromMonth,
          toMonth,
          membershipType: membershipType || undefined
        },
        timeout: 10000
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid data format received from server');
      }

      const validData = response.data.filter(item =>
        item.month && item.membership_type && !isNaN(parseFloat(item.total))
      );

      processChartData(validData);
    } catch (error) {
      console.error('Error fetching monthly income', error);
      setError(error.response?.data?.error || error.message || 'Failed to load payment data. Please try again.');
      setChartData({ labels: [], datasets: [] });
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, fromMonth, toMonth, membershipType, processChartData]);

  useEffect(() => {
    fetchMonthlyIncome();
  }, [fetchMonthlyIncome]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#fff' : '#666',
          font: { size: 12 },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        },
        onClick: () => {}, // disable toggling on legend click
      },
      title: {
        display: true,
        text: `Monthly Income ${selectedYear} (${fromMonth}-${toMonth})${membershipType ? ` - ${membershipType}` : ''}`,
        color: darkMode ? '#fff' : '#666',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
        titleColor: darkMode ? '#fff' : '#333',
        bodyColor: darkMode ? '#fff' : '#333',
        borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(context.parsed.y);
            }
            return label;
          },
          title: function(context) {
            const dateStr = context[0].label;
            const [year, month] = dateStr.split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            });
          }
        }
      }
    },
    scales: {
      x: {
        stacked: membershipType === '',
        ticks: {
          color: darkMode ? '#fff' : '#666',
          font: { size: 12 },
          callback: function(value) {
            const [year, month] = this.getLabelForValue(value).split('-');
            return new Date(year, month - 1).toLocaleDateString('en-US', {
              month: 'short'
            });
          }
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      },
      y: {
        stacked: membershipType === '',
        beginAtZero: true,
        ticks: {
          color: darkMode ? '#fff' : '#666',
          font: { size: 12 },
          callback: value => new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value)
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        }
      }
    },
    interaction: {
      mode: 'index',
      axis: 'x',
      intersect: false
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    elements: {
      bar: {
        borderRadius: 4
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    },
    datasets: {
      bar: {
        minBarLength: 5
      }
    }
  }), [darkMode, selectedYear, membershipType, fromMonth, toMonth]);

  // Month selector UI updated to send numeric month values:
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const exportCSV = () => {
    if (!chartData.labels.length) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    const headers = ["Month", ...chartData.datasets.map(d => d.label)];
    csvContent += headers.join(",") + "\r\n";

    chartData.labels.forEach((label, i) => {
      const row = [formatMonthLabel(label)];
      chartData.datasets.forEach(dataset => {
        row.push(dataset.data[i]?.toFixed(2) || "0.00");
      });
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `income_report_${selectedYear}_${fromMonth}-${toMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const formatMonthLabel = (month) => {
    const [year, monthNum] = month.split('-');
    return new Date(year, monthNum - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const totalIncome = useMemo(() => {
    if (!chartData.datasets.length) return 0;

    return chartData.datasets.reduce((sum, dataset) => {
      return sum + dataset.data.reduce((datasetSum, value) => datasetSum + (value || 0), 0);
    }, 0);
  }, [chartData]);

  return (
    <div style={{
      marginTop: '30px',
      padding: '20px',
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      color: darkMode ? '#fff' : '#000',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '20px',
        gap: '15px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: '600',
          color: darkMode ? '#fff' : '#333'
        }}>
          📊 Membership Monthly Income Overview
        </h2>

        {chartData.labels.length > 0 && (
          <div style={{
            backgroundColor: darkMode ? '#333' : '#f0f0f0',
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 'bold',
            color: darkMode ? '#fff' : '#333'
          }}>
            Total: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2
            }).format(totalIncome)}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: darkMode ? '#ff4444' : '#ffebee',
          color: darkMode ? '#fff' : '#c62828',
          borderRadius: '6px',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Year selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 120px',
          minWidth: '120px'
        }}>
          <label style={{
            marginRight: '8px',
            fontSize: '0.9rem',
            color: darkMode ? '#ccc' : '#666'
          }}>Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#000',
              border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              flex: '1',
              fontSize: '0.9rem'
            }}
            disabled={isLoading}
          >
            {years.map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
        </div>

        {/* From month selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 120px',
          minWidth: '120px'
        }}>
          <label style={{
            marginRight: '8px',
            fontSize: '0.9rem',
            color: darkMode ? '#ccc' : '#666'
          }}>From:</label>
          <select
            value={fromMonth}
            onChange={(e) => setFromMonth(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#000',
              border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              flex: '1',
              fontSize: '0.9rem'
            }}
            disabled={isLoading}
          >
            {monthNames.map((m, i) => {
              const monthNumber = (i + 1).toString().padStart(2, '0');
              return <option key={monthNumber} value={monthNumber}>{m}</option>;
            })}
          </select>
        </div>

        {/* To month selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 120px',
          minWidth: '120px'
        }}>
          <label style={{
            marginRight: '8px',
            fontSize: '0.9rem',
            color: darkMode ? '#ccc' : '#666'
          }}>To:</label>
          <select
            value={toMonth}
            onChange={(e) => setToMonth(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#000',
              border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              flex: '1',
              fontSize: '0.9rem'
            }}
            disabled={isLoading}
          >
            {monthNames.map((m, i) => {
              const monthNumber = (i + 1).toString().padStart(2, '0');
              return <option key={monthNumber} value={monthNumber}>{m}</option>;
            })}
          </select>
        </div>

        {/* Membership type selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 160px',
          minWidth: '160px'
        }}>
          <label style={{
            marginRight: '8px',
            fontSize: '0.9rem',
            color: darkMode ? '#ccc' : '#666'
          }}>Membership:</label>
          <select
            value={membershipType}
            onChange={(e) => setMembershipType(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#000',
              border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              flex: '1',
              fontSize: '0.9rem'
            }}
            disabled={isLoading}
          >
            <option value="">All Types</option>
            <option value="Standard Membership">Standard Membership</option>
            <option value="Premium Membership">Premium Membership</option>
            <option value="Family Membership">Family Membership</option>
          </select>
        </div>

        {/* Export CSV button */}
        <button
          onClick={exportCSV}
          disabled={isLoading || chartData.labels.length === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: darkMode ? '#444' : '#f0f0f0',
            color: darkMode ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: (isLoading || chartData.labels.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || chartData.labels.length === 0) ? 0.6 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.9rem',
            flex: '0 0 auto'
          }}
        >
          <span>⬇️ Export CSV</span>
        </button>

        {/* Toggle chart type button */}
        <button
          onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}
          disabled={isLoading || chartData.labels.length === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: darkMode ? '#444' : '#f0f0f0',
            color: darkMode ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: (isLoading || chartData.labels.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || chartData.labels.length === 0) ? 0.6 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.9rem',
            flex: '0 0 auto'
          }}
        >
          <span>🔄 {chartType === 'bar' ? 'Line' : 'Bar'} Chart</span>
        </button>
      </div>

      <div style={{
        height: '400px',
        position: 'relative',
        backgroundColor: darkMode ? '#2a2a2a' : '#f9f9f9',
        borderRadius: '8px',
        padding: '12px',
        border: `1px solid ${darkMode ? '#444' : '#eee'}`
      }}>
        {isLoading ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              margin: '0 auto 15px',
              border: `4px solid ${darkMode ? '#444' : '#eee'}`,
              borderTop: `4px solid ${darkMode ? '#fff' : '#007bff'}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{
              color: darkMode ? '#fff' : '#000',
              fontSize: '0.9rem'
            }}>Loading payment data...</p>
          </div>
        ) : chartData.labels.length === 0 ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            padding: '20px',
            maxWidth: '300px'
          }}>
            <p style={{
              color: darkMode ? '#aaa' : '#666',
              marginBottom: '15px',
              fontSize: '1rem'
            }}>
              {error ? 'Error loading data' : 'No payment data available for the selected filters'}
            </p>
            <button
              onClick={fetchMonthlyIncome}
              style={{
                padding: '8px 16px',
                backgroundColor: darkMode ? '#444' : '#e0e0e0',
                color: darkMode ? '#fff' : '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem'
              }}
            >
              ↻ Retry
            </button>
          </div>
        ) : chartType === 'bar' ? (
          <Bar
            data={chartData}
            options={options}
            style={{ maxHeight: '100%', width: '100%' }}
          />
        ) : (
          <Line
            data={chartData}
            options={options}
            style={{ maxHeight: '100%', width: '100%' }}
          />
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        select:disabled, button:disabled {
          opacity: 0.7;
          cursor: not-allowed !important;
        }
        @media (max-width: 768px) {
          .chart-controls > div {
            flex: 1 1 100% !important;
            margin-bottom: 10px;
          }
        }
      `}</style>
    </div>
  );
}

export default DashboardCharts;
