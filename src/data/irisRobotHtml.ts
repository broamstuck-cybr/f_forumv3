export const IRIS_HEAD_GLB =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261018_172206_0181329a-86e2-41c9-8ab8-c496f29aaa53.glb';

export const IRIS_ARM_GLB =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261018_172137_cd6086ec-07ef-44dc-bd15-95a450ddaa8c.glb';

export const IRIS_QR_CODE_URL = '/assets/qr-dino.png';

export const IRIS_ROBOT_STANDALONE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="color-scheme" content="dark" />
  <title>Iris — Smart AI Assistant</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <script type="importmap">
  { "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
  } }
  </script>
  <style>
    :root { --bg:#0b0b11; --nav:#12131a; --line:rgba(255,255,255,0.06); --text:#fff; --muted:#a3a3b2; --link:#c8c8d4; --violet:#7c4dff; --violet-2:#8f66ff; --nav-h:62px; }
    * { box-sizing:border-box; margin:0; padding:0 }
    html, body { background:var(--bg); color:var(--text) }
    body { font-family:"Figtree", system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing:antialiased; overflow-x:hidden }
    a { color:inherit; text-decoration:none }

    .nav { position:fixed; top:0; left:0; right:0; z-index:20; height:var(--nav-h); background:rgba(18,19,26,0.86); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border-bottom:1px solid var(--line); }
    .nav-inner { max-width:1344px; height:100%; margin:0 auto; padding:0 68px; display:flex; align-items:center; justify-content:space-between; position:relative; }
    .brand { display:flex; align-items:center; gap:11px; font-weight:600; font-size:21px; letter-spacing:-0.01em; }
    .brand-orb { width:26px; height:26px; border-radius:50%; background:radial-gradient(circle at 32% 28%, #c9b8ff 0%, #8b6cff 38%, #5b3df0 72%, #3a24b8 100%); box-shadow:0 0 14px rgba(124,77,255,.55), inset -2px -3px 6px rgba(20,8,70,.55); }
    .nav-right { display:flex; align-items:center; gap:30px; }
    .nav-links { display:flex; gap:38px; font-size:14px; font-weight:500; color:var(--link); }
    .nav-links a { transition:color .2s; }
    .nav-links a:hover { color:#fff; }
    .btn-open { background:#fff; color:#0b0b11; font-weight:600; font-size:14px; padding:10px 19px; border-radius:999px; transition:transform .2s, box-shadow .2s; }
    .btn-open:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(255,255,255,.15); }
    .menu-btn { display:none; width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,.06); border:1px solid var(--line); align-items:center; justify-content:center; cursor:pointer; }
    .menu-btn span { position:relative; display:block; width:16px; height:1.6px; background:#fff; border-radius:2px; transition:background .2s; }
    .menu-btn span::before, .menu-btn span::after { content:""; position:absolute; left:0; width:16px; height:1.6px; background:#fff; border-radius:2px; transition:transform .22s, top .22s; }
    .menu-btn span::before { top:-5px; }
    .menu-btn span::after { top:5px; }
    .nav.open .menu-btn span { background:transparent; }
    .nav.open .menu-btn span::before { top:0; transform:rotate(45deg); }
    .nav.open .menu-btn span::after { top:0; transform:rotate(-45deg); }
    .mobile-panel { display:none; position:absolute; top:calc(var(--nav-h) + 8px); left:16px; right:16px; background:rgba(20,21,30,.96); border:1px solid var(--line); border-radius:18px; padding:8px; flex-direction:column; box-shadow:0 20px 50px rgba(0,0,0,.5); }
    .mobile-panel a { padding:14px 16px; border-radius:12px; font-weight:500; color:var(--link); }
    .mobile-panel a:hover { background:rgba(255,255,255,.05); color:#fff; }
    .nav.open .mobile-panel { display:flex; }

    .hero { position:relative; min-height:100vh; min-height:100svh; overflow:hidden; isolation:isolate; }
    #stage { position:absolute; inset:0; width:100%; height:100%; display:block; z-index:0; touch-action:pan-y; }
    .hero::after { content:""; position:absolute; inset:0; z-index:1; pointer-events:none; background:radial-gradient(120% 80% at 50% 0%, transparent 55%, rgba(0,0,0,.45) 100%), repeating-linear-gradient(90deg, rgba(255,255,255,.012) 0 1px, transparent 1px 7px); }
    .hero-inner { position:relative; z-index:2; pointer-events:none; max-width:1344px; margin:0 auto; min-height:inherit; padding:calc(var(--nav-h) + 40px) 68px 80px; display:flex; flex-direction:column; justify-content:center; }
    .copy { max-width:600px; pointer-events:auto; }
    h1 { font-size:clamp(40px, 5.1vw, 70px); line-height:1.04; font-weight:700; letter-spacing:-0.025em; }
    .sub { margin-top:26px; color:var(--muted); font-size:clamp(17px, 1.65vw, 22px); line-height:1.55; font-weight:400; }
    .btn-try { display:inline-flex; align-items:center; justify-content:center; margin-top:36px; height:59px; padding:0 38px; border-radius:999px; background:linear-gradient(180deg, #8f66ff, #7c4dff); color:#fff; font-weight:600; font-size:20px; letter-spacing:-0.005em; box-shadow:inset 0 1px 0 rgba(255,255,255,.22); transition:transform .25s, filter .25s; }
    .btn-try:hover { transform:translateY(-2px); filter:brightness(1.08); }
    .reveal { opacity:0; transform:translateY(18px); animation:rise .9s cubic-bezier(.2,.7,.2,1) forwards; }
    .d1 { animation-delay:.08s; }
    .d2 { animation-delay:.2s; }
    .d3 { animation-delay:.32s; }
    @keyframes rise { to { opacity:1; transform:none; } }
    .loader { position:absolute; z-index:2; width:46px; height:46px; border-radius:50%; border:2px solid rgba(143,102,255,.18); border-top-color:#8f66ff; transform:translate(-50%,-50%); animation:spin 1s linear infinite; transition:opacity .5s; pointer-events:none; }
    .loader.hide { opacity:0; }
    @keyframes spin { to { transform:translate(-50%,-50%) rotate(360deg); } }

    @media (max-width:1100px) {
      .nav-inner, .hero-inner { padding-left:40px; padding-right:40px; }
      .nav-links { gap:26px; }
    }
    @media (max-width:860px) {
      .nav-links { display:none; }
      .menu-btn { display:inline-flex; }
      .nav-right { gap:10px; }
      .hero-inner { justify-content:flex-end; text-align:center; align-items:center; padding:calc(var(--nav-h) + 20px) 24px 56px; }
      .copy { max-width:560px; }
      h1 { font-size:clamp(36px, 9.2vw, 56px); }
      .sub { margin-top:16px; }
      .btn-try { margin-top:26px; }
    }
    @media (max-width:480px) {
      .nav-inner { padding:0 16px; }
      .hero-inner { padding:calc(var(--nav-h) + 16px) 16px 40px; }
      .brand { font-size:19px; }
      .btn-open { padding:9px 15px; font-size:13px; }
      .btn-try { height:54px; padding:0 32px; font-size:18px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .reveal { animation:none; opacity:1; transform:none; }
    }
  </style>
</head>
<body>
  <header class="nav" id="nav">
    <div class="nav-inner">
      <a class="brand" href="#"><span class="brand-orb"></span>Iris</a>
      <div class="nav-right">
        <nav class="nav-links">
          <a href="#">Overview</a>
          <a href="#">Ecosystem</a>
          <a href="#">Socials</a>
          <a href="#">Help</a>
        </nav>
        <a class="btn-open" href="#">Get Iris</a>
        <button class="menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false"><span></span></button>
      </div>
      <div class="mobile-panel">
        <a href="#">Overview</a>
        <a href="#">Ecosystem</a>
        <a href="#">Socials</a>
        <a href="#">Help</a>
      </div>
    </div>
  </header>
  <main class="hero" id="hero">
    <canvas id="stage" aria-hidden="true"></canvas>
    <div class="loader" id="loader"></div>
    <div class="hero-inner">
      <div class="copy">
        <h1 class="reveal d1">Introducing a<br />Smart AI Assistant</h1>
        <p class="sub reveal d2">Easy to start. Effortless to explore.<br />Capable in every conversation.</p>
        <a class="btn-try reveal d3" href="#">Start free</a>
      </div>
    </div>
  </main>
  <script type="module">
    import * as THREE from "three";
    import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
    import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
    import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
    import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
    import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
    import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

    const HEAD_GLB = "${IRIS_HEAD_GLB}";
    const ARM_GLB  = "${IRIS_ARM_GLB}";

    const nav = document.getElementById("nav");
    const menuBtn = document.getElementById("menuBtn");
    menuBtn?.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });

    const hero = document.getElementById("hero");
    const canvas = document.getElementById("stage");
    const loaderEl = document.getElementById("loader");
    const copyEl = hero.querySelector(".copy");
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0b11");
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

    function radialTexture(stops, size = 256) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d");
      const r = size / 2;
      const g = ctx.createRadialGradient(r, r, 0, r, r, r);
      for (const [offset, color] of stops) g.addColorStop(offset, color);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const glowTex = radialTexture([[0,"rgba(160,120,255,1)"],[0.25,"rgba(124,77,255,.55)"],[0.6,"rgba(90,50,230,.12)"],[1,"rgba(60,30,200,0)"]]);

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color("#030305");
    const softboxes = [
      { color: "#ffffff", w: 5, h: 3.2, pos: [-3, 4.5, 4], intensity: 3.2 },
      { color: "#ffffff", w: 1.2, h: 6, pos: [6, 0.5, 2], intensity: 1.1 },
      { color: "#ffffff", w: 3, h: 1, pos: [1.5, 5, -1], intensity: 0.8 },
      { color: "#7c4dff", w: 4, h: 5, pos: [-5, 0, -4], intensity: 1.0 },
      { color: "#7c4dff", w: 4, h: 5, pos: [5, 0, -4], intensity: 1.0 },
      { color: "#5b30ff", w: 6, h: 3, pos: [0, -5, 1], intensity: 0.35 },
    ];
    const sbGeo = new THREE.SphereGeometry(0.5, 32, 16);
    for (const sb of softboxes) {
      const col = new THREE.Color(sb.color).multiplyScalar(sb.intensity);
      const mesh = new THREE.Mesh(sbGeo, new THREE.MeshBasicMaterial({ color: col }));
      mesh.scale.set(sb.w, sb.h, 0.3);
      mesh.position.set(...sb.pos);
      mesh.lookAt(0, 0, 0);
      envScene.add(mesh);
    }
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(envScene, 0.02).texture;
    scene.environmentIntensity = 1.0;

    scene.add(new THREE.HemisphereLight(0xdcd8f0, 0x1a0f3a, 2.3));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
    dirLight.position.set(-3, 4, 5);
    scene.add(dirLight);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.4, 0.92);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    function rimMaterial(color, power, strength) {
      return new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uPower: { value: power },
          uStrength: { value: strength },
        },
        vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
        fragmentShader: "uniform vec3 uColor; uniform float uPower; uniform float uStrength; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), uPower); gl_FragColor = vec4(uColor * f * uStrength, f); }",
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
    }

    const robot = new THREE.Group();
    const body = new THREE.Group();
    const head = new THREE.Group();
    robot.add(body);
    body.add(head);
    scene.add(robot);

    const haze = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x7a55ff, opacity: 0.06, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false, transparent: true }));
    haze.scale.set(7.5, 7.5, 1);
    haze.position.set(0, 0.1, -3);
    scene.add(haze);

    const floorGlowMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0x8f6bff, opacity: 0.95, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorGlowMat);
    floorGlow.position.set(0, -2.05, -0.6);
    floorGlow.scale.set(3.4, 0.42, 1);
    scene.add(floorGlow);

    function prepareModel(root, { glossy, rim, tint, useMap, smooth }) {
      const meshes = [];
      root.traverse((o) => { if (o.isMesh) meshes.push(o); });
      for (const m of meshes) {
        if (smooth) {
          let g = m.geometry.clone();
          for (const attr of ["normal", "uv", "uv1", "tangent", "color"]) {
            if (g.attributes[attr]) g.deleteAttribute(attr);
          }
          g = mergeVertices(g, 1e-3);
          g.computeVertexNormals();
          m.geometry = g;
        }
        const prevMap = useMap && m.material?.map ? m.material.map : null;
        m.material = new THREE.MeshPhysicalMaterial({
          map: prevMap,
          color: new THREE.Color(tint),
          metalness: glossy ? 0.1 : 0,
          roughness: glossy ? 0.3 : 0.48,
          clearcoat: glossy ? 1.0 : 0.3,
          clearcoatRoughness: glossy ? 0.16 : 0.4,
          envMapIntensity: glossy ? 0.9 : 0.55,
        });
        if (rim) {
          const shell = new THREE.Mesh(m.geometry, rimMaterial(rim.color, rim.power, rim.strength));
          shell.renderOrder = 2;
          shell.userData.isRimShell = true;
          m.add(shell);
        }
      }
    }

    function normaliseHead(root) {
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      root.scale.setScalar(2 / (size.z || 2));
      root.updateMatrixWorld(true);
      const box2 = new THREE.Box3().setFromObject(root);
      const centre = box2.getCenter(new THREE.Vector3());
      root.position.set(-centre.x, -(box2.min.y + 1), -centre.z);
      root.updateMatrixWorld(true);
    }

    function subdivideNonIndexed(geo, rounds = 3) {
      let pos = Array.from(geo.attributes.position.array);
      for (let r = 0; r < rounds; r++) {
        const next = [];
        for (let i = 0; i < pos.length; i += 9) {
          const ax = pos[i], ay = pos[i+1], az = pos[i+2];
          const bx = pos[i+3], by = pos[i+4], bz = pos[i+5];
          const cx = pos[i+6], cy = pos[i+7], cz = pos[i+8];
          const abx = (ax+bx)*0.5, aby = (ay+by)*0.5, abz = (az+bz)*0.5;
          const bcx = (bx+cx)*0.5, bcy = (by+cy)*0.5, bcz = (bz+cz)*0.5;
          const cax = (cx+ax)*0.5, cay = (cy+ay)*0.5, caz = (cz+az)*0.5;
          next.push(ax,ay,az,abx,aby,abz,cax,cay,caz, bx,by,bz,bcx,bcy,bcz,abx,aby,abz, cx,cy,cz,cax,cay,caz,bcx,bcy,bcz, abx,aby,abz,bcx,bcy,bcz,cax,cay,caz);
        }
        pos = next;
      }
      const out = new THREE.BufferGeometry();
      out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      return out;
    }

    function buildSphericalRoundedRect(w, h, corner, centreY, radius) {
      const r = Math.min(corner, w * 0.5, h * 0.5);
      const x0 = -w * 0.5, y0 = centreY - h * 0.5;
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
      let geo = new THREE.ShapeGeometry(shape, 48).toNonIndexed();
      geo = subdivideNonIndexed(geo, 3);
      const posAttr = geo.attributes.position;
      const normals = new Float32Array(posAttr.count * 3);
      const v = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i), y = posAttr.getY(i);
        const z = Math.sqrt(Math.max(0.0001, radius * radius - x * x - y * y));
        posAttr.setXYZ(i, x, y, z);
        v.set(x, y, z).normalize();
        normals[i * 3] = v.x; normals[i * 3 + 1] = v.y; normals[i * 3 + 2] = v.z;
      }
      geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
      return geo;
    }

    const eyeGroups = [];
    const pupilWraps = [];
    const antennaGlows = [];

    function mountHead(root) {
      root.updateMatrixWorld(true);
      const hits = new THREE.Raycaster(new THREE.Vector3(0,0,5), new THREE.Vector3(0,0,-1)).intersectObject(root, true);
      const R = clamp(hits.length ? hits[0].point.length() : 0.98, 0.85, 1.1);

      const baseMeshes = [];
      root.traverse((o) => { if (o.isMesh && !o.userData.isRimShell) baseMeshes.push(o); });
      const vLocal = new THREE.Vector3(), vHead = new THREE.Vector3();
      const topLeft = [], topRight = [];

      for (const m of baseMeshes) {
        const toHead = m.matrixWorld.clone();
        const headToLocalNormal = new THREE.Matrix3().getNormalMatrix(new THREE.Matrix4().copy(toHead).invert());
        const pos = m.geometry.attributes.position;
        if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
        const norm = m.geometry.attributes.normal;
        for (let i = 0; i < pos.count; i++) {
          vLocal.fromBufferAttribute(pos, i);
          vHead.copy(vLocal).applyMatrix4(toHead);
          if (Math.abs(vHead.length() - R) <= R * 0.07) {
            const n = vHead.clone().normalize().applyMatrix3(headToLocalNormal).normalize();
            norm.setXYZ(i, n.x, n.y, n.z);
          }
          if (vHead.y > 0.75 && Math.abs(vHead.x) > 0.15) {
            (vHead.x < 0 ? topLeft : topRight).push(vHead.clone());
          }
        }
        norm.needsUpdate = true;
      }

      head.add(root);
      head.updateMatrixWorld(true);

      const bezelMesh = new THREE.Mesh(
        buildSphericalRoundedRect(1.86, 1.12, 0.46, -0.07, R * 1.03),
        new THREE.MeshPhysicalMaterial({ color: "#0c0c10", roughness: 0.3, metalness: 0.3, clearcoat: 0.8, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 })
      );
      bezelMesh.renderOrder = 3;
      head.add(bezelMesh);

      const glassMesh = new THREE.Mesh(
        buildSphericalRoundedRect(1.74, 1.0, 0.4, -0.07, R * 1.036),
        new THREE.MeshPhysicalMaterial({ color: "#000000", roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.9, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 })
      );
      glassMesh.renderOrder = 4;
      head.add(glassMesh);

      const irisTex = radialTexture([[0,"#d7c9ff"],[0.45,"#a07bff"],[0.8,"#7646f2"],[1,"#5c2fe0"]]);
      for (const sx of [-1, 1]) {
        const x = sx * 0.43, y = -0.08, rEye = R * 1.055;
        const z = Math.sqrt(Math.max(0.01, rEye * rEye - x * x - y * y));
        const eg = new THREE.Group();
        eg.position.set(x, y, z);
        eg.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), eg.position.clone().normalize());

        const halo = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48), new THREE.MeshBasicMaterial({ map: glowTex, color: 0x8a5cff, opacity: 0.24, transparent: true, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false, depthTest: false }));
        halo.position.z = -0.004; halo.renderOrder = 9; eg.add(halo);

        const ring = new THREE.Mesh(new THREE.RingGeometry(0.168, 0.212, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 0.88, 2.0), toneMapped: false, depthWrite: false, depthTest: false }));
        ring.renderOrder = 10; eg.add(ring);

        const iris = new THREE.Mesh(new THREE.CircleGeometry(0.17, 64), new THREE.MeshBasicMaterial({ map: irisTex, color: new THREE.Color(1.0, 0.95, 1.15), toneMapped: false, depthWrite: false, depthTest: false }));
        iris.position.z = 0.001; iris.renderOrder = 10; eg.add(iris);

        const pw = new THREE.Group();
        const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.083, 48), new THREE.MeshBasicMaterial({ color: "#07040f", toneMapped: false, depthWrite: false, depthTest: false }));
        pupil.position.z = 0.003; pupil.renderOrder = 10; pw.add(pupil);

        const glint = new THREE.Mesh(new THREE.CircleGeometry(0.022, 32), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false, depthWrite: false, depthTest: false }));
        glint.position.set(0.032, 0.034, 0.005); glint.renderOrder = 10; pw.add(glint);

        eg.add(pw); head.add(eg);
        eyeGroups.push(eg); pupilWraps.push(pw);
      }

      const ballGeo = new THREE.SphereGeometry(0.118, 32, 24);
      const ballMat = new THREE.MeshPhysicalMaterial({ color: "#8b62ff", emissive: new THREE.Color("#6a3dff"), emissiveIntensity: 1.5, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.14 });
      for (const list of [topLeft, topRight]) {
        if (!list.length) continue;
        let top = list[0];
        for (const p of list) if (p.y > top.y) top = p;
        const sum = new THREE.Vector3(); let count = 0;
        for (const p of list) if (p.distanceTo(top) <= 0.2) { sum.add(p); count++; }
        const centre = count ? sum.divideScalar(count) : top.clone();
        centre.y = Math.max(centre.y, top.y - 0.1);
        const ball = new THREE.Mesh(ballGeo, ballMat);
        ball.position.copy(centre); head.add(ball);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9a6bff, opacity: 0.85, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false, transparent: true }));
        sp.scale.set(0.5, 0.5, 1); sp.position.copy(centre); head.add(sp);
        antennaGlows.push(sp);
      }
    }

    function normaliseArm(root) {
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      root.scale.setScalar(0.78 / (size.y || 0.78));
      root.updateMatrixWorld(true);
      const centre = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
      root.position.sub(centre);
      const wrap = new THREE.Group();
      wrap.add(root);
      return wrap;
    }

    const arms = [];
    const armRestPoses = [
      { x: -1.32, y: -0.72, z: 0.15, rz: -0.62, phase: 0 },
      { x:  1.32, y: -0.72, z: 0.15, rz:  0.62, phase: Math.PI * 0.85 },
    ];

    const gltfLoader = new GLTFLoader();
    robot.scale.setScalar(0.001);
    let introReady = false;

    Promise.allSettled([gltfLoader.loadAsync(HEAD_GLB), gltfLoader.loadAsync(ARM_GLB)]).then(([headRes, armRes]) => {
      let headRoot;
      if (headRes.status === "fulfilled" && headRes.value?.scene) {
        headRoot = headRes.value.scene;
        normaliseHead(headRoot);
        prepareModel(headRoot, { glossy: true, useMap: false, tint: "#4a4a56", rim: { color: 0x8a5cff, power: 4.5, strength: 0.32 } });
      } else {
        headRoot = new THREE.Group();
        const mat = new THREE.MeshPhysicalMaterial({ color: "#2c2c35", roughness: 0.26, clearcoat: 1 });
        headRoot.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat));
        for (const sx of [-1, 1]) {
          const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 32), mat);
          ear.rotation.z = Math.PI * 0.5;
          ear.position.set(sx * 1.02, -0.04, 0);
          headRoot.add(ear);
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.04, 0.42, 16), mat);
          rod.position.set(sx * 0.46, 1.08, -0.05);
          rod.rotation.z = -sx * 0.25;
          headRoot.add(rod);
        }
        prepareModel(headRoot, { glossy: true, useMap: false, tint: "#4a4a56", rim: { color: 0x8a5cff, power: 4.5, strength: 0.32 } });
      }
      mountHead(headRoot);

      let armTpl;
      if (armRes.status === "fulfilled" && armRes.value?.scene) {
        armTpl = armRes.value.scene;
        prepareModel(armTpl, { glossy: false, useMap: false, smooth: true, tint: "#1d1d23", rim: { color: 0x8a5cff, power: 2.6, strength: 1.05 } });
      } else {
        armTpl = new THREE.Group();
        armTpl.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 16, 32), new THREE.MeshPhysicalMaterial({ color: "#1b1b21", roughness: 0.48, clearcoat: 0.3 })));
        prepareModel(armTpl, { glossy: false, useMap: false, tint: "#1d1d23", rim: { color: 0x8a5cff, power: 2.6, strength: 1.05 } });
      }
      [armTpl, armTpl.clone(true)].forEach((raw, idx) => {
        const pose = armRestPoses[idx];
        const wrap = normaliseArm(raw);
        wrap.position.set(pose.x, pose.y, pose.z);
        wrap.rotation.z = pose.rz;
        body.add(wrap);
        arms.push({ mesh: wrap, ...pose });
      });
      loaderEl.classList.add("hide");
      robot.scale.setScalar(0.001);
      introReady = true;
    });

    let W = 1280, H = 800, isMobile = false;
    const anchor = { x: 890, y: 400 };
    function layout() {
      const rect = hero.getBoundingClientRect();
      W = Math.max(1, rect.width); H = Math.max(1, rect.height);
      isMobile = W <= 860;
      renderer.setSize(W, H, false); composer.setSize(W, H); bloomPass.resolution.set(W, H);
      let robotPx;
      if (!isMobile) {
        robotPx = Math.min(H * 0.62, W * 0.4, 640);
        anchor.x = W * 0.695; anchor.y = H * 0.5 + 8;
      } else {
        const copyTop = copyEl.getBoundingClientRect().top - rect.top;
        const room = Math.max(copyTop - 62, 220);
        robotPx = Math.min(room * 0.92, W * 0.82);
        anchor.x = W / 2; anchor.y = 62 + room * 0.5;
      }
      camera.aspect = W / H;
      camera.position.z = (3.4 * H) / (robotPx * 2 * Math.tan((camera.fov * Math.PI) / 360));
      camera.setViewOffset(W, H, W / 2 - anchor.x, H / 2 - anchor.y, W, H);
      camera.updateProjectionMatrix();
      loaderEl.style.left = anchor.x + "px"; loaderEl.style.top = anchor.y + "px";
    }
    new ResizeObserver(layout).observe(hero);
    layout();

    const target = { x: 0, y: 0 }, look = { x: 0, y: 0 };
    let lastMoveTime = -10;
    function onPointer(cx, cy) {
      const rx = isMobile ? W * 0.5 : Math.max(W * 0.55, 500);
      const ry = isMobile ? H * 0.5 : Math.max(H * 0.55, 400);
      target.x = clamp((cx - anchor.x) / rx, -1.2, 1.2);
      target.y = clamp((cy - anchor.y) / ry, -1.2, 1.2);
      lastMoveTime = performance.now() * 0.001;
    }
    window.addEventListener("pointermove", (e) => onPointer(e.clientX, e.clientY), { passive: true });
    window.addEventListener("pointerdown", (e) => onPointer(e.clientX, e.clientY), { passive: true });
    window.addEventListener("touchmove", (e) => { if (e.touches?.[0]) onPointer(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });

    const rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let intro = 0, prevTime = performance.now() * 0.001, nextBlinkAt = prevTime + 3.2, blinkStart = -1, isVisible = true;
    new IntersectionObserver((entries) => { isVisible = entries[0]?.isIntersecting ?? true; }).observe(hero);

    function animate(nowMs) {
      requestAnimationFrame(animate);
      if (!isVisible) { prevTime = nowMs * 0.001; return; }
      const t = nowMs * 0.001, dt = Math.min(0.05, Math.max(0.0001, t - prevTime));
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
        const km1 = intro - 1;
        robot.scale.setScalar(Math.max(0.001, 1 + 2.4 * km1 * km1 * km1 + 1.4 * km1 * km1));
      }
      const m = rmq.matches ? 0.25 : 1;
      const bob = Math.sin(t * 1.6) * 0.09 * m;
      robot.position.y = bob;
      head.rotation.y = look.x * 0.5;
      head.rotation.x = look.y * 0.42;
      head.rotation.z = -look.x * 0.06 + Math.sin(t * 1.1) * 0.015 * m;
      body.rotation.y = look.x * 0.28;
      body.rotation.x = look.y * 0.12;
      for (const arm of arms) {
        const w = Math.sin(t * 2.0 + arm.phase), sx = Math.sign(arm.x);
        arm.mesh.position.y = arm.y + w * 0.13 * m - bob * 0.35;
        arm.mesh.position.x = arm.x + sx * look.x * -0.04;
        arm.mesh.rotation.z = arm.rz + w * 0.12 * sx * m;
        arm.mesh.rotation.x = Math.sin(t * 1.3 + arm.phase) * 0.08 * m;
      }
      const px = clamp(look.x * 0.075, -0.07, 0.07), py = clamp(-look.y * 0.06, -0.06, 0.06);
      for (const pw of pupilWraps) pw.position.set(px, py, 0);
      if (t >= nextBlinkAt) { blinkStart = t; nextBlinkAt = t + 2.5 + Math.random() * 3.5; }
      let eyeScaleY = 1;
      if (blinkStart > 0) {
        const bp = (t - blinkStart) / 0.32;
        if (bp >= 1) blinkStart = -1;
        else eyeScaleY = 1 - (bp < 0.5 ? bp * 2 : (1 - bp) * 2) * 0.92;
      }
      for (const eg of eyeGroups) eg.scale.y = eyeScaleY;
      floorGlow.scale.set(3.4 - bob * 3, 0.42 - bob * 0.4, 1);
      floorGlowMat.opacity = 0.7 + (0.09 - bob) * 1.5;
      const antOp = 0.7 * (0.85 + Math.sin(t * 1.6) * 0.15) + 0.15;
      for (const ag of antennaGlows) ag.material.opacity = antOp;
      composer.render();
    }
    requestAnimationFrame(animate);
  </script>
</body>
</html>`;
