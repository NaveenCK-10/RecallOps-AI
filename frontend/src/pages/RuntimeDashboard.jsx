import { useEffect, useState } from 'react';
import { Activity, DollarSign, Clock, Brain, Cpu, Zap, CheckCircle2, XCircle, ShieldAlert, FileSearch, Terminal, ArrowRight, Network, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { getIncidents } from '../services/api';
import StatBox from '../components/ui/StatBox';

export default function RuntimeDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await getIncidents({ limit: 50 });
        if (res.data.success) {
          setIncidents(res.data.data.incidents);
        }
      } catch (err) {
        console.error('Failed to fetch runtime data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  // Compute Metrics
  const totalAnalyses = incidents.length;
  const avgLatency = totalAnalyses > 0 ? Math.round(incidents.reduce((sum, i) => sum + (i.pipelineLatency || 0), 0) / totalAnalyses) : 0;
  let totalCost = 0;
  let costCount = 0;
  let matchCount = 0;
  let totalConfidence = 0;

  incidents.forEach(i => {
    if (i.runtimeDecisions?.actualCost) {
      totalCost += i.runtimeDecisions.actualCost;
      costCount++;
    }
    if (i.similarIncidents && i.similarIncidents.length > 0) matchCount++;
    if (i.confidence) totalConfidence += i.confidence;
  });

  const avgCost = costCount > 0 ? (totalCost / costCount) : 0;
  const matchRate = totalAnalyses > 0 ? ((matchCount / totalAnalyses) * 100).toFixed(1) : 0;
  const avgConfidence = totalAnalyses > 0 ? Math.round(totalConfidence / totalAnalyses) : 0;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide uppercase font-mono">Runtime <span className="text-cyan">Intelligence</span></h1>
          <p className="text-text-secondary mt-1 font-mono text-sm tracking-wide">Live execution traces and telemetry.</p>
        </div>
        <div className="flex items-center gap-3 bg-cyan/10 border border-cyan/30 text-cyan px-4 py-2 rounded-lg font-bold tracking-widest text-[10px] uppercase shadow-[inset_0_0_20px_rgba(0,229,255,0.1)]">
          <Activity className="w-4 h-4 pulse-cyan" />
          Data Stream Live
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[1,2,3,4,5].map(i => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative z-10">
            <StatBox label="Total Ingestions" value={totalAnalyses} />
            <StatBox label="Avg Latency" value={`${avgLatency}ms`} color="cyan" />
            <StatBox label="Avg Burn" value={`$${avgCost.toFixed(4)}`} color="success" />
            <StatBox label="Memory Resonance" value={`${matchRate}%`} color="purple" />
            <StatBox label="Model Confidence" value={`${avgConfidence}%`} color="warning" />
          </div>

          <div className="space-y-4 relative z-10">
            <h2 className="text-[10px] font-bold text-text-muted tracking-widest uppercase flex items-center gap-2 mb-4">
              <Zap className="w-3.5 h-3.5 text-accent" /> Execution Traces
            </h2>
            
            {incidents.length === 0 ? (
              <div className="text-center py-20 card-glass rounded-xl border border-dashed border-white/10">
                <Terminal className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-xs font-mono uppercase tracking-widest text-text-muted">No telemetry captured.</p>
              </div>
            ) : (
              incidents.map((log, idx) => {
                const isFailed = log.tags?.includes('api-error') || log.tags?.includes('fallback');
                const matches = log.similarIncidents?.length || 0;
                
                const nodes = [
                  { id: 'ingest', icon: Terminal, label: 'INGEST' },
                  { id: 'mem', icon: Brain, label: 'MEMORY', meta: `${matches} hit` },
                  { id: 'prompt', icon: Network, label: 'PROMPT', meta: `${log.runtimeDecisions?.tokens || 0} tkns` },
                  { id: 'llm', icon: Cpu, label: 'MISTRAL', meta: `${log.pipelineLatency || 0}ms` },
                  { id: 'reason', icon: ShieldAlert, label: 'REASONING', meta: `${log.confidence || 0}% conf` },
                  { id: 'result', icon: isFailed ? XCircle : CheckCircle2, label: 'RESULT', meta: isFailed ? 'Failed' : 'Success' },
                  { id: 'store', icon: Save, label: 'STORE' }
                ];

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                    key={log.incidentId} 
                    className="card-glass rounded-lg p-6 relative overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-200"
                  >
                    
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
                      
                      {/* Left Meta */}
                      <div className="shrink-0 w-56 flex flex-col gap-1 border-r border-white/5 pr-4">
                        <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest">{log.runtimeDecisions?.requestId || log.incidentId.substring(0,8)}</div>
                        <div className="text-sm font-bold text-white line-clamp-1 mt-1">{log.title}</div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted mt-2">
                          <Clock className="w-3 h-3" />
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </div>

                      {/* Visual Pipeline */}
                      <div className="flex-1 flex items-center justify-between relative px-2 py-4">
                        
                        {/* Connecting Line */}
                        <div className="absolute left-6 right-6 top-[22px] h-px bg-white/10 z-0">
                           {/* Static trace line for historical logs */}
                           <div className={`absolute top-0 left-0 h-full ${isFailed ? 'bg-danger/40 w-5/6' : 'bg-success/40 w-full'}`} />
                        </div>

                        {nodes.map((node) => {
                          const Icon = node.icon;
                          const isError = node.id === 'result' && isFailed;
                          const isSkipped = isFailed && node.id === 'store';
                          const nodeColor = isError ? 'text-danger' : 
                                           isSkipped ? 'text-white/20 opacity-50' :
                                           node.id === 'store' ? 'text-success' : 
                                           node.id === 'mem' && matches > 0 ? 'text-purple-light' :
                                           'text-white/80';

                          return (
                            <div key={node.id} className="relative z-10 flex flex-col items-center gap-3 w-16">
                              <div className={`w-8 h-8 rounded-full border border-white/10 bg-black/80 flex items-center justify-center transition-colors ${nodeColor}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-center">
                                <div className={`text-[10px] font-bold tracking-widest uppercase ${isError ? 'text-danger' : isSkipped ? 'text-white/20' : 'text-text-secondary'}`}>{node.label}</div>
                                {node.meta && <div className={`text-[10px] font-mono font-bold mt-1 ${isSkipped ? 'text-white/20' : 'text-white'}`}>{node.meta}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right Meta */}
                      <div className="shrink-0 w-32 flex flex-col items-end gap-1 border-l border-white/5 pl-4">
                         <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Compute Burn</div>
                         <div className="text-base font-bold text-success font-mono mt-1">${log.runtimeDecisions?.actualCost?.toFixed(4) || '0.0000'}</div>
                         <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mt-2">Latency</div>
                         <div className="text-base font-bold text-white font-mono mt-1">{log.pipelineLatency || 0}ms</div>
                      </div>

                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
