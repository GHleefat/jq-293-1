interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  format?: (v: number) => string;
  thresholds?: { warn: number; danger: number; dir?: "up" | "down" };
  color?: "auto" | "blue" | "green" | "orange";
}

export default function ProgressBar({
  label,
  value,
  max = 1,
  unit,
  format,
  thresholds,
  color = "auto",
}: ProgressBarProps) {
  const ratio = Math.max(0, Math.min(1, value / max));
  const dir: "up" | "down" = thresholds?.dir ?? "down";

  let stroke: string;
  let textClass: string;
  if (color === "auto" && thresholds) {
    if (
      dir === "down" ? value <= thresholds.danger : value >= thresholds.danger
    ) {
      stroke = "#ef4444";
      textClass = "glow-text-red";
    } else if (
      dir === "down" ? value <= thresholds.warn : value >= thresholds.warn
    ) {
      stroke = "#f59e0b";
      textClass = "glow-text-orange";
    } else {
      stroke = "#22c55e";
      textClass = "glow-text-green";
    }
  } else if (color === "blue") {
    stroke = "#3b82f6";
    textClass = "glow-text-blue";
  } else if (color === "green") {
    stroke = "#22c55e";
    textClass = "glow-text-green";
  } else {
    stroke = "#f97316";
    textClass = "glow-text-orange";
  }

  const disp = format ? format(value) : `${Math.round(ratio * 100)}%`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">{label}</div>
        <div className={`gauge-value text-sm ${textClass}`}>
          {disp}
          {unit && (
            <span className="text-slate-500 font-mono text-xs ml-1">
              {unit}
            </span>
          )}
        </div>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${ratio * 100}%`,
            background: `linear-gradient(90deg, ${stroke}dd 0%, ${stroke} 100%)`,
            color: stroke,
          }}
        />
      </div>
    </div>
  );
}
