import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Brain, Cpu, Database, AlertCircle, CheckCircle2, Upload, FileText, X, Check } from 'lucide-react';
import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyzeIncident } from '../services/api';
import { useApp } from '../context/AppContext';

export default function AnalyzeIncident() {
  const location = useLocation();
  const savedIncident = location.state?.incident;

  const [logInput, setLogInput] = useState(savedIncident?.rawLog || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(savedIncident || null);
  const [error, setError] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const [fileMeta, setFileMeta] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_TEXT_CHARS = 10000;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const VALID_EXTENSIONS = ['.log', '.txt', '.json', '.jsonl'];

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const processFile = (file) => {
    setError('');
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isValidExt = VALID_EXTENSIONS.includes(ext);
    
    if (!isValidExt) {
      setError(`Unsupported format. Please upload ${VALID_EXTENSIONS.join(', ')}`);
      return;
    }

    if (file.size === 0) {
      setError('File is empty.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large (${formatFileSize(file.size)}). Maximum is 5 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogInput(e.target.result);
      setFileMeta({ name: file.name, size: file.size });
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFileMeta(null);
    setLogInput('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    handleRemoveFile();
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
          <div 
            className={`glass-card rounded-xl p-1 border flex flex-col h-[600px] transition-colors relative overflow-hidden ${isDragging ? 'border-accent bg-accent/5' : 'border-border'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag Hover Overlay */}
            <AnimatePresence>
              {isDragging && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-bg-card/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-accent rounded-xl"
                >
                  <Upload className="w-10 h-10 text-accent mb-3 animate-bounce" />
                  <p className="text-lg font-medium text-text-primary">Drop log file here</p>
                  <p className="text-sm text-text-muted mt-1">Maximum size 5 MB</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between p-3 border-b border-border bg-bg-secondary/50 rounded-t-lg shrink-0">
              <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                <Terminal className="w-4 h-4" />
                {fileMeta ? 'File Upload Mode' : 'Raw Text Mode'}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-text-muted uppercase hidden sm:inline-block">or Drag & Drop</span>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs bg-bg-card hover:bg-border border border-border text-text-primary px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Log
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".log,.txt,.json,.jsonl" 
                  onChange={(e) => processFile(e.target.files?.[0])} 
                />
                <div className="w-px h-4 bg-border mx-1" />
                <button 
                  onClick={loadSample}
                  className="text-xs text-accent hover:text-accent-light transition-colors"
                >
                  Load Sample
                </button>
              </div>
            </div>
            
            <textarea
              value={logInput}
              onChange={(e) => {
                if (fileMeta) {
                  setFileMeta(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
                setLogInput(e.target.value);
              }}
              maxLength={fileMeta ? undefined : MAX_TEXT_CHARS}
              placeholder="Paste exception stack trace, Kibana logs, or Datadog alerts here..."
              className="flex-1 w-full bg-transparent resize-none p-4 text-sm font-mono text-text-primary focus:outline-none focus:ring-0 placeholder:text-text-muted premium-scrollbar"
            />
            
            <div className="p-3 border-t border-border bg-bg-secondary/50 rounded-b-lg flex justify-between items-center shrink-0">
              {fileMeta ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
                    <FileText className="w-3.5 h-3.5 text-text-muted" />
                    {fileMeta.name}
                    <span className="text-text-muted mx-1">|</span>
                    <span className="text-text-muted">{formatFileSize(fileMeta.size)} / 5 MB</span>
                  </div>
                  <span className="text-xs font-medium text-success ml-2 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Ready to Analyze
                  </span>
                  <button onClick={handleRemoveFile} className="ml-2 text-text-muted hover:text-danger transition-colors p-0.5 rounded-full hover:bg-danger/10">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ) : (
                <span className={`text-xs ${logInput.length >= MAX_TEXT_CHARS ? 'text-warning font-medium' : 'text-text-muted'}`}>
                  {logInput.length.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()} characters
                  {logInput.length > MAX_TEXT_CHARS ? ' (Limit exceeded)' : logInput.length === MAX_TEXT_CHARS ? ' (Limit reached)' : ''}
                </span>
              )}
              
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !logInput.trim() || (!fileMeta && logInput.length > MAX_TEXT_CHARS)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                  isAnalyzing || !logInput.trim() || (!fileMeta && logInput.length > MAX_TEXT_CHARS)
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
                    {savedIncident ? 'Re-analyze' : 'Analyze with AI'}
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-lg flex items-center gap-2 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
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
                <div className="shrink-0 p-5 border-b border-border/30 bg-bg-card/40 backdrop-blur-md z-10 flex flex-col gap-3">
                  {savedIncident && (
                    <div className="flex items-center gap-2 text-xs font-medium text-accent">
                      <Database className="w-3.5 h-3.5" />
                      <span>Viewing Saved Analysis</span>
                      <span className="text-text-muted px-1.5">•</span>
                      <span className="text-text-muted">Analyzed {new Date(savedIncident.createdAt).toLocaleDateString()} • {new Date(savedIncident.createdAt).toLocaleTimeString()}</span>
                    </div>
                  )}
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
