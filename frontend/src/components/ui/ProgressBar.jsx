import { motion } from 'framer-motion';

export default function ProgressBar({ label, value, total, color, delay = 0 }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono font-bold text-white">{value}</span>
      </div>
      <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`} 
        />
      </div>
    </div>
  );
}
