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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(52,136,205,.22),transparent_42%),rgba(1,5,10,.78)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto border border-sky-200/35 bg-[linear-gradient(145deg,rgba(15,31,48,.99),rgba(3,10,18,.99))] p-6 text-slate-100 shadow-[0_18px_45px_rgba(0,0,0,.55),0_0_28px_rgba(79,169,255,.16)]">
        <div className="mb-6 flex items-center justify-between border-b border-sky-200/20 pb-4">
          <h2 className="text-lg font-semibold tracking-wide text-white">Image Performance Monitor</h2>
          <button onClick={onClose} className="cursor-pointer border border-transparent p-2 text-slate-400 transition hover:border-sky-200/35 hover:bg-blue-400/10 hover:text-white">✕</button>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-sky-200/20 bg-sky-300/10 p-4">
            <div className="text-2xl font-bold text-sky-100">{stats.totalRequests}</div>
            <div className="text-sm text-sky-200/70">Total Requests</div>
          </div>
          <div className="border border-emerald-200/20 bg-emerald-300/10 p-4">
            <div className="text-2xl font-bold text-emerald-100">{stats.cacheHitRate}%</div>
            <div className="text-sm text-emerald-200/70">Cache Hit Rate</div>
          </div>
          <div className="border border-violet-200/20 bg-violet-300/10 p-4">
            <div className="text-2xl font-bold text-violet-100">{stats.avgLoadTime}ms</div>
            <div className="text-sm text-violet-200/70">Avg Load Time</div>
          </div>
          <div className="border border-amber-200/20 bg-amber-300/10 p-4">
            <div className="text-2xl font-bold text-amber-100">{stats.networkSavings}</div>
            <div className="text-sm text-amber-200/70">Est. Savings</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-6">
          <h3 className="mb-2 text-base font-semibold text-white">Recent Image Loads</h3>
          <div className="max-h-60 overflow-auto">
            {recentMetrics.length === 0 ? (
              <div className="py-4 text-center text-slate-400">No recent activity</div>
            ) : (
              <div className="space-y-2">
                {recentMetrics.slice().reverse().map((metric, index) => (
                  <div key={index} className="flex items-center justify-between border border-sky-200/10 bg-slate-950/35 p-2 text-sm">
                    <div className="flex items-center space-x-2 text-slate-200">
                      <div className={`w-2 h-2 rounded-full ${metric.fromCache ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="truncate max-w-xs">{metric.url.split('/').pop()}</div>
                    </div>
                    <div className="text-slate-400">{metric.loadTime}ms</div>
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
            className="cursor-pointer border border-sky-200/45 bg-[#246fb8] px-4 py-2 text-white transition hover:bg-[#338de0]"
          >
            Refresh Stats
          </button>
          <button
            onClick={clearCache}
            className="cursor-pointer border border-rose-200/35 bg-rose-500/80 px-4 py-2 text-white transition hover:bg-rose-500"
          >
            Clear Metrics
          </button>
        </div>
      </div>
    </div>
  );
}
