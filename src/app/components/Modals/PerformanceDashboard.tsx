import { useState, useEffect } from 'react';
import { serviceWorkerMonitor } from '@/client/utils/serviceWorkerMonitor';
import Modal from './Modal';

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
    <Modal open={isOpen} closeModal={onClose} variant="constrained-dialog" ariaLabel="Image Performance Monitor" showCloseButton
      modalHeader={<h2 className="py-3 text-lg font-semibold tracking-wide text-white">Image Performance Monitor</h2>}
      modalContent={<div className="min-w-0 text-slate-100">

        {/* Performance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 [&>div]:min-w-0 [&>div]:break-words">
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
                  <div key={index} className="flex min-w-0 items-center justify-between gap-2 border border-sky-200/10 bg-slate-950/35 p-2 text-sm">
                    <div className="flex min-w-0 items-center space-x-2 text-slate-200">
                      <div className={`w-2 h-2 rounded-full ${metric.fromCache ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="truncate max-w-xs">{metric.url.split('/').pop()}</div>
                    </div>
                    <div className="shrink-0 text-slate-400">{metric.loadTime}ms</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
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
      </div>}
    />
  );
}
