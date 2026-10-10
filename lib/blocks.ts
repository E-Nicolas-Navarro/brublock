export const blockTypes = [
  { id: "A00", name: "Estándar", description: "La pieza de partida para explorar el sistema.", tag: "Pieza completa" },
  { id: "A01", name: "Media altura", description: "El mismo ancho, en una variante de menor altura.", tag: "Perfil bajo" },
  { id: "B", name: "Medio bloque", description: "Una variante corta para combinar con las piezas completas.", tag: "Formato corto" },
  { id: "B01", name: "Compacto", description: "Una pieza corta y baja para explorar otras composiciones.", tag: "Formato compacto" },
  { id: "C", name: "Angosto", description: "Una geometría de menor profundidad.", tag: "Perfil angosto" },
  { id: "D", name: "Especial", description: "Una geometría alternativa dentro del mismo archivo de modelos.", tag: "Pieza especial" },
] as const;

export type BlockId = (typeof blockTypes)[number]["id"];
export type WallConfig = { columns: number; layers: number; staggered: boolean; exploded: boolean };
export type Placement = { model: BlockId; position: [number, number, number]; layer: number };

// Viewer units only. GLB export scale is not a validated physical dimension.
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

export function quoteText(config: WallConfig, project: string) {
  const { full, half } = configurationSummary(config);
  return `Hola, me interesa el sistema Brublock.\n\nProyecto: ${project.trim()}\nConfiguración conceptual: ${config.columns} bloques de largo y ${config.layers} capas.\nDisposición: ${config.staggered ? "trabada" : "alineada"}.\nPiezas estándar: ${full}. Medios bloques: ${half}.\n\nQuisiera consultar disponibilidad, medidas reales y una cotización. Entiendo que la contención requiere evaluación técnica.`;
}
