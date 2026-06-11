import type { Material } from "../data/materials";

interface MaterialCardProps {
  material: Material;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const TYPE_BADGE: Record<
  Material["type"],
  { label: string; cls: string; icon: string }
> = {
  ablative: { label: "烧蚀型", cls: "warn", icon: "🔥" },
  heatSink: { label: "热容型", cls: "info", icon: "❄️" },
  radiative: { label: "辐射型", cls: "success", icon: "☀️" },
};

export default function MaterialCard({
  material,
  active,
  onClick,
  disabled,
}: MaterialCardProps) {
  const badge = TYPE_BADGE[material.type];
  const style: React.CSSProperties = {
    ["--card-glow-a" as any]: material.glowColor,
    ["--card-glow-b" as any]: material.color,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`material-card text-left ${active ? "active" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      style={style}
    >
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-inner border border-white/10"
            style={{ background: material.color }}
            aria-hidden
          />
          <div>
            <div className="font-display font-bold text-[13px] tracking-wide text-slate-100">
              {material.name}
            </div>
            <div className="text-[10px] text-slate-500">
              厚度 {material.thickness}mm · ρ {material.density}
            </div>
          </div>
        </div>
        <span className={`badge ${badge.cls}`}>
          <span>{badge.icon}</span>
          {badge.label}
        </span>
      </div>
      <p className="text-xs text-slate-300/90 leading-relaxed mb-2 relative z-10">
        {material.description}
      </p>
      <div className="grid grid-cols-2 gap-2 text-[10.5px] relative z-10">
        <div>
          <div className="text-emerald-400/80 mb-0.5 font-semibold">优势</div>
          <ul className="text-slate-400 space-y-0.5 list-disc list-inside leading-snug">
            {material.pros.slice(0, 2).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-rose-400/80 mb-0.5 font-semibold">劣势</div>
          <ul className="text-slate-400 space-y-0.5 list-disc list-inside leading-snug">
            {material.cons.slice(0, 2).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </button>
  );
}
