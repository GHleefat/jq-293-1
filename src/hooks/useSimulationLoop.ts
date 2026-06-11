import { useEffect, useRef } from "react";
import { stepPhysics } from "../engine/physics";
import type { Material } from "../data/materials";
import { getMaterial, useSimulationStore } from "../store/useSimulationStore";

export function useSimulationLoop() {
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const matRef = useRef<Material>(
    getMaterial(useSimulationStore.getState().materialId),
  );
  const subStepAccum = useRef<number>(0);

  useEffect(() => {
    let prevMaterialId = useSimulationStore.getState().materialId;
    const unsub = useSimulationStore.subscribe((state) => {
      if (state.materialId !== prevMaterialId) {
        matRef.current = getMaterial(state.materialId);
        prevMaterialId = state.materialId;
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    function tick(ts: number) {
      const store = useSimulationStore.getState();
      if (store.status === "running") {
        const dtFrame = lastTsRef.current
          ? Math.min(0.05, (ts - lastTsRef.current) / 1000)
          : 0;
        lastTsRef.current = ts;

        const multiplier = store.speedMultiplier;
        const BASE_PHYSICS_DT = 0.008;
        subStepAccum.current += dtFrame * multiplier;

        let state = store.state;
        let ended = false;
        let endReason: any;
        let endMessage: string | undefined;
        let maxIters = 200;
        const mat = matRef.current;

        while (subStepAccum.current >= BASE_PHYSICS_DT && maxIters-- > 0) {
          const result = stepPhysics(state, mat, BASE_PHYSICS_DT);
          state = result.state;
          if (result.ended) {
            ended = true;
            endReason = result.endReason;
            endMessage = result.endMessage;
            subStepAccum.current = 0;
            break;
          }
          subStepAccum.current -= BASE_PHYSICS_DT;
        }

        if (store.status === "running") {
          store.tick(state, { ended, endReason, endMessage });
        }
      } else {
        lastTsRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
