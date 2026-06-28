import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Brain, Cpu, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { analyzeIncident } from '../services/api';
import { useApp } from '../context/AppContext';

export default function AnalyzeIncident() {
  const [logInput, setLogInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!logInput.trim()) {
      setError('Please enter a production log to analyze.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setResult(null);

    try {
      const res = await analyzeIncident(logInput);
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setError(res.data.error || 'Failed to analyze incident.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSample = () => {
    setLogInput(`2024-03-15T14:23:45.123Z ERROR [db-pool] PostgreSQL connection pool exhausted
Max connections: 100/100 active, 0 idle
FATAL: too many connections for role "app_user"
  at Pool.connect (/app/node_modules/pg-pool/index.js:45:11)
  at async OrderService.getOrders (/app/services/order.js:127:20)`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Incident Analyzer</h1>
        <p className="text-text-secondary mt-1">Paste raw production logs, alerts, or stack traces for autonomous root cause analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-1 border border-border flex flex-col h-[500px]">
            <div className="flex items-center justify-between p-3 border-b border-border bg-bg-secondary/50 rounded-t-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                <Terminal className="w-4 h-4" />
                Raw Input
              </div>
              <button 
                onClick={loadSample}
                className="text-xs text-accent hover:text-accent-light transition-colors"
              >
                Load Sample
              </button>
            </div>
            <textarea
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder="Paste exception stack trace, Kibana logs, or Datadog alerts here..."
              className="flex-1 w-full bg-transparent resize-none p-4 text-sm font-mono text-text-primary focus:outline-none focus:ring-0 placeholder:text-text-muted"
            />
            <div className="p-3 border-t border-border bg-bg-secondary/50 rounded-b-lg flex justify-between items-center">
              <span className="text-xs text-text-muted">{logInput.length} characters</span>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !logInput.trim()}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  isAnalyzing || !logInput.trim() 
                    ? 'bg-border text-text-muted cursor-not-allowed' 
                    : 'bg-accent hover:bg-accent-light text-white glow-accent'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Analyzing Pipeline...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="h-[500px]">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full glass-card rounded-xl border border-border p-8 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-border border-t-accent animate-spin" />
                  <Cpu className="w-6 h-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-text-primary">Pipeline Active</h3>
                  <div className="flex flex-col gap-2 text-sm text-text-secondary text-left w-64 mx-auto">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> 1. Querying Hindsight Memory</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" /> 2. CascadeFlow Complexity Routing</div>
                    <div className="flex items-center gap-2 text-text-muted"><div className="w-4 h-4" /> 3. NVIDIA LLM Inference</div>
                    <div className="flex items-center gap-2 text-text-muted"><div className="w-4 h-4" /> 4. Storing to Persistent Memory</div>
                  </div>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[75vh] min-h-[500px] max-h-[800px] flex flex-col glass-card rounded-xl border border-border overflow-hidden"
              >
                {/* Fixed Header */}
                <div className={`shrink-0 h-1.5 bg-gradient-to-r ${
                  result.severity === 'critical' ? 'from-danger to-danger/50' : 
                  result.severity === 'high' ? 'from-warning to-warning/50' : 
                  'from-success to-success/50'
                }`} />
                <div className="shrink-0 p-5 border-b border-border/30 bg-bg-card/40 backdrop-blur-md z-10">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-bold text-text-primary leading-tight">{result.title}</h2>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full shrink-0 severity-${result.severity}`}>
                      {result.severity}
                    </span>
                  </div>
                </div>
                
                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto premium-scrollbar p-5 space-y-8">
                  
                  {/* Root Cause & Resolution */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Root Cause</h4>
                      <p className="text-sm text-text-primary leading-relaxed">{result.rootCause}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Recommended Resolution</h4>
                      <div className="p-4 bg-bg-secondary rounded-lg border border-border whitespace-pre-wrap text-sm text-text-primary font-mono leading-relaxed overflow-x-auto premium-scrollbar">
                        {result.resolution}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border/40 w-full" />

                  {/* Runtime & Memory Intel */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Memory Context */}
                    <div className="bg-bg-secondary/50 rounded-xl border border-border/50 p-4">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                        <Brain className="w-4 h-4 text-purple" />
                        Hindsight Context
                      </h4>
                      {result.similarIncidents?.length > 0 ? (
                        <div className="space-y-3">
                          <div className="text-xs text-text-secondary">Found {result.similarIncidents.length} similar prior incidents. Model context augmented.</div>
                          <div className="p-3 bg-purple/10 border border-purple/20 rounded-lg text-xs">
                            <span className="font-medium text-purple-400 block mb-1">Top Match: {Math.round(result.similarIncidents[0].similarity * 100)}%</span>
                            <span className="text-text-primary line-clamp-2">{result.similarIncidents[0].title}</span>
                            <span className="text-text-muted mt-1 block">{result.similarIncidents[0].resolution.substring(0,80)}...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-text-muted">No similar prior incidents found. This is a novel issue.</div>
                      )}
                    </div>

                    {/* CascadeFlow Routing */}
                    <div className="bg-bg-secondary/50 rounded-xl border border-border/50 p-4">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                        <Cpu className="w-4 h-4 text-cyan" />
                        CascadeFlow Decision
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex justify-between text-xs border-b border-border/30 pb-2">
                          <span className="text-text-muted">Complexity:</span>
                          <span className="font-medium text-text-primary capitalize">{result.runtimeDecisions?.complexity}</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-border/30 pb-2">
                          <span className="text-text-muted">Routed Model:</span>
                          <span className="font-medium text-accent-light">{result.runtimeDecisions?.modelName}</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-border/30 pb-2">
                          <span className="text-text-muted">Latency:</span>
                          <span className="font-medium text-text-primary">{result.runtimeDecisions?.actualLatency}ms</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">Est. Cost:</span>
                          <span className="font-medium text-success">${result.runtimeDecisions?.actualCost}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </motion.div>
            ) : (
              <div className="h-full glass-card rounded-xl border border-border border-dashed flex flex-col items-center justify-center text-text-muted p-8 text-center">
                <Database className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">Awaiting incident log input.</p>
                <p className="text-xs mt-2 opacity-70 max-w-xs">The analysis pipeline will check persistent memory, route to the optimal model, and store the resolution for future reference.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
