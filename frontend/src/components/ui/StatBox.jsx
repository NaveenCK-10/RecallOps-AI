import { motion } from 'framer-motion';

export default function StatBox({ label, value, color }) {
  const getColorClass = () => {
    switch(color) {
      case 'cyan': return 'text-cyan';
      case 'purple': return 'text-purple-light';
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      default: return 'text-white';
    }
  };

  return (
    <div className="card-glass p-6 rounded-xl border border-white/5 flex flex-col justify-center relative overflow-hidden group hover:border-white/20 transition-colors duration-250">
      <div className="relative z-10">
        <div className="text-[10px] uppercase font-bold text-text-muted tracking-widest mb-2">{label}</div>
        <motion.div 
          key={value}
          initial={{ opacity: 0.5, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className={`text-2xl font-bold font-mono ${getColorClass()}`}
        >
          {value}
        </motion.div>
      </div>
    </div>
  );
}
