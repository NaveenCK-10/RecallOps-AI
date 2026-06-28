import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Cpu, Brain, Zap, Clock, Server, CheckCircle, AlertTriangle, ShieldCheck, DollarSign, Activity } from 'lucide-react';
import { getAnalytics } from '../services/api';
import { motion } from 'framer-motion';
import ProgressBar from '../components/ui/ProgressBar';

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
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 skeleton rounded-xl" />)}
      </div>
    );
  }

  if (!analytics || analytics.totalIncidents === 0) {
    return (
      <div className="max-w-[1400px] mx-auto flex flex-col items-center justify-center py-32 opacity-80 card-glass border border-dashed border-white/10 rounded-xl">
        <Server className="w-16 h-16 text-white/20 mb-6 pulse-cyan" />
        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Awaiting Telemetry</h2>
        <p className="text-[10px] font-mono text-text-muted mt-2 uppercase tracking-widest">Initialize pipeline analysis to populate runtime metrics.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide uppercase font-mono">System <span className="text-success">Analytics</span></h1>
          <p className="text-text-secondary mt-1 font-mono text-sm tracking-wide">Platform telemetry and performance visualization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Memory Efficiency */}
        <div className="card-glass rounded-xl p-6 relative overflow-hidden border border-white/5">
          <h3 className="text-[10px] font-bold text-text-muted tracking-widest uppercase mb-6 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-purple-light" />
            Knowledge Reuse Efficiency
          </h3>
          <div className="space-y-6">
            <ProgressBar label="Synthesized New Knowledge" value={analytics.memoryUsage.newCreated} total={analytics.totalIncidents} color="bg-purple-light" />
            <ProgressBar label="Retrieved Existing Knowledge" value={analytics.memoryUsage.existingReused} total={analytics.totalIncidents} color="bg-accent" />
            <ProgressBar label="Knowledge Misses" value={analytics.memoryUsage.misses} total={analytics.totalIncidents} color="bg-white/20" />
          </div>
        </div>

        {/* Pipeline Success */}
        <div className="card-glass rounded-xl p-6 relative overflow-hidden border border-white/5">
          <h3 className="text-[10px] font-bold text-text-muted tracking-widest uppercase mb-6 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            Pipeline Success Rate
          </h3>
          <div className="space-y-6">
            <ProgressBar label="Resolved Anomalies" value={analytics.pipelineSuccess.successful} total={analytics.totalIncidents} color="bg-success" />
            <ProgressBar label="Healthy Diagnoses" value={analytics.pipelineSuccess.healthy} total={analytics.totalIncidents} color="bg-cyan" />
            <ProgressBar label="Inference Failures" value={analytics.pipelineSuccess.failed} total={analytics.totalIncidents} color="bg-danger" />
          </div>
        </div>

        {/* Cost Trend */}
        <div className="card-glass rounded-xl p-6 flex flex-col justify-between relative overflow-hidden border border-white/5">
          <h3 className="text-[10px] font-bold text-text-muted tracking-widest uppercase mb-6 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-success" />
            Cost Trend
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border-l border-white/10 pl-4">
              <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">Avg Burn</div>
              <div className="text-lg font-bold text-white mt-1">${analytics.costOverview.avg.toFixed(4)}</div>
            </div>
            <div className="p-3 border-l border-white/10 pl-4">
              <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">Max Burn</div>
              <div className="text-lg font-bold text-warning mt-1">${analytics.costOverview.max.toFixed(4)}</div>
            </div>
            <div className="p-3 border-l border-success/30 pl-4 col-span-2">
              <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">Total Expend</div>
              <div className="text-2xl font-bold text-success mt-1">${analytics.costOverview.total.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* Incident Categories */}
        <div className="card-glass rounded-xl p-6 relative overflow-hidden border border-white/5 lg:col-span-2">
          <h3 className="text-[10px] font-bold text-text-muted tracking-widest uppercase mb-6 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-accent" />
            Incident Taxonomy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {Object.entries(analytics.categoryDistribution).map(([category, count], idx) => (
              <ProgressBar key={category} label={category} value={count} total={analytics.totalIncidents} color="bg-accent" delay={idx * 0.1} />
            ))}
            {Object.keys(analytics.categoryDistribution).length === 0 && (
              <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">No taxonomies classified.</div>
            )}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="card-glass rounded-xl p-6 relative overflow-hidden border border-white/5">
          <h3 className="text-[10px] font-bold text-text-muted tracking-widest uppercase mb-6 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            Severity Matrix
          </h3>
          <div className="space-y-6">
            {Object.entries(analytics.severityDistribution).map(([severity, count], idx) => {
              const colors = {
                critical: 'bg-danger',
                high: 'bg-warning',
                medium: 'bg-purple-light',
                low: 'bg-cyan',
                healthy: 'bg-success'
              };
              return (
                <ProgressBar key={severity} label={severity} value={count} total={analytics.totalIncidents} color={colors[severity] || 'bg-accent'} delay={idx * 0.1} />
              );
            })}
          </div>
        </div>

        {/* Average Confidence (Radial Gauge) */}
        <div className="card-glass rounded-xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden border border-white/5">
          <h3 className="text-[10px] font-bold text-text-muted tracking-widest uppercase mb-2 flex items-center gap-2">
            Model Resonance
          </h3>
          <div className="relative z-10 w-40 h-40 flex items-center justify-center my-6">
            <svg className="absolute top-0 left-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="46%" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/10" />
              <motion.circle 
                initial={{ strokeDashoffset: 290 }}
                animate={{ strokeDashoffset: 290 - (290 * analytics.avgConfidence) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="50%" cy="50%" r="46%" 
                fill="none" stroke="currentColor" strokeWidth="4" 
                className="text-accent" 
                strokeDasharray="290" 
                strokeLinecap="round" 
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-mono font-bold text-white">{analytics.avgConfidence}%</span>
              <span className="text-[10px] font-mono text-accent uppercase tracking-widest mt-1">Confidence</span>
            </div>
          </div>
        </div>
        
        {/* Latency Trend */}
        <div className="card-glass rounded-xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden border border-white/5 lg:col-span-2">
          <h3 className="text-[10px] font-bold text-text-muted tracking-widest uppercase mb-2 self-start flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan" />
            Avg Latency Trend
          </h3>
          <div className="flex flex-col items-start justify-center h-full w-full py-8">
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Global Pipeline Latency</div>
            <div className="text-4xl font-mono font-bold text-white">{analytics.avgResolutionTime}ms</div>
          </div>
        </div>

      </div>
    </div>
  );
}
