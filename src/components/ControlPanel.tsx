import { useSimulationStore } from "../store/useSimulationStore";
import { MATERIALS } from "../data/materials";
import MaterialCard from "./MaterialCard";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Wind,
  Settings2,
} from "lucide-react";

const SPEEDS = [0.25, 0.5, 1, 2, 4, 8];

export default function ControlPanel() {
  const status = useSimulationStore((s) => s.status);
  const pitchDeg = useSimulationStore((s) => s.pitchDeg);
  const speedMult = useSimulationStore((s) => s.speedMultiplier);
  const materialId = useSimulationStore((s) => s.materialId);
  const state = useSimulationStore((s) => s.state);

  const start = useSimulationStore((s) => s.start);
  const pause = useSimulationStore((s) => s.pause);
  const reset = useSimulationStore((s) => s.reset);
  const setPitch = useSimulationStore((s) => s.setPitchDeg);
  const setSpeed = useSimulationStore((s) => s.setSpeedMultiplier);
  const setMaterial = useSimulationStore((s) => s.setMaterialId);

  const simEnded = status === "ended";
  const simIdle = status === "idle";
  const simRunning = status === "running";
  const canSelectMaterial = simIdle || simEnded;

  const fpa = (state.flightPathAngle * 180) / Math.PI;

  return (
    <div className="panel panel-glow p-5 flex flex-col gap-4 2xl:h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-amber-400" />
          <div className="font-display font-bold text-sm tracking-wider text-slate-100">
            模拟控制
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {simEnded || simIdle ? (
            <button className="btn btn-primary" onClick={start}>
              <Play className="w-4 h-4" fill="currentColor" />
              {simEnded ? "重新开始" : "开始模拟"}
            </button>
          ) : simRunning ? (
            <button className="btn" onClick={pause}>
              <Pause className="w-4 h-4" />
              暂停
            </button>
          ) : (
            <button className="btn btn-primary" onClick={start}>
              <Play className="w-4 h-4" fill="currentColor" />
              继续
            </button>
          )}
          <button className="btn btn-danger" onClick={reset}>
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>

      <div className="divider-glow" />

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-sky-400" />
            <div className="text-sm font-semibold text-slate-100">
              迎角控制 Attack Angle (α)
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-wider text-slate-500">
                机身俯仰
              </div>
              <span className="gauge-value text-lg glow-text-blue">
                {pitchDeg.toFixed(0)}°
              </span>
            </div>
            <div className="text-slate-600">|</div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-wider text-slate-500">
                真实迎角 α
              </div>
              <span className="gauge-value text-lg glow-text-orange">
                {(state.trueAoA * (180 / Math.PI)).toFixed(1)}°
              </span>
            </div>
            <div className="text-slate-600">|</div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-wider text-slate-500">
                轨迹角 γ
              </div>
              <span className="gauge-value text-lg text-slate-300">
                {fpa.toFixed(1)}°
              </span>
            </div>
          </div>
        </div>
        <div className="relative">
          <input
            type="range"
            min={-15}
            max={40}
            step={0.5}
            value={pitchDeg}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="slider-track"
          />
          <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
            {[-15, -5, 5, 15, 25, 40].map((v) => (
              <span key={v} className={v === pitchDeg ? "text-sky-300" : ""}>
                {v}°
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="rounded-lg bg-slate-800/50 px-2.5 py-1.5 border border-slate-700/50">
            <div className="text-slate-500">低头</div>
            <div className="text-slate-300">减阻 · 低加热</div>
          </div>
          <div className="rounded-lg bg-slate-800/50 px-2.5 py-1.5 border border-slate-700/50">
            <div className="text-slate-500">平衡区</div>
            <div className="text-slate-300">L/D 最大</div>
          </div>
          <div className="rounded-lg bg-slate-800/50 px-2.5 py-1.5 border border-slate-700/50">
            <div className="text-slate-500">抬头</div>
            <div className="text-slate-300">强减速 · 高热</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FastForward className="w-4 h-4 text-violet-400" />
            <div className="text-sm font-semibold text-slate-100">
              模拟速度倍率
            </div>
          </div>
          <div className="font-mono text-violet-300 text-sm">
            ×{speedMult.toFixed(2)}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                speedMult === s
                  ? "bg-violet-600/30 border-violet-400/50 text-violet-200 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-700/60"
              }`}
            >
              ×{s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded bg-gradient-to-b from-amber-400 to-red-500" />
          <div className="text-sm font-semibold text-slate-100">
            隔热材料选择
          </div>
          <div className="ml-auto text-[10px] text-slate-500">
            {canSelectMaterial
              ? "可切换 · 模拟运行时不生效"
              : "模拟中切换需等待下次重置"}
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-2.5">
          {MATERIALS.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              active={m.id === materialId}
              disabled={!canSelectMaterial}
              onClick={() => setMaterial(m.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
