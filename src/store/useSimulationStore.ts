import { create } from "zustand";
import type { CraftState } from "../engine/physics";
import { createInitialState, recomputeAeroFromPitch } from "../engine/physics";
import { DEFAULT_MATERIAL_ID, MATERIALS } from "../data/materials";
import type { Material } from "../data/materials";

export type SimStatus = "idle" | "running" | "paused" | "ended";
export type EndReason = "landing" | "burn" | "cabin_overheat";

export interface SimSnapshot {
  state: CraftState;
  heatHistory: number[];
  tempHistory: number[];
}

interface SimulationStore {
  status: SimStatus;
  pitchDeg: number;
  speedMultiplier: number;
  materialId: string;
  state: CraftState;
  trajectory: { x: number; altitude: number; velocity: number }[];
  heatHistory: number[];
  cabinHistory: number[];
  endReason?: EndReason;
  endMessage?: string;

  setPitchDeg: (deg: number) => void;
  setSpeedMultiplier: (s: number) => void;
  setMaterialId: (id: string) => void;

  start: () => void;
  pause: () => void;
  reset: () => void;

  tick: (
    newState: CraftState,
    options?: { ended?: boolean; endReason?: EndReason; endMessage?: string },
  ) => void;
}

function getMaterial(id: string): Material {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];
}

export const useSimulationStore = create<SimulationStore>((set, get) => {
  const initMat = getMaterial(DEFAULT_MATERIAL_ID);
  const initPitch = 15;
  return {
    status: "idle",
    pitchDeg: initPitch,
    speedMultiplier: 1,
    materialId: DEFAULT_MATERIAL_ID,
    state: createInitialState(initPitch, initMat),
    trajectory: [],
    heatHistory: [],
    cabinHistory: [],

    setPitchDeg: (deg) => {
      const d = Math.max(-15, Math.min(40, deg));
      set((s) => {
        const pitchRad = (d * Math.PI) / 180;
        const aeroUpdates = recomputeAeroFromPitch(s.state, pitchRad);
        const next = { ...s.state, ...aeroUpdates };
        return { pitchDeg: d, state: next };
      });
    },
    setSpeedMultiplier: (s) =>
      set({ speedMultiplier: Math.max(0.1, Math.min(10, s)) }),
    setMaterialId: (id) => {
      const store = get();
      const mat = getMaterial(id);
      const newState = createInitialState(store.pitchDeg, mat);
      if (store.status === "idle" || store.status === "ended") {
        set({
          materialId: id,
          state: newState,
          trajectory: [],
          heatHistory: [],
          cabinHistory: [],
        });
      } else {
        set({ materialId: id });
      }
    },

    start: () =>
      set((s) => {
        if (s.status === "ended" || s.status === "idle") {
          const mat = getMaterial(s.materialId);
          const init = createInitialState(s.pitchDeg, mat);
          return {
            status: "running",
            state: init,
            trajectory: [],
            heatHistory: [],
            cabinHistory: [],
            endReason: undefined,
            endMessage: undefined,
          };
        }
        return { status: "running" };
      }),
    pause: () => set({ status: "paused" }),
    reset: () => {
      const store = get();
      const mat = getMaterial(store.materialId);
      set({
        status: "idle",
        state: createInitialState(store.pitchDeg, mat),
        trajectory: [],
        heatHistory: [],
        cabinHistory: [],
        endReason: undefined,
        endMessage: undefined,
      });
    },

    tick: (newState, options) => {
      set((s) => {
        const MAX_POINTS = 600;
        const MAX_HIST = 200;
        const traj = s.trajectory.slice(-(MAX_POINTS - 1));
        traj.push({
          x: newState.x,
          altitude: newState.altitude / 1000,
          velocity: newState.velocity,
        });
        const heat = s.heatHistory.slice(-(MAX_HIST - 1));
        heat.push(newState.heatRate);
        const cabin = s.cabinHistory.slice(-(MAX_HIST - 1));
        cabin.push(newState.cabinTemp);
        return {
          state: newState,
          trajectory: traj,
          heatHistory: heat,
          cabinHistory: cabin,
          status: options?.ended ? "ended" : s.status,
          endReason: options?.endReason ?? s.endReason,
          endMessage: options?.endMessage ?? s.endMessage,
        };
      });
    },
  };
});

export { getMaterial };

if (typeof window !== "undefined") {
  (window as any).__simStore = useSimulationStore;
}
