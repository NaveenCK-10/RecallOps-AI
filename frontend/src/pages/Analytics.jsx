import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Cpu, Brain, Zap, Clock } from 'lucide-react';
import { getAnalytics } from '../services/api';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await getAnalytics();
        if (res.data.success) {
          setAnalytics(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 skeleton rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">System Analytics</h1>
        <p className="text-text-secondary mt-1">Platform performance, cost metrics, and AI intelligence tracking.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Incidents" value={analytics?.totalIncidents} icon={<BarChart3 />} color="text-accent" />
        <MetricCard title="Memory Hit Rate" value={`${analytics?.memoryHitRate}%`} icon={<Brain />} color="text-purple-400" />
        <MetricCard title="Avg Resolution Time" value={`${analytics?.avgResolutionTime}ms`} icon={<Clock />} color="text-cyan-400" />
        <MetricCard title="Cost Savings" value={`$${analytics?.costSaved}`} icon={<TrendingUp />} color="text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Usage */}
        <div className="glass-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent-light" />
            Model Usage Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(analytics?.runtimeAnalytics?.modelUsage || {}).map(([model, count]) => (
              <div key={model}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">{model}</span>
                  <span className="text-text-primary font-medium">{count} uses</span>
                </div>
                <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent glow-accent rounded-full" 
                    style={{ width: `${(count / analytics.runtimeAnalytics.totalRequests) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="glass-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
            Incident Severity Breakdown
          </h3>
          <div className="space-y-4">
            {Object.entries(analytics?.severityBreakdown || {}).map(([severity, count]) => {
              const colors = {
                critical: 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]',
                high: 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]',
                medium: 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]',
                low: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
              };
              return (
                <div key={severity}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary capitalize">{severity}</span>
                    <span className="text-text-primary font-medium">{count} incidents</span>
                  </div>
                  <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${colors[severity] || 'bg-accent'}`} 
                      style={{ width: `${(count / analytics.totalIncidents) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  return (
    <div className="glass-card p-5 rounded-xl border border-border flex flex-col justify-between h-32 relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-20 h-20 bg-current opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-colors ${color}`} />
      <div className="flex items-center justify-between z-10">
        <span className="text-sm font-medium text-text-secondary">{title}</span>
        <div className={`p-2 bg-white/[0.03] rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-text-primary tracking-tight z-10">{value}</div>
    </div>
  );
}
