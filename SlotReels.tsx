import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

const REEL_SYMBOLS = ["🍒", "🍋", "🔔", "🍉", "7️⃣", "⭐", "💎", "🎰"];

interface Props {
  isSpinning: boolean;
  currentSymbols: string[];
}

export const SlotReels = memo(function SlotReels({ isSpinning, currentSymbols }: Props) {
  const [tick, setTick] = useState(0);

  // Local ticker — only this component re-renders at 120ms
  useEffect(() => {
    if (!isSpinning) return;
    const t = setInterval(() => setTick((n) => n + 1), 120);
    return () => clearInterval(t);
  }, [isSpinning]);

  return (
    <div className="glass-panel rounded-3xl p-5 flex flex-col items-center relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
      <p className="text-[10px] font-display tracking-widest text-primary/50 uppercase mb-3">Slot Reels</p>

      <div className="flex gap-3 w-full justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={clsx(
              "w-24 h-24 md:w-28 md:h-28 rounded-xl border flex items-center justify-center overflow-hidden relative",
              isSpinning ? "border-primary/70 bg-primary/10" : "border-primary/20 bg-black/40"
            )}
            style={isSpinning ? { boxShadow: "0 0 16px rgba(212,175,55,0.35)" } : undefined}
          >
            {isSpinning ? (
              <span
                key={tick + i * 97}
                className="text-4xl select-none"
                style={{ filter: "blur(0.4px)" }}
              >
                {REEL_SYMBOLS[(tick + i * 3) % REEL_SYMBOLS.length]}
              </span>
            ) : (
              <motion.span
                key={`s-${currentSymbols[i]}-${i}`}
                initial={{ scale: 0.5, opacity: 0, y: -16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1, type: "spring", stiffness: 220 }}
                className="text-4xl select-none"
              >
                {currentSymbols[i]}
              </motion.span>
            )}

            {isSpinning && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "repeating-linear-gradient(transparent,transparent 9px,rgba(212,175,55,0.06) 9px,rgba(212,175,55,0.06) 10px)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {isSpinning && (
        <motion.p
          className="mt-3 text-xs font-display tracking-widest text-primary uppercase"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity }}
        >
          Spinning...
        </motion.p>
      )}
    </div>
  );
});
