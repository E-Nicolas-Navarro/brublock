import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { blockTypes, blockVolumeM3, BLOCK_WIDTH, configurationMetrics, configurationSummary, createWall, formatNumber, quoteText, supplier } from "../lib/blocks";
import * as THREE from "three";
import { createConcreteMaterial, normalizeBlockGeometry } from "../lib/block-rendering";

test("aligned layers contain only complete pieces", () => {
  const config = { columns: 4, layers: 3, staggered: false, exploded: false };
  assert.deepEqual(configurationSummary(config), { full: 12, half: 0, total: 12 });
});

test("staggered layers use two half pieces and maintain the same width", () => {
  const config = { columns: 4, layers: 3, staggered: true, exploded: false };
  assert.deepEqual(configurationSummary(config), { full: 11, half: 2, total: 13 });
  for (let layer = 0; layer < config.layers; layer++) {
    const row = createWall(config).filter((block) => block.layer === layer);
    const width = (block: typeof row[number]) => block.model === "B" ? BLOCK_WIDTH / 2 : BLOCK_WIDTH;
    assert.equal(row[0].position[0] - width(row[0]) / 2, -5.6);
    assert.equal(row.at(-1)!.position[0] + width(row.at(-1)!) / 2, 5.6);
  }
});

test("exploded view changes positions, not quantities", () => {
  const base = { columns: 5, layers: 4, staggered: true, exploded: false };
  const exploded = { ...base, exploded: true };
  assert.deepEqual(configurationSummary(base), configurationSummary(exploded));
  assert.ok(createWall(exploded).at(-1)!.position[1] > createWall(base).at(-1)!.position[1]);
});

test("limits keep the viewer within its supported range", () => {
  const wall = createWall({ columns: 100, layers: -2, staggered: false, exploded: false });
  assert.equal(wall.length, 8);
  assert.ok(wall.every((block) => block.layer === 0));
});

test("quote contains actual counts and requests technical validation", () => {
  const quote = quoteText({ columns: 4, layers: 3, staggered: true, exploded: false }, "  Contención de patio  ");
  assert.match(quote, /Proyecto: Contención de patio/);
  assert.match(quote, /Bloques altos \(80 × 160 × 80 cm\): 11/);
  assert.match(quote, /Bloques cuadrados altos \(80 × 80 × 80 cm\): 2/);
  assert.match(quote, /6,4 m de largo × 2,4 m de alto × 0,8 m de profundidad/);
  assert.match(quote, /30\.720 kg/);
  assert.match(quote, /evaluación técnica/);
});

test("catalog dimensions and weights preserve the supplied brochure data", () => {
  const expected: Record<string, { dimensions: number[]; weight: number }> = {
    A00: { dimensions: [80, 160, 80], weight: 2560 },
    A01: { dimensions: [80, 160, 40], weight: 1280 },
    B: { dimensions: [80, 80, 80], weight: 1280 },
    B01: { dimensions: [80, 80, 40], weight: 540 },
    C: { dimensions: [40, 160, 80], weight: 1280 },
    D: { dimensions: [160, 80], weight: 1920 },
  };
  for (const block of blockTypes) {
    assert.deepEqual(block.dimensionsCm, expected[block.id].dimensions);
    assert.equal(block.weightKg, expected[block.id].weight);
  }
  assert.equal(blockTypes.find((block) => block.id === "D")!.stepRiseCm, 20);
  assert.equal(blockTypes.find((block) => block.id === "D")!.stepTreadCm, 22.5);
  assert.deepEqual(blockTypes.map((block) => block.name), [
    "Bloque alto", "Bloque cuadrado alto", "Bloque bajo", "Bloque cuadrado bajo", "Bloque tabique", "Bloque escalera",
  ]);
  assert.deepEqual(blockTypes.map((block) => block.catalogVolumeText), [
    "1,024 m³", "512 m³", "512 m³", "256 m³", "512 m³", null,
  ]);
});

test("rectangular volumes use cubic meters, not the brochure's missing separators", () => {
  const volumes: Record<string, number | null> = { A00: 1.024, A01: 0.512, B: 0.512, B01: 0.256, C: 0.512, D: null };
  for (const block of blockTypes) assert.equal(blockVolumeM3(block), volumes[block.id]);
  assert.equal(formatNumber(0.512), "0,512");
  assert.equal(formatNumber(2560), "2.560");
});

test("nominal wall dimensions and estimated weight are independent of layer separation", () => {
  const config = { columns: 4, layers: 3, staggered: true, exploded: false };
  assert.deepEqual(configurationMetrics(config), { lengthM: 6.4, heightM: 2.4, depthM: 0.8, weightKg: 30720 });
  assert.deepEqual(configurationMetrics(config), configurationMetrics({ ...config, exploded: true }));
  assert.deepEqual(configurationMetrics(config), configurationMetrics({ ...config, staggered: false }));
});

test("metrics use the same bounded dimensions as the rendered wall", () => {
  assert.deepEqual(configurationMetrics({ columns: 100, layers: -2, staggered: false, exploded: false }), {
    lengthM: 12.8, heightM: 0.8, depthM: 0.8, weightKg: 20480,
  });
});

test("supplier contact matches the source without guessing an international WhatsApp number", () => {
  assert.equal(supplier.brand, "BRUBLOCKS");
  assert.equal(supplier.name, "Cantera Moreno");
  assert.equal(supplier.phone, "0294 425-0785");
  assert.equal(supplier.address, "Ruta Nacional 40, km 2030");
  assert.equal(readFileSync(new URL("../public/catalogos/brublocks.jpeg", import.meta.url)).readUInt16BE(0), 0xffd8);
});

test("all six catalog entries have distinct GLB-derived vector illustrations", () => {
  const illustrations = blockTypes.map((block) => {
    const svg = readFileSync(new URL(`../public/illustrations/${block.id}.svg`, import.meta.url), "utf8");
    assert.match(svg, /<svg[^>]+viewBox=/);
    assert.ok(svg.includes(`<title id="title">${block.name}`));
    assert.match(svg, /<polygon/);
    assert.match(svg, /<path/);
    assert.ok(!svg.includes("NaN"));
    return svg;
  });
  assert.equal(new Set(illustrations).size, 6);
});

test("catalog IDs match the six actual GLB mesh nodes", () => {
  const bytes = readFileSync(new URL("../public/models/brunoblok.glb", import.meta.url));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  assert.deepEqual(gltf.nodes.filter((node: { mesh?: number }) => node.mesh !== undefined).map((node: { name: string }) => node.name).sort(), blockTypes.map((block) => block.id).sort());
});

test("concrete material renders and casts shadows from both sides", () => {
  const texture = new THREE.Texture();
  const material = createConcreteMaterial(texture);
  assert.equal(material.side, THREE.DoubleSide);
  assert.equal(material.shadowSide, THREE.DoubleSide);
  assert.equal(material.bumpMap, texture);
  material.dispose();
  texture.dispose();
});

test("normalization transforms authored normals without recomputing or mutating the source", () => {
  const source = new THREE.BufferGeometry();
  source.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  // Deliberately different from face normals, to catch accidental recomputation.
  source.setAttribute("normal", new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0, 1, 0, 0], 3));
  const mesh = new THREE.Mesh(source);
  mesh.rotation.z = Math.PI / 2;
  mesh.updateMatrixWorld(true);
  const normalized = normalizeBlockGeometry(mesh);
  const normals = normalized.getAttribute("normal");
  for (let vertex = 0; vertex < 3; vertex++) {
    assert.ok(Math.abs(normals.getX(vertex)) < 1e-6);
    assert.ok(Math.abs(normals.getY(vertex) - 1) < 1e-6);
    assert.ok(Math.abs(normals.getZ(vertex)) < 1e-6);
  }
  assert.equal(source.getAttribute("normal").getX(0), 1);
  assert.equal(source.getAttribute("normal").getY(0), 0);
  assert.notEqual(normalized, source);
  normalized.dispose();
  source.dispose();
  (mesh.material as THREE.Material).dispose();
});

test("normalization computes normals only when the source has none", () => {
  const source = new THREE.BufferGeometry();
  source.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  const mesh = new THREE.Mesh(source);
  mesh.updateMatrixWorld(true);
  const normalized = normalizeBlockGeometry(mesh);
  assert.equal(normalized.getAttribute("normal").getZ(0), 1);
  assert.equal(source.hasAttribute("normal"), false);
  normalized.dispose();
  source.dispose();
  (mesh.material as THREE.Material).dispose();
});
