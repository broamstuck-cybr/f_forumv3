import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Users } from 'lucide-react';
import type { DimensionView } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  IRIS_ARM_GLB,
  IRIS_HEAD_GLB,
  IRIS_QR_CODE_URL,
} from '../../data/irisRobotHtml';
import './iris-qr-corner.css';

export interface IrisQrCornerSectionProps {
  onNavigate?: (view: DimensionView) => void;
  contextLabel?: 'home' | 'landing';
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function createRadialTexture(stops: Array<[number, string]>, size = 256): THREE.CanvasTexture {
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

function createRimMaterial(color: number, power: number, strength: number): THREE.ShaderMaterial {
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

function subdivideNonIndexed(geo: THREE.BufferGeometry, rounds = 3): THREE.BufferGeometry {
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
  const geo = subdivideNonIndexed(baseGeo, 3);
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

function prepareModel(root: THREE.Object3D, opts: PrepareModelOpts): void {
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
        createRimMaterial(opts.rim.color, opts.rim.power, opts.rim.strength)
      );
      shell.renderOrder = 2;
      shell.userData.isRimShell = true;
      m.add(shell);
    }
  }
}

function normaliseHead(root: THREE.Object3D): void {
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

function normaliseArm(root: THREE.Object3D): THREE.Group {
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

function buildFallbackHead(): THREE.Group {
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
  prepareModel(g, {
    glossy: true,
    useMap: false,
    tint: '#4a4a56',
    rim: { color: 0x38c99a, power: 4.5, strength: 0.32 },
  });
  return g;
}

function buildFallbackArm(): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.42, 16, 32),
    new THREE.MeshPhysicalMaterial({ color: '#1b1b21', roughness: 0.48, clearcoat: 0.3 })
  );
  g.add(m);
  prepareModel(g, {
    glossy: false,
    useMap: false,
    tint: '#1d1d23',
    rim: { color: 0x38c99a, power: 2.6, strength: 1.05 },
  });
  return g;
}

export const IrisQrCornerSection: React.FC<IrisQrCornerSectionProps> = ({
  onNavigate,
  contextLabel = 'landing',
}) => {
  const { navigate } = useAppStore();
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  const [loaderHidden, setLoaderHidden] = useState(false);
  const [webglFallback, setWebglFallback] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const go = (view: DimensionView) => {
    if (onNavigate) onNavigate(view);
    else navigate(view);
  };

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
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas || typeof window === 'undefined') return undefined;

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
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c1212');

    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

    const glowTex = createRadialTexture([
      [0, 'rgba(56,201,154,1)'],
      [0.25, 'rgba(16,155,114,.52)'],
      [0.6, 'rgba(11,122,89,.12)'],
      [1, 'rgba(8,70,54,0)'],
    ]);

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
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.4, 0.92);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

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

    const eyeGroups: THREE.Group[] = [];
    const pupilWraps: THREE.Group[] = [];
    const antennaGlows: THREE.Sprite[] = [];

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
        buildSphericalRoundedRect(1.86, 1.12, 0.46, -0.07, R * 1.03),
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
        buildSphericalRoundedRect(1.74, 1.0, 0.4, -0.07, R * 1.036),
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

      const irisTex = createRadialTexture([
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

        const halo = new THREE.Mesh(
          new THREE.CircleGeometry(0.42, 48),
          new THREE.MeshBasicMaterial({
            map: glowTex,
            color: 0x38c99a,
            opacity: 0.24,
            transparent: true,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
            depthWrite: false,
            depthTest: false,
          })
        );
        halo.position.z = -0.004;
        halo.renderOrder = 9;
        eyeGroup.add(halo);

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.168, 0.212, 64),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(0.65, 1.55, 1.25),
            toneMapped: false,
            depthWrite: false,
            depthTest: false,
          })
        );
        ring.renderOrder = 10;
        eyeGroup.add(ring);

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

      mountHead(headRoot);

      const rawArms = [armTpl, armTpl.clone(true)];
      rawArms.forEach((raw, idx) => {
        const pose = armRestPoses[idx];
        const wrap = normaliseArm(raw);
        wrap.position.set(pose.x, pose.y, pose.z);
        wrap.rotation.z = pose.rz;
        body.add(wrap);
        arms.push({ mesh: wrap, ...pose });
      });
    };

    populateRobot(buildFallbackHead(), buildFallbackArm());
    robot.scale.setScalar(1);
    setLoaderHidden(true);

    const gltfLoader = new GLTFLoader();
    let introReady = true;
    let disposed = false;
    let forceRenderFrames = 3;

    Promise.allSettled([
      gltfLoader.loadAsync(IRIS_HEAD_GLB),
      gltfLoader.loadAsync(IRIS_ARM_GLB),
    ]).then(([headRes, armRes]) => {
      if (disposed) return;

      let headRoot: THREE.Object3D;
      if (headRes.status === 'fulfilled' && headRes.value?.scene) {
        headRoot = headRes.value.scene;
        normaliseHead(headRoot);
        prepareModel(headRoot, {
          glossy: true,
          useMap: false,
          tint: '#4a4a56',
          rim: { color: 0x38c99a, power: 4.5, strength: 0.32 },
        });
      } else {
        headRoot = buildFallbackHead();
      }

      let armTpl: THREE.Object3D;
      if (armRes.status === 'fulfilled' && armRes.value?.scene) {
        armTpl = armRes.value.scene;
        prepareModel(armTpl, {
          glossy: false,
          useMap: false,
          smooth: true,
          tint: '#1d1d23',
          rim: { color: 0x38c99a, power: 2.6, strength: 1.05 },
        });
      } else {
        armTpl = buildFallbackArm();
      }

      populateRobot(headRoot, armTpl);
      setLoaderHidden(true);
      introReady = true;
      forceRenderFrames = 4;
    });

    let W = 1280;
    let H = 640;
    let isMobile = false;
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
        anchor.x = W * 0.65;
        anchor.y = H * 0.5;
      } else {
        const panelEl = panelRef.current;
        const panelTop = panelEl ? panelEl.getBoundingClientRect().top - rect.top : H * 0.52;
        const room = Math.max(panelTop - 24, 240);
        robotPx = Math.min(room * 0.9, W * 0.76);
        anchor.x = W / 2;
        anchor.y = 20 + room * 0.5;
      }

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
      forceRenderFrames = Math.max(forceRenderFrames, 5);
    };

    const ro = new ResizeObserver(layout);
    ro.observe(hero);
    layout();

    const target = { x: 0, y: 0 };
    const look = { x: 0, y: 0 };
    let lastMoveTime = -10;

    const onPointer = (clientX: number, clientY: number) => {
      const rect = hero.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const rx = isMobile ? W * 0.5 : Math.max(W * 0.55, 500);
      const ry = isMobile ? H * 0.5 : Math.max(H * 0.55, 400);
      target.x = clamp((localX - anchor.x) / rx, -1.2, 1.2);
      target.y = clamp((localY - anchor.y) / ry, -1.2, 1.2);
      lastMoveTime = performance.now() * 0.001;
    };

    const handlePointerMove = (e: PointerEvent) => onPointer(e.clientX, e.clientY);
    const handlePointerDown = (e: PointerEvent) => onPointer(e.clientX, e.clientY);
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
    let isVisible = true;
    let rafId = 0;

    const io = new IntersectionObserver((entries) => {
      const nowIntersecting = entries[0]?.isIntersecting ?? true;
      if (nowIntersecting && !isVisible) {
        forceRenderFrames = Math.max(forceRenderFrames, 3);
      }
      isVisible = nowIntersecting;
    });
    io.observe(hero);

    let contextLost = false;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      setWebglFallback(true);
    };
    const handleContextRestored = () => {
      contextLost = false;
      setWebglFallback(false);
      forceRenderFrames = Math.max(forceRenderFrames, 5);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    const animate = (nowMs: number) => {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);
      if (contextLost || (!isVisible && forceRenderFrames <= 0)) {
        prevTime = nowMs * 0.001;
        return;
      }
      if (forceRenderFrames > 0) {
        forceRenderFrames -= 1;
      }

      const t = nowMs * 0.001;
      const dt = Math.min(0.05, Math.max(0.0001, t - prevTime));
      prevTime = t;

      if (t - lastMoveTime > 3.5) {
        target.x = Math.sin(t * 0.45) * 0.45;
        target.y = Math.sin(t * 0.31 + 1.2) * 0.2;
      }

      const alpha = 1 - Math.pow(0.0025, dt);
      look.x += (target.x - look.x) * alpha;
      look.y += (target.y - look.y) * alpha;

      if (introReady) {
        intro = Math.min(1, intro + dt * 1.4);
        const k = intro;
        const km1 = k - 1;
        const scale = 1 + 2.4 * km1 * km1 * km1 + 1.4 * km1 * km1;
        robot.scale.setScalar(Math.max(0.001, scale));
      }

      const m = reducedMotionQuery.matches ? 0.25 : 1;
      const bob = Math.sin(t * 1.6) * 0.09 * m;
      robot.position.y = bob;

      head.rotation.y = look.x * 0.5;
      head.rotation.x = look.y * 0.42;
      head.rotation.z = -look.x * 0.06 + Math.sin(t * 1.1) * 0.015 * m;

      body.rotation.y = look.x * 0.28;
      body.rotation.x = look.y * 0.12;

      for (const arm of arms) {
        const w = Math.sin(t * 2.0 + arm.phase);
        const signX = Math.sign(arm.x);
        arm.mesh.position.y = arm.y + w * 0.13 * m - bob * 0.35;
        arm.mesh.position.x = arm.x + signX * look.x * -0.04;
        arm.mesh.rotation.z = arm.rz + w * 0.12 * signX * m;
        arm.mesh.rotation.x = Math.sin(t * 1.3 + arm.phase) * 0.08 * m;
      }

      const px = clamp(look.x * 0.075, -0.07, 0.07);
      const py = clamp(-look.y * 0.06, -0.06, 0.06);
      for (const pw of pupilWraps) {
        pw.position.set(px, py, 0);
      }

      if (t >= nextBlinkAt) {
        blinkStart = t;
        nextBlinkAt = t + 2.5 + Math.random() * 3.5;
      }
      let eyeScaleY = 1;
      if (blinkStart > 0) {
        const bp = (t - blinkStart) / 0.32;
        if (bp >= 1) {
          blinkStart = -1;
          eyeScaleY = 1;
        } else {
          const tri = bp < 0.5 ? bp * 2 : (1 - bp) * 2;
          eyeScaleY = 1 - tri * (1 - 0.08);
        }
      }
      for (const eg of eyeGroups) {
        eg.scale.y = eyeScaleY;
      }

      floorGlow.scale.set(3.4 - bob * 3, 0.42 - bob * 0.4, 1);
      floorGlowMat.opacity = 0.7 + (0.09 - bob) * 1.5;

      const antOp = 0.7 * (0.85 + Math.sin(t * 1.6) * 0.15) + 0.15;
      for (const ag of antennaGlows) {
        (ag.material as THREE.SpriteMaterial).opacity = antOp;
      }

      composer.render();
    };

    rafId = requestAnimationFrame(animate);

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

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
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
      renderer?.dispose();
    };
  }, []);

  return (
    <section
      id={`iris-qr-${contextLabel}`}
      aria-label="Không gian Robot 3D, mã QR và Khu Vinh Danh Đội Ngũ Phát Triển FPT Forum"
      className="iris-qr-section"
    >
      <div ref={heroRef} className="iris-hero">
        <canvas ref={canvasRef} className="iris-stage-canvas" aria-hidden="true" />
        <div
          ref={loaderRef}
          className={`iris-loader ${loaderHidden ? 'hide' : ''}`}
          aria-hidden="true"
        />

        {webglFallback && (
          <div ref={fallbackRef} className="iris-fallback-bot" aria-hidden="true">
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
          </div>
        )}

        <div className="iris-hero-inner">
          <div ref={panelRef} className="iris-harmony-dock">
            <button
              type="button"
              className="iris-qr-plate"
              onClick={() => setQrModalOpen(true)}
              aria-label="Phóng to mã QR FPT Forum"
              title="Nhấn để phóng to mã QR"
            >
              <img
                src={IRIS_QR_CODE_URL}
                alt="Mã QR kết nối FPT Forum"
                className="iris-qr-img"
                loading="eager"
                decoding="sync"
              />
            </button>

            <button
              type="button"
              className="iris-honor-btn"
              onClick={() => go('honor')}
              aria-label="Mở Phòng Vinh Danh 3D đội ngũ phát triển FPT Forum"
            >
              <span className="iris-honor-btn-glow" aria-hidden="true" />
              <span className="iris-honor-btn-icon" aria-hidden="true">
                <Users size={17} strokeWidth={2} />
              </span>
              <span className="iris-honor-btn-label">Gặp gỡ đội ngũ phát triển của tôi :)</span>
            </button>
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
                <img src={IRIS_QR_CODE_URL} alt="Mã QR kết nối FPT Forum" />
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
    </section>
  );
};

export default IrisQrCornerSection;
