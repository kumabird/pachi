import { LogEntry } from "@/hooks/use-pachinko";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { Target, Zap, CircleDollarSign } from "lucide-react";

interface EventLogProps {
  logs: LogEntry[];
}

export function EventLog({ logs }: EventLogProps) {
  return (
    <div className="h-full flex flex-col glass-panel rounded-3xl overflow-hidden relative">
      <div className="p-5 border-b border-primary/10 bg-black/40 backdrop-blur-xl z-10">
        <h3 className="font-display font-bold text-lg text-primary tracking-widest flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Machine Feed
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 no-scrollbar flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={clsx(
                "p-4 rounded-xl border flex items-center justify-between gap-4",
                log.type === "win" && "bg-primary/10 border-primary/40 text-glow-gold",
                log.type === "rush" && "bg-red-500/10 border-red-500/40 text-glow-red text-red-400",
                log.type === "chucker" && "bg-white/5 border-white/10 text-gray-300",
                log.type === "info" && "bg-transparent border-transparent text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                {log.type === "win" && <CircleDollarSign className="w-5 h-5 text-primary" />}
                {log.type === "rush" && <Zap className="w-5 h-5 text-red-400" />}
                {log.type === "chucker" && <Target className="w-5 h-5 text-gray-400" />}
                <span className={clsx(
                  "font-medium",
                  log.type === "win" && "text-primary font-bold tracking-wide",
                  log.type === "rush" && "font-bold tracking-wider"
                )}>
                  {log.message}
                </span>
              </div>
              
              {log.amount && (
                <span className={clsx(
                  "font-display font-bold tabular-nums text-lg",
                  log.type === "win" && "text-primary",
                  log.type === "rush" && "text-red-400"
                )}>
                  +{log.amount}
                </span>
              )}
              
              <span className="text-xs opacity-40 ml-auto tabular-nums">
                {log.timestamp.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit', fractionalSecondDigits: 1 })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {logs.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground/50 font-medium">
            Waiting for action...
          </div>
        )}
      </div>
      
      {/* Bottom fade out gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
    </div>
  );
}
