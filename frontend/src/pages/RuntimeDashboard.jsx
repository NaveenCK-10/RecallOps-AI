import { useEffect, useState } from 'react';
import { Cpu, Activity, Zap, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { getRuntime } from '../services/api';

export default function RuntimeDashboard() {
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRuntime = async () => {
      try {
        const res = await getRuntime({ limit: 50 });
        if (res.data.success) {
          setLogs(res.data.data.logs);
          setAnalytics(res.data.data.analytics);
        }
      } catch (err) {
        console.error('Failed to fetch runtime data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRuntime();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">CascadeFlow Runtime</h1>
          <p className="text-text-secondary mt-1">Real-time model routing, dynamic latency optimization, and spec-execution logs.</p>
        </div>
        <div className="flex items-center gap-2 bg-cyan/10 border border-cyan/20 text-cyan-400 px-3 py-1.5 rounded-lg text-sm font-medium">
          <Cpu className="w-4 h-4" />
          {analytics?.provider === 'cascadeflow-sdk' ? 'SDK Active' : 'Routing-Only Mode'}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox icon={<Activity />} label="Total Inferences" value={analytics?.totalRequests || 0} />
            <StatBox icon={<DollarSign />} label="Total Inference Cost" value={`$${analytics?.totalCost?.toFixed(4) || 0}`} color="text-success" />
            <StatBox icon={<ShieldCheck />} label="Cost Saved (Routing)" value={`$${analytics?.costSavedByMemory?.toFixed(4) || 0}`} color="text-purple-400" />
            <StatBox icon={<Clock />} label="Average Latency" value={`${analytics?.averageLatency || 0}ms`} color="text-cyan-400" />
          </div>

          <div className="glass-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-bg-secondary/50 font-medium text-text-primary">
              Recent Routing Decisions
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase bg-bg-secondary/30">
                  <tr>
                    <th className="px-4 py-3 font-medium">Request ID</th>
                    <th className="px-4 py-3 font-medium">Complexity</th>
                    <th className="px-4 py-3 font-medium">Selected Model</th>
                    <th className="px-4 py-3 font-medium">Latency</th>
                    <th className="px-4 py-3 font-medium">Cost</th>
                    <th className="px-4 py-3 font-medium">Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.length === 0 && (
                    <tr><td colSpan="6" className="px-4 py-8 text-center text-text-muted">No runtime logs available. Run an analysis first.</td></tr>
                  )}
                  {logs.map((log, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      key={log.requestId} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-[11px] text-text-muted">{log.requestId}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          log.complexity === 'complex' ? 'bg-danger/10 text-danger border border-danger/20' : 
                          log.complexity === 'standard' ? 'bg-warning/10 text-warning border border-warning/20' : 
                          'bg-success/10 text-success border border-success/20'
                        }`}>
                          {log.complexity}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-accent-light">{log.modelName}</td>
                      <td className="px-4 py-3 text-text-secondary">{log.actualLatency}ms</td>
                      <td className="px-4 py-3 text-success font-mono">${log.actualCost}</td>
                      <td className="px-4 py-3">
                        {log.memoryAugmented ? (
                          <span className="flex items-center gap-1 text-[11px] text-purple-400 bg-purple/10 border border-purple/20 px-2 py-0.5 rounded w-fit">
                            <Zap className="w-3 h-3" /> Augmented
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-muted">Zero-shot</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, color = "text-accent" }) {
  return (
    <div className="glass-card p-4 rounded-xl border border-border flex items-start gap-4">
      <div className={`p-2 rounded-lg bg-bg-secondary ${color} bg-opacity-10 border border-white/5`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-text-muted mb-1">{label}</div>
        <div className="text-xl font-bold text-text-primary">{value}</div>
      </div>
    </div>
  );
}
