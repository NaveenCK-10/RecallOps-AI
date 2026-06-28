import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Brain, Cpu, Database, AlertCircle, CheckCircle2, Upload, FileText, X, Check, Activity, ShieldAlert, FileSearch, Filter, Network, RefreshCcw, Save } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { analyzeIncident } from '../services/api';
import { getSeverityTheme } from '../config/severityTheme';

export default function AnalyzeIncident() {
  const location = useLocation();
  const savedIncident = location.state?.incident;

  const [logInput, setLogInput] = useState(savedIncident?.rawLog || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(0);
  const [result, setResult] = useState(savedIncident || null);
  const [error, setError] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const [fileMeta, setFileMeta] = useState(null);
  const fileInputRef = useRef(null);

  // Derived: resolve severity theme whenever result changes
  const severityTheme = result ? getSeverityTheme(result.severity, result.tags) : null;
  const needsWideBackground = severityTheme ? ['severity-shimmer', 'severity-sweep'].includes(severityTheme.animation) : false;

  const MAX_TEXT_CHARS = 10000;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const VALID_EXTENSIONS = ['.log', '.txt', '.json', '.jsonl'];

  const stages = [
    { label: 'Upload Local File', icon: Upload },
    { label: 'Parsing Log Stream', icon: Terminal },
    { label: 'Data Preprocessing', icon: Filter },
    { label: 'Memory Retrieval', icon: Brain },
    { label: 'Context Building', icon: Network },
    { label: 'CascadeFlow Routing', icon: Cpu },
    { label: 'Mistral Nemotron', icon: Activity },
    { label: 'AI Reasoning', icon: ShieldAlert },
    { label: 'Generating Resolution', icon: RefreshCcw },
    { label: 'Saving Memory', icon: Save },
    { label: 'Analysis Completed', icon: CheckCircle2 }
  ];

  // Pipeline simulation effect - intelligent stalling
  useEffect(() => {
    let timeout;
    if (isAnalyzing && pipelineStage < stages.length) {
      if (pipelineStage === 6 || pipelineStage === 7) {
        timeout = setTimeout(() => {
           if (pipelineStage === 6) setPipelineStage(7);
        }, 1500);
      } else {
        timeout = setTimeout(() => {
          setPipelineStage(prev => prev + 1);
        }, 200);
      }
    }
    return () => clearTimeout(timeout);
  }, [isAnalyzing, pipelineStage, stages.length]);

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
    setPipelineStage(fileMeta ? 0 : 1); // skip upload stage if raw text
    setResult(null);

    try {
      const res = await analyzeIncident(logInput);
      if (res.data.success) {
        setPipelineStage(8); 
        setTimeout(() => setPipelineStage(9), 150);
        setTimeout(() => setPipelineStage(10), 300);
        
        setTimeout(() => {
          setResult(res.data.data);
          setIsAnalyzing(false);
        }, 600);
      } else {
        setError(res.data.error || 'Failed to analyze incident.');
        setIsAnalyzing(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred during analysis.');
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
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-wide uppercase font-mono">Incident <span className="text-accent">Analyzer</span></h1>
        <p className="text-text-secondary mt-1 font-mono text-sm tracking-wide">Autonomous root cause isolation & memory synthesis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6 flex flex-col h-[750px]">
          <div 
            className={`flex-1 card-primary rounded-xl p-1 flex flex-col transition-all duration-200 relative overflow-hidden ${isDragging ? 'border-accent bg-accent/5 glow-accent' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag Hover Overlay */}
            <AnimatePresence>
              {isDragging && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-50 bg-bg-primary/90 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-accent rounded-xl"
                >
                  <Upload className="w-12 h-12 text-accent mb-4 pulse-cyan" />
                  <p className="text-xl font-bold text-white tracking-widest uppercase font-mono">Uplink Log File</p>
                  <p className="text-xs font-mono text-text-muted mt-2">Capacity: 5 MB limit</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20 shrink-0">
              <div className="flex items-center gap-3 text-[10px] font-bold text-white tracking-widest uppercase font-mono">
                <Terminal className="w-4 h-4 text-accent" />
                {fileMeta ? 'File Mode' : 'Raw Stream Mode'}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-text-muted font-mono uppercase hidden sm:inline-block">or Drag & Drop</span>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload log file"
                  className="text-[10px] font-bold uppercase tracking-widest bg-black/40 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
                >
                  <Upload className="w-3 h-3" />
                  Upload
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".log,.txt,.json,.jsonl" 
                  onChange={(e) => processFile(e.target.files?.[0])} 
                  aria-label="Hidden file input"
                />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button 
                  onClick={loadSample}
                  aria-label="Load sample log"
                  className="text-[10px] font-bold uppercase tracking-widest text-accent hover:text-white transition-colors"
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
              aria-label="Log Input Area"
              placeholder="Inject raw production logs, stack traces, or exception dumps here..."
              className="flex-1 w-full bg-black/40 resize-none p-6 text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 placeholder:text-text-muted premium-scrollbar border-none leading-relaxed"
            />
            
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center shrink-0">
              {fileMeta ? (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-success/10 border border-success/20 px-4 py-2 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white tracking-widest">
                    <FileText className="w-3.5 h-3.5 text-success" />
                    {fileMeta.name}
                    <span className="text-text-muted mx-1">|</span>
                    <span className="text-text-muted">{formatFileSize(fileMeta.size)} / 5 MB</span>
                  </div>
                  <span className="text-[10px] font-bold text-success ml-2 flex items-center gap-1.5 uppercase tracking-widest">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                  <button onClick={handleRemoveFile} aria-label="Remove file" className="ml-2 text-white/50 hover:text-danger transition-colors p-1 rounded-full hover:bg-danger/20">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ) : (
                <span className={`text-[10px] font-mono tracking-widest uppercase ${logInput.length >= MAX_TEXT_CHARS ? 'text-warning font-bold' : 'text-text-muted'}`}>
                  {logInput.length.toLocaleString()} / {MAX_TEXT_CHARS.toLocaleString()} chars
                </span>
              )}
              
              <motion.button
                whileHover={{ scale: isAnalyzing || !logInput.trim() || (!fileMeta && logInput.length > MAX_TEXT_CHARS) ? 1 : 1.02 }}
                whileTap={{ scale: isAnalyzing || !logInput.trim() || (!fileMeta && logInput.length > MAX_TEXT_CHARS) ? 1 : 0.98 }}
                onClick={handleAnalyze}
                disabled={isAnalyzing || !logInput.trim() || (!fileMeta && logInput.length > MAX_TEXT_CHARS)}
                aria-label={savedIncident ? 'Re-execute Analysis' : 'Initiate Analysis'}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-colors duration-200 ${
                  isAnalyzing || !logInput.trim() || (!fileMeta && logInput.length > MAX_TEXT_CHARS)
                    ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10' 
                    : 'bg-accent/10 hover:bg-accent text-accent hover:text-bg-primary border border-accent/50 hover:border-accent glow-accent'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    {savedIncident ? 'Re-execute' : 'Initiate Analysis'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-danger/10 border border-danger/30 text-danger rounded-lg flex items-center gap-3 text-xs font-mono uppercase tracking-widest font-bold"
            >
              <AlertCircle className="w-4 h-4 shrink-0 pulse-red" />
              {error}
            </motion.div>
          )}
        </div>

        {/* Results / Execution Section */}
        <div className="h-[750px]">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full card-raised rounded-xl p-8 flex flex-col relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-neural-grid opacity-10" />
                <div className="relative z-10 flex flex-col h-full justify-center max-w-sm mx-auto w-full">
                  
                  {/* Rotating AI Core Visual */}
                  <div className="flex items-center justify-center mb-16 relative">
                    <div className="absolute inset-0 bg-accent/5 rounded-full blur-[40px]" />
                    <div className="w-20 h-20 rounded-full border border-accent/20 flex items-center justify-center relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                        className="absolute inset-[-1px] rounded-full border-t border-r border-accent" 
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                        className="absolute inset-2 rounded-full border-b border-l border-purple-light" 
                      />
                      <Cpu className="w-6 h-6 text-white pulse-cyan" />
                    </div>
                  </div>

                  {/* Execution Timeline */}
                  <div className="space-y-0 relative pl-4">
                    {/* Continuous vertical line */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-px bg-white/5" />
                    
                    {/* Animated vertical progress line */}
                    <div className="absolute left-[27px] top-4 w-px bg-accent glow-accent transition-all duration-300 ease-out" style={{ height: `${(pipelineStage / (stages.length - 1)) * 100}%`, maxHeight: 'calc(100% - 32px)' }} />

                    {stages.map((stage, idx) => {
                      const isActive = idx === pipelineStage;
                      const isComplete = idx < pipelineStage;
                      const StageIcon = stage.icon;

                      return (
                        <div key={idx} className="flex items-center gap-5 py-2.5 relative">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border z-10 bg-bg-secondary transition-colors duration-200 ${
                            isComplete ? 'border-accent text-accent' : 
                            isActive ? 'border-purple text-purple pulse-purple' : 
                            'border-white/10 text-white/20'
                          }`}>
                            {isComplete ? <Check className="w-3 h-3" /> : <StageIcon className="w-3 h-3" />}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors duration-200 ${
                              isComplete ? 'text-white' : 
                              isActive ? 'text-purple-light font-bold glow-purple' : 
                              'text-text-muted'
                            }`}>
                              {stage.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="h-[750px] flex flex-col card-raised rounded-xl overflow-hidden relative"
                style={{ borderColor: `${severityTheme.primary}15` }}
              >
                {/* ── Dynamic Severity Accent Bar ── */}
                <div
                  className="shrink-0 severity-accent relative"
                  style={{
                    height: severityTheme.accentHeight,
                    background: needsWideBackground
                      ? `linear-gradient(90deg, ${severityTheme.from}, ${severityTheme.to}, ${severityTheme.from})`
                      : severityTheme.gradient,
                    backgroundSize: needsWideBackground ? '200% 100%' : 'auto',
                    animationName: severityTheme.animation,
                    animationDuration: severityTheme.animationDuration,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    boxShadow: `0 1px 12px ${severityTheme.glowColor}, 0 0 24px ${severityTheme.glowColor}`,
                  }}
                />

                {/* Fixed Header */}
                <div className="shrink-0 p-6 border-b border-white/5 bg-black/40 backdrop-blur-md z-10 flex flex-col gap-4">
                  {savedIncident && (
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-accent uppercase tracking-widest">
                      <Database className="w-3 h-3" />
                      <span>Persistent Record Loaded</span>
                      <span className="text-white/20 px-1">•</span>
                      <span className="text-white/50">{new Date(savedIncident.createdAt).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-6">
                    <h2 className="text-xl font-bold text-white leading-tight">{result.title}</h2>
                    <span
                      className="text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-sm shrink-0 transition-all duration-300"
                      style={{
                        background: severityTheme.badgeBg,
                        color: severityTheme.badgeText,
                        border: `1px solid ${severityTheme.badgeBorder}`,
                        textShadow: `0 0 6px ${severityTheme.glowColor}`,
                      }}
                    >
                      {result.severity}
                    </span>
                  </div>
                </div>
                
                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto premium-scrollbar p-6 space-y-8 bg-black/10">
                  
                  {/* Root Cause */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5" /> Assessment
                    </h4>
                    <p className="text-sm text-text-primary leading-relaxed font-mono bg-black/40 p-5 rounded-lg border border-white/5">{result.rootCause}</p>
                  </div>
                  
                  {/* Resolution */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolution Protocol
                    </h4>
                    <div className="p-5 bg-black/40 rounded-lg border border-white/5 whitespace-pre-wrap text-sm text-[#c9d1d9] font-mono leading-relaxed overflow-x-auto premium-scrollbar">
                      {result.resolution}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/5 w-full" />

                  {/* Intel Cards */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Hindsight */}
                    <div className="card-glass rounded-xl p-5 hover:border-purple/30 transition-colors duration-200 group">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest mb-4">
                        <Brain className="w-3.5 h-3.5 text-purple-light" />
                        Hindsight Vector Map
                      </h4>
                      {result.similarIncidents?.length > 0 ? (
                        <div className="space-y-4">
                          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Retrieved {result.similarIncidents.length} temporal matches.</div>
                          <div className="p-4 bg-black/40 border border-white/5 rounded-lg relative overflow-hidden group-hover:border-purple/20 transition-colors">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-light" />
                            <span className="font-mono font-bold text-[10px] text-purple-light uppercase tracking-widest block mb-2">Match: {Math.round(result.similarIncidents[0].similarity * 100)}%</span>
                            <span className="text-xs text-white line-clamp-1">{result.similarIncidents[0].title}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mt-4">No historical matches. Novel anomaly detected.</div>
                      )}
                    </div>

                    {/* CascadeFlow Routing */}
                    <div className="card-glass rounded-xl p-5 hover:border-cyan/30 transition-colors duration-200 group">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest mb-4">
                        <Cpu className="w-3.5 h-3.5 text-cyan" />
                        CascadeFlow Metrics
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-mono border-b border-white/5 pb-2">
                          <span className="text-text-muted uppercase tracking-widest">Complexity Tier:</span>
                          <span className="font-bold text-white capitalize tracking-widest">{result.runtimeDecisions?.complexity || 'Standard'}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono border-b border-white/5 pb-2">
                          <span className="text-text-muted uppercase tracking-widest">Active Model:</span>
                          <span className="font-bold text-accent tracking-widest">{result.runtimeDecisions?.modelName || 'Mistral Nemotron'}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono border-b border-white/5 pb-2">
                          <span className="text-text-muted uppercase tracking-widest">Roundtrip:</span>
                          <span className="font-bold text-white tracking-widest">{result.runtimeDecisions?.actualLatency || 0}ms</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-text-muted uppercase tracking-widest">Token Cost:</span>
                          <span className="font-bold text-success tracking-widest">${result.runtimeDecisions?.actualCost || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full card-glass rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center text-text-muted p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-neural-grid opacity-10" />
                <Database className="w-12 h-12 mb-6 opacity-20" />
                <p className="text-xs font-bold tracking-widest uppercase text-white/40">Awaiting Telemetry</p>
                <p className="text-[10px] font-mono mt-3 opacity-40 max-w-sm leading-relaxed uppercase tracking-widest">
                  Pipeline dormant. Inject log data to activate Hindsight retrieval and multi-model routing.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
