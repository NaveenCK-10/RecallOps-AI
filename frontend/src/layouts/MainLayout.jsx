import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Search, Brain, Cpu, BarChart3, Menu, X, Zap, Database, Activity
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/analyze', icon: Search, label: 'Analyze Incident' },
  { path: '/memory', icon: Brain, label: 'Memory Explorer' },
  { path: '/runtime', icon: Cpu, label: 'Runtime Intel' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const bootSteps = [
  "Initializing Runtime",
  "Connecting NVIDIA",
  "Loading Hindsight Memory",
  "Starting CascadeFlow Runtime",
  "Building AI Context",
  "System Online"
];

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [isBooting, setIsBooting] = useState(false);
  const [bootStep, setBootStep] = useState(0);

  useEffect(() => {
    // Only run once per session
    if (!sessionStorage.getItem('recallops_booted')) {
      setIsBooting(true);
      sessionStorage.setItem('recallops_booted', 'true');
    }
  }, []);

  useEffect(() => {
    if (!isBooting) return;
    
    // Max duration 2.5s total across 6 steps = ~400ms per step
    const interval = setInterval(() => {
      setBootStep(prev => {
        if (prev >= bootSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => setIsBooting(false), 400); // fade out delay
          return prev;
        }
        return prev + 1;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [isBooting]);

  const handleSkipBoot = () => {
    setIsBooting(false);
  };

  // Keyboard skip
  useEffect(() => {
    const handleKeyDown = () => {
      if (isBooting) setIsBooting(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBooting]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-bg-primary bg-neural-grid font-sans text-text-primary">
      
      {/* Noise and Scanline overlay */}
      <div className="noise-overlay" />
      <div className="scanline" />

      {/* Boot Sequence Overlay */}
      <AnimatePresence>
        {isBooting && (
          <motion.div 
            className="fixed inset-0 z-[100] bg-bg-primary flex flex-col items-center justify-center overflow-hidden cursor-pointer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
            onClick={handleSkipBoot}
          >
            <motion.div 
              className="absolute top-0 left-0 w-full h-[2px] bg-accent opacity-30 shadow-[0_0_10px_rgba(0,229,255,0.5)]"
              initial={{ y: -10 }}
              animate={{ y: "100vh" }}
              transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
            />
            
            <div className="flex flex-col items-start gap-4 max-w-md w-full px-8">
              <div className="flex items-center gap-4 mb-4">
                <Zap className="w-8 h-8 text-accent pulse-cyan" />
                <h1 className="text-2xl font-bold tracking-[0.2em] text-white">RECALLOPS <span className="text-accent">AI</span></h1>
              </div>
              
              <div className="space-y-2 w-full font-mono text-xs">
                {bootSteps.map((step, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: bootStep >= idx ? 1 : 0, x: bootStep >= idx ? 0 : -10 }}
                    className={`flex items-center gap-3 ${idx === bootSteps.length - 1 ? 'text-success font-bold' : 'text-text-muted'}`}
                  >
                    <span className="w-4">{bootStep > idx ? '✓' : bootStep === idx ? '>' : ''}</span>
                    <span className="uppercase tracking-widest">{step}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 text-[9px] text-text-muted uppercase tracking-widest animate-pulse opacity-50">
                Press any key or click to skip
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col card-glass border-r border-border transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border bg-black/20 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center glow-accent">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider">RecallOps</h1>
            <p className="text-[9px] text-accent font-mono tracking-widest uppercase opacity-80">Void Signal X++</p>
          </div>
          <button className="ml-auto lg:hidden text-text-secondary" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto premium-scrollbar relative z-10">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className="relative block"
              >
                <motion.div 
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? 'text-accent bg-accent/5 glow-accent'
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-accent rounded-r-full" />
                  )}
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'pulse-cyan text-accent' : ''}`} />
                  <span className="tracking-wide">{label}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-4 py-6 border-t border-border bg-black/10 shrink-0">
          <div className="card-primary p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors duration-200 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-light" />
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Hindsight DB</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-success pulse-green" />
            </div>
            <p className="text-[9px] font-mono text-text-secondary leading-relaxed relative z-10">
              Persistent memory initialized. Context retention active.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between h-16 px-4 lg:px-6 border-b border-border card-glass shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden mr-2 text-text-secondary hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-1 h-4 bg-accent rounded-full glow-accent hidden lg:block" />
            <span className="text-xs font-bold tracking-widest uppercase text-white hidden lg:block">
              {navItems.find(n => location.pathname === n.path || (n.path !== '/' && location.pathname.startsWith(n.path)))?.label || 'Mission Control'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-purple/20 bg-purple/5">
              <Activity className="w-3 h-3 text-purple-light pulse-purple" />
              <span className="text-[9px] font-mono font-bold text-purple-light tracking-widest uppercase">Pipeline Active</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-success/20 bg-success/5">
              <div className="w-1.5 h-1.5 rounded-full bg-success pulse-green" />
              <span className="text-[9px] font-mono font-bold text-success tracking-widest uppercase">System Online</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto premium-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
