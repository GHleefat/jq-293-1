export type MaterialType = "ablative" | "heatSink" | "radiative";

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  typeLabel: string;
  thickness: number;
  density: number;
  specificHeat: number;
  thermalConductivity: number;
  ablationHeat?: number;
  emissivity?: number;
  maxTemp: number;
  color: string;
  glowColor: string;
  description: string;
  pros: string[];
  cons: string[];
}

export const MATERIALS: Material[] = [
  {
    id: "pica",
    name: "PICA-X",
    type: "ablative",
    typeLabel: "烧蚀型",
    thickness: 80,
    density: 260,
    specificHeat: 1200,
    thermalConductivity: 0.08,
    ablationHeat: 14e6,
    maxTemp: 3500,
    color: "#1f2937",
    glowColor: "#f97316",
    description: "龙飞船使用的酚醛浸渍碳烧蚀材料，高效可靠",
    pros: ["隔热效果极强", "高温稳定性好", "质量轻"],
    cons: ["一次性使用", "厚度随烧蚀减小", "失效后无法修复"],
  },
  {
    id: "phenolic",
    name: "酚醛树脂",
    type: "ablative",
    typeLabel: "烧蚀型",
    thickness: 60,
    density: 380,
    specificHeat: 1500,
    thermalConductivity: 0.15,
    ablationHeat: 10e6,
    maxTemp: 2800,
    color: "#3f2712",
    glowColor: "#ef4444",
    description: "传统阿波罗/神舟飞船使用的烧蚀隔热层",
    pros: ["工艺成熟", "成本较低", "烧蚀性能稳定"],
    cons: ["密度比PICA大", "效率略低", "机械强度一般"],
  },
  {
    id: "rcc",
    name: "增强碳-碳",
    type: "radiative",
    typeLabel: "辐射型",
    thickness: 10,
    density: 1600,
    specificHeat: 1800,
    thermalConductivity: 12,
    emissivity: 0.85,
    maxTemp: 1900,
    color: "#111827",
    glowColor: "#dc2626",
    description: "航天飞机机翼前缘使用，高温辐射散热",
    pros: ["可重复使用", "高温辐射效率高", "机械强度高"],
    cons: ["低温性能差", "脆性大易开裂", "导热系数高"],
  },
  {
    id: "titanium",
    name: "钛合金",
    type: "heatSink",
    typeLabel: "热容型",
    thickness: 25,
    density: 4500,
    specificHeat: 540,
    thermalConductivity: 7,
    maxTemp: 900,
    color: "#9ca3af",
    glowColor: "#f59e0b",
    description: "金属热容吸热，短时间低热流适用",
    pros: ["结构坚固", "可重复使用", "加工性能好"],
    cons: ["重量大", "吸热有限会饱和", "超过温度迅速失效"],
  },
  {
    id: "ceramic",
    name: "陶瓷瓦",
    type: "heatSink",
    typeLabel: "热容型",
    thickness: 50,
    density: 350,
    specificHeat: 1100,
    thermalConductivity: 0.06,
    maxTemp: 1400,
    color: "#f8fafc",
    glowColor: "#fbbf24",
    description: "航天飞机表面隔热瓦，低热导率高孔隙率",
    pros: ["质量很轻", "导热极低", "隔热好"],
    cons: ["非常脆弱", "怕水怕撞击", "热容有限"],
  },
];

export const DEFAULT_MATERIAL_ID = "pica";
