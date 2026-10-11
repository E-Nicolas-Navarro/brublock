import { readFile, writeFile, mkdir } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { normalizeBlockGeometry } from "../lib/block-rendering";
import { blockTypes } from "../lib/blocks";

type Triangle = { points: THREE.Vector3[]; normal: THREE.Vector3; depth: number; visible: boolean };
type Edge = { a: THREE.Vector3; b: THREE.Vector3; faces: Triangle[] };
const width = 640;
const height = 480;
const light = new THREE.Vector3(-3, 7, 5).normalize();
const camera = new THREE.OrthographicCamera(-2.55, 2.55, 1.9125, -1.9125, 0.1, 50);
camera.position.set(-4, 3.2, 5);
camera.lookAt(0, 0.7, 0);
camera.updateMatrixWorld(true);
const towardCamera = camera.position.clone().sub(new THREE.Vector3(0, 0.7, 0)).normalize();

function screen(point: THREE.Vector3) {
  const projected = point.clone().project(camera);
  return { x: (projected.x + 1) * width / 2, y: (1 - projected.y) * height / 2 };
}
function pointKey(point: THREE.Vector3) {
  return [point.x, point.y, point.z].map((coordinate) => coordinate.toFixed(3)).join(",");
}
function depth(point: THREE.Vector3) {
  return -point.clone().applyMatrix4(camera.matrixWorldInverse).z;
}
function shade(normal: THREE.Vector3) {
  const level = Math.round(172 + 62 * Math.max(0, normal.dot(light)));
  return `rgb(${level},${level + 1},${level})`;
}

export function illustrate(geometry: THREE.BufferGeometry, title: string): string {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const vertex = (i: number) => new THREE.Vector3().fromBufferAttribute(position, index ? index.getX(i) : i);
  const count = index ? index.count : position.count;
  const triangles: Triangle[] = [];
  const edges = new Map<string, Edge>();
  for (let i = 0; i < count; i += 3) {
    const points = [vertex(i), vertex(i + 1), vertex(i + 2)];
    const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
    const triangle = { points, normal, depth: depth(points[0].clone().add(points[1]).add(points[2]).divideScalar(3)), visible: normal.dot(towardCamera) > 0.00001 };
    triangles.push(triangle);
    for (let e = 0; e < 3; e++) {
      const a = points[e];
      const b = points[(e + 1) % 3];
      const key = [pointKey(a), pointKey(b)].sort().join("|");
      const edge = edges.get(key) ?? { a, b, faces: [] };
      edge.faces.push(triangle);
      edges.set(key, edge);
    }
  }
  // Some closed GLB meshes have globally inward winding. DoubleSide handles
  // this in the live viewer; the SVG projection needs outward-facing normals
  // for visibility and shading. Leave the original geometry untouched.
  const signedVolume = triangles.reduce((sum, triangle) => sum + triangle.points[0].dot(
    triangle.points[1].clone().cross(triangle.points[2]),
  ) / 6, 0);
  if (signedVolume < 0) {
    for (const triangle of triangles) {
      triangle.normal.negate();
      triangle.visible = triangle.normal.dot(towardCamera) > 0.00001;
    }
  }
  const items: { depth: number; kind: number; svg: string }[] = [];
  const projectedFaces = triangles.filter((face) => face.visible).map((triangle) => {
    const points = triangle.points.map(screen);
    return {
      points,
      normal: triangle.normal,
      depths: triangle.points.map(depth),
      left: Math.min(...points.map((p) => p.x)), right: Math.max(...points.map((p) => p.x)),
      top: Math.min(...points.map((p) => p.y)), bottom: Math.max(...points.map((p) => p.y)),
    };
  });
  function surfaceAt(x: number, y: number) {
    let nearest: { depth: number; normal: THREE.Vector3 } | null = null;
    for (const face of projectedFaces) {
      if (x < face.left || x > face.right || y < face.top || y > face.bottom) continue;
      const [a, b, c] = face.points;
      const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
      if (Math.abs(denominator) < 0.000001) continue;
      const u = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / denominator;
      const v = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / denominator;
      const w = 1 - u - v;
      if (u < -0.00001 || v < -0.00001 || w < -0.00001) continue;
      const d = u * face.depths[0] + v * face.depths[1] + w * face.depths[2];
      if (!nearest || d < nearest.depth) nearest = { depth: d, normal: face.normal };
    }
    return nearest;
  }
  function visibleAt(x: number, y: number, edgeDepth: number) {
    for (const face of projectedFaces) {
      if (x < face.left || x > face.right || y < face.top || y > face.bottom) continue;
      const [a, b, c] = face.points;
      const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
      if (Math.abs(denominator) < 0.000001) continue;
      const u = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / denominator;
      const v = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / denominator;
      const w = 1 - u - v;
      if (u < -0.00001 || v < -0.00001 || w < -0.00001) continue;
      const surfaceDepth = u * face.depths[0] + v * face.depths[1] + w * face.depths[2];
      if (surfaceDepth < edgeDepth - 0.002) return false;
    }
    return true;
  }
  const contours: string[] = [];
  for (const triangle of triangles.filter((face) => face.visible)) {
    const points = triangle.points.map((point) => { const p = screen(point); return `${p.x.toFixed(2)},${p.y.toFixed(2)}`; }).join(" ");
    // Same-colored fine strokes hide raster seams, not triangle topology.
    const fill = shade(triangle.normal);
    items.push({ depth: triangle.depth, kind: 0, svg: `<polygon points="${points}" fill="${fill}" stroke="${fill}" stroke-width="0.65"/>` });
  }
  for (const edge of edges.values()) {
    const visible = edge.faces.filter((face) => face.visible);
    if (!visible.length) continue;
    const silhouette = visible.length !== edge.faces.length || edge.faces.length === 1;
    const crease = edge.faces.some((face) => edge.faces.some((other) => face.normal.dot(other.normal) < Math.cos(25 * Math.PI / 180)));
    if (!silhouette && !crease) continue;
    const a = screen(edge.a), b = screen(edge.b);
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length < 0.01) continue;
    const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const px = -(b.y - a.y) / length, py = (b.x - a.x) / length;
    const leftSurface = surfaceAt(midpoint.x + px, midpoint.y + py);
    const rightSurface = surfaceAt(midpoint.x - px, midpoint.y - py);
    // Clipped meshes can contain open/internal seams inside a flat surface.
    // They aren't product outlines: omit them when both sides are coplanar.
    if (leftSurface && rightSurface && leftSurface.normal.dot(rightSurface.normal) > 0.999 &&
      Math.abs(leftSurface.depth - rightSurface.depth) < 0.04) continue;
    // Clip hidden contour portions against projected surfaces, so rear studs
    // and underside edges never bleed through the opaque concrete faces.
    const samples = Math.max(1, Math.ceil(length / 1.5));
    const da = depth(edge.a), db = depth(edge.b);
    const at = (t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    let start: number | null = null;
    function flush(end: number) {
      if (start === null) return;
      const from = at(start), to = at(end);
      contours.push(`<path d="M${from.x.toFixed(2)} ${from.y.toFixed(2)}L${to.x.toFixed(2)} ${to.y.toFixed(2)}" fill="none" stroke="#424644" stroke-width="${silhouette ? 2 : 1.35}" stroke-linecap="round"/>`);
      start = null;
    }
    for (let sample = 0; sample < samples; sample++) {
      const t = (sample + 0.5) / samples;
      const point = at(t);
      if (visibleAt(point.x, point.y, da + (db - da) * t)) {
        if (start === null) start = sample / samples;
      } else flush(sample / samples);
    }
    flush(1);
  }
  // Painter's order lets front surfaces occlude rear studs and contours.
  items.sort((a, b) => b.depth - a.depth || a.kind - b.kind);
  const projected = triangles.flatMap((triangle) => triangle.points.map(screen));
  const left = Math.min(...projected.map((point) => point.x));
  const right = Math.max(...projected.map((point) => point.x));
  const bottom = Math.max(...projected.map((point) => point.y));
  const top = Math.min(...projected.map((point) => point.y));
  const viewBox = `${(left - 25).toFixed(2)} ${(top - 25).toFixed(2)} ${(right - left + 50).toFixed(2)} ${(bottom - top + 65).toFixed(2)}`;
  const shadow = `<ellipse cx="${((left + right) / 2).toFixed(2)}" cy="${(bottom + 5).toFixed(2)}" rx="${((right - left) * 0.42).toFixed(2)}" ry="12" fill="#193247" opacity="0.08"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" role="img" aria-labelledby="title"><title id="title">${title} — ilustración del modelo 3D</title>${shadow}${items.map((item) => item.svg).join("")}${contours.join("")}</svg>\n`;
}

async function main() {
  const data = Uint8Array.from(await readFile(new URL("../public/models/brunoblok.glb", import.meta.url)));
  const gltf = await new GLTFLoader().parseAsync(data.buffer, "");
  gltf.scene.updateMatrixWorld(true);
  const directory = new URL("../public/illustrations/", import.meta.url);
  await mkdir(directory, { recursive: true });
  for (const block of blockTypes) {
    const mesh = gltf.scene.getObjectByName(block.id) as THREE.Mesh | undefined;
    if (!mesh?.isMesh) throw new Error(`Missing GLB mesh: ${block.id}`);
    const geometry = normalizeBlockGeometry(mesh);
    await writeFile(new URL(`${block.id}.svg`, directory), illustrate(geometry, block.name));
    geometry.dispose();
    process.stdout.write(`Illustrated ${block.id}: ${block.name}\n`);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
