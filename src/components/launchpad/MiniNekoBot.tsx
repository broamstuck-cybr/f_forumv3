import React, { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import './mini-neko-bot.css';

export interface MiniNekoBotProps {
  theme: 'dark' | 'light';
}

type NekoMoodId = 'idle' | 'happy' | 'heart' | 'starry' | 'wink' | 'shy' | 'curious';

interface NekoMoodSpec {
  id: NekoMoodId;
  eyeHex: number;
  earGlowHex: number;
  blushHex: number;
  blushOpacity: number;
  arcLeft: number;
  arcRight: number;
  leftScaleY: number;
  rightScaleY: number;
  heartOpacity: number;
  starOpacity: number;
}

const NEKO_MOODS: NekoMoodSpec[] = [
  {
    id: 'idle',
    eyeHex: 0x4ce0b0,
    earGlowHex: 0x52d6aa,
    blushHex: 0xf29b88,
    blushOpacity: 0.42,
    arcLeft: 0,
    arcRight: 0,
    leftScaleY: 1,
    rightScaleY: 1,
    heartOpacity: 0,
    starOpacity: 0,
  },
  {
    id: 'happy',
    eyeHex: 0x57e8b9,
    earGlowHex: 0x62ebbd,
    blushHex: 0xf49888,
    blushOpacity: 0.68,
    arcLeft: 1,
    arcRight: 1,
    leftScaleY: 0.06,
    rightScaleY: 0.06,
    heartOpacity: 0,
    starOpacity: 0,
  },
  {
    id: 'heart',
    eyeHex: 0xff8ea8,
    earGlowHex: 0xff9eb5,
    blushHex: 0xff7b9c,
    blushOpacity: 0.85,
    arcLeft: 0,
    arcRight: 0,
    leftScaleY: 0.04,
    rightScaleY: 0.04,
    heartOpacity: 1,
    starOpacity: 0,
  },
  {
    id: 'starry',
    eyeHex: 0xf7cf76,
    earGlowHex: 0xf5c469,
    blushHex: 0xf29f7e,
    blushOpacity: 0.5,
    arcLeft: 0,
    arcRight: 0,
    leftScaleY: 0.04,
    rightScaleY: 0.04,
    heartOpacity: 0,
    starOpacity: 1,
  },
  {
    id: 'wink',
    eyeHex: 0x4ce0b0,
    earGlowHex: 0x76e8c2,
    blushHex: 0xf49b88,
    blushOpacity: 0.56,
    arcLeft: 0,
    arcRight: 1,
    leftScaleY: 1.06,
    rightScaleY: 0.06,
    heartOpacity: 0,
    starOpacity: 0,
  },
  {
    id: 'shy',
    eyeHex: 0xf0b284,
    earGlowHex: 0xf2a58c,
    blushHex: 0xf47f86,
    blushOpacity: 0.9,
    arcLeft: 1,
    arcRight: 1,
    leftScaleY: 0.06,
    rightScaleY: 0.06,
    heartOpacity: 0,
    starOpacity: 0,
  },
  {
    id: 'curious',
    eyeHex: 0x7ad7e4,
    earGlowHex: 0x7ad7e4,
    blushHex: 0xf09b8a,
    blushOpacity: 0.3,
    arcLeft: 0,
    arcRight: 0,
    leftScaleY: 1.14,
    rightScaleY: 0.72,
    heartOpacity: 0,
    starOpacity: 0,
  },
];

function createHeartGeometry(THREEMod: typeof THREE, size: number): THREE.ShapeGeometry {
  const s = new THREEMod.Shape();
  s.moveTo(0, -size * 0.65);
  s.bezierCurveTo(size * 0.95, -size * 0.05, size * 0.92, size * 0.78, 0, size * 0.34);
  s.bezierCurveTo(-size * 0.92, size * 0.78, -size * 0.95, -size * 0.05, 0, -size * 0.65);
  return new THREEMod.ShapeGeometry(s, 14);
}

function createStarGeometry(THREEMod: typeof THREE, outerR: number, innerR: number): THREE.ShapeGeometry {
  const s = new THREEMod.Shape();
  const points = 4;
  for (let i = 0; i < points * 2; i += 1) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return new THREEMod.ShapeGeometry(s);
}

export const MiniNekoBot: React.FC<MiniNekoBotProps> = ({ theme }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const moodIdxRef = useRef(0);
  const actionStartRef = useRef(0);
  const actionKindRef = useRef(0);
  const themeRef = useRef<'dark' | 'light'>(theme);
  const renderOnceRef = useRef<(() => void) | null>(null);
  const [moodIdx, setMoodIdx] = useState(0);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    themeRef.current = theme;
    renderOnceRef.current?.();
  }, [theme]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof window === 'undefined') return;

    let cancelled = false;
    let rafId = 0;
    let visible = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let renderer: THREE.WebGLRenderer | null = null;
    let observer: IntersectionObserver | null = null;
    const disposables: Array<{ dispose: () => void }> = [];

    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (rect.width <= 0) return;
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      pointer.tx = Math.max(-1, Math.min(1, (e.clientX - cx) / 360));
      pointer.ty = Math.max(-1, Math.min(1, (e.clientY - cy) / 280));
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const boot = async () => {
      try {
        const THREEMod = await import('three');
        if (cancelled) return;

        const w = Math.max(64, host.clientWidth || 86);
        const h = Math.max(64, host.clientHeight || 86);

        renderer = new THREEMod.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREEMod.SRGBColorSpace;
        renderer.toneMapping = THREEMod.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;

        host.innerHTML = '';
        host.appendChild(renderer.domElement);

        const scene = new THREEMod.Scene();
        const camera = new THREEMod.PerspectiveCamera(34, w / h, 0.1, 20);
        camera.position.set(0, 0.08, 4.35);

        const ambientLight = new THREEMod.AmbientLight(0xffffff, 1.15);
        scene.add(ambientLight);

        const keyLight = new THREEMod.DirectionalLight(0xfff6ea, 1.75);
        keyLight.position.set(2.2, 3.0, 3.4);
        scene.add(keyLight);

        const rimLight = new THREEMod.DirectionalLight(0x4ce0b0, 1.2);
        rimLight.position.set(-2.4, 1.6, -2.0);
        scene.add(rimLight);

        const fillLight = new THREEMod.PointLight(0xf2a788, 0.65, 8);
        fillLight.position.set(0, -1.8, 2.2);
        scene.add(fillLight);

        const rootGroup = new THREEMod.Group();
        scene.add(rootGroup);

        const shellMat = track(
          new THREEMod.MeshPhysicalMaterial({
            color: 0x162427,
            roughness: 0.24,
            metalness: 0.14,
            clearcoat: 0.92,
            clearcoatRoughness: 0.14,
          })
        );

        const visorMat = track(
          new THREEMod.MeshPhysicalMaterial({
            color: 0x060b0d,
            roughness: 0.1,
            metalness: 0.12,
            clearcoat: 1.0,
            clearcoatRoughness: 0.06,
          })
        );

        const earGlowMat = track(
          new THREEMod.MeshStandardMaterial({
            color: 0x52d6aa,
            emissive: 0x52d6aa,
            emissiveIntensity: 1.15,
            roughness: 0.3,
          })
        );

        const eyeMat = track(
          new THREEMod.MeshBasicMaterial({
            color: 0x4ce0b0,
            transparent: true,
            opacity: 1,
          })
        );

        const pupilMat = track(new THREEMod.MeshBasicMaterial({ color: 0x061012 }));
        const glintMat = track(new THREEMod.MeshBasicMaterial({ color: 0xffffff }));

        const arcMatLeft = track(
          new THREEMod.MeshBasicMaterial({ color: 0x4ce0b0, transparent: true, opacity: 0 })
        );
        const arcMatRight = track(
          new THREEMod.MeshBasicMaterial({ color: 0x4ce0b0, transparent: true, opacity: 0 })
        );
        const heartMat = track(
          new THREEMod.MeshBasicMaterial({ color: 0xff8ea8, transparent: true, opacity: 0 })
        );
        const starMat = track(
          new THREEMod.MeshBasicMaterial({ color: 0xf7cf76, transparent: true, opacity: 0 })
        );
        const blushMat = track(
          new THREEMod.MeshBasicMaterial({ color: 0xf29b88, transparent: true, opacity: 0.42 })
        );
        const collarMat = track(
          new THREEMod.MeshStandardMaterial({
            color: 0x0d825f,
            emissive: 0x0d6b4e,
            emissiveIntensity: 0.4,
            roughness: 0.35,
          })
        );
        const bellMat = track(
          new THREEMod.MeshStandardMaterial({
            color: 0xf5c874,
            emissive: 0xd99636,
            emissiveIntensity: 0.45,
            metalness: 0.65,
            roughness: 0.22,
          })
        );

        const headGroup = new THREEMod.Group();
        headGroup.position.set(0, 0.24, 0);
        rootGroup.add(headGroup);

        const headGeo = track(new THREEMod.SphereGeometry(0.62, 34, 26));
        const headMesh = new THREEMod.Mesh(headGeo, shellMat);
        headMesh.scale.set(1.12, 0.94, 0.96);
        headGroup.add(headMesh);

        const visorGeo = track(new THREEMod.SphereGeometry(0.608, 30, 22, -0.78, 1.56, 1.06, 0.88));
        const visorMesh = new THREEMod.Mesh(visorGeo, visorMat);
        visorMesh.rotation.y = Math.PI / 2;
        visorMesh.scale.set(1.01, 0.94, 1.1);
        visorMesh.position.set(0, -0.02, 0.03);
        headGroup.add(visorMesh);

        const earOuterGeo = track(new THREEMod.ConeGeometry(0.23, 0.44, 24));
        const earInnerGeo = track(new THREEMod.ConeGeometry(0.13, 0.27, 18));

        const makeEar = (side: -1 | 1) => {
          const pivot = new THREEMod.Group();
          pivot.position.set(side * 0.43, 0.44, 0.02);
          pivot.rotation.z = -side * 0.4;
          pivot.rotation.x = 0.08;
          const outer = new THREEMod.Mesh(earOuterGeo, shellMat);
          outer.position.set(0, 0.14, 0);
          outer.scale.set(1, 1, 0.72);
          pivot.add(outer);

          const inner = new THREEMod.Mesh(earInnerGeo, earGlowMat);
          inner.position.set(0, 0.12, 0.068);
          inner.scale.set(1, 1, 0.45);
          pivot.add(inner);

          headGroup.add(pivot);
          return pivot;
        };

        const leftEar = makeEar(-1);
        const rightEar = makeEar(1);

        // WHY: Mount face elements slightly ahead of the curved visor so expressions read crisply at 64-92px.
        const faceGroup = new THREEMod.Group();
        faceGroup.position.set(0, -0.01, 0.625);
        headGroup.add(faceGroup);

        const eyeGeo = track(new THREEMod.CircleGeometry(0.145, 28));
        const pupilGeo = track(new THREEMod.CircleGeometry(0.068, 22));
        const glintGeo = track(new THREEMod.CircleGeometry(0.036, 16));
        const arcGeo = track(new THREEMod.TorusGeometry(0.112, 0.032, 12, 24, Math.PI));
        const heartGeo = track(createHeartGeometry(THREEMod, 0.165));
        const starGeo = track(createStarGeometry(THREEMod, 0.17, 0.062));
        const blushGeo = track(new THREEMod.CircleGeometry(0.088, 22));

        const makeEyeRig = (side: -1 | 1, arcMat: THREE.MeshBasicMaterial) => {
          const g = new THREEMod.Group();
          g.position.set(side * 0.225, 0.045, 0);
          g.rotation.y = side * 0.16;

          const baseEye = new THREEMod.Mesh(eyeGeo, eyeMat);
          g.add(baseEye);

          const pupilRig = new THREEMod.Group();
          pupilRig.position.set(0, 0, 0.012);
          const pupil = new THREEMod.Mesh(pupilGeo, pupilMat);
          pupilRig.add(pupil);
          const glint = new THREEMod.Mesh(glintGeo, glintMat);
          glint.position.set(0.034, 0.036, 0.006);
          pupilRig.add(glint);
          baseEye.add(pupilRig);

          const arc = new THREEMod.Mesh(arcGeo, arcMat);
          arc.position.set(0, -0.032, 0.016);
          g.add(arc);

          const heart = new THREEMod.Mesh(heartGeo, heartMat);
          heart.position.set(0, 0.01, 0.018);
          g.add(heart);

          const star = new THREEMod.Mesh(starGeo, starMat);
          star.position.set(0, 0.01, 0.02);
          g.add(star);

          faceGroup.add(g);
          return { g, baseEye, pupilRig, star };
        };

        const leftEye = makeEyeRig(-1, arcMatLeft);
        const rightEye = makeEyeRig(1, arcMatRight);

        const noseGeo = track(new THREEMod.CircleGeometry(0.038, 3));
        const noseMesh = new THREEMod.Mesh(noseGeo, blushMat);
        noseMesh.position.set(0, -0.062, 0.032);
        noseMesh.rotation.z = Math.PI;
        faceGroup.add(noseMesh);

        const mouthArcGeo = track(new THREEMod.TorusGeometry(0.052, 0.016, 10, 18, Math.PI));
        const mouthL = new THREEMod.Mesh(mouthArcGeo, eyeMat);
        mouthL.position.set(-0.048, -0.105, 0.028);
        mouthL.rotation.z = Math.PI;
        faceGroup.add(mouthL);
        const mouthR = new THREEMod.Mesh(mouthArcGeo, eyeMat);
        mouthR.position.set(0.048, -0.105, 0.028);
        mouthR.rotation.z = Math.PI;
        faceGroup.add(mouthR);

        const cheekL = new THREEMod.Mesh(blushGeo, blushMat);
        cheekL.position.set(-0.355, -0.075, -0.02);
        cheekL.rotation.y = -0.34;
        cheekL.scale.set(1.28, 0.68, 1);
        faceGroup.add(cheekL);

        const cheekR = new THREEMod.Mesh(blushGeo, blushMat);
        cheekR.position.set(0.355, -0.075, -0.02);
        cheekR.rotation.y = 0.34;
        cheekR.scale.set(1.28, 0.68, 1);
        faceGroup.add(cheekR);

        const bodyGroup = new THREEMod.Group();
        bodyGroup.position.set(0, -0.52, -0.02);
        rootGroup.add(bodyGroup);

        const bodyGeo = track(new THREEMod.SphereGeometry(0.34, 26, 20));
        const bodyMesh = new THREEMod.Mesh(bodyGeo, shellMat);
        bodyMesh.scale.set(1.06, 0.92, 0.88);
        bodyGroup.add(bodyMesh);

        const collarGeo = track(new THREEMod.TorusGeometry(0.28, 0.042, 12, 28));
        const collarMesh = new THREEMod.Mesh(collarGeo, collarMat);
        collarMesh.rotation.x = Math.PI / 2;
        collarMesh.position.set(0, 0.22, 0.01);
        bodyGroup.add(collarMesh);

        const bellGeo = track(new THREEMod.SphereGeometry(0.088, 18, 16));
        const bellMesh = new THREEMod.Mesh(bellGeo, bellMat);
        bellMesh.position.set(0, 0.16, 0.305);
        bodyGroup.add(bellMesh);

        const pawGeo = track(new THREEMod.CapsuleGeometry(0.085, 0.13, 10, 14));
        const leftPaw = new THREEMod.Mesh(pawGeo, shellMat);
        leftPaw.position.set(-0.49, -0.45, 0.14);
        leftPaw.rotation.z = 0.42;
        rootGroup.add(leftPaw);

        const rightPaw = new THREEMod.Mesh(pawGeo, shellMat);
        rightPaw.position.set(0.49, -0.45, 0.14);
        rightPaw.rotation.z = -0.42;
        rootGroup.add(rightPaw);

        const tailPivot = new THREEMod.Group();
        tailPivot.position.set(0, -0.62, -0.26);
        rootGroup.add(tailPivot);

        const tailCurve = new THREEMod.CatmullRomCurve3([
          new THREEMod.Vector3(0, 0, 0),
          new THREEMod.Vector3(0.18, 0.04, -0.24),
          new THREEMod.Vector3(0.34, 0.24, -0.28),
          new THREEMod.Vector3(0.38, 0.48, -0.18),
        ]);
        const tailGeo = track(new THREEMod.TubeGeometry(tailCurve, 20, 0.048, 10, false));
        const tailMesh = new THREEMod.Mesh(tailGeo, shellMat);
        tailPivot.add(tailMesh);

        const tailTipGeo = track(new THREEMod.SphereGeometry(0.072, 14, 14));
        const tailTip = new THREEMod.Mesh(tailTipGeo, earGlowMat);
        tailTip.position.set(0.38, 0.49, -0.18);
        tailPivot.add(tailTip);

        const shadowGeo = track(new THREEMod.CircleGeometry(0.42, 24));
        const shadowMat = track(
          new THREEMod.MeshBasicMaterial({
            color: 0x050a0b,
            transparent: true,
            opacity: 0.22,
          })
        );
        const shadowMesh = new THREEMod.Mesh(shadowGeo, shadowMat);
        shadowMesh.rotation.x = -Math.PI / 2;
        shadowMesh.position.set(0, -1.04, 0);
        scene.add(shadowMesh);

        let lastAppliedTheme: 'dark' | 'light' | null = null;
        const applyThemeMaterials = () => {
          const current = themeRef.current;
          if (current === lastAppliedTheme) return;
          lastAppliedTheme = current;
          const isLight = current === 'light';
          if (isLight) {
            shellMat.color.setHex(0xfffcf5);
            shellMat.roughness = 0.2;
            shellMat.metalness = 0.04;
            visorMat.color.setHex(0x0c171a);
            collarMat.color.setHex(0x0d6b4e);
            collarMat.emissive.setHex(0x0a533c);
            ambientLight.intensity = 1.45;
            keyLight.intensity = 1.55;
            rimLight.color.setHex(0x1db886);
            rimLight.intensity = 1.05;
            shadowMat.color.setHex(0x30281c);
            shadowMat.opacity = 0.15;
          } else {
            // WHY: Luminous pearl-mint ceramic shell gives crisp adorable silhouette separation against the deep emerald-obsidian hero background.
            shellMat.color.setHex(0xdcece6);
            shellMat.roughness = 0.2;
            shellMat.metalness = 0.08;
            visorMat.color.setHex(0x071013);
            collarMat.color.setHex(0x129168);
            collarMat.emissive.setHex(0x0d7554);
            ambientLight.intensity = 1.3;
            keyLight.intensity = 1.65;
            rimLight.color.setHex(0x4ce0b0);
            rimLight.intensity = 1.4;
            shadowMat.color.setHex(0x020807);
            shadowMat.opacity = 0.32;
          }
        };

        applyThemeMaterials();

        const targetEyeColor = new THREEMod.Color(0x4ce0b0);
        const targetEarColor = new THREEMod.Color(0x52d6aa);
        const targetBlushColor = new THREEMod.Color(0xf29b88);
        let nextBlinkAt = performance.now() + 2600;
        let lastTime = performance.now();

        const stepAndRender = (now: number) => {
          if (!renderer || cancelled) return;
          const dt = Math.min(0.05, Math.max(0.008, (now - lastTime) / 1000));
          lastTime = now;
          const t = now * 0.001;

          applyThemeMaterials();

          const spec = NEKO_MOODS[moodIdxRef.current % NEKO_MOODS.length];
          const lerpRate = reduced ? 1 : Math.min(1, dt * 10);

          targetEyeColor.setHex(spec.eyeHex);
          targetEarColor.setHex(spec.earGlowHex);
          targetBlushColor.setHex(spec.blushHex);

          eyeMat.color.lerp(targetEyeColor, lerpRate);
          arcMatLeft.color.lerp(targetEyeColor, lerpRate);
          arcMatRight.color.lerp(targetEyeColor, lerpRate);
          earGlowMat.color.lerp(targetEarColor, lerpRate);
          earGlowMat.emissive.lerp(targetEarColor, lerpRate);
          blushMat.color.lerp(targetBlushColor, lerpRate);

          blushMat.opacity += (spec.blushOpacity - blushMat.opacity) * lerpRate;
          arcMatLeft.opacity += (spec.arcLeft - arcMatLeft.opacity) * lerpRate;
          arcMatRight.opacity += (spec.arcRight - arcMatRight.opacity) * lerpRate;
          heartMat.opacity += (spec.heartOpacity - heartMat.opacity) * lerpRate;
          starMat.opacity += (spec.starOpacity - starMat.opacity) * lerpRate;

          let blinkFactor = 1;
          if (!reduced && now >= nextBlinkAt) {
            const blinkElapsed = now - nextBlinkAt;
            if (blinkElapsed < 140) {
              blinkFactor = Math.max(0.08, 1 - Math.sin((blinkElapsed / 140) * Math.PI));
            } else {
              nextBlinkAt = now + 2800 + Math.random() * 2400;
            }
          }

          leftEye.baseEye.scale.y +=
            (spec.leftScaleY * blinkFactor - leftEye.baseEye.scale.y) * lerpRate;
          rightEye.baseEye.scale.y +=
            (spec.rightScaleY * blinkFactor - rightEye.baseEye.scale.y) * lerpRate;

          pointer.x += (pointer.tx - pointer.x) * (reduced ? 1 : Math.min(1, dt * 7));
          pointer.y += (pointer.ty - pointer.y) * (reduced ? 1 : Math.min(1, dt * 7));
          const px = pointer.x * 0.036;
          const py = -pointer.y * 0.028;
          leftEye.pupilRig.position.set(px, py, 0.012);
          rightEye.pupilRig.position.set(px, py, 0.012);

          const actElapsed = (now - actionStartRef.current) / 1000;
          const inAction = !reduced && actionStartRef.current > 0 && actElapsed < 0.95;
          const actP = inAction ? actElapsed / 0.95 : 0;

          let hopY = 0;
          let spinY = 0;
          let tiltZ = 0;
          let pawWave = 0;
          let tailSpeed = 2.6;

          if (inAction) {
            tailSpeed = 11.5;
            const kind = actionKindRef.current % 3;
            if (kind === 0) {
              hopY = Math.abs(Math.sin(actP * Math.PI * 2)) * 0.24 * (1 - actP * 0.35);
              pawWave = Math.sin(actP * Math.PI * 6) * 0.55;
            } else if (kind === 1) {
              spinY = Math.sin(actP * Math.PI * 0.5) * Math.PI * 2;
              hopY = Math.sin(actP * Math.PI) * 0.16;
            } else {
              tiltZ = Math.sin(actP * Math.PI * 4) * 0.22 * (1 - actP);
              hopY = Math.sin(actP * Math.PI) * 0.1;
              pawWave = Math.sin(actP * Math.PI * 4) * 0.36;
            }
          }

          const idleBob = reduced ? 0 : Math.sin(t * 2.1) * 0.075;
          rootGroup.position.y = idleBob + hopY;
          rootGroup.rotation.y = -0.15 + pointer.x * 0.36 + spinY;
          rootGroup.rotation.x = pointer.y * 0.2;
          rootGroup.rotation.z = tiltZ + (reduced ? 0 : Math.sin(t * 1.35) * 0.035);

          const earTwitch = reduced ? 0 : Math.max(0, Math.sin(t * 1.9) - 0.92) * 2.2;
          leftEar.rotation.z = 0.4 + earTwitch * 0.35 + (inAction ? 0.14 : 0);
          rightEar.rotation.z = -0.4 - (inAction ? 0.14 : 0);

          leftPaw.position.y = -0.45 + (reduced ? 0 : Math.sin(t * 2.1 + 0.6) * 0.035) + Math.max(0, pawWave * 0.16);
          leftPaw.rotation.z = 0.42 + pawWave;
          rightPaw.position.y = -0.45 + (reduced ? 0 : Math.sin(t * 2.1 + 1.4) * 0.035) + Math.max(0, -pawWave * 0.16);
          rightPaw.rotation.z = -0.42 - pawWave;

          tailPivot.rotation.y = reduced ? 0.12 : Math.sin(t * tailSpeed) * 0.46;
          tailPivot.rotation.z = reduced ? 0 : Math.cos(t * tailSpeed * 0.5) * 0.12;

          if (spec.starOpacity > 0.2 && !reduced) {
            leftEye.star.rotation.z = t * 1.8;
            rightEye.star.rotation.z = -t * 1.8;
          }

          shadowMesh.scale.setScalar(1 - (idleBob + hopY) * 0.38);

          renderer.render(scene, camera);
        };

        renderOnceRef.current = () => stepAndRender(performance.now());

        const loop = (now: number) => {
          if (cancelled) return;
          if (visible && !document.hidden) {
            stepAndRender(now);
          }
          if (!reduced) {
            rafId = window.requestAnimationFrame(loop);
          }
        };

        observer = new IntersectionObserver(
          (entries) => {
            visible = Boolean(entries[0]?.isIntersecting);
          },
          { threshold: 0.01 }
        );
        observer.observe(host);

        stepAndRender(performance.now());
        if (!reduced) {
          rafId = window.requestAnimationFrame(loop);
        }
      } catch {
        if (!cancelled) setWebglFailed(true);
      }
    };

    void boot();

    return () => {
      cancelled = true;
      renderOnceRef.current = null;
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      observer?.disconnect();
      disposables.forEach((d) => {
        try {
          d.dispose();
        } catch {
          void 0;
        }
      });
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, []);

  const handlePoke = () => {
    const next = (moodIdxRef.current + 1) % NEKO_MOODS.length;
    moodIdxRef.current = next;
    actionStartRef.current = performance.now();
    actionKindRef.current += 1;
    setMoodIdx(next);
    renderOnceRef.current?.();
  };

  const activeMood = NEKO_MOODS[moodIdx];
  const shellFill = theme === 'light' ? '#fffcf5' : '#dcece6';
  const shellStroke = theme === 'light' ? 'rgba(24,28,26,0.18)' : 'rgba(56,201,154,0.45)';
  const eyeFill =
    activeMood.id === 'heart'
      ? '#ff8ea8'
      : activeMood.id === 'starry'
        ? '#f7cf76'
        : activeMood.id === 'shy'
          ? '#f0b284'
          : '#4ce0b0';

  return (
    <button
      type="button"
      className="hm-neko-anchor"
      onClick={handlePoke}
      aria-label="Tương tác với mèo máy mini F-Forum"
      title="Chạm để đổi biểu cảm"
      data-neko-mood={activeMood.id}
    >
      <span className="hm-neko-stage" ref={hostRef} aria-hidden="true">
        {webglFailed && (
          <svg className="hm-neko-fallback" viewBox="0 0 80 80" fill="none">
            <path d="M18 32L22 14L35 25" fill={shellFill} stroke={shellStroke} strokeWidth="2" strokeLinejoin="round" />
            <path d="M62 32L58 14L45 25" fill={shellFill} stroke={shellStroke} strokeWidth="2" strokeLinejoin="round" />
            <path d="M22 28L24 19L31 25" fill={eyeFill} opacity="0.85" />
            <path d="M58 28L56 19L49 25" fill={eyeFill} opacity="0.85" />
            <ellipse cx="40" cy="40" rx="23" ry="19" fill={shellFill} stroke={shellStroke} strokeWidth="2" />
            <rect x="22" y="29" width="36" height="21" rx="10.5" fill="#070e10" />
            <circle cx="32" cy="39" r="4.2" fill={eyeFill} />
            <circle cx="48" cy="39" r="4.2" fill={eyeFill} />
            <circle cx="26" cy="44" r="2.6" fill="#f29b88" opacity="0.7" />
            <circle cx="54" cy="44" r="2.6" fill="#f29b88" opacity="0.7" />
            <ellipse cx="40" cy="64" rx="13" ry="9" fill={shellFill} stroke={shellStroke} strokeWidth="2" />
            <circle cx="40" cy="59" r="3.4" fill="#f5c874" />
          </svg>
        )}
      </span>
    </button>
  );
};

export default MiniNekoBot;
