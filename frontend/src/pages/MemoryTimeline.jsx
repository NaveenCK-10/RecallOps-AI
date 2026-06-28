import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Search, Clock, Database, AlertCircle, FileText, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchMemory, getMemories, getMemoryStats } from '../services/api';
import StatBox from '../components/ui/StatBox';

export default function MemoryTimeline() {
  const [memories, setMemories] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleMemoryClick = (mem) => {
    const reconstructedIncident = {
      incidentId: mem.memoryId || mem.id,
      title: mem.summary,
      rawLog: mem.content,
      severity: mem.metadata?.severity || 'medium',
      rootCause: mem.content, 
      resolution: mem.metadata?.resolution || 'No specific resolution recorded in this memory.',
      category: mem.metadata?.category || mem.type,
      createdAt: mem.createdAt,
      runtimeDecisions: {
        complexity: 'historical',
        modelName: 'Hindsight DB',
        actualLatency: 0,
        actualCost: 0
      }
    };
    navigate('/analyze', { state: { incident: reconstructedIncident } });
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async (query = '') => {
    setLoading(true);
    try {
      if (query) {
        const res = await searchMemory(query, 20);
        if (res.data.success) setMemories(res.data.data.results);
      } else {
        const [memRes, statRes] = await Promise.all([
          getMemories({ limit: 50 }),
          getMemoryStats()
        ]);
        if (memRes.data.success) setMemories(memRes.data.data.memories);
        if (statRes.data.success) setStats(statRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch memories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMemories(searchQuery);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide uppercase font-mono">Memory <span className="text-purple-light">Explorer</span></h1>
          <p className="text-text-secondary mt-1 font-mono text-sm tracking-wide">Hindsight persistent vector database visualizer.</p>
        </div>
        <div className="flex items-center gap-3 bg-purple/10 border border-purple/30 text-purple-light px-4 py-2 rounded-lg font-bold tracking-widest text-[10px] uppercase">
          <Database className="w-4 h-4" />
          {stats?.provider === 'hindsight-sdk' ? 'Vector Map Online' : 'Local Fallback'}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          <StatBox label="Total Vectors" value={stats.totalMemories} />
          <StatBox label="Anomalies" value={stats.byType?.incident || 0} />
          <StatBox label="Resolutions" value={stats.byType?.fix || 0} />
          <StatBox label="Annotations" value={stats.byType?.note || 0} />
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="relative group z-20">
        <div className={`absolute inset-0 bg-accent/10 rounded-xl blur-xl transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`relative flex items-center bg-black/40 border transition-colors duration-200 rounded-xl overflow-hidden ${isFocused ? 'border-accent' : 'border-white/10 hover:border-white/20'}`}>
          <Search className={`absolute left-5 w-5 h-5 transition-colors duration-200 ${isFocused ? 'text-accent pulse-cyan' : 'text-text-muted group-hover:text-white'}`} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Query semantic memory banks (e.g. 'OOM killer' or 'postgres connection')..."
            className="w-full bg-transparent py-4 pl-14 pr-6 text-sm font-mono text-white outline-none placeholder:text-text-muted tracking-wide"
            aria-label="Search memory bank"
          />
          {searchQuery && (
            <button 
              type="submit" 
              className="absolute right-4 flex items-center gap-2 bg-accent/10 hover:bg-accent text-accent hover:text-bg-primary border border-accent/50 hover:border-accent px-4 py-1.5 rounded uppercase text-[10px] font-bold tracking-widest transition-colors duration-200"
            >
              <Zap className="w-3.5 h-3.5" /> Execute
            </button>
          )}
        </div>
      </form>

      {/* Timeline */}
      <div className="space-y-6 relative z-10">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-40 skeleton rounded-xl" />)
        ) : memories.length === 0 ? (
          <div className="text-center py-20 card-glass rounded-xl border border-dashed border-white/10">
            <Database className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-xs font-mono uppercase tracking-widest text-text-muted">No semantic matches found.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {memories.map((mem, idx) => {
              const severity = mem.metadata?.severity || 'medium';
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  whileHover={{ y: -4 }}
                  key={mem.memoryId} 
                  onClick={() => handleMemoryClick(mem)}
                  className="card-glass rounded-xl p-6 relative cursor-pointer group hover:border-purple-light transition-all duration-200 overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-purple-light transition-colors duration-200" />

                  <div className="flex flex-col md:flex-row gap-6 relative z-10">
                    {/* Left Meta Column */}
                    <div className="shrink-0 w-48 flex flex-col gap-3 border-r border-white/5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors duration-200 ${
                          mem.type === 'incident' ? 'bg-danger/10 border-danger/30 text-danger' : 
                          mem.type === 'fix' ? 'bg-success/10 border-success/30 text-success' : 
                          'bg-cyan/10 border-cyan/30 text-cyan'
                        }`}>
                          {mem.type === 'incident' ? <AlertCircle className="w-4 h-4" /> : 
                           mem.type === 'fix' ? <CheckCircle2 className="w-4 h-4" /> : 
                           <FileText className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-white tracking-widest px-2 py-1 bg-white/5 border border-white/10 rounded-sm">
                          {mem.type}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Timestamp</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white uppercase tracking-wider">
                          <Clock className="w-3 h-3 text-white/40" />
                          {new Date(mem.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Severity</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest w-fit px-2 py-0.5 rounded border severity-${severity}`}>
                          {severity}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content Column */}
                    <div className="flex-1">
                      <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Knowledge Subject</div>
                      <h3 className="text-base font-bold text-white mb-3 tracking-wide line-clamp-1">{mem.summary}</h3>
                      
                      <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">Raw Content</div>
                      <div className="p-4 bg-black/40 rounded-lg border border-white/5 text-xs font-mono text-text-secondary leading-relaxed group-hover:border-white/10 transition-colors line-clamp-3">
                        {mem.content}
                      </div>
                    </div>
                    
                    {/* Resonance Column */}
                    {mem.similarity && (
                      <div className="shrink-0 w-32 flex flex-col items-end border-l border-white/5 pl-4">
                        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">Resonance</span>
                        <span className="text-2xl font-bold font-mono text-purple-light tracking-tight">
                          {Math.round(mem.similarity * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
