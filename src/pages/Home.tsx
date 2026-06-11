import Header from "../components/Header";
import Canvas2D from "../components/Canvas2D";
import Dashboard from "../components/Dashboard";
import ControlPanel from "../components/ControlPanel";
import { useSimulationStore } from "../store/useSimulationStore";
import { useSimulationLoop } from "../hooks/useSimulationLoop";
import { Trophy, AlertTriangle, Flame, RotateCcw, Play } from "lucide-react";

export default function Home() {
  useSimulationLoop();
  const status = useSimulationStore((s) => s.status);
  const endReason = useSimulationStore((s) => s.endReason);
  const endMessage = useSimulationStore((s) => s.endMessage);
  const reset = useSimulationStore((s) => s.reset);
  const start = useSimulationStore((s) => s.start);

  const isSuccess = endReason === "landing";

  return (
    <div className="h-full w-full flex flex-col min-h-screen overflow-hidden">
      <Header />
      <main
        className="flex-1 p-4 lg:p-6 gap-4 lg:gap-5 min-h-0
          grid grid-cols-1
          grid-rows-[auto_auto_auto]
          2xl:grid-cols-[minmax(0,1fr)_420px]
          2xl:grid-rows-[minmax(420px,1fr)_auto]
          2xl:[&>*:nth-child(1)]:row-span-2"
      >
        <div className="relative min-h-[480px] md:min-h-[540px] h-full order-1 2xl:order-none flex flex-col">
          <div className="flex-1 min-h-0 relative">
            <Canvas2D />
            {status === "ended" && endMessage && (
              <div className="result-banner rounded-[14px]">
                <div
                  className={`max-w-lg mx-6 rounded-2xl p-6 border text-center relative overflow-hidden ${
                    isSuccess
                      ? "bg-gradient-to-br from-emerald-950/90 to-emerald-900/80 border-emerald-400/40 shadow-[0_0_60px_rgba(16,185,129,0.25)]"
                      : "bg-gradient-to-br from-rose-950/90 to-orange-950/80 border-rose-400/40 shadow-[0_0_60px_rgba(244,63,94,0.25)]"
                  }`}
                >
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-400 blur-3xl" />
                  </div>
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                        isSuccess ? "bg-emerald-500/20" : "bg-rose-500/20"
                      }`}
                    >
                      {isSuccess ? (
                        <Trophy
                          className="w-8 h-8 text-emerald-300"
                          strokeWidth={2}
                        />
                      ) : endReason === "burn" ? (
                        <Flame
                          className="w-8 h-8 text-orange-300 animate-pulse"
                          strokeWidth={2}
                        />
                      ) : (
                        <AlertTriangle
                          className="w-8 h-8 text-rose-300 animate-pulse"
                          strokeWidth={2}
                        />
                      )}
                    </div>
                    <div
                      className={`font-display font-black text-2xl mb-2 tracking-wider ${
                        isSuccess ? "glow-text-green" : "glow-text-red"
                      }`}
                    >
                      {isSuccess ? "任务成功" : "任务失败"}
                    </div>
                    <div className="text-sm text-slate-300 mb-5">
                      {endMessage}
                    </div>
                    <div className="flex justify-center gap-2">
                      <button className="btn" onClick={reset}>
                        <RotateCcw className="w-4 h-4" />
                        重置参数
                      </button>
                      <button className="btn btn-primary" onClick={start}>
                        <Play className="w-4 h-4" fill="currentColor" />
                        再来一次
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="order-2 2xl:order-none flex flex-col min-h-0">
          <Dashboard />
        </div>

        <div className="col-span-1 2xl:col-span-1 order-3 min-h-0 2xl:max-h-[calc(50vh-2rem)] 2xl:overflow-y-auto 2xl:pr-1">
          <ControlPanel />
        </div>
      </main>
    </div>
  );
}
