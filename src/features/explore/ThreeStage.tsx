import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box, Hexagon, RotateCcw, Waves } from 'lucide-react';
import './three-stage.css';

type ShapeId = 'knot' | 'icosa' | 'lattice';

interface ShapeOption {
  id: ShapeId;
  label: string;
  icon: React.ReactNode;
}

const SHAPES: ShapeOption[] = [
  { id: 'knot', label: 'Nút thắt', icon: <Waves size={14} aria-hidden="true" /> },
  { id: 'icosa', label: 'Đa diện', icon: <Hexagon size={14} aria-hidden="true" /> },
  { id: 'lattice', label: 'Mạng tinh thể', icon: <Box size={14} aria-hidden="true" /> },
];

const PALETTE = {
  dark: {
    bg: '#11100f',
    accent: '#e2703f',
    secondary: '#8cb0c7',
    ink: '#f3eee3',
    grid: 'rgba(243,238,227,0.14)',
  },
  light: {
    bg: '#f5f1e8',
    accent: '#c42a18',
    secondary: '#2c5b78',
    ink: '#14120e',
    grid: 'rgba(20,18,14,0.14)',
  },
};

export interface ThreeStageProps {
  theme: 'dark' | 'light';
  title: string;
  reduced?: boolean;
  className?: string;
}

/**
 * Sân khấu Three.js thật cho nhóm "Không gian 3D" của Bàn soi.
 *
 * - Kéo chuột / kéo ngón tay để xoay vật thể thep quỹ đạo cầu.
 * - Lăn chuột hoặc chụm hai ngón để đổi khoảng cách camera (3.2 – 9).
 * - Ba hình học khác nhau (torus knot, icosahedron, mạng tinh thể) với
 *   cùng hệ ánh sáng, để so sánh chất liệu và nhịp xoay.
 * - Tôn trọng reduced-motion: vật thể đứng yên, chỉ phản hồi thao tác.
 */
export const ThreeStage: React.FC<ThreeStageProps> = ({ theme, title, reduced = false, className = '' }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shape, setShape] = useState<ShapeId>('knot');
  const [dragging, setDragging] = useState(false);
  const stateRef = useRef({ yaw: 0.6, pitch: 0.22, distance: 5.2, targetYaw: 0.6, targetPitch: 0.22, targetDistance: 5.2 });
  const resetRef = useRef<() => void>(() => undefined);

  const palette = PALETTE[theme];

  const buildGeometry = useMemo(() => {
    if (shape === 'knot') return () => new THREE.TorusKnotGeometry(1.15, 0.34, 180, 26, 2, 3);
    if (shape === 'icosa') return () => new THREE.IcosahedronGeometry(1.55, 1);
    return () => {
      const group = new THREE.Group();
      const radius = 0.52;
      const step = 1.05;
      for (let x = -1; x <= 1; x += 1) {
        for (let y = -1; y <= 1; y += 1) {
          for (let z = -1; z <= 1; z += 1) {
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(radius, 24, 18),
              new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.42 })
            );
            sphere.position.set(x * step, y * step, z * step);
            group.add(sphere);
          }
        }
      }
      return group as unknown as THREE.BufferGeometry;
    };
  }, [shape]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const key = new THREE.DirectionalLight(new THREE.Color(palette.accent), 2.4);
    key.position.set(3.4, 4.2, 3.8);
    const fill = new THREE.DirectionalLight(new THREE.Color(palette.secondary), 1.15);
    fill.position.set(-4, -1.6, -2.4);
    const ambient = new THREE.AmbientLight(new THREE.Color(palette.ink), 0.42);
    scene.add(key, fill, ambient);

    const built = buildGeometry();
    const isGroup = (built as unknown as THREE.Group).isGroup === true;
    const holder = isGroup ? (built as unknown as THREE.Group) : new THREE.Group();
    if (!isGroup) {
      const mesh = new THREE.Mesh(
        built,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(palette.accent),
          roughness: 0.28,
          metalness: 0.55,
          flatShading: false,
        })
      );
      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(built, 18),
        new THREE.LineBasicMaterial({ color: new THREE.Color(palette.secondary), transparent: true, opacity: 0.34 })
      );
      holder.add(mesh, wire);
    } else {
      holder.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.color = new THREE.Color(palette.accent);
      });
    }
    root.add(holder);

    const state = stateRef.current;
    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let pinchStart = 0;
    let distanceStart = 0;
    const activePointers = new Map<number, { x: number; y: number }>();

    const onPointerDown = (event: PointerEvent) => {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size === 2) {
        const [a, b] = Array.from(activePointers.values());
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        distanceStart = state.targetDistance;
        return;
      }
      pointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      setDragging(true);
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!activePointers.has(event.pointerId)) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size === 2) {
        const [a, b] = Array.from(activePointers.values());
        const spread = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStart > 0) {
          state.targetDistance = THREE.MathUtils.clamp(distanceStart * (pinchStart / spread), 3.1, 9);
        }
        return;
      }
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      state.targetYaw += dx * 0.0058;
      state.targetPitch = THREE.MathUtils.clamp(state.targetPitch + dy * 0.0048, -1.15, 1.15);
    };

    const endPointer = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);
      if (pointerId === event.pointerId) {
        pointerId = null;
        setDragging(false);
      }
      if (activePointers.size < 2) pinchStart = 0;
    };

    const onWheel = (event: WheelEvent) => {
      if (!event.shiftKey && Math.abs(event.deltaY) < 2) return;
      event.preventDefault();
      state.targetDistance = THREE.MathUtils.clamp(state.targetDistance + event.deltaY * 0.0028, 3.1, 9);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    resetRef.current = () => {
      state.targetYaw = state.yaw = 0.6;
      state.targetPitch = state.pitch = 0.22;
      state.targetDistance = state.distance = 5.2;
    };

    let raf = 0;
    let last = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const ease = 1 - Math.pow(0.0016, dt);
      state.yaw += (state.targetYaw - state.yaw) * ease;
      state.pitch += (state.targetPitch - state.pitch) * ease;
      state.distance += (state.targetDistance - state.distance) * ease;

      if (!reduced) {
        state.targetYaw += dt * 0.16;
        holder.rotation.y += dt * 0.06;
      }
      root.rotation.set(state.pitch, state.yaw, 0);
      camera.position.set(0, 0.6, state.distance);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endPointer);
      canvas.removeEventListener('pointercancel', endPointer);
      canvas.removeEventListener('wheel', onWheel);
      root.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, theme, reduced, palette.accent, palette.secondary, palette.ink]);

  return (
    <div
      className={`three-stage ${className}`}
      data-theme={theme}
      data-dragging={dragging ? 'true' : undefined}
    >
      <div
        ref={hostRef}
        className="three-stage-canvas"
        role="application"
        aria-label={`Xoay và phóng to mô hình ${title} bằng chuột hoặc cảm ứng`}
      />
      <div className="three-stage-head">
        <span className="three-stage-kicker">WebGL · kéo để xoay, lăn để thu phóng</span>
        <div className="three-stage-shapes" role="group" aria-label="Chọn hình học">
          {SHAPES.map((option) => (
            <button
              key={option.id}
              type="button"
              className="three-stage-chip"
              aria-pressed={shape === option.id}
              onClick={() => setShape(option.id)}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
          <button
            type="button"
            className="three-stage-chip three-stage-chip--icon"
            aria-label="Đưa góc nhìn về mặc định"
            title="Đưa góc nhìn về mặc định"
            onClick={() => resetRef.current()}
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreeStage;
