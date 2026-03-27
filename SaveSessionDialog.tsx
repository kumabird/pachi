import { useState } from "react";
import { useCreateSession } from "@/hooks/use-sessions";
import { PachinkoStats } from "@/hooks/use-pachinko";
import { X, Trophy, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

interface SaveSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PachinkoStats;
  onSuccess: () => void;
}

export function SaveSessionDialog({ isOpen, onClose, stats, onSuccess }: SaveSessionDialogProps) {
  const [playerName, setPlayerName] = useState("");
  const createSession = useCreateSession();
  const [, setLocation] = useLocation();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || createSession.isPending) return;

    try {
      await createSession.mutateAsync({
        playerName: playerName.trim(),
        ballsShot: stats.ballsShot,
        ballsWon: stats.ballsWon,
        wins: stats.wins,
      });
      onSuccess();
      setLocation("/leaderboard");
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-primary/30 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-primary/10 relative overflow-hidden"
            >
              {/* Background accent */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-muted-foreground hover:text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-display font-bold text-foreground mb-2">Save Session</h2>
                <p className="text-muted-foreground">Immortalize your results on the leaderboard.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Net Balance</p>
                  <p className="text-2xl font-display font-bold text-gold-gradient tabular-nums">
                    {stats.netBalance > 0 ? "+" : ""}{stats.netBalance}
                  </p>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Wins</p>
                  <p className="text-2xl font-display font-bold text-foreground tabular-nums">
                    {stats.wins}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Player Initials / Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={16}
                    placeholder="e.g. VIP Player"
                    className="w-full bg-black/50 border border-primary/20 rounded-xl px-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!playerName.trim() || createSession.isPending}
                  className="w-full bg-gold-gradient text-black font-bold text-lg rounded-xl py-4 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createSession.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Submit Score"
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
