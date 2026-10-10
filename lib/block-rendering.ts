import * as THREE from "three";

export function normalizeBlockGeometry(mesh: THREE.Mesh): THREE.BufferGeometry {
  const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
  // Preserve proportions across all six pieces; remove each export pivot.
  geometry.scale(2.8 / 0.629921, 2.8 / 0.629921, 2.8 / 0.629921);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = box.getCenter(new THREE.Vector3());
  geometry.translate(-center.x, -box.min.y, -center.z);
  // Exported normals encode the intended hard edges. Transform, don't replace.
  if (!geometry.hasAttribute("normal")) geometry.computeVertexNormals();
  return geometry;
}

export function createConcreteMaterial(bumpMap: THREE.Texture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: "#b9bdbb",
    roughness: 0.94,
    metalness: 0,
    bumpMap,
    bumpScale: 0.027,
    // The source GLB material is doubleSided; retain that when replacing it.
    side: THREE.DoubleSide,
    shadowSide: THREE.DoubleSide,
  });
}
