import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { blockTypes, BLOCK_WIDTH, configurationSummary, createWall, quoteText } from "../lib/blocks";
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
  assert.match(quote, /Piezas estándar: 11. Medios bloques: 2/);
  assert.match(quote, /evaluación técnica/);
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
