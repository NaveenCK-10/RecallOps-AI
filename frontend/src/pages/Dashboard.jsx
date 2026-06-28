import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, Clock, Zap, ArrowRight, Brain, Cpu, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAnalytics, getIncidents } from '../services/api';
import { useApp } from '../context/AppContext';

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
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">RecallOps Dashboard</h1>
          <p className="text-text-secondary mt-1">Production incident intelligence and autonomous resolution.</p>
        </div>
        <button 
          onClick={() => navigate('/analyze')}
          className="flex items-center gap-2 bg-accent hover:bg-accent-light text-white px-5 py-2.5 rounded-lg font-medium transition-colors glow-accent w-fit"
        >
          <Zap className="w-4 h-4" />
          Analyze New Incident
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-xl skeleton" />)}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Incidents Analyzed" 
              value={analytics?.totalIncidents || 0}
              icon={<Activity className="w-5 h-5 text-accent-light" />}
              trend="+12% this week"
            />
            <StatCard 
              title="Memory Hit Rate" 
              value={`${analytics?.memoryHitRate || 0}%`}
              icon={<Brain className="w-5 h-5 text-purple" />}
              trend="Hindsight persistent memory"
            />
            <StatCard 
              title="Avg Resolution Time" 
              value={`${analytics?.avgResolutionTime || 0}ms`}
              icon={<Clock className="w-5 h-5 text-cyan" />}
              trend="Pipeline latency"
            />
            <StatCard 
              title="Cost Saved (Memory)" 
              value={`$${analytics?.costSaved || 0}`}
              icon={<Cpu className="w-5 h-5 text-success" />}
              trend="Via CascadeFlow dynamic routing"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Incidents */}
            <div className="lg:col-span-2 glass-card rounded-xl p-5 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Recent Incidents
                </h2>
                <button onClick={() => navigate('/analyze')} className="text-sm text-accent hover:text-accent-light flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">No incidents analyzed yet.</div>
                ) : (
                  incidents.map((incident, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={incident.incidentId} 
                      className="p-4 rounded-lg bg-bg-secondary border border-border hover:border-border-bright transition-colors cursor-pointer group"
                      onClick={() => navigate('/analyze', { state: { incident }})}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-text-primary group-hover:text-accent-light transition-colors">
                          {incident.title}
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full severity-${incident.severity}`}>
                          {incident.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5" /> {incident.category}</span>
                        {incident.similarIncidents?.length > 0 && (
                          <span className="flex items-center gap-1 text-purple"><Brain className="w-3.5 h-3.5" /> {incident.similarIncidents.length} memories</span>
                        )}
                        <span>{new Date(incident.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="glass-card rounded-xl p-5 border border-border">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                System Integrations
              </h2>
              
              <div className="space-y-4">
                <IntegrationStatus 
                  name="NVIDIA Inference" 
                  status={analytics?.runtimeAnalytics?.provider === 'nvidia-api' ? 'online' : 'mock'} 
                  model={Object.keys(analytics?.runtimeAnalytics?.modelUsage || {})[0] || 'Llama 3.1 70B'}
                />
                <IntegrationStatus 
                  name="Hindsight Memory" 
                  status={analytics?.memoryStats?.provider === 'hindsight-sdk' ? 'online' : 'local'} 
                  detail={`${analytics?.memoryStats?.totalMemories || 0} vectors stored`}
                />
                <IntegrationStatus 
                  name="CascadeFlow Router" 
                  status={analytics?.runtimeAnalytics?.provider === 'cascadeflow-sdk' ? 'online' : 'routing-only'} 
                  detail="Dynamic multi-model routing"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend }) {
  return (
    <div className="glass-card rounded-xl p-5 border border-border flex flex-col justify-between h-32 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{title}</span>
        <div className="p-2 bg-white/[0.03] rounded-lg">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-text-primary tracking-tight">{value}</div>
        <div className="text-xs text-text-muted mt-1">{trend}</div>
      </div>
    </div>
  );
}

function IntegrationStatus({ name, status, detail, model }) {
  const isOnline = status === 'online';
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary border border-border">
      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
      <div>
        <div className="text-sm font-medium text-text-primary flex items-center gap-2">
          {name}
          {!isOnline && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">{status}</span>}
        </div>
        {(detail || model) && (
          <div className="text-xs text-text-muted mt-1">
            {model ? `Model: ${model}` : detail}
          </div>
        )}
      </div>
    </div>
  );
}
