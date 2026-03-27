import { Link, useLocation } from "wouter";
import { Coins, Trophy } from "lucide-react";
import { clsx } from "clsx";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-primary/20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center shadow-lg shadow-primary/20">
            <Coins className="text-black w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gold-gradient tracking-widest uppercase">
            Aura Pachinko
          </h1>
        </div>
        
        <nav className="flex items-center gap-6">
          <Link 
            href="/" 
            className={clsx(
              "font-display font-semibold tracking-wide transition-all duration-300 hover:text-primary hover:text-glow-gold",
              location === "/" ? "text-primary text-glow-gold" : "text-muted-foreground"
            )}
          >
            Simulator
          </Link>
          <Link 
            href="/leaderboard" 
            className={clsx(
              "flex items-center gap-2 font-display font-semibold tracking-wide transition-all duration-300 hover:text-primary hover:text-glow-gold",
              location === "/leaderboard" ? "text-primary text-glow-gold" : "text-muted-foreground"
            )}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
