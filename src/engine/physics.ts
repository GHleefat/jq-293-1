import type { Material } from "../data/materials";

export interface CraftState {
  altitude: number;
  velocity: number;
  flightPathAngle: number;
  x: number;
  pitch: number;
  trueAoA: number;
  mach: number;
  gForce: number;
  skinTemp: number;
  cabinTemp: number;
  heatRate: number;
  shieldRemaining: number;
  shieldMassPerArea: number;
  totalHeat: number;
  time: number;
  cd: number;
  cl: number;
}

export const INITIAL_ALTITUDE = 120000;
export const INITIAL_VELOCITY = 11000;
export const INITIAL_FLIGHT_PATH_ANGLE = -7 * (Math.PI / 180);
export const CRAFT_MASS = 8000;
export const REFERENCE_AREA = 15;
export const R_EARTH = 6371000;
export const G0 = 9.80665;
export const RHO0 = 1.225;
export const SCALE_HEIGHT = 8500;
export const GAMMA = 1.4;
export const R_GAS = 287;
export const T_SEA_LEVEL = 288.15;
export const LAPSE_RATE = 0.0065;
export const T_TROPOPAUSE = 216.65;
export const SUTTON_K = 3.5e-8;
export const STEFAN_BOLTZMANN = 5.67e-8;
export const CABIN_MASS = 2000;
export const CABIN_SPECIFIC_HEAT = 1000;
export const CABIN_SAFE_TEMP = 350;
export const CABIN_FAIL_TEMP = 400;
export const SHIELD_FAIL_TEMP = 10;

export function gravityAt(altitude: number): number {
  return G0 * Math.pow(R_EARTH / (R_EARTH + altitude), 2);
}

export function atmosphereTemp(altitude: number): number {
  const h = altitude;
  if (h < 11000) return T_SEA_LEVEL - LAPSE_RATE * h;
  if (h < 20000) return T_TROPOPAUSE;
  if (h < 47000) return T_TROPOPAUSE + 0.001 * (h - 20000);
  if (h < 51000) return 282.65;
  if (h < 71000) return 282.65 - 0.0028 * (h - 51000);
  if (h < 85000) return 226.65 - 0.002 * (h - 71000);
  return Math.max(160, 186.65 + 0.003 * (h - 85000));
}

export function airDensity(altitude: number): number {
  if (altitude > 120000) return 0;
  return RHO0 * Math.exp(-altitude / SCALE_HEIGHT);
}

export function speedOfSound(temp: number): number {
  return Math.sqrt(GAMMA * R_GAS * temp);
}

export function aeroCoeffs(alpha: number, mach: number) {
  const alphaDeg = alpha * (180 / Math.PI);
  const alphaClamped = Math.max(-20, Math.min(50, alphaDeg));
  let cd = 0.12 + 0.8 * Math.pow(Math.sin(alpha * 0.9), 2);
  if (mach > 1) cd += 0.15 * Math.min(1, (mach - 1) / 4);
  cd = Math.max(0.1, cd);
  const stallAlpha = 30;
  const peakCl = 0.8 + (mach > 2 ? 0.2 : 0);
  let cl;
  if (alphaClamped < stallAlpha) {
    cl = peakCl * Math.sin(2 * alpha * 0.9);
  } else {
    const beyond = alphaClamped - stallAlpha;
    cl =
      peakCl *
      Math.sin(2 * ((stallAlpha * Math.PI) / 180) * 0.9) *
      (1 - beyond / 25);
  }
  cl = Math.max(-0.3, Math.min(1.1, cl));
  return { cd, cl };
}

export function suttonGravesHeatRate(
  rho: number,
  velocity: number,
  alpha: number,
): number {
  const sinFactor = 1 + 0.6 * Math.sin(Math.max(0, alpha));
  return (
    SUTTON_K * Math.sqrt(Math.max(rho, 0)) * Math.pow(velocity, 3) * sinFactor
  );
}

export interface StepResult {
  state: CraftState;
  ended: boolean;
  endReason?: "landing" | "burn" | "cabin_overheat";
  endMessage?: string;
}

export function stepPhysics(
  state: CraftState,
  material: Material,
  dt: number,
): StepResult {
  const { altitude, velocity, flightPathAngle, x, pitch } = state;
  const h = Math.max(0, altitude);

  const trueAoA = pitch - flightPathAngle;

  const g = gravityAt(h);
  const rho = airDensity(h);
  const T_atm = atmosphereTemp(h);
  const a = speedOfSound(T_atm);
  const mach = velocity / a;

  const { cd, cl } = aeroCoeffs(trueAoA, mach);
  const dynPressure = 0.5 * rho * velocity * velocity;
  const D = dynPressure * REFERENCE_AREA * cd;
  const L = dynPressure * REFERENCE_AREA * cl;

  const dv_dt = -D / CRAFT_MASS - g * Math.sin(flightPathAngle);
  const dgamma_dt =
    L / (CRAFT_MASS * velocity) +
    (g / velocity - velocity / (R_EARTH + h)) * Math.cos(flightPathAngle);
  const dh_dt = velocity * Math.sin(flightPathAngle);
  const dx_dt = velocity * Math.cos(flightPathAngle);

  const gForce = D / CRAFT_MASS / G0;

  let newV = Math.max(0, velocity + dv_dt * dt);
  let newGamma = flightPathAngle + dgamma_dt * dt;
  if (newGamma < -Math.PI / 2) newGamma = -Math.PI / 2;
  if (newGamma > Math.PI / 2) newGamma = Math.PI / 2;
  let newH = Math.max(0, h + dh_dt * dt);
  let newX = x + (dx_dt * dt) / 1000;

  const rawHeat = suttonGravesHeatRate(rho, velocity, trueAoA);
  const heatRate = isFinite(rawHeat) ? Math.max(0, rawHeat) : 0;

  let { skinTemp, cabinTemp, shieldRemaining, shieldMassPerArea, totalHeat } =
    state;
  const dt_s = dt;
  let effectiveHeatToShield = heatRate;

  if (material.type === "radiative" && material.emissivity) {
    const radiativeLoss =
      material.emissivity *
      STEFAN_BOLTZMANN *
      (Math.pow(skinTemp, 4) - Math.pow(T_atm, 4));
    effectiveHeatToShield = Math.max(0, heatRate - radiativeLoss);
  }

  const matThicknessMeters = material.thickness / 1000;
  const massPerAreaInitial = matThicknessMeters * material.density;
  if (shieldMassPerArea <= 0) shieldMassPerArea = massPerAreaInitial;

  const dT_skin =
    (effectiveHeatToShield * dt_s) /
    Math.max(0.1, shieldMassPerArea * material.specificHeat);
  skinTemp = Math.max(T_atm, skinTemp + dT_skin);

  if (
    material.type === "ablative" &&
    skinTemp > material.maxTemp * 0.6 &&
    material.ablationHeat
  ) {
    const aboveThreshold = Math.max(0, skinTemp - material.maxTemp * 0.5);
    const ablateTemp = Math.min(aboveThreshold, dT_skin * 0.7 + 50);
    const excessEnergy = shieldMassPerArea * material.specificHeat * ablateTemp;
    const massAblated = Math.min(
      shieldMassPerArea * 0.95,
      excessEnergy / material.ablationHeat,
    );
    shieldMassPerArea = Math.max(0, shieldMassPerArea - massAblated);
    shieldRemaining = Math.max(
      0,
      Math.min(1, shieldMassPerArea / massPerAreaInitial),
    );
    skinTemp =
      material.maxTemp * 0.55 + (skinTemp - material.maxTemp * 0.55) * 0.3;
  }

  if (material.type === "heatSink" || shieldRemaining > 0.05) {
    const deltaT = Math.max(0, skinTemp - cabinTemp - 20);
    const thicknessUsed = matThicknessMeters * Math.max(0.05, shieldRemaining);
    const conductionToCabin =
      ((material.thermalConductivity * deltaT) /
        Math.max(0.001, thicknessUsed)) *
      dt_s;
    cabinTemp =
      cabinTemp + conductionToCabin / (CABIN_MASS * CABIN_SPECIFIC_HEAT);
    skinTemp = Math.max(
      T_atm,
      skinTemp -
        conductionToCabin / (shieldMassPerArea * material.specificHeat),
    );
  } else {
    const directHeat = heatRate * 0.5 * dt_s;
    cabinTemp = cabinTemp + directHeat / (CABIN_MASS * CABIN_SPECIFIC_HEAT);
  }

  cabinTemp = Math.max(T_atm, cabinTemp);
  skinTemp = Math.max(T_atm, Math.min(skinTemp, material.maxTemp * 1.2));

  totalHeat += heatRate * dt_s;

  let ended = false;
  let endReason: StepResult["endReason"];
  let endMessage: string | undefined;

  if (newH <= 0 && velocity < 300) {
    ended = true;
    endReason = "landing";
    endMessage = "任务成功：舱体已安全着陆！";
    newH = 0;
  } else if (newH <= 0 && velocity >= 300) {
    ended = true;
    endReason = "burn";
    endMessage = "任务失败：着陆速度过高，撞击地面解体。";
    newH = 0;
  } else if (cabinTemp > CABIN_FAIL_TEMP) {
    ended = true;
    endReason = "cabin_overheat";
    endMessage = "任务失败：舱内温度超过安全上限，系统损毁。";
  } else if (shieldRemaining < 0.03 && skinTemp > material.maxTemp * 0.8) {
    ended = true;
    endReason = "burn";
    endMessage = "任务失败：隔热层完全消耗，舱体被烧毁。";
  }

  const newState: CraftState = {
    altitude: newH,
    velocity: newV,
    flightPathAngle: newGamma,
    x: newX,
    pitch,
    trueAoA,
    mach: newV / speedOfSound(atmosphereTemp(newH)),
    gForce,
    skinTemp,
    cabinTemp,
    heatRate,
    shieldRemaining,
    shieldMassPerArea,
    totalHeat,
    time: state.time + dt_s,
    cd,
    cl,
  };

  return { state: newState, ended, endReason, endMessage };
}

export function createInitialState(
  pitchDeg: number,
  material: Material,
): CraftState {
  const pitch = pitchDeg * (Math.PI / 180);
  const h0 = INITIAL_ALTITUDE;
  const T0 = atmosphereTemp(h0);
  const a0 = speedOfSound(T0);
  const massPerAreaInitial = (material.thickness / 1000) * material.density;
  const trueAoA = pitch - INITIAL_FLIGHT_PATH_ANGLE;
  return {
    altitude: INITIAL_ALTITUDE,
    velocity: INITIAL_VELOCITY,
    flightPathAngle: INITIAL_FLIGHT_PATH_ANGLE,
    x: 0,
    pitch,
    trueAoA,
    mach: INITIAL_VELOCITY / a0,
    gForce: 0,
    skinTemp: 200,
    cabinTemp: 293,
    heatRate: 0,
    shieldRemaining: 1,
    shieldMassPerArea: massPerAreaInitial,
    totalHeat: 0,
    time: 0,
    cd: 0.15,
    cl: 0,
  };
}
