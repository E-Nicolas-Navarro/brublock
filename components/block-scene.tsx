"use client";

import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, ContactShadows, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { createWall, type BlockId, type WallConfig } from "@/lib/blocks";
import { createConcreteMaterial, normalizeBlockGeometry } from "@/lib/block-rendering";

type Props = { mode: "wall" | "piece"; selected?: BlockId; config: WallConfig; resetKey?: number; hero?: boolean };

function useBlockGeometries() {
  const { scene } = useGLTF("/models/brunoblok.glb");
  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const geometries = {} as Record<BlockId, THREE.BufferGeometry>;
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      geometries[child.name as BlockId] = normalizeBlockGeometry(child);
    });
    return geometries;
  }, [scene]);
}

function useConcreteMaterial() {
  return useMemo(() => {
    const size = 128;
    const pixels = new Uint8Array(size * size * 4);
    let seed = 17;
    for (let i = 0; i < size * size; i++) {
      seed = (seed * 16807) % 2147483647;
      const value = 145 + (seed % 110);
      pixels.set([value, value, value, 255], i * 4);
    }
    const texture = new THREE.DataTexture(pixels, size, size);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);
    texture.needsUpdate = true;
    return createConcreteMaterial(texture);
  }, []);
}

function Models({ mode, selected = "A00", config }: Props) {
  const geometries = useBlockGeometries();
  const material = useConcreteMaterial();
  useEffect(() => () => {
    Object.values(geometries).forEach((geometry) => geometry.dispose());
    material.bumpMap?.dispose();
    material.dispose();
  }, [geometries, material]);
  const placements = mode === "wall" ? createWall(config) : [{ model: selected, position: [0, 0, 0] as [number, number, number], layer: 0 }];
  return <Center top>
    <group dispose={null}>
      {placements.map((block, index) => <mesh key={`${block.model}-${index}`} geometry={geometries[block.model]} material={material} position={block.position} castShadow receiveShadow />)}
    </group>
  </Center>;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="scene-fallback"><strong>No se pudo iniciar la vista 3D.</strong><span>Probá recargar o usar un navegador con WebGL. Podés seguir explorando la página y preparar tu consulta.</span></div>;
    return this.props.children;
  }
}

export default function BlockScene(props: Props) {
  return <SceneBoundary>
    <Canvas key={props.resetKey} frameloop="demand" shadows dpr={[1, 1.6]} camera={{ position: props.hero ? [14, 10, 17] : [12, 8, 14], fov: 34 }} gl={{ antialias: true }} fallback={<div className="scene-fallback">Tu navegador no admite WebGL. El configurador sigue disponible sin vista 3D.</div>}>
      <ambientLight intensity={1.3} />
      <hemisphereLight args={["#dbe6f0", "#8c8e86", 1.3]} />
      <directionalLight position={[-7, 12, 8]} intensity={3.2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.001} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={12} shadow-camera-bottom={-12} />
      <directionalLight position={[7, 3, -8]} intensity={1.8} color="#ecf1f9" />
      <Suspense fallback={<Html center><span className="loading-3d">Cargando modelos…</span></Html>}>
        <Bounds fit clip observe margin={props.hero ? 1.18 : 1.3}>
          <Models {...props} />
        </Bounds>
        <ContactShadows position={[0, -0.025, 0]} opacity={0.38} scale={40} blur={2.5} far={12} resolution={512} frames={1} key={`${props.mode}-${props.selected}-${JSON.stringify(props.config)}`} />
      </Suspense>
      <OrbitControls makeDefault minPolarAngle={0.25} maxPolarAngle={Math.PI / 2.08} enablePan={false} minDistance={2} maxDistance={65} />
    </Canvas>
  </SceneBoundary>;
}
