import { ReactNode } from "react";
import { clsx } from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  highlight?: boolean;
  valueColor?: string;
  suffix?: string;
}

export function StatCard({ title, value, icon, highlight, valueColor, suffix }: StatCardProps) {
  return (
    <div className={clsx(
      "relative overflow-hidden rounded-2xl p-6 transition-all duration-500",
      "bg-card/40 backdrop-blur-md border",
      highlight ? "border-primary/50 glow-gold" : "border-primary/10 hover:border-primary/30"
    )}>
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          {title}
        </h3>
        {icon && (
          <div className={clsx("text-primary/70", highlight && "text-primary")}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-1">
        <div className={clsx(
          "text-4xl font-display font-bold tabular-nums tracking-tight",
          valueColor || (highlight ? "text-gold-gradient" : "text-foreground")
        )}>
          {value}
        </div>
        {suffix && (
          <span className="text-sm font-medium text-muted-foreground ml-1">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
