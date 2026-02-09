import { useState, useEffect } from 'react';
import { serviceWorkerMonitor } from '@/client/utils/serviceWorkerMonitor';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PerformanceDashboard({ isOpen, onClose }: PerformanceDashboardProps) {
  const [stats, setStats] = useState(serviceWorkerMonitor.getPerformanceSummary());

  useEffect(() => {
    if (isOpen) {
      setStats(serviceWorkerMonitor.getPerformanceSummary());
    }
  }, [isOpen]);

  const refreshStats = () => {
    setStats(serviceWorkerMonitor.getPerformanceSummary());
  };

  const clearCache = () => {
    serviceWorkerMonitor.clearMetrics();
    setStats(serviceWorkerMonitor.getPerformanceSummary());
  };

  if (!isOpen) return null;

  const recentMetrics = serviceWorkerMonitor.getRecentMetrics();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Image Performance Monitor</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded">
            <div className="text-2xl font-bold text-blue-800">{stats.totalRequests}</div>
            <div className="text-sm text-blue-600">Total Requests</div>
          </div>
          <div className="bg-green-100 p-4 rounded">
            <div className="text-2xl font-bold text-green-800">{stats.cacheHitRate}%</div>
            <div className="text-sm text-green-600">Cache Hit Rate</div>
          </div>
          <div className="bg-purple-100 p-4 rounded">
            <div className="text-2xl font-bold text-purple-800">{stats.avgLoadTime}ms</div>
            <div className="text-sm text-purple-600">Avg Load Time</div>
          </div>
          <div className="bg-orange-100 p-4 rounded">
            <div className="text-2xl font-bold text-orange-800">{stats.networkSavings}</div>
            <div className="text-sm text-orange-600">Est. Savings</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Recent Image Loads</h3>
          <div className="max-h-60 overflow-auto">
            {recentMetrics.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No recent activity</div>
            ) : (
              <div className="space-y-2">
                {recentMetrics.slice().reverse().map((metric, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${metric.fromCache ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="truncate max-w-xs">{metric.url.split('/').pop()}</div>
                    </div>
                    <div className="text-gray-600">{metric.loadTime}ms</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={refreshStats}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Stats
          </button>
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Metrics
          </button>
        </div>
      </div>
    </div>
  );
}