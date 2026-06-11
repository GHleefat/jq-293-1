import { useMemo } from "react";

interface GaugeProps {
  label: string;
  value: number;
  unit?: string;
  format?: (v: number) => string;
  min?: number;
  max?: number;
  colorMode?: "blue" | "orange" | "red" | "green" | "auto";
  thresholds?:
    | { warn: number; danger: number }
    | { warn: number; danger: number; dir?: "up" | "down" };
  history?: number[];
}

export default function Gauge({
  label,
  value,
  unit,
  format,
  min = 0,
  max = 100,
  colorMode = "blue",
  thresholds,
  history,
}: GaugeProps) {
  const display = format ? format(value) : value.toFixed(2);

  const mode = useMemo<GaugeProps["colorMode"]>(() => {
    if (colorMode !== "auto" || !thresholds) return colorMode;
    const dir: "up" | "down" = (thresholds as any).dir ?? "up";
    if (dir === "up") {
      if (value >= thresholds.danger) return "red";
      if (value >= thresholds.warn) return "orange";
      return "green";
    } else {
      if (value <= thresholds.danger) return "red";
      if (value <= thresholds.warn) return "orange";
      return "green";
    }
  }, [colorMode, value, thresholds]);

  const colorClass =
    mode === "red"
      ? "glow-text-red"
      : mode === "orange"
        ? "glow-text-orange"
        : mode === "green"
          ? "glow-text-green"
          : "glow-text-blue";

  const stroke =
    mode === "red"
      ? "#ef4444"
      : mode === "orange"
        ? "#f97316"
        : mode === "green"
          ? "#22c55e"
          : "#3b82f6";

  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 px-3 py-3 flex flex-col gap-2 relative overflow-hidden">
      <div className="absolute inset-0 shimmer opacity-25 pointer-events-none" />
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </div>
        {history && history.length > 2 && (
          <Sparkline data={history} stroke={stroke} />
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`gauge-value text-[22px] leading-none ${colorClass}`}>
          {display}
        </span>
        {unit && (
          <span className="text-xs text-slate-400 font-mono">{unit}</span>
        )}
      </div>
      <div className="h-1 w-full rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${ratio * 100}%`,
            background: stroke,
            boxShadow: `0 0 10px ${stroke}`,
          }}
        />
      </div>
    </div>
  );
}

function Sparkline({ data, stroke }: { data: number[]; stroke: string }) {
  const w = 68;
  const h = 26;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(0.001, max - min);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const id = `sp-${stroke.replace("#", "")}-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <svg width={w} height={h} className="mini-spark" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={`url(#${id})`}
        stroke="none"
      />
    </svg>
  );
}
