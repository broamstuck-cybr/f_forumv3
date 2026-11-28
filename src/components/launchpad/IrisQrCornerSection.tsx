import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type * as THREE from 'three';
import type { DimensionView } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { IRIS_QR_CODE_URL } from '../../data/irisRobotHtml';
import { IconMessageSquare } from '../../ui/icons';
import { FeedbackModal } from '../public/FeedbackModal';
import './iris-qr-corner.css';

export interface IrisQrCornerSectionProps {
  onNavigate?: (view: DimensionView) => void;
  contextLabel?: 'home' | 'landing';
}

type ThreeNamespace = typeof import('three');
type MergeVerticesFn = typeof import('three/examples/jsm/utils/BufferGeometryUtils.js').mergeVertices;

type RobotExpressionId =
  | 'smile'
  | 'starry'
  | 'heart'
  | 'curious'
  | 'sleepy'
  | 'excited'
  | 'proud'
  | 'shy'
  | 'music'
  | 'greeting';

type RobotActionId =
  | 'double_hop'
  | 'two_arm_wave'
  | 'shy_wiggle'
  | 'twirl_360'
  | 'curious_tilt'
  | 'cozy_bob'
  | 'antenna_bounce'
  | 'peekaboo'
  | 'shimmy_dance'
  | 'victory_spin';

interface ExpressionSpec {
  id: RobotExpressionId;
  tone: 'mint' | 'rose' | 'amber' | 'steel';
  ringColor: [number, number, number];
  haloHex: number;
  haloOpacity: number;
  antennaHex: number;
  blushOpacity: number;
  leftEyeScaleY: number;
  rightEyeScaleY: number;
  leftEyeScaleX: number;
  rightEyeScaleX: number;
  starOpacity: number;
  heartOpacity: number;
  happyArcLeft: number;
  happyArcRight: number;
}

const ROBOT_EXPRESSIONS: ExpressionSpec[] = [
  {
    id: 'smile',
    tone: 'mint',
    ringColor: [0.68, 1.58, 1.24],
    haloHex: 0x38c99a,
    haloOpacity: 0.3,
    antennaHex: 0x52d6aa,
    blushOpacity: 0.45,
    leftEyeScaleY: 1.0,
    rightEyeScaleY: 0.16,
    leftEyeScaleX: 1.04,
    rightEyeScaleX: 1.08,
    starOpacity: 0,
    heartOpacity: 0,
    happyArcLeft: 0,
    happyArcRight: 0.95,
  },
  {
    id: 'starry',
    tone: 'amber',
    ringColor: [1.32, 1.48, 0.85],
    haloHex: 0xf4c77b,
    haloOpacity: 0.36,
    antennaHex: 0xf4c77b,
    blushOpacity: 0.28,
    leftEyeScaleY: 1.12,
    rightEyeScaleY: 1.12,
    leftEyeScaleX: 1.12,
    rightEyeScaleX: 1.12,
    starOpacity: 0.96,
    heartOpacity: 0,
    happyArcLeft: 0,
    happyArcRight: 0,
  },
  {
    id: 'heart',
    tone: 'rose',
    ringColor: [1.55, 0.78, 1.02],
    haloHex: 0xf48fb1,
    haloOpacity: 0.34,
    antennaHex: 0xf49bb4,
    blushOpacity: 0.82,
    leftEyeScaleY: 1.06,
    rightEyeScaleY: 1.06,
    leftEyeScaleX: 1.06,
    rightEyeScaleX: 1.06,
    starOpacity: 0,
    heartOpacity: 0.96,
    happyArcLeft: 0,
    happyArcRight: 0,
  },
  {
    id: 'curious',
    tone: 'steel',
    ringColor: [0.68, 1.44, 1.55],
    haloHex: 0x6ec7d9,
    haloOpacity: 0.28,
    antennaHex: 0x8cbcc8,
    blushOpacity: 0.12,
    leftEyeScaleY: 1.14,
    rightEyeScaleY: 0.78,
    leftEyeScaleX: 1.1,
    rightEyeScaleX: 0.94,
    starOpacity: 0,
    heartOpacity: 0,
    happyArcLeft: 0,
    happyArcRight: 0,
  },
  {
    id: 'sleepy',
    tone: 'steel',
    ringColor: [0.62, 1.12, 1.24],
    haloHex: 0x76b8c4,
    haloOpacity: 0.18,
    antennaHex: 0x6ca9b5,
    blushOpacity: 0.22,
    leftEyeScaleY: 0.34,
    rightEyeScaleY: 0.34,
    leftEyeScaleX: 1.05,
    rightEyeScaleX: 1.05,
    starOpacity: 0,
    heartOpacity: 0,
    happyArcLeft: 0,
    happyArcRight: 0,
  },
  {
    id: 'excited',
    tone: 'mint',
    ringColor: [0.76, 1.72, 1.42],
    haloHex: 0x4be6b5,
    haloOpacity: 0.42,
    antennaHex: 0x6ff5ca,
    blushOpacity: 0.36,
    leftEyeScaleY: 1.18,
    rightEyeScaleY: 1.18,
    leftEyeScaleX: 1.16,
    rightEyeScaleX: 1.16,
    starOpacity: 0.45,
    heartOpacity: 0,
    happyArcLeft: 0,
    happyArcRight: 0,
  },
  {
    id: 'proud',
    tone: 'amber',
    ringColor: [1.4, 1.32, 0.72],
    haloHex: 0xe6b385,
    haloOpacity: 0.34,
    antennaHex: 0xe6b385,
    blushOpacity: 0.52,
    leftEyeScaleY: 0.2,
    rightEyeScaleY: 0.2,
    leftEyeScaleX: 1.1,
    rightEyeScaleX: 1.1,
    starOpacity: 0,
    heartOpacity: 0,
    happyArcLeft: 0.95,
    happyArcRight: 0.95,
  },
  {
    id: 'shy',
    tone: 'rose',
    ringColor: [1.32, 0.92, 1.08],
    haloHex: 0xf49bb4,
    haloOpacity: 0.28,
    antennaHex: 0xf2a7bc,
    blushOpacity: 0.95,
    leftEyeScaleY: 0.78,
    rightEyeScaleY: 0.78,
    leftEyeScaleX: 0.94,
    rightEyeScaleX: 0.94,
    starOpacity: 0,
    heartOpacity: 0,
    happyArcLeft: 0,
    happyArcRight: 0,
  },
  {
    id: 'music',
    tone: 'mint',
    ringColor: [0.62, 1.62, 1.46],
    haloHex: 0x3ed9b8,
    haloOpacity: 0.34,
    antennaHex: 0x5be8cb,
    blushOpacity: 0.35,
    leftEyeScaleY: 0.96,
    rightEyeScaleY: 0.96,
    leftEyeScaleX: 1.02,
    rightEyeScaleX: 1.02,
    starOpacity: 0,
    heartOpacity: 0,
    happyArcLeft: 0.25,
    happyArcRight: 0.25,
  },
  {
    id: 'greeting',
    tone: 'mint',
    ringColor: [0.7, 1.6, 1.28],
    haloHex: 0x38c99a,
    haloOpacity: 0.34,
    antennaHex: 0x52d6aa,
    blushOpacity: 0.42,
    leftEyeScaleY: 1.08,
    rightEyeScaleY: 1.08,
    leftEyeScaleX: 1.06,
    rightEyeScaleX: 1.06,
    starOpacity: 0,
    heartOpacity: 0,
    happyArcLeft: 0,
    happyArcRight: 0,
  },
];

const ROBOT_ACTIONS: Array<{ id: RobotActionId; duration: number }> = [
  { id: 'double_hop', duration: 2.1 },
  { id: 'two_arm_wave', duration: 2.5 },
  { id: 'shy_wiggle', duration: 2.4 },
  { id: 'twirl_360', duration: 2.2 },
  { id: 'curious_tilt', duration: 2.6 },
  { id: 'cozy_bob', duration: 2.8 },
  { id: 'antenna_bounce', duration: 2.2 },
  { id: 'peekaboo', duration: 2.4 },
  { id: 'shimmy_dance', duration: 2.5 },
  { id: 'victory_spin', duration: 2.4 },
];

const EXPRESSION_BY_ID = new Map<RobotExpressionId, ExpressionSpec>(
  ROBOT_EXPRESSIONS.map((item) => [item.id, item])
);

function pickNextRandom<T>(list: T[], current: T): T {
  if (list.length <= 1) return list[0];
  let next = list[Math.floor(Math.random() * list.length)];
  if (next === current) {
    const idx = list.indexOf(current);
    next = list[(idx + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length];
  }
  return next;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function createRadialTexture(
  THREE: ThreeNamespace,
  stops: Array<[number, string]>,
  size = 256
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const r = size / 2;
    const g = ctx.createRadialGradient(r, r, 0, r, r, r);
    for (const [offset, color] of stops) {
      g.addColorStop(offset, color);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStarSparkleTexture(THREE: ThreeNamespace, size = 128): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const half = size / 2;
    ctx.clearRect(0, 0, size, size);
    const glow = ctx.createRadialGradient(half, half, 0, half, half, half);
    glow.addColorStop(0, 'rgba(255, 250, 224, 0.95)');
    glow.addColorStop(0.35, 'rgba(255, 230, 150, 0.45)');
    glow.addColorStop(1, 'rgba(255, 230, 150, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    ctx.beginPath();
    const outer = size * 0.44;
    const inner = size * 0.12;
    for (let i = 0; i < 8; i += 1) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const x = half + Math.cos(a) * r;
      const y = half + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#fff9df';
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHeartOverlayTexture(THREE: ThreeNamespace, size = 128): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const half = size / 2;
    ctx.clearRect(0, 0, size, size);
    const s = size * 0.34;
    ctx.save();
    ctx.translate(half, half + s * 0.14);
    ctx.beginPath();
    ctx.moveTo(0, s * 0.85);
    ctx.bezierCurveTo(-s * 1.35, s * 0.1, -s * 1.15, -s * 1.05, 0, -s * 0.32);
    ctx.bezierCurveTo(s * 1.15, -s * 1.05, s * 1.35, s * 0.1, 0, s * 0.85);
    ctx.closePath();
    const grad = ctx.createRadialGradient(-s * 0.2, -s * 0.25, 2, 0, 0, s * 1.2);
    grad.addColorStop(0, '#ffd4e3');
    grad.addColorStop(0.45, '#ff7fa9');
    grad.addColorStop(1, '#e84d82');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHappyArcTexture(THREE: ThreeNamespace, size = 128): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = '#ccf7e8';
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.62, size * 0.28, Math.PI * 1.14, Math.PI * 1.86);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRimMaterial(
  THREE: ThreeNamespace,
  color: number,
  power: number,
  strength: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uStrength: { value: strength },
    },
    vertexShader: `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uStrength;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), uPower);
        gl_FragColor = vec4(uColor * f * uStrength, f);
      }
    `,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

function subdivideNonIndexed(
  THREE: ThreeNamespace,
  geo: THREE.BufferGeometry,
  rounds = 3
): THREE.BufferGeometry {
  const attr = geo.attributes.position;
  let pos = Array.from(attr.array as ArrayLike<number>);
  for (let r = 0; r < rounds; r += 1) {
    const next: number[] = [];
    for (let i = 0; i < pos.length; i += 9) {
      const ax = pos[i], ay = pos[i + 1], az = pos[i + 2];
      const bx = pos[i + 3], by = pos[i + 4], bz = pos[i + 5];
      const cx = pos[i + 6], cy = pos[i + 7], cz = pos[i + 8];
      const abx = (ax + bx) * 0.5, aby = (ay + by) * 0.5, abz = (az + bz) * 0.5;
      const bcx = (bx + cx) * 0.5, bcy = (by + cy) * 0.5, bcz = (bz + cz) * 0.5;
      const cax = (cx + ax) * 0.5, cay = (cy + ay) * 0.5, caz = (cz + az) * 0.5;
      next.push(
        ax, ay, az, abx, aby, abz, cax, cay, caz,
        bx, by, bz, bcx, bcy, bcz, abx, aby, abz,
        cx, cy, cz, cax, cay, caz, bcx, bcy, bcz,
        abx, aby, abz, bcx, bcy, bcz, cax, cay, caz
      );
    }
    pos = next;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return out;
}

function buildSphericalRoundedRect(
  THREE: ThreeNamespace,
  w: number,
  h: number,
  corner: number,
  centreY: number,
  radius: number
): THREE.BufferGeometry {
  const r = Math.min(corner, w * 0.5, h * 0.5);
  const x0 = -w * 0.5;
  const y0 = centreY - h * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(x0 + r, y0);
  shape.lineTo(x0 + w - r, y0);
  shape.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  shape.lineTo(x0 + w, y0 + h - r);
  shape.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  shape.lineTo(x0 + r, y0 + h);
  shape.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  shape.lineTo(x0, y0 + r);
  shape.quadraticCurveTo(x0, y0, x0 + r, y0);

  const baseGeo = new THREE.ShapeGeometry(shape, 48).toNonIndexed();
  const geo = subdivideNonIndexed(THREE, baseGeo, 3);
  baseGeo.dispose();

  const posAttr = geo.attributes.position;
  const normals = new Float32Array(posAttr.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < posAttr.count; i += 1) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = Math.sqrt(Math.max(0.0001, radius * radius - x * x - y * y));
    posAttr.setXYZ(i, x, y, z);
    v.set(x, y, z).normalize();
    normals[i * 3] = v.x;
    normals[i * 3 + 1] = v.y;
    normals[i * 3 + 2] = v.z;
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geo;
}

interface PrepareModelOpts {
  glossy: boolean;
  tint: string;
  useMap?: boolean;
  smooth?: boolean;
  rim?: { color: number; power: number; strength: number };
}

function prepareModel(
  THREE: ThreeNamespace,
  mergeVertices: MergeVerticesFn,
  root: THREE.Object3D,
  opts: PrepareModelOpts
): void {
  const meshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      meshes.push(obj as THREE.Mesh);
    }
  });
  for (const m of meshes) {
    if (opts.smooth) {
      let g = m.geometry.clone();
      for (const attr of ['normal', 'uv', 'uv1', 'tangent', 'color']) {
        if (g.attributes[attr]) g.deleteAttribute(attr);
      }
      g = mergeVertices(g, 1e-3);
      g.computeVertexNormals();
      m.geometry = g;
    }
    const oldMat = m.material as THREE.MeshStandardMaterial | undefined;
    const prevMap = opts.useMap && oldMat?.map ? oldMat.map : null;
    m.material = new THREE.MeshPhysicalMaterial({
      map: prevMap,
      color: new THREE.Color(opts.tint),
      metalness: opts.glossy ? 0.1 : 0,
      roughness: opts.glossy ? 0.3 : 0.48,
      clearcoat: opts.glossy ? 1.0 : 0.3,
      clearcoatRoughness: opts.glossy ? 0.16 : 0.4,
      envMapIntensity: opts.glossy ? 0.9 : 0.55,
    });
    if (opts.rim) {
      const shell = new THREE.Mesh(
        m.geometry,
        createRimMaterial(THREE, opts.rim.color, opts.rim.power, opts.rim.strength)
      );
      shell.renderOrder = 2;
      shell.userData.isRimShell = true;
      m.add(shell);
    }
  }
}

function normaliseHead(THREE: ThreeNamespace, root: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const s = 2 / (size.z || 2);
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root);
  const centre = box2.getCenter(new THREE.Vector3());
  root.position.set(-centre.x, -(box2.min.y + 1), -centre.z);
  root.updateMatrixWorld(true);
}

function normaliseArm(THREE: ThreeNamespace, root: THREE.Object3D): THREE.Group {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const s = 0.78 / (size.y || 0.78);
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root);
  const centre = box2.getCenter(new THREE.Vector3());
  root.position.sub(centre);
  const wrap = new THREE.Group();
  wrap.add(root);
  return wrap;
}

function buildFallbackHead(THREE: ThreeNamespace, mergeVertices: MergeVerticesFn): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: '#2c2c35', roughness: 0.26, clearcoat: 1 });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat);
  g.add(sphere);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 32), mat);
    ear.rotation.z = Math.PI * 0.5;
    ear.position.set(sx * 1.02, -0.04, 0);
    g.add(ear);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.04, 0.42, 16), mat);
    rod.position.set(sx * 0.46, 1.08, -0.05);
    rod.rotation.z = -sx * 0.25;
    g.add(rod);
  }
  prepareModel(THREE, mergeVertices, g, {
    glossy: true,
    useMap: false,
    tint: '#4a4a56',
    rim: { color: 0x38c99a, power: 4.5, strength: 0.32 },
  });
  return g;
}

function buildFallbackArm(THREE: ThreeNamespace, mergeVertices: MergeVerticesFn): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.42, 16, 32),
    new THREE.MeshPhysicalMaterial({ color: '#1b1b21', roughness: 0.48, clearcoat: 0.3 })
  );
  g.add(m);
  prepareModel(THREE, mergeVertices, g, {
    glossy: false,
    useMap: false,
    tint: '#1d1d23',
    rim: { color: 0x38c99a, power: 2.6, strength: 1.05 },
  });
  return g;
}

const MoodEmblemSvg: React.FC<{ expression: RobotExpressionId }> = ({ expression }) => {
  switch (expression) {
    case 'smile':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5.5 10.5c1-1.6 3-1.6 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16.5" cy="10" r="1.4" fill="currentColor" />
          <path d="M8 14.8c1.4 2.1 6.6 2.1 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'starry':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M11 3.5 12.7 8.8 18 10.5 12.7 12.2 11 17.5 9.3 12.2 4 10.5 9.3 8.8 11 3.5Z"
            fill="currentColor"
          />
          <path
            d="M18.5 14 19.3 16.2 21.5 17 19.3 17.8 18.5 20 17.7 17.8 15.5 17 17.7 16.2 18.5 14Z"
            fill="currentColor"
            opacity="0.82"
          />
        </svg>
      );
    case 'heart':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 19.6 5.2 13a4.3 4.3 0 0 1 6.1-6.1L12 7.6l.7-.7a4.3 4.3 0 0 1 6.1 6.1L12 19.6Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'curious':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 9.2a3.2 3.2 0 1 1 5.3 2.4c-.9.8-2.3 1.4-2.3 2.9"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="18.2" r="1.3" fill="currentColor" />
        </svg>
      );
    case 'sleepy':
      return (
        <svg width="26" height="24" viewBox="0 0 26 24" fill="none" aria-hidden="true">
          <path
            d="M4.5 12.5h5.5l-5.5 6h5.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 5.5h7.5l-7.5 8h7.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'excited':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6l2.5 2.5M15.9 15.9l2.5 2.5M18.4 5.6l-2.5 2.5M8.1 15.9l-2.5 2.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case 'proud':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 16.5 6.2 8l5.8 4.2L17.8 8 20 16.5H4Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.22"
          />
          <line x1="5" y1="19.5" x2="19" y2="19.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case 'shy':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <ellipse cx="7" cy="13.5" rx="3.2" ry="1.8" fill="currentColor" opacity="0.45" />
          <ellipse cx="17" cy="13.5" rx="3.2" ry="1.8" fill="currentColor" opacity="0.45" />
          <path d="M9.6 15.2c1.1 1.1 3.7 1.1 4.8 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M6.2 9.8c.7-.8 1.9-.8 2.6 0M15.2 9.8c.7-.8 1.9-.8 2.6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'music':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 17.5V7.2l9-2v10.3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="6.8" cy="17.5" r="2.3" fill="currentColor" />
          <circle cx="15.8" cy="15.5" r="2.3" fill="currentColor" />
        </svg>
      );
    case 'greeting':
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 4.5 13.8 9.2 18.5 11 13.8 12.8 12 17.5 10.2 12.8 5.5 11 10.2 9.2 12 4.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path d="M5 17.5c2 1.6 4 2.2 7 2.2s5-.6 7-2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
};

export const IrisQrCornerSection: React.FC<IrisQrCornerSectionProps> = ({
  onNavigate,
  contextLabel = 'landing',
}) => {
  const { navigate, theme } = useAppStore();
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLButtonElement>(null);
  const emblemRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef(theme);
  const applySceneThemeRef = useRef<((mode: 'dark' | 'light') => void) | null>(null);
  const triggerMoodRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    themeRef.current = theme;
    applySceneThemeRef.current?.(theme);
  }, [theme]);

  const [loaderHidden, setLoaderHidden] = useState(false);
  const [webglFallback, setWebglFallback] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [shouldBootScene, setShouldBootScene] = useState(false);
  const [robotHovered, setRobotHovered] = useState(false);
  const [activeExpression, setActiveExpression] = useState<RobotExpressionId>('greeting');
  const [activeAction, setActiveAction] = useState<RobotActionId>('two_arm_wave');
  const [moodNonce, setMoodNonce] = useState(0);

  const go = (view: DimensionView) => {
    if (onNavigate) onNavigate(view);
    else navigate(view);
  };

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || shouldBootScene) return undefined;
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setShouldBootScene(true);
      return undefined;
    }

    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight || 900;
    if (rect.top <= vh + 120 && rect.bottom >= -120) {
      setShouldBootScene(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldBootScene(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px 0px' }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [shouldBootScene]);

  useEffect(() => {
    if (!qrModalOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQrModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [qrModalOpen]);

  useEffect(() => {
    if (!shouldBootScene) return undefined;
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas || typeof window === 'undefined') return undefined;

    let cancelled = false;
    let cleanupScene: (() => void) | undefined;

    void (async () => {
      const [
        THREE,
        { GLTFLoader },
        { EffectComposer },
        { RenderPass },
        { UnrealBloomPass },
        { OutputPass },
        { mergeVertices },
        { IRIS_ARM_GLB, IRIS_HEAD_GLB },
      ] = await Promise.all([
        import('three'),
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/postprocessing/EffectComposer.js'),
        import('three/examples/jsm/postprocessing/RenderPass.js'),
        import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
        import('three/examples/jsm/postprocessing/OutputPass.js'),
        import('three/examples/jsm/utils/BufferGeometryUtils.js'),
        import('../../data/irisRobotHtml'),
      ]);

      if (cancelled) return;

      let renderer: THREE.WebGLRenderer | null = null;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        });
      } catch {
        setWebglFallback(true);
        setLoaderHidden(true);
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(themeRef.current === 'light' ? '#eef4f1' : '#0c1212');

      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

      const glowTex = createRadialTexture(THREE, [
        [0, 'rgba(56,201,154,1)'],
        [0.25, 'rgba(16,155,114,.52)'],
        [0.6, 'rgba(11,122,89,.12)'],
        [1, 'rgba(8,70,54,0)'],
      ]);
      const blushTex = createRadialTexture(
        THREE,
        [
          [0, 'rgba(255,148,178,0.92)'],
          [0.45, 'rgba(244,122,162,0.44)'],
          [1, 'rgba(244,122,162,0)'],
        ],
        128
      );
      const starEyeTex = createStarSparkleTexture(THREE, 128);
      const heartEyeTex = createHeartOverlayTexture(THREE, 128);
      const happyArcTex = createHappyArcTexture(THREE, 128);
      const ambientSparkleTex = createStarSparkleTexture(THREE, 64);

      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color('#040808');
      const softboxes: Array<{
        color: string;
        w: number;
        h: number;
        pos: [number, number, number];
        intensity: number;
      }> = [
        { color: '#ffffff', w: 5, h: 3.2, pos: [-3, 4.5, 4], intensity: 3.2 },
        { color: '#ffffff', w: 1.2, h: 6, pos: [6, 0.5, 2], intensity: 1.1 },
        { color: '#ffffff', w: 3, h: 1, pos: [1.5, 5, -1], intensity: 0.8 },
        { color: '#38c99a', w: 4, h: 5, pos: [-5, 0, -4], intensity: 0.95 },
        { color: '#38c99a', w: 4, h: 5, pos: [5, 0, -4], intensity: 0.95 },
        { color: '#109b72', w: 6, h: 3, pos: [0, -5, 1], intensity: 0.35 },
      ];
      const sbGeo = new THREE.SphereGeometry(0.5, 32, 16);
      for (const sb of softboxes) {
        const col = new THREE.Color(sb.color).multiplyScalar(sb.intensity);
        const mesh = new THREE.Mesh(sbGeo, new THREE.MeshBasicMaterial({ color: col }));
        mesh.scale.set(sb.w, sb.h, 0.3);
        mesh.position.set(sb.pos[0], sb.pos[1], sb.pos[2]);
        mesh.lookAt(0, 0, 0);
        envScene.add(mesh);
      }
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTarget = pmrem.fromScene(envScene, 0.02);
      scene.environment = envTarget.texture;
      scene.environmentIntensity = 1.0;

      scene.add(new THREE.HemisphereLight(0xd8f0e8, 0x0c241d, 2.3));
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
      dirLight.position.set(-3, 4, 5);
      scene.add(dirLight);

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(1, 1),
        themeRef.current === 'light' ? 0.14 : 0.55,
        0.4,
        themeRef.current === 'light' ? 0.96 : 0.92
      );
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());

      applySceneThemeRef.current = (mode) => {
        scene.background = new THREE.Color(mode === 'light' ? '#eef4f1' : '#0c1212');
        bloomPass.strength = mode === 'light' ? 0.14 : 0.55;
        bloomPass.threshold = mode === 'light' ? 0.96 : 0.92;
      };

      const robot = new THREE.Group();
      const body = new THREE.Group();
      const head = new THREE.Group();
      robot.add(body);
      body.add(head);
      scene.add(robot);

      const haze = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: 0x38c99a,
          opacity: 0.06,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
          depthWrite: false,
          transparent: true,
        })
      );
      haze.scale.set(7.5, 7.5, 1);
      haze.position.set(0, 0.1, -3);
      scene.add(haze);

      const floorGlowMat = new THREE.MeshBasicMaterial({
        map: glowTex,
        color: 0x38c99a,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorGlowMat);
      floorGlow.position.set(0, -2.05, -0.6);
      floorGlow.scale.set(3.4, 0.42, 1);
      scene.add(floorGlow);

      // Tasteful ambient floating sparkles orbiting gently around Iris
      const sparkleGroup = new THREE.Group();
      scene.add(sparkleGroup);
      const SPARKLE_PALETTE = [0x6ef0c2, 0xf6d48a, 0xf7a4be, 0x8cdbe8];
      const ambientSparkles: Array<{
        sprite: THREE.Sprite;
        mat: THREE.SpriteMaterial;
        angle: number;
        radius: number;
        yBase: number;
        speed: number;
        phase: number;
        baseScale: number;
      }> = [];
      for (let i = 0; i < 16; i += 1) {
        const mat = new THREE.SpriteMaterial({
          map: ambientSparkleTex,
          color: SPARKLE_PALETTE[i % SPARKLE_PALETTE.length],
          opacity: 0.42,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
          depthWrite: false,
          transparent: true,
        });
        const sprite = new THREE.Sprite(mat);
        const angle = (i / 16) * Math.PI * 2;
        const radius = 1.65 + (i % 4) * 0.28;
        const yBase = -0.95 + ((i * 0.37) % 2.15);
        const speed = 0.24 + (i % 5) * 0.065;
        const phase = i * 1.13;
        const baseScale = 0.11 + (i % 3) * 0.045;
        sprite.scale.set(baseScale, baseScale, 1);
        sparkleGroup.add(sprite);
        ambientSparkles.push({ sprite, mat, angle, radius, yBase, speed, phase, baseScale });
      }

      const eyeGroups: THREE.Group[] = [];
      const pupilWraps: THREE.Group[] = [];
      const antennaGlows: THREE.Sprite[] = [];
      const antennaBallMats: THREE.MeshPhysicalMaterial[] = [];
      const eyeHaloMats: THREE.MeshBasicMaterial[] = [];
      const eyeRingMats: THREE.MeshBasicMaterial[] = [];
      const starEyeMats: THREE.MeshBasicMaterial[] = [];
      const starEyeMeshes: THREE.Mesh[] = [];
      const heartEyeMats: THREE.MeshBasicMaterial[] = [];
      const heartEyeMeshes: THREE.Mesh[] = [];
      const happyArcMats: THREE.MeshBasicMaterial[] = [];
      const blushMats: THREE.MeshBasicMaterial[] = [];

      const mountHead = (root: THREE.Object3D) => {
        root.updateMatrixWorld(true);

        const raycaster = new THREE.Raycaster(
          new THREE.Vector3(0, 0, 5),
          new THREE.Vector3(0, 0, -1)
        );
        const hits = raycaster.intersectObject(root, true);
        const hitDist = hits.length ? hits[0].point.length() : 0.98;
        const R = clamp(hitDist, 0.85, 1.1);

        const baseMeshes: THREE.Mesh[] = [];
        root.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh && !obj.userData.isRimShell) {
            baseMeshes.push(obj as THREE.Mesh);
          }
        });

        const vLocal = new THREE.Vector3();
        const vHead = new THREE.Vector3();
        const topLeft: THREE.Vector3[] = [];
        const topRight: THREE.Vector3[] = [];

        for (const m of baseMeshes) {
          const toHead = m.matrixWorld.clone();
          const headToLocalNormal = new THREE.Matrix3().getNormalMatrix(
            new THREE.Matrix4().copy(toHead).invert()
          );
          const pos = m.geometry.attributes.position;
          if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
          const norm = m.geometry.attributes.normal;
          for (let i = 0; i < pos.count; i += 1) {
            vLocal.fromBufferAttribute(pos, i);
            vHead.copy(vLocal).applyMatrix4(toHead);
            const d = vHead.length();
            if (Math.abs(d - R) <= R * 0.07) {
              const n = vHead.clone().normalize().applyMatrix3(headToLocalNormal).normalize();
              norm.setXYZ(i, n.x, n.y, n.z);
            }
            if (vHead.y > 0.75 && Math.abs(vHead.x) > 0.15) {
              if (vHead.x < 0) topLeft.push(vHead.clone());
              else topRight.push(vHead.clone());
            }
          }
          norm.needsUpdate = true;
        }

        head.add(root);
        head.updateMatrixWorld(true);

        const bezelMesh = new THREE.Mesh(
          buildSphericalRoundedRect(THREE, 1.86, 1.12, 0.46, -0.07, R * 1.03),
          new THREE.MeshPhysicalMaterial({
            color: '#0c0c10',
            roughness: 0.3,
            metalness: 0.3,
            clearcoat: 0.8,
            polygonOffset: true,
            polygonOffsetFactor: -6,
            polygonOffsetUnits: -6,
          })
        );
        bezelMesh.renderOrder = 3;
        head.add(bezelMesh);

        const glassMesh = new THREE.Mesh(
          buildSphericalRoundedRect(THREE, 1.74, 1.0, 0.4, -0.07, R * 1.036),
          new THREE.MeshPhysicalMaterial({
            color: '#000000',
            roughness: 0.12,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            envMapIntensity: 0.9,
            polygonOffset: true,
            polygonOffsetFactor: -8,
            polygonOffsetUnits: -8,
          })
        );
        glassMesh.renderOrder = 4;
        head.add(glassMesh);

        const irisTex = createRadialTexture(THREE, [
          [0, '#ccf7e8'],
          [0.45, '#52d6aa'],
          [0.8, '#13966d'],
          [1, '#0b684b'],
        ]);

        for (const sx of [-1, 1]) {
          const x = sx * 0.43;
          const y = -0.08;
          const rEye = R * 1.055;
          const z = Math.sqrt(Math.max(0.01, rEye * rEye - x * x - y * y));
          const eyeGroup = new THREE.Group();
          eyeGroup.position.set(x, y, z);
          eyeGroup.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            eyeGroup.position.clone().normalize()
          );

          const haloMat = new THREE.MeshBasicMaterial({
            map: glowTex,
            color: 0x38c99a,
            opacity: 0.24,
            transparent: true,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
            depthWrite: false,
            depthTest: false,
          });
          const halo = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48), haloMat);
          halo.position.z = -0.004;
          halo.renderOrder = 9;
          eyeGroup.add(halo);
          eyeHaloMats.push(haloMat);

          const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.65, 1.55, 1.25),
            toneMapped: false,
            depthWrite: false,
            depthTest: false,
          });
          const ring = new THREE.Mesh(new THREE.RingGeometry(0.168, 0.212, 64), ringMat);
          ring.renderOrder = 10;
          eyeGroup.add(ring);
          eyeRingMats.push(ringMat);

          const iris = new THREE.Mesh(
            new THREE.CircleGeometry(0.17, 64),
            new THREE.MeshBasicMaterial({
              map: irisTex,
              color: new THREE.Color(1.0, 0.95, 1.15),
              toneMapped: false,
              depthWrite: false,
              depthTest: false,
            })
          );
          iris.position.z = 0.001;
          iris.renderOrder = 10;
          eyeGroup.add(iris);

          const pupilWrap = new THREE.Group();
          const pupil = new THREE.Mesh(
            new THREE.CircleGeometry(0.083, 48),
            new THREE.MeshBasicMaterial({
              color: '#07040f',
              toneMapped: false,
              depthWrite: false,
              depthTest: false,
            })
          );
          pupil.position.z = 0.003;
          pupil.renderOrder = 10;
          pupilWrap.add(pupil);

          const glint = new THREE.Mesh(
            new THREE.CircleGeometry(0.022, 32),
            new THREE.MeshBasicMaterial({
              color: '#ffffff',
              toneMapped: false,
              depthWrite: false,
              depthTest: false,
            })
          );
          glint.position.set(0.032, 0.034, 0.005);
          glint.renderOrder = 10;
          pupilWrap.add(glint);

          eyeGroup.add(pupilWrap);

          // Layered expression overlays inside eyeGroup (zero mesh alteration)
          const starMat = new THREE.MeshBasicMaterial({
            map: starEyeTex,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
            depthWrite: false,
            depthTest: false,
          });
          const starMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), starMat);
          starMesh.position.z = 0.008;
          starMesh.renderOrder = 11;
          eyeGroup.add(starMesh);
          starEyeMats.push(starMat);
          starEyeMeshes.push(starMesh);

          const heartMat = new THREE.MeshBasicMaterial({
            map: heartEyeTex,
            transparent: true,
            opacity: 0,
            toneMapped: false,
            depthWrite: false,
            depthTest: false,
          });
          const heartMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), heartMat);
          heartMesh.position.z = 0.009;
          heartMesh.renderOrder = 11;
          eyeGroup.add(heartMesh);
          heartEyeMats.push(heartMat);
          heartEyeMeshes.push(heartMesh);

          // Happy curved smile-arc overlay mounted on head at eye position (not squashed when eyeGroup scales)
          const happyArcMat = new THREE.MeshBasicMaterial({
            map: happyArcTex,
            transparent: true,
            opacity: 0,
            toneMapped: false,
            depthWrite: false,
            depthTest: false,
          });
          const happyArcMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.38), happyArcMat);
          happyArcMesh.position.set(x, y + 0.02, z + 0.012);
          happyArcMesh.quaternion.copy(eyeGroup.quaternion);
          happyArcMesh.renderOrder = 12;
          head.add(happyArcMesh);
          happyArcMats.push(happyArcMat);

          // Rosy cheek blush mounted smoothly on the lower visor surface
          const bx = sx * 0.56;
          const by = -0.34;
          const rBlush = R * 1.052;
          const bz = Math.sqrt(Math.max(0.01, rBlush * rBlush - bx * bx - by * by));
          const blushMat = new THREE.MeshBasicMaterial({
            map: blushTex,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
            depthWrite: false,
            depthTest: false,
          });
          const blushMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.2), blushMat);
          blushMesh.position.set(bx, by, bz);
          blushMesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            blushMesh.position.clone().normalize()
          );
          blushMesh.renderOrder = 9;
          head.add(blushMesh);
          blushMats.push(blushMat);

          head.add(eyeGroup);
          eyeGroups.push(eyeGroup);
          pupilWraps.push(pupilWrap);
        }

        const ballGeo = new THREE.SphereGeometry(0.118, 32, 24);
        const ballMat = new THREE.MeshPhysicalMaterial({
          color: '#38c99a',
          emissive: new THREE.Color('#109b72'),
          emissiveIntensity: 1.4,
          roughness: 0.22,
          clearcoat: 1,
          clearcoatRoughness: 0.14,
        });
        antennaBallMats.push(ballMat);

        for (const list of [topLeft, topRight]) {
          if (!list.length) continue;
          let top = list[0];
          for (const p of list) {
            if (p.y > top.y) top = p;
          }
          const sum = new THREE.Vector3();
          let count = 0;
          for (const p of list) {
            if (p.distanceTo(top) <= 0.2) {
              sum.add(p);
              count += 1;
            }
          }
          const centre = count ? sum.divideScalar(count) : top.clone();
          centre.y = Math.max(centre.y, top.y - 0.1);

          const ball = new THREE.Mesh(ballGeo, ballMat);
          ball.position.copy(centre);
          head.add(ball);

          const sp = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: glowTex,
              color: 0x52d6aa,
              opacity: 0.82,
              blending: THREE.AdditiveBlending,
              toneMapped: false,
              depthWrite: false,
              transparent: true,
            })
          );
          sp.scale.set(0.5, 0.5, 1);
          sp.position.copy(centre);
          head.add(sp);
          antennaGlows.push(sp);
        }
      };

      const arms: Array<{
        mesh: THREE.Group;
        x: number;
        y: number;
        z: number;
        rz: number;
        phase: number;
      }> = [];
      const armRestPoses = [
        { x: -1.32, y: -0.72, z: 0.15, rz: -0.62, phase: 0 },
        { x: 1.32, y: -0.72, z: 0.15, rz: 0.62, phase: Math.PI * 0.85 },
      ];

      const clearGroup = (grp: THREE.Group) => {
        while (grp.children.length > 0) {
          grp.remove(grp.children[0]);
        }
      };

      const populateRobot = (headRoot: THREE.Object3D, armTpl: THREE.Object3D) => {
        clearGroup(head);
        for (const a of arms) {
          body.remove(a.mesh);
        }
        arms.length = 0;
        eyeGroups.length = 0;
        pupilWraps.length = 0;
        antennaGlows.length = 0;
        antennaBallMats.length = 0;
        eyeHaloMats.length = 0;
        eyeRingMats.length = 0;
        starEyeMats.length = 0;
        starEyeMeshes.length = 0;
        heartEyeMats.length = 0;
        heartEyeMeshes.length = 0;
        happyArcMats.length = 0;
        blushMats.length = 0;

        mountHead(headRoot);

        const rawArms = [armTpl, armTpl.clone(true)];
        rawArms.forEach((raw, idx) => {
          const pose = armRestPoses[idx];
          const wrap = normaliseArm(THREE, raw);
          wrap.position.set(pose.x, pose.y, pose.z);
          wrap.rotation.z = pose.rz;
          body.add(wrap);
          arms.push({ mesh: wrap, ...pose });
        });
      };

      populateRobot(buildFallbackHead(THREE, mergeVertices), buildFallbackArm(THREE, mergeVertices));
      robot.scale.setScalar(1);
      setLoaderHidden(true);

      const gltfLoader = new GLTFLoader();
      let introReady = true;
      let disposed = false;
      let isVisible = false;
      let contextLost = false;
      let rafId = 0;

      const scheduleFrame = () => {
        if (disposed || contextLost || !isVisible || rafId !== 0) return;
        rafId = requestAnimationFrame(animate);
      };

      Promise.allSettled([
        gltfLoader.loadAsync(IRIS_HEAD_GLB),
        gltfLoader.loadAsync(IRIS_ARM_GLB),
      ]).then(([headRes, armRes]) => {
        if (disposed) return;

        let headRoot: THREE.Object3D;
        if (headRes.status === 'fulfilled' && headRes.value?.scene) {
          headRoot = headRes.value.scene;
          normaliseHead(THREE, headRoot);
          prepareModel(THREE, mergeVertices, headRoot, {
            glossy: true,
            useMap: false,
            tint: '#4a4a56',
            rim: { color: 0x38c99a, power: 4.5, strength: 0.32 },
          });
        } else {
          headRoot = buildFallbackHead(THREE, mergeVertices);
        }

        let armTpl: THREE.Object3D;
        if (armRes.status === 'fulfilled' && armRes.value?.scene) {
          armTpl = armRes.value.scene;
          prepareModel(THREE, mergeVertices, armTpl, {
            glossy: false,
            useMap: false,
            smooth: true,
            tint: '#1d1d23',
            rim: { color: 0x38c99a, power: 2.6, strength: 1.05 },
          });
        } else {
          armTpl = buildFallbackArm(THREE, mergeVertices);
        }

        populateRobot(headRoot, armTpl);
        setLoaderHidden(true);
        introReady = true;
        scheduleFrame();
      });

      let W = 1280;
      let H = 640;
      let isMobile = false;
      let robotHitRadius = 190;
      const anchor = { x: 830, y: 320 };

      const layout = () => {
        const rect = hero.getBoundingClientRect();
        W = Math.max(1, rect.width);
        H = Math.max(1, rect.height);
        isMobile = W <= 860;

        renderer?.setSize(W, H, false);
        composer.setSize(W, H);
        bloomPass.resolution.set(W, H);

        let robotPx: number;
        if (!isMobile) {
          robotPx = Math.min(H * 0.72, W * 0.42, 540);
          anchor.x = W * 0.67;
          anchor.y = H * 0.5;
        } else {
          const panelEl = panelRef.current;
          const panelTop = panelEl ? panelEl.getBoundingClientRect().top - rect.top : H * 0.46;
          const room = Math.max(panelTop - 24, 240);
          robotPx = Math.min(room * 0.88, W * 0.72);
          anchor.x = W / 2;
          anchor.y = 20 + room * 0.5;
        }
        robotHitRadius = Math.max(115, robotPx * 0.46);

        const fovRad = (camera.fov * Math.PI) / 180;
        camera.aspect = W / H;
        camera.position.z = (3.4 * H) / (robotPx * 2 * Math.tan(fovRad / 2));
        camera.setViewOffset(W, H, W / 2 - anchor.x, H / 2 - anchor.y, W, H);
        camera.updateProjectionMatrix();

        if (loaderRef.current) {
          loaderRef.current.style.left = `${anchor.x}px`;
          loaderRef.current.style.top = `${anchor.y}px`;
        }
        if (fallbackRef.current) {
          fallbackRef.current.style.left = `${anchor.x}px`;
          fallbackRef.current.style.top = `${anchor.y}px`;
        }
        if (emblemRef.current) {
          const ox = Math.min(robotPx * 0.34, 148);
          const oy = Math.min(robotPx * 0.34, 140);
          emblemRef.current.style.left = `${clamp(anchor.x + ox, 44, W - 44)}px`;
          emblemRef.current.style.top = `${clamp(anchor.y - oy, 44, H - 44)}px`;
        }
        scheduleFrame();
      };

      const ro = new ResizeObserver(layout);
      ro.observe(hero);
      layout();

      const target = { x: 0, y: 0 };
      const look = { x: 0, y: 0 };
      let lastMoveTime = -10;

      // Smooth 10-expression + 10-action state machine
      let currentExprSpec: ExpressionSpec = ROBOT_EXPRESSIONS[9]; // greeting
      let currentActionObj = ROBOT_ACTIONS[1]; // two_arm_wave
      let actionStartTime = performance.now() * 0.001 + 0.5;
      let nextMoodAt = performance.now() * 0.001 + 4.8 + Math.random() * 2.2;
      let burstStrength = 0.6;

      // Smoothed expression channels
      const exprBlend = {
        ringR: 0.65,
        ringG: 1.55,
        ringB: 1.25,
        haloOpacity: 0.24,
        blush: 0,
        star: 0,
        heart: 0,
        happyL: 0,
        happyR: 0,
        eyeScaleYL: 1,
        eyeScaleYR: 1,
        eyeScaleXL: 1,
        eyeScaleXR: 1,
      };
      const tmpColor = new THREE.Color();
      const targetHaloColor = new THREE.Color(currentExprSpec.haloHex);
      const targetAntennaColor = new THREE.Color(currentExprSpec.antennaHex);

      const triggerRandomMood = (nowSec?: number) => {
        const tNow = nowSec ?? performance.now() * 0.001;
        const nextExpr = pickNextRandom(ROBOT_EXPRESSIONS, currentExprSpec);
        const nextAct = pickNextRandom(ROBOT_ACTIONS, currentActionObj);
        currentExprSpec = nextExpr;
        currentActionObj = nextAct;
        actionStartTime = tNow;
        nextMoodAt = tNow + 4.5 + Math.random() * 2.5;
        burstStrength = 1.0;
        targetHaloColor.setHex(nextExpr.haloHex);
        targetAntennaColor.setHex(nextExpr.antennaHex);
        setActiveExpression(nextExpr.id);
        setActiveAction(nextAct.id);
        setMoodNonce((n) => n + 1);
      };
      triggerMoodRef.current = () => triggerRandomMood();

      const isPointOnRobot = (clientX: number, clientY: number): boolean => {
        const rect = hero.getBoundingClientRect();
        const lx = clientX - rect.left;
        const ly = clientY - rect.top;
        const dx = lx - anchor.x;
        const dy = ly - anchor.y;
        return dx * dx + dy * dy <= robotHitRadius * robotHitRadius;
      };

      const onPointer = (clientX: number, clientY: number) => {
        if (!isVisible) return;
        const rect = hero.getBoundingClientRect();
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;
        const rx = isMobile ? W * 0.5 : Math.max(W * 0.55, 500);
        const ry = isMobile ? H * 0.5 : Math.max(H * 0.55, 400);
        target.x = clamp((localX - anchor.x) / rx, -1.2, 1.2);
        target.y = clamp((localY - anchor.y) / ry, -1.2, 1.2);
        lastMoveTime = performance.now() * 0.001;
      };

      const handlePointerMove = (e: PointerEvent) => {
        onPointer(e.clientX, e.clientY);
        const overCanvas = e.target === canvas;
        setRobotHovered(overCanvas && isPointOnRobot(e.clientX, e.clientY));
      };
      const handlePointerDown = (e: PointerEvent) => {
        onPointer(e.clientX, e.clientY);
        if (e.target === canvas && isPointOnRobot(e.clientX, e.clientY)) {
          triggerRandomMood();
        }
      };
      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches && e.touches[0]) {
          onPointer(e.touches[0].clientX, e.touches[0].clientY);
        }
      };

      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerdown', handlePointerDown, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });

      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      let intro = 1;
      let prevTime = performance.now() * 0.001;
      let nextBlinkAt = prevTime + 2.5 + Math.random() * 3.5;
      let blinkStart = -1;

      const handleMotionChange = () => {
        if (!reducedMotionQuery.matches && isVisible) {
          scheduleFrame();
        }
      };
      reducedMotionQuery.addEventListener('change', handleMotionChange);

      const io = new IntersectionObserver((entries) => {
        const nowIntersecting = entries[0]?.isIntersecting ?? false;
        isVisible = nowIntersecting;
        if (nowIntersecting) {
          scheduleFrame();
        } else if (rafId !== 0) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      });
      io.observe(hero);

      const heroRectNow = hero.getBoundingClientRect();
      const vhNow = window.innerHeight || 900;
      if (heroRectNow.top <= vhNow && heroRectNow.bottom >= 0) {
        isVisible = true;
      }

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        contextLost = true;
        if (rafId !== 0) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        setWebglFallback(true);
      };
      const handleContextRestored = () => {
        contextLost = false;
        setWebglFallback(false);
        scheduleFrame();
      };
      canvas.addEventListener('webglcontextlost', handleContextLost, false);
      canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

      function animate(nowMs: number) {
        rafId = 0;
        if (disposed || contextLost || !isVisible) {
          prevTime = nowMs * 0.001;
          return;
        }

        const t = nowMs * 0.001;
        const dt = Math.min(0.05, Math.max(0.0001, t - prevTime));
        prevTime = t;

        const isReduced =
          reducedMotionQuery.matches ||
          document.documentElement.classList.contains('reduce-motion');
        if (isReduced) {
          look.x = 0;
          look.y = 0;
          robot.scale.setScalar(1);
          robot.position.set(0, 0, 0);
          head.rotation.set(0, 0, 0);
          body.rotation.set(0, 0, 0);
          for (const arm of arms) {
            arm.mesh.position.set(arm.x, arm.y, arm.z);
            arm.mesh.rotation.set(0, 0, arm.rz);
          }
          for (const pw of pupilWraps) {
            pw.position.set(0, 0, 0);
          }
          for (const eg of eyeGroups) {
            eg.scale.set(1, 1, 1);
          }
          for (const sm of starEyeMats) sm.opacity = 0;
          for (const hm of heartEyeMats) hm.opacity = 0;
          for (const am of happyArcMats) am.opacity = 0;
          for (const bm of blushMats) bm.opacity = 0.25;
          sparkleGroup.visible = false;
          floorGlow.scale.set(3.4, 0.42, 1);
          floorGlowMat.opacity = 0.78;
          for (const ag of antennaGlows) {
            (ag.material as THREE.SpriteMaterial).opacity = 0.78;
          }
          composer.render();
          return;
        }

        sparkleGroup.visible = true;

        // Auto-trigger a fresh cute expression + action every 4.5–7.0s
        if (t >= nextMoodAt) {
          triggerRandomMood(t);
        }
        burstStrength = Math.max(0, burstStrength - dt * 0.9);

        if (t - lastMoveTime > 3.5) {
          target.x = Math.sin(t * 0.45) * 0.45;
          target.y = Math.sin(t * 0.31 + 1.2) * 0.2;
        }

        const alpha = 1 - Math.pow(0.0025, dt);
        look.x += (target.x - look.x) * alpha;
        look.y += (target.y - look.y) * alpha;

        let baseScale = 1;
        if (introReady) {
          intro = Math.min(1, intro + dt * 1.4);
          const k = intro;
          const km1 = k - 1;
          baseScale = Math.max(0.001, 1 + 2.4 * km1 * km1 * km1 + 1.4 * km1 * km1);
        }

        // Compute smooth additive offsets for the 10 cute actions
        let actRobotX = 0;
        let actRobotY = 0;
        let actRobotZ = 0;
        let actScaleX = 1;
        let actScaleY = 1;
        let actBodyRotY = 0;
        let actBodyRotZ = 0;
        let actHeadRotX = 0;
        let actHeadRotY = 0;
        let actHeadRotZ = 0;
        let armLdx = 0;
        let armLdy = 0;
        let armLdz = 0;
        let armLdrz = 0;
        let armLdrx = 0;
        let armRdx = 0;
        let armRdy = 0;
        let armRdz = 0;
        let armRdrz = 0;
        let armRdrx = 0;
        let antBoostL = 0;
        let antBoostR = 0;

        const rawP = (t - actionStartTime) / currentActionObj.duration;
        if (rawP >= 0 && rawP <= 1) {
          const p = clamp(rawP, 0, 1);
          const env = Math.sin(p * Math.PI);
          const smoothInOut = p * p * (3 - 2 * p);

          switch (currentActionObj.id) {
            case 'double_hop': {
              const hop = Math.abs(Math.sin(p * Math.PI * 2));
              actRobotY = hop * 0.34 * env;
              actScaleY = 1 + (hop - 0.35) * 0.09 * env;
              actScaleX = 1 - (hop - 0.35) * 0.05 * env;
              armLdy = hop * 0.32 * env;
              armRdy = hop * 0.32 * env;
              armLdrz = -hop * 0.55 * env;
              armRdrz = hop * 0.55 * env;
              break;
            }
            case 'two_arm_wave': {
              const wave = Math.sin(p * Math.PI * 6);
              armLdy = 0.42 * env;
              armRdy = 0.42 * env;
              armLdrz = (-0.75 + wave * 0.38) * env;
              armRdrz = (0.75 + wave * 0.38) * env;
              actHeadRotZ = wave * 0.08 * env;
              actHeadRotX = -0.06 * env;
              break;
            }
            case 'shy_wiggle': {
              const wig = Math.sin(p * Math.PI * 4);
              actRobotX = wig * 0.14 * env;
              actBodyRotZ = wig * 0.1 * env;
              actHeadRotZ = -wig * 0.12 * env;
              armLdx = 0.14 * env;
              armRdx = -0.14 * env;
              armLdrz = 0.25 * env;
              armRdrz = -0.25 * env;
              break;
            }
            case 'twirl_360': {
              actBodyRotY = smoothInOut * Math.PI * 2;
              actRobotY = Math.sin(p * Math.PI) * 0.2;
              armLdx = -0.14 * env;
              armRdx = 0.14 * env;
              armLdrz = -0.42 * env;
              armRdrz = 0.42 * env;
              break;
            }
            case 'curious_tilt': {
              actHeadRotZ = 0.26 * env;
              actHeadRotX = 0.08 * env;
              actRobotZ = 0.36 * env;
              armRdy = 0.26 * env;
              armRdrz = 0.42 * env;
              armRdrx = -0.25 * env;
              break;
            }
            case 'cozy_bob': {
              actRobotX = Math.sin(p * Math.PI * 2) * 0.16 * env;
              actRobotY = Math.sin(p * Math.PI * 4) * 0.12 * env;
              actHeadRotZ = Math.sin(p * Math.PI * 2) * 0.08 * env;
              armLdy = Math.sin(p * Math.PI * 2) * 0.16 * env;
              armRdy = -Math.sin(p * Math.PI * 2) * 0.16 * env;
              break;
            }
            case 'antenna_bounce': {
              const pulse = Math.sin(p * Math.PI * 6);
              actRobotY = Math.abs(pulse) * 0.16 * env;
              actHeadRotX = -Math.abs(pulse) * 0.09 * env;
              antBoostL = (0.5 + 0.5 * pulse) * env;
              antBoostR = (0.5 - 0.5 * pulse) * env;
              armLdy = (0.14 + Math.max(0, pulse) * 0.2) * env;
              armRdy = (0.14 + Math.max(0, -pulse) * 0.2) * env;
              break;
            }
            case 'peekaboo': {
              const dip = p < 0.42 ? -Math.sin((p / 0.42) * Math.PI) * 0.44 : Math.sin(((p - 0.42) / 0.58) * Math.PI) * 0.26;
              actRobotY = dip;
              actHeadRotX = p < 0.42 ? 0.22 * env : -0.1 * env;
              const open = p >= 0.42 ? Math.sin(((p - 0.42) / 0.58) * Math.PI) : 0;
              armLdx = -0.18 * open;
              armRdx = 0.18 * open;
              armLdy = 0.36 * open;
              armRdy = 0.36 * open;
              armLdrz = -0.6 * open;
              armRdrz = 0.6 * open;
              break;
            }
            case 'shimmy_dance': {
              const groove = Math.sin(p * Math.PI * 6);
              actBodyRotZ = groove * 0.12 * env;
              actHeadRotY = -groove * 0.16 * env;
              actRobotY = Math.abs(groove) * 0.11 * env;
              armLdy = (0.2 + groove * 0.22) * env;
              armRdy = (0.2 - groove * 0.22) * env;
              armLdrz = (-0.35 + groove * 0.25) * env;
              armRdrz = (0.35 + groove * 0.25) * env;
              break;
            }
            case 'victory_spin': {
              actBodyRotY = smoothInOut * Math.PI * 2;
              actRobotY = Math.sin(p * Math.PI) * 0.32;
              armLdy = 0.48 * env;
              armRdy = 0.48 * env;
              armLdrz = -0.88 * env;
              armRdrz = 0.88 * env;
              antBoostL = 0.5 * env;
              antBoostR = 0.5 * env;
              break;
            }
          }
        }

        // Subtle rhythmic music groove when expression === 'music'
        const musicBeat = currentExprSpec.id === 'music' ? Math.sin(t * 7.2) : 0;
        if (currentExprSpec.id === 'music') {
          actHeadRotZ += musicBeat * 0.055;
          actRobotY += Math.abs(musicBeat) * 0.04;
        } else if (currentExprSpec.id === 'curious') {
          actHeadRotZ += 0.12;
        }

        const bob = Math.sin(t * 1.6) * 0.09;
        robot.position.set(actRobotX, bob + actRobotY, actRobotZ);
        robot.scale.set(baseScale * actScaleX, baseScale * actScaleY, baseScale * actScaleX);

        head.rotation.y = look.x * 0.5 + actHeadRotY;
        head.rotation.x = look.y * 0.42 + actHeadRotX;
        head.rotation.z = -look.x * 0.06 + Math.sin(t * 1.1) * 0.015 + actHeadRotZ;

        body.rotation.y = look.x * 0.28 + actBodyRotY;
        body.rotation.x = look.y * 0.12;
        body.rotation.z = actBodyRotZ;

        arms.forEach((arm, idx) => {
          const w = Math.sin(t * 2.0 + arm.phase);
          const signX = Math.sign(arm.x);
          const dx = idx === 0 ? armLdx : armRdx;
          const dy = idx === 0 ? armLdy : armRdy;
          const dz = idx === 0 ? armLdz : armRdz;
          const drz = idx === 0 ? armLdrz : armRdrz;
          const drx = idx === 0 ? armLdrx : armRdrx;
          arm.mesh.position.y = arm.y + w * 0.13 - bob * 0.35 + dy;
          arm.mesh.position.x = arm.x + signX * look.x * -0.04 + dx;
          arm.mesh.position.z = arm.z + dz;
          arm.mesh.rotation.z = arm.rz + w * 0.12 * signX + drz;
          arm.mesh.rotation.x = Math.sin(t * 1.3 + arm.phase) * 0.08 + drx;
        });

        const shyOffsetX = currentExprSpec.id === 'shy' ? 0.025 : 0;
        const shyOffsetY = currentExprSpec.id === 'shy' ? -0.022 : 0;
        const px = clamp(look.x * 0.075 + shyOffsetX, -0.07, 0.07);
        const py = clamp(-look.y * 0.06 + shyOffsetY, -0.06, 0.06);
        for (const pw of pupilWraps) {
          pw.position.set(px, py, 0);
        }

        // Smoothly interpolate expression channels
        const eAlpha = 1 - Math.pow(0.001, dt);
        exprBlend.ringR += (currentExprSpec.ringColor[0] - exprBlend.ringR) * eAlpha;
        exprBlend.ringG += (currentExprSpec.ringColor[1] - exprBlend.ringG) * eAlpha;
        exprBlend.ringB += (currentExprSpec.ringColor[2] - exprBlend.ringB) * eAlpha;
        exprBlend.haloOpacity += (currentExprSpec.haloOpacity - exprBlend.haloOpacity) * eAlpha;
        exprBlend.blush += (currentExprSpec.blushOpacity - exprBlend.blush) * eAlpha;
        exprBlend.star += (currentExprSpec.starOpacity - exprBlend.star) * eAlpha;
        exprBlend.heart += (currentExprSpec.heartOpacity - exprBlend.heart) * eAlpha;
        exprBlend.happyL += (currentExprSpec.happyArcLeft - exprBlend.happyL) * eAlpha;
        exprBlend.happyR += (currentExprSpec.happyArcRight - exprBlend.happyR) * eAlpha;
        exprBlend.eyeScaleYL += (currentExprSpec.leftEyeScaleY - exprBlend.eyeScaleYL) * eAlpha;
        exprBlend.eyeScaleYR += (currentExprSpec.rightEyeScaleY - exprBlend.eyeScaleYR) * eAlpha;
        exprBlend.eyeScaleXL += (currentExprSpec.leftEyeScaleX - exprBlend.eyeScaleXL) * eAlpha;
        exprBlend.eyeScaleXR += (currentExprSpec.rightEyeScaleX - exprBlend.eyeScaleXR) * eAlpha;

        if (t >= nextBlinkAt) {
          blinkStart = t;
          nextBlinkAt = t + 2.5 + Math.random() * 3.5;
        }
        let blinkFactor = 1;
        if (blinkStart > 0) {
          const bp = (t - blinkStart) / 0.32;
          if (bp >= 1) {
            blinkStart = -1;
            blinkFactor = 1;
          } else {
            const tri = bp < 0.5 ? bp * 2 : (1 - bp) * 2;
            blinkFactor = 1 - tri * (1 - 0.08);
          }
        }

        const sleepyBreath =
          currentExprSpec.id === 'sleepy' ? 1 + Math.sin(t * 2.1) * 0.14 : 1;

        eyeGroups.forEach((eg, idx) => {
          const sy = (idx === 0 ? exprBlend.eyeScaleYL : exprBlend.eyeScaleYR) * sleepyBreath;
          const sx = idx === 0 ? exprBlend.eyeScaleXL : exprBlend.eyeScaleXR;
          eg.scale.set(sx, sy * blinkFactor, 1);
        });

        for (const rm of eyeRingMats) {
          rm.color.setRGB(exprBlend.ringR, exprBlend.ringG, exprBlend.ringB);
        }
        for (const hm of eyeHaloMats) {
          hm.color.lerp(targetHaloColor, eAlpha);
          hm.opacity = exprBlend.haloOpacity + burstStrength * 0.14;
        }
        for (const bm of blushMats) {
          bm.opacity = exprBlend.blush;
        }
        starEyeMats.forEach((sm, idx) => {
          sm.opacity = exprBlend.star * (0.85 + 0.15 * Math.sin(t * 7 + idx));
          const mesh = starEyeMeshes[idx];
          if (mesh) {
            mesh.rotation.z = t * 1.4 * (idx === 0 ? 1 : -1);
            const sc = 0.92 + Math.sin(t * 6 + idx) * 0.1;
            mesh.scale.set(sc, sc, 1);
          }
        });
        heartEyeMats.forEach((hm, idx) => {
          hm.opacity = exprBlend.heart;
          const mesh = heartEyeMeshes[idx];
          if (mesh) {
            const beat = 0.94 + Math.abs(Math.sin(t * 4.4)) * 0.14;
            mesh.scale.set(beat, beat, 1);
          }
        });
        happyArcMats.forEach((am, idx) => {
          am.opacity = idx === 0 ? exprBlend.happyL : exprBlend.happyR;
        });

        floorGlow.scale.set(3.4 - bob * 3, 0.42 - bob * 0.4, 1);
        floorGlowMat.opacity = 0.7 + (0.09 - bob) * 1.5;
        floorGlowMat.color.lerp(targetHaloColor, eAlpha * 0.5);

        const antBaseOp = 0.7 * (0.85 + Math.sin(t * 1.6) * 0.15) + 0.15;
        for (const bMat of antennaBallMats) {
          bMat.color.lerp(targetAntennaColor, eAlpha);
          bMat.emissive.lerp(targetAntennaColor, eAlpha);
          bMat.emissiveIntensity = 1.35 + burstStrength * 0.75 + (antBoostL + antBoostR) * 0.45;
        }
        antennaGlows.forEach((ag, idx) => {
          const mat = ag.material as THREE.SpriteMaterial;
          const musicAlt =
            currentExprSpec.id === 'music' ? Math.sin(t * 7.2 + idx * Math.PI) * 0.18 : 0;
          const boost = idx === 0 ? antBoostL : antBoostR;
          mat.opacity = clamp(antBaseOp + boost * 0.35 + burstStrength * 0.2 + musicAlt, 0.2, 1);
          mat.color.lerp(targetAntennaColor, eAlpha);
          const sc = 0.5 + boost * 0.22 + burstStrength * 0.15;
          ag.scale.set(sc, sc, 1);
        });

        // Animate ambient floating sparkles around robot
        const isLightTheme = themeRef.current === 'light';
        for (let i = 0; i < ambientSparkles.length; i += 1) {
          const sp = ambientSparkles[i];
          const ang = sp.angle + t * sp.speed;
          const rad = sp.radius + burstStrength * 0.35 + Math.sin(t * 1.4 + sp.phase) * 0.12;
          sp.sprite.position.set(
            Math.cos(ang) * rad + actRobotX * 0.35,
            sp.yBase + Math.sin(t * 1.7 + sp.phase) * 0.22 + bob * 0.4,
            Math.sin(ang) * rad * 0.55 - 0.25
          );
          const twinkle = 0.45 + 0.55 * Math.sin(t * 3.4 + sp.phase);
          const sc = sp.baseScale * (0.78 + twinkle * 0.45 + burstStrength * 0.38);
          sp.sprite.scale.set(sc, sc, 1);
          const baseOp = isLightTheme ? 0.32 : 0.55;
          sp.mat.opacity = clamp(baseOp * twinkle + burstStrength * 0.28, 0.08, 0.92);
          if (burstStrength > 0.2 && i % 3 === 0) {
            tmpColor.copy(targetAntennaColor);
            sp.mat.color.lerp(tmpColor, 0.08);
          }
        }

        composer.render();
        scheduleFrame();
      }

      scheduleFrame();

      const disposeObjectTree = (rootObj: THREE.Object3D) => {
        rootObj.traverse((node) => {
          const meshNode = node as THREE.Mesh;
          if (meshNode.geometry) {
            meshNode.geometry.dispose();
          }
          const mat = meshNode.material;
          if (Array.isArray(mat)) {
            mat.forEach((mItem) => mItem.dispose());
          } else if (mat) {
            mat.dispose();
          }
        });
      };

      cleanupScene = () => {
        applySceneThemeRef.current = null;
        triggerMoodRef.current = null;
        disposed = true;
        if (rafId) cancelAnimationFrame(rafId);
        ro.disconnect();
        io.disconnect();
        reducedMotionQuery.removeEventListener('change', handleMotionChange);
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('touchmove', handleTouchMove);
        disposeObjectTree(scene);
        disposeObjectTree(envScene);
        composer.dispose();
        pmrem.dispose();
        envTarget.dispose();
        glowTex.dispose();
        blushTex.dispose();
        starEyeTex.dispose();
        heartEyeTex.dispose();
        happyArcTex.dispose();
        ambientSparkleTex.dispose();
        renderer?.dispose();
      };
    })();

    return () => {
      cancelled = true;
      cleanupScene?.();
    };
  }, [shouldBootScene]);

  const currentExprMeta = EXPRESSION_BY_ID.get(activeExpression) ?? ROBOT_EXPRESSIONS[9];

  const handleFallbackTap = () => {
    const nextExpr = pickNextRandom(ROBOT_EXPRESSIONS, currentExprMeta);
    const nextAct = pickNextRandom(
      ROBOT_ACTIONS,
      ROBOT_ACTIONS.find((a) => a.id === activeAction) ?? ROBOT_ACTIONS[0]
    );
    setActiveExpression(nextExpr.id);
    setActiveAction(nextAct.id);
    setMoodNonce((n) => n + 1);
  };

  return (
    <section
      id={`iris-qr-${contextLabel}`}
      aria-label="Không gian Robot 3D, mã QR và Đội ngũ phát triển F-Forum"
      className="iris-qr-section"
    >
      <div
        ref={heroRef}
        className="iris-hero"
        data-expression={activeExpression}
        data-action={activeAction}
      >
        <canvas
          ref={canvasRef}
          className={`iris-stage-canvas ${robotHovered ? 'is-robot-hover' : ''}`}
          aria-hidden="true"
        />
        <div
          ref={loaderRef}
          className={`iris-loader ${loaderHidden ? 'hide' : ''}`}
          aria-hidden="true"
        />

        <div ref={emblemRef} className="iris-mood-anchor" aria-hidden="true">
          <div
            key={`${activeExpression}-${moodNonce}`}
            className="iris-mood-emblem"
            data-tone={currentExprMeta.tone}
          >
            <MoodEmblemSvg expression={activeExpression} />
          </div>
        </div>

        {webglFallback && (
          <button
            ref={fallbackRef}
            type="button"
            className="iris-fallback-bot"
            onClick={handleFallbackTap}
            aria-label="Chạm vào robot Iris để đổi biểu cảm"
            title="Đổi biểu cảm"
          >
            <svg viewBox="0 0 240 240" width="220" height="220">
              <defs>
                <radialGradient id="irisBotHead" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#6a6a7c" />
                  <stop offset="55%" stopColor="#353542" />
                  <stop offset="100%" stopColor="#16161e" />
                </radialGradient>
              </defs>
              <circle cx="82" cy="36" r="10" fill="#38c99a" />
              <circle cx="158" cy="36" r="10" fill="#38c99a" />
              <line x1="86" y1="44" x2="96" y2="70" stroke="#4a5856" strokeWidth="6" strokeLinecap="round" />
              <line x1="154" y1="44" x2="144" y2="70" stroke="#4a5856" strokeWidth="6" strokeLinecap="round" />
              <circle cx="120" cy="128" r="68" fill="url(#irisBotHead)" stroke="#38c99a" strokeOpacity="0.45" strokeWidth="2" />
              <rect x="68" y="98" width="104" height="58" rx="26" fill="#060a09" stroke="#1d2826" strokeWidth="3" />
              <circle cx="98" cy="126" r="13" fill="#109b72" stroke="#ccf7e8" strokeWidth="3" />
              <circle cx="98" cy="126" r="6" fill="#040d0a" />
              <circle cx="101" cy="123" r="2.2" fill="#ffffff" />
              <circle cx="142" cy="126" r="13" fill="#109b72" stroke="#ccf7e8" strokeWidth="3" />
              <circle cx="142" cy="126" r="6" fill="#040d0a" />
              <circle cx="145" cy="123" r="2.2" fill="#ffffff" />
            </svg>
          </button>
        )}

        <div className="iris-hero-inner">
          <div ref={panelRef} className="iris-harmony-dock">
            <button
              type="button"
              className="iris-qr-plate"
              onClick={() => setQrModalOpen(true)}
              aria-label="Phóng to mã QR F-Forum"
              title="Phóng to QR"
            >
              <img
                src={IRIS_QR_CODE_URL}
                alt="Mã QR kết nối F-Forum"
                className="iris-qr-img"
                loading="eager"
                decoding="sync"
              />
            </button>

            <div className="iris-dock-actions">
              <button
                type="button"
                className="iris-honor-btn"
                onClick={() => go('honor')}
                title="Gặp gỡ đội ngũ :3"
              >
                <span className="iris-honor-btn-glow" aria-hidden="true" />
                <span className="iris-honor-btn-label">Gặp đội ngũ :3</span>
              </button>

              <button
                type="button"
                className="iris-feedback-btn"
                onClick={() => setFeedbackOpen(true)}
                title="Gửi góp ý cho F-Forum"
              >
                <IconMessageSquare size={17} aria-hidden="true" />
                <span className="iris-honor-btn-label">Feedback</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {qrModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="iris-qr-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Mã QR phóng to"
            onClick={() => setQrModalOpen(false)}
          >
            <div className="iris-qr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="iris-qr-modal-frame">
                <img src={IRIS_QR_CODE_URL} alt="Mã QR kết nối F-Forum" />
              </div>
              <div className="iris-qr-modal-actions">
                <a
                  href={IRIS_QR_CODE_URL}
                  download="fforum-qr-code.png"
                  className="iris-qr-btn"
                >
                  Tải mã QR
                </a>
                <button
                  type="button"
                  className="iris-qr-btn iris-qr-btn--ghost"
                  onClick={() => setQrModalOpen(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </section>
  );
};

export default IrisQrCornerSection;
