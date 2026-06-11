import { Orbit, Flame, ThermometerSun, Rocket } from "lucide-react";

export default function Header() {
  return (
    <header className="relative px-8 py-4 flex items-center justify-between border-b border-slate-800/70 backdrop-blur-sm">
      <div className="absolute inset-x-0 bottom-0 h-px divider-glow" />
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-violet-700 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.45)] border border-sky-300/30">
            <Orbit className="w-6 h-6 text-white" strokeWidth={2.2} />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-red-600 border border-orange-200/50 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse">
            <Flame className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        <div>
          <h1 className="font-display font-black text-[26px] tracking-wide leading-none">
            <span className="glow-text-blue">REENTRY</span>
            <span className="mx-1.5 text-slate-500">·</span>
            <span className="glow-text-orange">SIMULATOR</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 tracking-wider flex items-center gap-2">
            <Rocket className="w-3 h-3" />
            航天器再入大气层 · 气动加热 · 隔热材料 交互式物理模拟
            <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
            <ThermometerSun className="w-3 h-3" />
            调节迎角与材料 · 平衡烧蚀与散热
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">物理引擎</span>
          <span className="font-mono text-slate-200">READY</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-slate-400">渲染</span>
          <span className="font-mono text-slate-200">Canvas 2D</span>
        </div>
      </div>
    </header>
  );
}
