import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, Clock, Zap, ArrowRight, Brain, Cpu, Database, Network, ShieldCheck, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAnalytics, getIncidents } from '../services/api';
import { useApp } from '../context/AppContext';
import StatBox from '../components/ui/StatBox';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, incidentsRes] = await Promise.all([
          getAnalytics(),
          getIncidents({ limit: 5 })
        ]);
        
        if (analyticsRes.data.success) {
          dispatch({ type: 'SET_ANALYTICS', payload: analyticsRes.data.data });
        }
        if (incidentsRes.data.success) {
          dispatch({ type: 'SET_INCIDENTS', payload: incidentsRes.data.data.incidents });
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dispatch]);

  const { analytics, incidents } = state;

  return (
    <div className="space-y-6">
      
      {/* 1. HERO MISSION CONTROL PANEL */}
      <div className="card-primary rounded-xl p-8 relative overflow-hidden flex flex-col md:flex-row items-start justify-between gap-8 border border-white/10 shadow-2xl">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-radial-glow opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-neural-grid opacity-20 pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-lg">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-widest uppercase font-mono mb-2">RecallOps <span className="text-accent">AI</span></h1>
            <p className="text-text-secondary font-mono text-sm tracking-widest uppercase">AI Incident Response Platform</p>
          </div>
          <p className="text-sm text-text-muted leading-relaxed max-w-md">
            Autonomous root cause isolation utilizing persistent vector memory, dynamic multi-model routing, and Mistral Nemotron inference.
          </p>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={() => navigate('/analyze')}
            className="mt-6 flex items-center gap-2 bg-accent/10 border border-accent/50 hover:bg-accent text-accent hover:text-bg-primary px-6 py-3 rounded text-[11px] font-bold uppercase tracking-widest transition-colors duration-200 glow-accent w-fit"
          >
            <Zap className="w-4 h-4" />
            Initialize Analysis
          </motion.button>
        </div>

        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto">
          <SystemStatusNode label="NVIDIA" status="Connected" active />
          <SystemStatusNode label="Hindsight" status="Active" active />
          <SystemStatusNode label="CascadeFlow" status="Ready" active />
          <SystemStatusNode label="Memory Store" status="Healthy" active />
          <SystemStatusNode label="Runtime" status="Monitoring" active />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 skeleton rounded-xl" />
          <div className="h-96 skeleton rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 2. RECENT INCIDENTS (Pipeline Overview) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-bold text-white tracking-widest uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  Recent Pipeline Activity
                </h2>
                <button onClick={() => navigate('/runtime')} className="text-[10px] text-text-muted hover:text-white uppercase font-bold tracking-widest flex items-center gap-1 transition-colors">
                  View Runtime <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {incidents.length === 0 ? (
                  <div className="card-glass p-10 text-center rounded-xl border border-dashed border-white/10">
                    <p className="text-xs font-mono uppercase tracking-widest text-text-muted">No pipeline activity detected.</p>
                  </div>
                ) : (
                  incidents.map((incident, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.2 }}
                      key={incident.incidentId} 
                      onClick={() => navigate('/analyze', { state: { incident }})}
                      className="card-raised p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${incident.severity === 'healthy' ? 'bg-success pulse-green' : 'bg-warning pulse-amber'}`} />
                        <div>
                          <div className="text-sm font-bold text-white mb-1 group-hover:text-accent transition-colors">{incident.title}</div>
                          <div className="flex items-center gap-4 text-[10px] font-mono text-text-muted uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Database className="w-3 h-3" /> {incident.category}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(incident.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {incident.similarIncidents?.length > 0 && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-light bg-purple/10 px-2 py-1 rounded border border-purple/20">
                            {incident.similarIncidents.length} Memories
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border severity-${incident.severity}`}>
                          {incident.severity}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* 3. KPIS & MEMORY ACTIVITY */}
            <div className="space-y-6">
              
              <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-bold text-white tracking-widest uppercase flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-light" />
                  Key Metrics
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Analyzed" value={analytics?.totalIncidents || 0} />
                <StatBox label="Latency" value={`${analytics?.avgResolutionTime || 0}ms`} color="cyan" />
                <StatBox label="Mem Hits" value={`${analytics?.memoryHitRate || 0}%`} color="purple" />
                <StatBox label="Cost" value={`$${analytics?.totalCost?.toFixed(3) || 0}`} color="success" />
              </div>

              <div className="card-raised rounded-xl p-5 border border-white/5">
                <h3 className="text-[10px] font-bold text-text-muted tracking-widest uppercase mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  Pipeline Integrity
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
                    <span className="text-text-secondary">Success Rate</span>
                    <span className="text-white font-bold">{analytics?.totalIncidents > 0 ? Math.round((analytics.pipelineSuccess.successful + analytics.pipelineSuccess.healthy) / analytics.totalIncidents * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-success rounded-full" style={{ width: `${analytics?.totalIncidents > 0 ? ((analytics.pipelineSuccess.successful + analytics.pipelineSuccess.healthy) / analytics.totalIncidents * 100) : 0}%` }} />
                  </div>
                  
                  <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
                    <span className="text-text-secondary">Avg Confidence</span>
                    <span className="text-white font-bold">{analytics?.avgConfidence || 0}%</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}

function SystemStatusNode({ label, status, active }) {
  return (
    <div className="card-glass p-3 rounded-lg border border-white/5 flex flex-col gap-1.5 backdrop-blur-md">
      <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</div>
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-success pulse-green' : 'bg-warning'}`} />
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">{status}</span>
      </div>
    </div>
  );
}
