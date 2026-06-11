import { useSimulationStore } from "../store/useSimulationStore";
import Gauge from "./Gauge";
import ProgressBar from "./ProgressBar";
import {
  Activity,
  Shield,
  ThermometerSun,
  Gauge as GaugeIcon,
  TrendingUp,
} from "lucide-react";

const STATUS_LABEL: Record<
  string,
  { text: string; dot: string; badge: string }
> = {
  idle: { text: "待启动", dot: "idle", badge: "info" },
  running: { text: "模拟运行中", dot: "", badge: "success" },
  paused: { text: "已暂停", dot: "warn", badge: "warn" },
  ended: { text: "已结束", dot: "danger", badge: "danger" },
};

export default function Dashboard() {
  const state = useSimulationStore((s) => s.state);
  const status = useSimulationStore((s) => s.status);
  const heatHistory = useSimulationStore((s) => s.heatHistory);
  const cabinHistory = useSimulationStore((s) => s.cabinHistory);

  const statusInfo = STATUS_LABEL[status];

  const altKm = state.altitude / 1000;
  const velKmS = state.velocity / 1000;
  const cabinC = state.cabinTemp - 273.15;
  const skinC = state.skinTemp - 273.15;
  const heatMW = state.heatRate / 1e6;
  const totalHeatMJ = state.totalHeat / 1e6;

  return (
    <div className="panel panel-glow p-5 flex flex-col gap-4 2xl:h-full 2xl:overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <div className="font-display font-bold text-sm tracking-wider text-slate-100">
            飞行参数仪表
          </div>
        </div>
        <div className={`badge ${statusInfo.badge} gap-1.5`}>
          <span className={`status-dot ${statusInfo.dot}`} />
          {statusInfo.text}
        </div>
      </div>
      <div className="divider-glow" />

      <div className="grid grid-cols-2 gap-3">
        <Gauge
          label="高度 Altitude"
          value={altKm}
          unit="km"
          min={0}
          max={140}
          colorMode="blue"
          format={(v) => v.toFixed(1)}
        />
        <Gauge
          label="速度 Velocity"
          value={velKmS}
          unit="km/s"
          min={0}
          max={12}
          colorMode="auto"
          thresholds={{ warn: 3, danger: 6, dir: "up" } as any}
          format={(v) => v.toFixed(2)}
        />
        <Gauge
          label="马赫数 Mach"
          value={state.mach}
          unit="Ma"
          min={0}
          max={35}
          colorMode="auto"
          thresholds={{ warn: 5, danger: 15, dir: "up" } as any}
          format={(v) => v.toFixed(1)}
        />
        <Gauge
          label="G 过载 Load"
          value={state.gForce}
          unit="g"
          min={0}
          max={12}
          colorMode="auto"
          thresholds={{ warn: 6, danger: 10, dir: "up" } as any}
          format={(v) => v.toFixed(1)}
        />
        <Gauge
          label="真实迎角 α AOA"
          value={state.trueAoA * (180 / Math.PI)}
          unit="°"
          min={-20}
          max={60}
          colorMode="auto"
          thresholds={{ warn: 35, danger: 48, dir: "up" } as any}
          format={(v) => v.toFixed(1)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Gauge
          label="加热率 Heat Rate"
          value={heatMW}
          unit="MW/m²"
          min={0}
          max={5}
          colorMode="orange"
          format={(v) => v.toFixed(2)}
          history={heatHistory.map((h) => h / 1e6)}
        />
        <Gauge
          label="累计热量 Σ Q"
          value={totalHeatMJ}
          unit="MJ/m²"
          min={0}
          max={150}
          colorMode="auto"
          thresholds={{ warn: 50, danger: 100, dir: "up" } as any}
          format={(v) => v.toFixed(1)}
        />
      </div>

      <div className="divider-glow" />

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ThermometerSun className="w-4 h-4 text-orange-400" />
          <div className="font-display font-bold text-sm tracking-wider text-slate-100">
            温度监控
          </div>
          <div className="ml-auto text-[10px] text-slate-500 font-mono">
            TIME {state.time.toFixed(1)}s
          </div>
        </div>
        <ProgressBar
          label="表面温度 Skin"
          value={skinC}
          max={2800}
          format={(v) => `${Math.round(v)} °C`}
          thresholds={{ warn: 900, danger: 1800, dir: "up" } as any}
        />
        <ProgressBar
          label="舱内温度 Cabin"
          value={cabinC}
          max={180}
          format={(v) => `${v.toFixed(1)} °C`}
          thresholds={{ warn: 60, danger: 110, dir: "up" } as any}
          color="auto"
        />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="text-xs">
            <div className="text-slate-500 mb-1">安全上限 Safe</div>
            <div className="font-mono text-emerald-300">≤ 77°C</div>
          </div>
          <div className="text-xs">
            <div className="text-slate-500 mb-1">失效阈值 Fail</div>
            <div className="font-mono text-rose-300">≥ 127°C</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <div className="font-display font-bold text-sm tracking-wider text-slate-100">
            隔热层状态
          </div>
        </div>
        <ProgressBar
          label="剩余量 Shield"
          value={state.shieldRemaining}
          max={1}
          format={(v) => `${(v * 100).toFixed(1)}%`}
          thresholds={{ warn: 0.35, danger: 0.1, dir: "down" } as any}
        />
        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
          <div>
            <div className="text-slate-500 mb-1">CL / CD</div>
            <div className="font-mono text-sky-300">
              {state.cl.toFixed(2)} / {state.cd.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-1">升阻比 L/D</div>
            <div className="font-mono text-sky-300">
              {state.cd > 0 ? (state.cl / state.cd).toFixed(2) : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 flex items-center gap-2.5 text-[11px]">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-slate-400">
          <span className="text-slate-200 font-semibold">提示：</span>
          迎角越大，阻力越大、减速越快，但加热率也越高。找到最佳迎角让舱体在合适高度完成减速！
        </span>
      </div>
    </div>
  );
}
