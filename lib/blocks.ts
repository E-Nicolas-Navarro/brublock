export type BlockId = "A00" | "A01" | "B" | "B01" | "C" | "D";

type BlockProduct = {
  id: BlockId;
  name: string;
  description: string;
  tag: string;
  // Preserve the dimension order printed in the supplied catalog.
  dimensionsCm: readonly [number, number, number] | readonly [number, number];
  weightKg: number;
  catalogVolumeText: string | null;
  stepRiseCm?: number;
  stepTreadCm?: number;
};

export const supplier = {
  brand: "BRUBLOCKS",
  name: "Cantera Moreno",
  phone: "0294 425-0785",
  phoneHref: "tel:02944250785",
  address: "Ruta Nacional 40, km 2030",
  catalogUrl: "/catalogos/brublocks.jpeg",
} as const;

export const blockTypes: readonly BlockProduct[] = [
  { id: "A00", name: "Bloque alto", description: "La pieza completa de 160 cm de largo y 80 cm de altura.", tag: "Formato completo", dimensionsCm: [80, 160, 80], weightKg: 2560, catalogVolumeText: "1,024 m³" },
  { id: "B", name: "Bloque cuadrado alto", description: "Una pieza de 80 cm de lado, usada en los extremos de las capas trabadas del visor.", tag: "Formato cuadrado", dimensionsCm: [80, 80, 80], weightKg: 1280, catalogVolumeText: "512 m³" },
  { id: "A01", name: "Bloque bajo", description: "El mismo largo del bloque alto, con 40 cm de altura.", tag: "Media altura", dimensionsCm: [80, 160, 40], weightKg: 1280, catalogVolumeText: "512 m³" },
  { id: "B01", name: "Bloque cuadrado bajo", description: "El formato cuadrado de 80 cm de lado, con 40 cm de altura.", tag: "Cuadrado de media altura", dimensionsCm: [80, 80, 40], weightKg: 540, catalogVolumeText: "256 m³" },
  { id: "C", name: "Bloque tabique", description: "Una pieza de 160 cm de largo, 80 cm de altura y 40 cm de espesor.", tag: "Formato tabique", dimensionsCm: [40, 160, 80], weightKg: 1280, catalogVolumeText: "512 m³" },
  { id: "D", name: "Bloque escalera", description: "Una pieza escalonada con peldaños de 20 cm de alto y 22,5 cm de pisada.", tag: "Formato escalera", dimensionsCm: [160, 80], weightKg: 1920, catalogVolumeText: null, stepRiseCm: 20, stepTreadCm: 22.5 },
];

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 }).format(value);
}

export function blockVolumeM3(block: BlockProduct): number | null {
  // The brochure omits decimal separators for several volumes. Derive these
  // from the three supplied dimensions, and never invent the stair's height.
  if (block.dimensionsCm.length !== 3) return null;
  return block.dimensionsCm.reduce((volume, dimension) => volume * dimension, 1) / 1_000_000;
}

export type WallConfig = { columns: number; layers: number; staggered: boolean; exploded: boolean };
export type Placement = { model: BlockId; position: [number, number, number]; layer: number };

// Render units, not meters. Nominal physical dimensions come from the catalog.
export const BLOCK_WIDTH = 2.8;
export const LAYER_HEIGHT = 1.4;

export function createWall(config: WallConfig): Placement[] {
  const columns = Math.min(8, Math.max(2, Math.round(config.columns)));
  const layers = Math.min(6, Math.max(1, Math.round(config.layers)));
  const result: Placement[] = [];
  const left = -(columns * BLOCK_WIDTH) / 2;
  for (let layer = 0; layer < layers; layer++) {
    const y = layer * (LAYER_HEIGHT + (config.exploded ? 0.75 : 0));
    if (config.staggered && layer % 2 === 1) {
      result.push({ model: "B", position: [left + BLOCK_WIDTH / 4, y, 0], layer });
      for (let column = 0; column < columns - 1; column++) {
        result.push({ model: "A00", position: [left + BLOCK_WIDTH * (column + 1), y, 0], layer });
      }
      result.push({ model: "B", position: [-left - BLOCK_WIDTH / 4, y, 0], layer });
    } else {
      for (let column = 0; column < columns; column++) {
        result.push({ model: "A00", position: [left + BLOCK_WIDTH * (column + 0.5), y, 0], layer });
      }
    }
  }
  return result;
}

export function configurationSummary(config: WallConfig) {
  const blocks = createWall(config);
  return { full: blocks.filter((b) => b.model === "A00").length, half: blocks.filter((b) => b.model === "B").length, total: blocks.length };
}

export function configurationMetrics(config: WallConfig) {
  const blocks = createWall(config);
  const { full, half } = configurationSummary(config);
  const alto = blockTypes.find((block) => block.id === "A00")!;
  const cuadrado = blockTypes.find((block) => block.id === "B")!;
  const columns = blocks.filter((block) => block.layer === 0).length;
  const layers = new Set(blocks.map((block) => block.layer)).size;
  return {
    lengthM: columns * alto.dimensionsCm[1] / 100,
    heightM: layers * alto.dimensionsCm[2]! / 100,
    depthM: alto.dimensionsCm[0] / 100,
    weightKg: full * alto.weightKg + half * cuadrado.weightKg,
  };
}

export function quoteText(config: WallConfig, project: string) {
  const { full, half } = configurationSummary(config);
  const metrics = configurationMetrics(config);
  return `Hola, Cantera Moreno. Me interesa el sistema BRUBLOCKS.\n\nProyecto: ${project.trim()}\nConfiguración conceptual: ${config.columns} bloques de largo y ${config.layers} capas.\nDisposición: ${config.staggered ? "trabada" : "alineada"}.\nBloques altos (80 × 160 × 80 cm): ${full}.\nBloques cuadrados altos (80 × 80 × 80 cm): ${half}.\nMedidas nominales según catálogo: ${formatNumber(metrics.lengthM)} m de largo × ${formatNumber(metrics.heightM)} m de alto × ${formatNumber(metrics.depthM)} m de profundidad.\nPeso estimado según catálogo: ${formatNumber(metrics.weightKg)} kg.\n\nQuisiera consultar disponibilidad, transporte y una cotización. Entiendo que la contención requiere evaluación técnica y que estas medidas son orientativas.`;
}
