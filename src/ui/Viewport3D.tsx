/**
 * 3D preview.
 *
 * The only module allowed to touch three.js directly. Everything it needs
 * arrives as a plain `Float32Array` of positions from the worker.
 *
 * @module ui/Viewport3D
 */

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { ViewState } from '../store/usePotStore';

interface Props {
  positions: Float32Array | null;
  view: ViewState;
  /** Pot height, mm — used to frame the camera and place the clip plane. */
  height: number;
  /** Pot width, mm — used to frame the camera. */
  width: number;
}

/** Enables local clipping once; r3f gives no declarative hook for it. */
function ClippingSetup({ enabled }: { enabled: boolean }): null {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.localClippingEnabled = enabled;
  }, [gl, enabled]);
  return null;
}

function PotMesh({ positions, view }: { positions: Float32Array; view: ViewState }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // The worker sends a triangle soup, so normals must be derived here.
    // Flat normals are the honest choice: the fluting is a real facet
    // pattern, and smoothing it would hide exactly what the user is tuning.
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }, [positions]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const clipping = useMemo(
    () => (view.section ? [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)] : []),
    [view.section],
  );

  return (
    <mesh geometry={geometry} castShadow={false}>
      <meshStandardMaterial
        color="#8ea6c0"
        roughness={0.75}
        metalness={0.05}
        wireframe={view.wireframe}
        side={view.section ? THREE.DoubleSide : THREE.FrontSide}
        clippingPlanes={clipping}
        clipShadows
      />
    </mesh>
  );
}

/**
 * Orbit-controlled preview of the current mesh.
 *
 * The model is built with Z up (printer convention) and rotated into
 * three.js's Y-up world here, at the very last moment.
 *
 * @param props - geometry and view toggles
 * @returns the canvas element
 */
export function Viewport3D({ positions, view, height, width }: Props) {
  const controls = useRef(null);
  const dist = Math.max(height, width) * 2.2;

  return (
    <Canvas
      camera={{ position: [dist * 0.7, dist * 0.55, dist * 0.7], fov: 40, near: 1, far: dist * 20 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0f1115']} />
      <ClippingSetup enabled={view.section} />

      <hemisphereLight intensity={0.55} groundColor="#20242c" />
      <directionalLight position={[1, 2, 1.5].map((v) => v * dist) as [number, number, number]} intensity={1.4} />
      <directionalLight position={[-1, 0.7, -1].map((v) => v * dist) as [number, number, number]} intensity={0.4} />

      {/* Z-up model into a Y-up scene. */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -height / 2, 0]}>
        {positions && <PotMesh positions={positions} view={view} />}
      </group>

      {view.grid && (
        <Grid
          position={[0, -height / 2, 0]}
          args={[400, 400]}
          cellSize={10}
          cellColor="#2a2f39"
          sectionSize={50}
          sectionColor="#3b4250"
          infiniteGrid
          fadeDistance={dist * 3}
          followCamera={false}
        />
      )}

      <OrbitControls ref={controls} makeDefault enablePan target={[0, 0, 0]} />
    </Canvas>
  );
}
