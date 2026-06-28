import { useEffect, useState } from 'react';
import { Brain, Search, Clock, Tag, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchMemory, getMemories, getMemoryStats } from '../services/api';

export default function MemoryTimeline() {
  const [memories, setMemories] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Hindsight Memory</h1>
          <p className="text-text-secondary mt-1">Persistent vector database of past incidents, resolutions, and engineering context.</p>
        </div>
        <div className="flex items-center gap-2 bg-purple/10 border border-purple/20 text-purple-400 px-3 py-1.5 rounded-lg text-sm font-medium">
          <Database className="w-4 h-4" />
          {stats?.provider === 'hindsight-sdk' ? 'Vector DB Connected' : 'Local Fallback Mode'}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl border border-border">
            <div className="text-xs text-text-muted mb-1">Total Memories</div>
            <div className="text-2xl font-bold text-text-primary">{stats.totalMemories}</div>
          </div>
          <div className="glass-card p-4 rounded-xl border border-border">
            <div className="text-xs text-text-muted mb-1">Incidents</div>
            <div className="text-2xl font-bold text-text-primary">{stats.byType?.incident || 0}</div>
          </div>
          <div className="glass-card p-4 rounded-xl border border-border">
            <div className="text-xs text-text-muted mb-1">Fixes & PRs</div>
            <div className="text-2xl font-bold text-text-primary">{stats.byType?.fix || 0}</div>
          </div>
          <div className="glass-card p-4 rounded-xl border border-border">
            <div className="text-xs text-text-muted mb-1">Notes</div>
            <div className="text-2xl font-bold text-text-primary">{stats.byType?.note || 0}</div>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Semantic search across all past incidents and resolutions (e.g., 'database connection limits')..."
          className="w-full bg-bg-card border border-border focus:border-purple/50 focus:ring-1 focus:ring-purple/50 rounded-xl py-3 pl-12 pr-4 text-text-primary outline-none transition-all"
        />
        <button type="submit" className="hidden" />
      </form>

      {/* Timeline */}
      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 skeleton rounded-xl" />)
        ) : memories.length === 0 ? (
          <div className="text-center py-12 text-text-muted glass-card rounded-xl">
            No memories found matching your search.
          </div>
        ) : (
          memories.map((mem, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={mem.memoryId} 
              className="glass-card rounded-xl p-5 border border-border flex gap-4"
            >
              <div className="flex flex-col items-center gap-2 mt-1 shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  mem.type === 'incident' ? 'bg-danger/10 text-danger' : 
                  mem.type === 'fix' ? 'bg-success/10 text-success' : 
                  'bg-cyan/10 text-cyan'
                }`}>
                  {mem.type === 'incident' ? <AlertCircle className="w-5 h-5" /> : 
                   mem.type === 'fix' ? <CheckCircle2 className="w-5 h-5" /> : 
                   <FileText className="w-5 h-5" />}
                </div>
                {idx !== memories.length - 1 && <div className="w-px h-full bg-border" />}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-text-muted px-2 py-0.5 bg-bg-secondary rounded border border-border">
                    {mem.type}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    {new Date(mem.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-text-primary mb-2">{mem.summary}</h3>
                
                <div className="p-3 bg-bg-secondary rounded-lg border border-border text-sm text-text-secondary leading-relaxed mb-4">
                  {mem.content}
                </div>
                
                {mem.similarity && (
                  <div className="mb-3 flex items-center gap-2 text-xs">
                    <span className="text-purple-400 font-medium bg-purple/10 px-2 py-0.5 rounded border border-purple/20">
                      Match Score: {Math.round(mem.similarity * 100)}%
                    </span>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-text-muted" />
                  {mem.tags?.map(tag => (
                    <span key={tag} className="text-xs text-text-muted px-2 py-0.5 bg-white/[0.03] rounded-full border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// Need some extra icons
import { Database, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
