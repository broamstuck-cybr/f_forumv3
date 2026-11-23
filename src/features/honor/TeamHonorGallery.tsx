import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { AppRoute, DimensionView } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  HONOR_EXHIBITS,
  createHonorArtwork,
  getHonorPlateDataUrl,
  type HonorExhibit,
} from './teamHonorData';
import './team-honor.css';

export interface TeamHonorGalleryProps {
  onBack?: () => void;
  onNavigate?: (view: AppRoute | DimensionView) => void;
}

interface SavedHonorEntry {
  exhibitId: string;
  role: string;
  category: string;
  phase: string;
  savedAt: string;
}

interface SelectionDraft {
  role: string;
  category: string;
  phase: string;
}

interface FrameMeta {
  frameIndex: number;
  exhibitIndex: number;
  th: number;
  r: number;
  y: number;
  focusR: number;
  focusYaw: number;
  group: THREE.Group;
  artMesh: THREE.Mesh;
}

interface RectSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
}

const STORAGE_HONOR_SAVED_KEY = 'fforum_honor_saved_v1';

const CORRIDOR_R = 18;
const CORRIDOR_H = 6.2;
const N_FRAMES = HONOR_EXHIBITS.length;
const ARC_MIN = -0.52;
const ARC_MAX = 0.52;
const WALK_R = 11.8;
const WALK_Y = 2.78;
const WALK_PITCH = 0.01;
const FOCUS_R = CORRIDOR_R - 3.2;
const INIT_TH = -0.26;
const FOCUS_GLIDE_SEC = 0.85;

function clampArc(th: number): number {
  return Math.max(ARC_MIN - 0.04, Math.min(ARC_MAX + 0.04, th));
}

function shortestAngleDelta(from: number, to: number): number {
  const twoPi = Math.PI * 2;
  let d = (to - from) % twoPi;
  if (d > Math.PI) d -= twoPi;
  if (d < -Math.PI) d += twoPi;
  return d;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

function easeOutQuart(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u * u;
}

function createCorridorWallTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, '#ded9cc');
    grad.addColorStop(0.18, '#ebe7dd');
    grad.addColorStop(0.8, '#e8e3d8');
    grad.addColorStop(1, '#d3cdbe');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.strokeStyle = 'rgba(19, 28, 26, 0.07)';
    ctx.lineWidth = 2;
    for (let x = 0; x < c.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, c.height);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(19, 28, 26, 0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 416);
    ctx.lineTo(c.width, 416);
    ctx.stroke();

    ctx.fillStyle = 'rgba(19, 28, 26, 0.035)';
    ctx.fillRect(0, 418, c.width, 94);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(6, 1);
  return tex;
}

function createRadialFloorTexture(): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, half * 0.45, half, half, half);
    grad.addColorStop(0, '#cfc9ba');
    grad.addColorStop(0.55, '#dcd7c9');
    grad.addColorStop(1, '#c7c0b0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(19, 28, 26, 0.09)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(half + Math.cos(a) * half * 0.58, half + Math.sin(a) * half * 0.58);
      ctx.lineTo(half + Math.cos(a) * half, half + Math.sin(a) * half);
      ctx.stroke();
    }
    for (const ringFrac of [0.68, 0.84, 0.96]) {
      ctx.beginPath();
      ctx.arc(half, half, half * ringFrac, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRadialCeilingTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, half * 0.4, half, half, half);
    grad.addColorStop(0, '#efece3');
    grad.addColorStop(0.6, '#f6f3ec');
    grad.addColorStop(1, '#e4dfd3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(19, 28, 26, 0.06)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i += 1) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(half + Math.cos(a) * half * 0.58, half + Math.sin(a) * half * 0.58);
      ctx.lineTo(half + Math.cos(a) * half, half + Math.sin(a) * half);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function loadSavedEntries(): SavedHonorEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_HONOR_SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const TeamHonorGallery: React.FC<TeamHonorGalleryProps> = ({ onBack, onNavigate }) => {
  const { navigate, reducedMotion: storeReducedMotion } = useAppStore();

  const [viewMode, setViewMode] = useState<'3d' | 'list'>('3d');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSheetExhibitId, setActiveSheetExhibitId] = useState<string | null>(null);
  const [focusedExhibitIndex, setFocusedExhibitIndex] = useState<number | null>(null);
  const [hoveredPill, setHoveredPill] = useState<{
    exhibitIndex: number;
    x: number;
    y: number;
  } | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const [savedEntries, setSavedEntries] = useState<SavedHonorEntry[]>(loadSavedEntries);
  const [drafts, setDrafts] = useState<Record<string, SelectionDraft>>(() => {
    const init: Record<string, SelectionDraft> = {};
    for (const ex of HONOR_EXHIBITS) {
      init[ex.id] = {
        role: ex.options.roles[0],
        category: ex.options.categories[0],
        phase: ex.options.phases[0],
      };
    }
    return init;
  });

  const [openAccordions, setOpenAccordions] = useState<{
    coreContribution: boolean;
    architectureResults: boolean;
    gratitude: boolean;
  }>({
    coreContribution: true,
    architectureResults: false,
    gratitude: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetMatImgRef = useRef<HTMLImageElement>(null);
  const pendingFlyRectRef = useRef<RectSnapshot | null>(null);
  const lastFlyImageUrlRef = useRef<string>('');
  const sceneControlRef = useRef<{
    focusFrameByIndex: (frameIdx: number) => void;
    focusExhibitId: (exhibitId: string) => void;
    stepWalk: (delta: number) => void;
    exitFocus: () => void;
    projectFocusedRect: () => RectSnapshot | null;
  } | null>(null);

  const systemReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  const isReducedMotion = storeReducedMotion || systemReducedMotion;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_HONOR_SAVED_KEY, JSON.stringify(savedEntries));
    } catch {
      return;
    }
  }, [savedEntries]);

  const exhibitById = useMemo(() => {
    const map = new Map<string, HonorExhibit>();
    for (const item of HONOR_EXHIBITS) {
      map.set(item.id, item);
    }
    return map;
  }, []);

  const [plateTick, setPlateTick] = useState(0);

  const plateUrls = useMemo(() => {
    void plateTick;
    const map = new Map<string, string>();
    if (typeof document === 'undefined') return map;
    for (const ex of HONOR_EXHIBITS) {
      map.set(
        ex.id,
        getHonorPlateDataUrl(ex, () => setPlateTick((t) => t + 1))
      );
    }
    return map;
  }, [plateTick]);

  const filteredExhibits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return HONOR_EXHIBITS;
    return HONOR_EXHIBITS.filter(
      (ex) =>
        ex.title.toLowerCase().includes(q) ||
        ex.subtitle.toLowerCase().includes(q) ||
        ex.track.toLowerCase().includes(q) ||
        ex.code.includes(q) ||
        ex.accordions.coreContribution.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeExhibit = activeSheetExhibitId ? exhibitById.get(activeSheetExhibitId) ?? null : null;

  const handleGoBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('home');
    } else {
      navigate('home');
    }
  }, [navigate, onBack, onNavigate]);

  const openExhibitSheet = useCallback(
    (exhibitId: string, sourceRect?: RectSnapshot | null) => {
      const targetEx = exhibitById.get(exhibitId);
      if (!targetEx) return;
      pendingFlyRectRef.current = sourceRect ?? null;
      lastFlyImageUrlRef.current = plateUrls.get(exhibitId) || getHonorPlateDataUrl(targetEx);
      setActiveSheetExhibitId(exhibitId);
      setSearchOpen(false);
    },
    [exhibitById, plateUrls]
  );

  useEffect(() => {
    if (!activeSheetExhibitId) return undefined;
    if (isReducedMotion) {
      pendingFlyRectRef.current = null;
      return undefined;
    }
    const srcRect = pendingFlyRectRef.current;
    pendingFlyRectRef.current = null;
    const destEl = sheetMatImgRef.current;
    if (!srcRect || !destEl || typeof destEl.animate !== 'function') return undefined;
    if (srcRect.width < 12 || srcRect.height < 12) return undefined;

    const raf = requestAnimationFrame(() => {
      const destRect = destEl.getBoundingClientRect();
      if (destRect.width < 12 || destRect.height < 12) return;

      const flyer = document.createElement('img');
      flyer.src = lastFlyImageUrlRef.current || destEl.src;
      flyer.alt = '';
      flyer.setAttribute('aria-hidden', 'true');
      flyer.style.position = 'fixed';
      flyer.style.left = `${srcRect.left}px`;
      flyer.style.top = `${srcRect.top}px`;
      flyer.style.width = `${srcRect.width}px`;
      flyer.style.height = `${srcRect.height}px`;
      flyer.style.objectFit = 'cover';
      flyer.style.borderRadius = '10px';
      flyer.style.zIndex = '75';
      flyer.style.pointerEvents = 'none';
      flyer.style.boxShadow = '0 24px 60px rgba(0, 0, 0, 0.28)';
      document.body.appendChild(flyer);

      destEl.style.opacity = '0';
      const anim = flyer.animate(
        [
          {
            left: `${srcRect.left}px`,
            top: `${srcRect.top}px`,
            width: `${srcRect.width}px`,
            height: `${srcRect.height}px`,
            opacity: 0.96,
          },
          {
            left: `${destRect.left}px`,
            top: `${destRect.top}px`,
            width: `${destRect.width}px`,
            height: `${destRect.height}px`,
            opacity: 1,
          },
        ],
        {
          duration: 360,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        }
      );
      anim.onfinish = () => {
        destEl.style.opacity = '1';
        flyer.remove();
      };
      anim.oncancel = () => {
        destEl.style.opacity = '1';
        flyer.remove();
      };
    });

    return () => cancelAnimationFrame(raf);
  }, [activeSheetExhibitId, isReducedMotion]);

  const toggleSaveExhibit = useCallback(
    (exhibit: HonorExhibit) => {
      const draft = drafts[exhibit.id] || {
        role: exhibit.options.roles[0],
        category: exhibit.options.categories[0],
        phase: exhibit.options.phases[0],
      };
      setSavedEntries((prev) => {
        const idx = prev.findIndex((item) => item.exhibitId === exhibit.id);
        if (idx >= 0) {
          return prev.filter((item) => item.exhibitId !== exhibit.id);
        }
        return [
          {
            exhibitId: exhibit.id,
            role: draft.role,
            category: draft.category,
            phase: draft.phase,
            savedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    },
    [drafts]
  );

  const updateDraftChoice = useCallback(
    (exhibitId: string, field: keyof SelectionDraft, value: string) => {
      setDrafts((prev) => {
        const curr = prev[exhibitId];
        if (!curr) return prev;
        return {
          ...prev,
          [exhibitId]: {
            ...curr,
            [field]: value,
          },
        };
      });
      setSavedEntries((prev) =>
        prev.map((entry) =>
          entry.exhibitId === exhibitId ? { ...entry, [field]: value } : entry
        )
      );
    },
    []
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (drawerOpen) {
          setDrawerOpen(false);
        } else if (searchOpen) {
          setSearchOpen(false);
        } else if (activeSheetExhibitId) {
          setActiveSheetExhibitId(null);
        } else if (focusedExhibitIndex !== null) {
          sceneControlRef.current?.exitFocus();
        }
        return;
      }

      if (isInput || viewMode !== '3d' || activeSheetExhibitId || drawerOpen) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'd' || e.key === 'w') {
        e.preventDefault();
        sceneControlRef.current?.stepWalk(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'a' || e.key === 's') {
        e.preventDefault();
        sceneControlRef.current?.stepWalk(-1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSheetExhibitId, drawerOpen, focusedExhibitIndex, searchOpen, viewMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || viewMode !== '3d' || typeof window === 'undefined') return undefined;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return undefined;
    }

    setWebglUnavailable(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    const fogColor = new THREE.Color('#eae6dc');
    scene.background = fogColor;
    scene.fog = new THREE.FogExp2(0xeae6dc, 0.022);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 90);

    scene.add(new THREE.HemisphereLight(0xfffdf8, 0xcac3b2, 1.35));
    const keyLight = new THREE.DirectionalLight(0xfff7ea, 0.8);
    keyLight.position.set(12, 18, 10);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xd9efe6, 0.45);
    fillLight.position.set(-14, 10, -12);
    scene.add(fillLight);

    const wallTex = createCorridorWallTexture();
    const floorTex = createRadialFloorTexture();
    const ceilingTex = createRadialCeilingTexture();

    const outerWallGeo = new THREE.CylinderGeometry(CORRIDOR_R, CORRIDOR_R, CORRIDOR_H, 160, 1, true);
    const outerWallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.BackSide,
    });
    const outerWall = new THREE.Mesh(outerWallGeo, outerWallMat);
    outerWall.position.y = CORRIDOR_H * 0.5;
    scene.add(outerWall);

    const floorGeo = new THREE.CircleGeometry(CORRIDOR_R, 160);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.82,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI * 0.5;
    floorMesh.position.y = 0;
    scene.add(floorMesh);

    const ceilingGeo = new THREE.CircleGeometry(CORRIDOR_R, 160);
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: ceilingTex,
      roughness: 0.94,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI * 0.5;
    ceilingMesh.position.y = CORRIDOR_H;
    scene.add(ceilingMesh);

    const frameW = 1.62;
    const frameH = frameW * (763 / 567);
    const backingGeo = new THREE.BoxGeometry(frameW + 0.16, frameH + 0.16, 0.06);
    const matGeo = new THREE.PlaneGeometry(frameW + 0.07, frameH + 0.07);
    const artGeo = new THREE.PlaneGeometry(frameW, frameH);

    const backingMat = new THREE.MeshStandardMaterial({
      color: '#18211f',
      roughness: 0.45,
      metalness: 0.18,
    });
    const matBoardMat = new THREE.MeshStandardMaterial({
      color: '#faf7f0',
      roughness: 0.8,
      metalness: 0,
    });

    const exhibitMaterials = HONOR_EXHIBITS.map((exhibit) => {
      const art = createHonorArtwork(exhibit, maxAniso, () => setPlateTick((t) => t + 1));
      return new THREE.MeshBasicMaterial({
        map: art.texture,
      });
    });

    const frames: FrameMeta[] = [];
    const hitMeshes: THREE.Mesh[] = [];

    const addFrame = (frameIndex: number, exhibitIndex: number, th: number, y: number) => {
      const rWall = CORRIDOR_R - 0.16;

      const group = new THREE.Group();
      group.position.set(rWall * Math.cos(th), y, rWall * Math.sin(th));
      group.lookAt(0, y, 0);

      const backing = new THREE.Mesh(backingGeo, backingMat);
      group.add(backing);

      const matMesh = new THREE.Mesh(matGeo, matBoardMat);
      matMesh.position.z = 0.032;
      group.add(matMesh);

      const artMesh = new THREE.Mesh(artGeo, exhibitMaterials[exhibitIndex]);
      artMesh.position.z = 0.036;
      artMesh.userData = { frameIndex, exhibitIndex };
      group.add(artMesh);

      scene.add(group);
      hitMeshes.push(artMesh);
      frames.push({
        frameIndex,
        exhibitIndex,
        th,
        r: rWall,
        y,
        focusR: FOCUS_R,
        focusYaw: 0,
        group,
        artMesh,
      });
    };

    for (let i = 0; i < N_FRAMES; i += 1) {
      const th = ARC_MIN + (i / Math.max(1, N_FRAMES - 1)) * (ARC_MAX - ARC_MIN);
      const y = 2.86 + (i % 2 === 0 ? 0.06 : -0.06);
      addFrame(i, i, th, y);
    }

    const pose = {
      th: INIT_TH,
      targetTh: INIT_TH,
      r: WALK_R,
      y: WALK_Y,
      yaw: 0,
      pitch: WALK_PITCH,
    };

    const pointerNorm = { x: 0, y: 0 };
    let hoveredFrameIdx: number | null = null;
    let focusedFrameIdx: number | null = null;

    interface GlideAnim {
      active: boolean;
      elapsed: number;
      duration: number;
      startTh: number;
      dTh: number;
      startR: number;
      targetR: number;
      startY: number;
      targetY: number;
      startYaw: number;
      dYaw: number;
      startPitch: number;
      targetPitch: number;
      onDone?: () => void;
    }

    const glide: GlideAnim = {
      active: false,
      elapsed: 0,
      duration: FOCUS_GLIDE_SEC,
      startTh: 0,
      dTh: 0,
      startR: WALK_R,
      targetR: WALK_R,
      startY: WALK_Y,
      targetY: WALK_Y,
      startYaw: 0,
      dYaw: 0,
      startPitch: WALK_PITCH,
      targetPitch: WALK_PITCH,
    };

    const startGlide = (
      targetTh: number,
      targetR: number,
      targetY: number,
      targetYaw: number,
      targetPitch: number,
      onDone?: () => void
    ) => {
      const dTh = shortestAngleDelta(pose.th, targetTh);
      const dYaw = shortestAngleDelta(pose.yaw, targetYaw);
      if (isReducedMotion) {
        pose.th += dTh;
        pose.targetTh = pose.th;
        pose.r = targetR;
        pose.y = targetY;
        pose.yaw = targetYaw;
        pose.pitch = targetPitch;
        glide.active = false;
        onDone?.();
        return;
      }
      glide.active = true;
      glide.elapsed = 0;
      glide.duration = FOCUS_GLIDE_SEC;
      glide.startTh = pose.th;
      glide.dTh = dTh;
      glide.startR = pose.r;
      glide.targetR = targetR;
      glide.startY = pose.y;
      glide.targetY = targetY;
      glide.startYaw = pose.yaw;
      glide.dYaw = dYaw;
      glide.startPitch = pose.pitch;
      glide.targetPitch = targetPitch;
      glide.onDone = onDone;
    };

    const focusFrame = (frameIdx: number) => {
      const f = frames[frameIdx];
      if (!f) return;
      focusedFrameIdx = frameIdx;
      setFocusedExhibitIndex(f.exhibitIndex);
      startGlide(f.th, f.focusR, f.y, f.focusYaw, 0);
    };

    const exitFocus = () => {
      if (focusedFrameIdx === null) return;
      focusedFrameIdx = null;
      setFocusedExhibitIndex(null);
      pose.targetTh = pose.th;
      startGlide(pose.th, WALK_R, WALK_Y, 0, WALK_PITCH);
    };

    const projectFrameRect = (frameIdx: number): RectSnapshot | null => {
      const f = frames[frameIdx];
      if (!f || !renderer) return null;
      const rect = canvas.getBoundingClientRect();
      const hw = frameW * 0.5;
      const hh = frameH * 0.5;
      const corners = [
        new THREE.Vector3(-hw, -hh, 0.036),
        new THREE.Vector3(hw, -hh, 0.036),
        new THREE.Vector3(-hw, hh, 0.036),
        new THREE.Vector3(hw, hh, 0.036),
      ];
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      f.group.updateMatrixWorld(true);
      for (const pt of corners) {
        pt.applyMatrix4(f.group.matrixWorld);
        pt.project(camera);
        const sx = rect.left + (pt.x * 0.5 + 0.5) * rect.width;
        const sy = rect.top + (-pt.y * 0.5 + 0.5) * rect.height;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }
      if (!Number.isFinite(minX)) return null;
      return {
        left: minX,
        top: minY,
        width: Math.max(20, maxX - minX),
        height: Math.max(20, maxY - minY),
      };
    };

    sceneControlRef.current = {
      focusFrameByIndex: (idx: number) => focusFrame(idx),
      focusExhibitId: (exhibitId: string) => {
        const exIdx = HONOR_EXHIBITS.findIndex((e) => e.id === exhibitId);
        if (exIdx >= 0 && frames[exIdx]) {
          focusFrame(frames[exIdx].frameIndex);
        }
      },
      stepWalk: (delta: number) => {
        if (focusedFrameIdx !== null) {
          const nextIdx = Math.max(0, Math.min(frames.length - 1, focusedFrameIdx + delta));
          focusFrame(nextIdx);
        } else {
          const step = (ARC_MAX - ARC_MIN) / Math.max(1, N_FRAMES - 1);
          pose.targetTh = clampArc(pose.targetTh + delta * step);
        }
      },
      exitFocus,
      projectFocusedRect: () =>
        focusedFrameIdx !== null ? projectFrameRect(focusedFrameIdx) : null,
    };

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      renderer?.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w <= 640 ? 56 : 48;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(updateSize);
    ro.observe(canvas);
    updateSize();

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    let dragging = false;
    let dragMoved = 0;
    let lastX = 0;

    const pickFrameAt = (clientX: number, clientY: number): number | null => {
      const rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(hitMeshes, false);
      if (hits.length > 0 && hits[0].distance < 22) {
        const idx = hits[0].object.userData.frameIndex;
        return typeof idx === 'number' ? idx : null;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      dragMoved = 0;
      lastX = e.clientX;
      canvas.classList.add('is-dragging');
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNorm.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      if (dragging) {
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        dragMoved += Math.abs(dx);
        if (dragMoved > 5) {
          if (focusedFrameIdx !== null) {
            focusedFrameIdx = null;
            setFocusedExhibitIndex(null);
            glide.active = false;
            pose.r = WALK_R;
            pose.y = WALK_Y;
            pose.yaw = 0;
            pose.pitch = WALK_PITCH;
          }
          pose.targetTh = clampArc(pose.targetTh - dx * 0.0022);
        }
        return;
      }

      const picked = pickFrameAt(e.clientX, e.clientY);
      hoveredFrameIdx = picked;
      if (picked !== null) {
        canvas.classList.add('is-pointer');
        const pr = projectFrameRect(picked);
        if (pr) {
          setHoveredPill({
            exhibitIndex: frames[picked].exhibitIndex,
            x: pr.left + pr.width * 0.5,
            y: Math.max(88, pr.top - 10),
          });
        }
      } else {
        canvas.classList.remove('is-pointer');
        setHoveredPill(null);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      canvas.classList.remove('is-dragging');

      if (dragMoved < 6) {
        const picked = pickFrameAt(e.clientX, e.clientY);
        if (picked !== null) {
          if (focusedFrameIdx === picked) {
            const rectSnap = projectFrameRect(picked);
            const exhibit = HONOR_EXHIBITS[frames[picked].exhibitIndex];
            if (exhibit) openExhibitSheet(exhibit.id, rectSnap);
          } else {
            focusFrame(picked);
          }
        } else if (focusedFrameIdx !== null) {
          exitFocus();
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (focusedFrameIdx !== null) {
        exitFocus();
      }
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      pose.targetTh = clampArc(pose.targetTh + delta * 0.00055);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    let contextLost = false;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      setWebglUnavailable(true);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    const forwardVec = new THREE.Vector3();
    const rightVec = new THREE.Vector3();
    const lookDir = new THREE.Vector3();
    const upVec = new THREE.Vector3(0, 1, 0);

    let prevMs = performance.now();
    let rafId = 0;

    const tick = (nowMs: number) => {
      rafId = requestAnimationFrame(tick);
      if (contextLost || !renderer) return;

      const dt = Math.min(0.05, Math.max(0.001, (nowMs - prevMs) * 0.001));
      prevMs = nowMs;

      if (glide.active) {
        glide.elapsed += dt;
        const u = Math.min(1, glide.elapsed / glide.duration);
        const eTh = easeOutQuart(u);
        const eYaw = easeOutQuad(u);
        const ePos = easeOutCubic(u);

        pose.th = glide.startTh + glide.dTh * eTh;
        pose.targetTh = pose.th;
        pose.yaw = glide.startYaw + glide.dYaw * eYaw;
        pose.r = glide.startR + (glide.targetR - glide.startR) * ePos;
        pose.y = glide.startY + (glide.targetY - glide.startY) * ePos;
        pose.pitch = glide.startPitch + (glide.targetPitch - glide.startPitch) * ePos;

        if (u >= 1) {
          glide.active = false;
          glide.onDone?.();
        }
      } else if (focusedFrameIdx === null) {
        const damp = isReducedMotion ? 1 : 1 - Math.exp(-dt / 0.36);
        pose.th += (pose.targetTh - pose.th) * damp;
        pose.r += (WALK_R - pose.r) * damp;
        pose.y += (WALK_Y - pose.y) * damp;

        const parallaxYaw = isReducedMotion ? 0 : pointerNorm.x * 0.14;
        const parallaxPitch = isReducedMotion ? WALK_PITCH : WALK_PITCH - pointerNorm.y * 0.06;
        pose.yaw += (parallaxYaw - pose.yaw) * Math.min(1, dt * 6);
        pose.pitch += (parallaxPitch - pose.pitch) * Math.min(1, dt * 6);
      }

      const cosT = Math.cos(pose.th);
      const sinT = Math.sin(pose.th);
      camera.position.set(pose.r * cosT, pose.y, pose.r * sinT);

      // WHY: Radial outward forwardVec faces the single curved front gallery arc (-0.52..+0.52 rad) directly without corridor blind spots.
      forwardVec.set(cosT, 0, sinT);
      rightVec.set(-sinT, 0, cosT);

      lookDir
        .copy(forwardVec)
        .multiplyScalar(Math.cos(pose.yaw))
        .addScaledVector(rightVec, Math.sin(pose.yaw))
        .multiplyScalar(Math.cos(pose.pitch))
        .addScaledVector(upVec, Math.sin(pose.pitch))
        .normalize();

      camera.lookAt(
        camera.position.x + lookDir.x,
        camera.position.y + lookDir.y,
        camera.position.z + lookDir.z
      );

      if (hoveredFrameIdx !== null && focusedFrameIdx === null) {
        const pr = projectFrameRect(hoveredFrameIdx);
        if (pr) {
          setHoveredPill((prev) =>
            prev
              ? { ...prev, x: pr.left + pr.width * 0.5, y: Math.max(88, pr.top - 10) }
              : null
          );
        }
      }

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      sceneControlRef.current = null;

      outerWallGeo.dispose();
      outerWallMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      ceilingGeo.dispose();
      ceilingMat.dispose();
      wallTex.dispose();
      floorTex.dispose();
      ceilingTex.dispose();
      backingGeo.dispose();
      backingMat.dispose();
      matGeo.dispose();
      matBoardMat.dispose();
      artGeo.dispose();
      exhibitMaterials.forEach((m) => m.dispose());
      renderer?.dispose();
    };
  }, [isReducedMotion, openExhibitSheet, viewMode]);

  const focusedExhibit =
    focusedExhibitIndex !== null ? HONOR_EXHIBITS[focusedExhibitIndex] ?? null : null;

  const isActiveSaved = activeExhibit
    ? savedEntries.some((item) => item.exhibitId === activeExhibit.id)
    : false;

  const activeDraft = activeExhibit ? drafts[activeExhibit.id] : null;

  return (
    <div className="thg-root">
      <header className="thg-header">
        <button
          type="button"
          className="thg-brand"
          onClick={() => {
            setActiveSheetExhibitId(null);
            setViewMode('3d');
          }}
        >
          <span className="thg-brand-mark" aria-hidden="true">
            <Compass size={14} />
          </span>
          <span>F-Forum · Sổ Vinh Danh</span>
        </button>

        <nav className="thg-nav" aria-label="Điều hướng Sổ Vinh Danh">
          <button
            type="button"
            className={`thg-nav-link ${viewMode === '3d' && !activeSheetExhibitId ? 'is-active' : ''}`}
            onClick={() => {
              setActiveSheetExhibitId(null);
              setViewMode('3d');
            }}
          >
            Hành lang 3D
          </button>
          <button
            type="button"
            className={`thg-nav-link ${viewMode === 'list' && !activeSheetExhibitId ? 'is-active' : ''}`}
            onClick={() => {
              setActiveSheetExhibitId(null);
              setViewMode('list');
            }}
          >
            Danh sách
          </button>
          <button
            type="button"
            className="thg-nav-link thg-nav-link--back"
            onClick={handleGoBack}
          >
            Quay lại F-Forum
          </button>
        </nav>

        <div className="thg-header-actions">
          <button
            type="button"
            className={`thg-icon-btn ${searchOpen ? 'is-active' : ''}`}
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Tìm kiếm hồ sơ đội ngũ"
            aria-expanded={searchOpen}
          >
            <Search size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="thg-saved-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label={`Mở Hồ sơ đã lưu (${savedEntries.length})`}
          >
            <Bookmark size={16} aria-hidden="true" />
            <span className="thg-saved-label">Hồ sơ đã lưu</span>
            <span className="thg-saved-badge">{savedEntries.length}</span>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="thg-search-bar" role="search" aria-label="Lọc hồ sơ vinh danh">
          <div className="thg-search-input-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              className="thg-search-input"
              placeholder="Tìm vai trò, khảo sát 195, kiến trúc, bảo mật..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="thg-icon-btn"
                style={{ width: 28, height: 28 }}
                onClick={() => setSearchQuery('')}
                aria-label="Xóa từ khóa"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="thg-search-results">
            {filteredExhibits.length === 0 ? (
              <p style={{ margin: '8px 4px', fontSize: 13, color: 'var(--thg-muted)' }}>
                Không có hồ sơ phù hợp với từ khóa "{searchQuery}".
              </p>
            ) : (
              filteredExhibits.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  className="thg-search-item"
                  onClick={() => {
                    setSearchOpen(false);
                    if (viewMode === '3d') {
                      setActiveSheetExhibitId(null);
                      sceneControlRef.current?.focusExhibitId(ex.id);
                    } else {
                      openExhibitSheet(ex.id);
                    }
                  }}
                >
                  <div>
                    <div className="thg-search-item-title">{ex.title}</div>
                    <div className="thg-search-item-sub">{ex.subtitle}</div>
                  </div>
                  <span className="thg-search-item-code">{ex.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === '3d' && (
        <div className="thg-stage-wrap">
          <canvas
            ref={canvasRef}
            className="thg-canvas"
            aria-label="Hành lang trưng bày 3D Đội ngũ Phát triển F-Forum"
          />

          {webglUnavailable && (
            <div className="thg-webgl-fallback">
              <p className="thg-hud-kicker">PHÒNG VINH DANH F-FORUM</p>
              <h2 className="thg-hud-headline">Trình duyệt tạm tắt WebGL 3D</h2>
              <p className="thg-hud-sub">
                Bạn vẫn có thể duyệt toàn bộ 9 hồ sơ đội ngũ phát triển dưới dạng thẻ biên tập.
              </p>
              <button
                type="button"
                className="thg-primary-btn"
                onClick={() => setViewMode('list')}
              >
                Mở chế độ Danh sách
              </button>
            </div>
          )}

          {!activeSheetExhibitId && !webglUnavailable && (
            <div className="thg-hud">
              <div className="thg-hud-top">
                <div className="thg-hud-hint-box">
                  <span>
                    {focusedExhibit
                      ? `Đang soi Bản ghi ${focusedExhibit.code} · Nhấp lại khung tranh để mở hồ sơ · Esc để lùi`
                      : 'Kéo ngang hoặc cuộn để dạo hành lang · Nhấp vào khung tranh để soi'}
                  </span>
                </div>

                <div className="thg-hud-mode-pill" role="group" aria-label="Chế độ hiển thị">
                  <button
                    type="button"
                    className={`thg-hud-mode-btn ${viewMode === '3d' ? 'is-active' : ''}`}
                    onClick={() => setViewMode('3d')}
                  >
                    3D GALLERY
                  </button>
                  <button
                    type="button"
                    className="thg-hud-mode-btn"
                    onClick={() => setViewMode('list')}
                  >
                    DANH SÁCH
                  </button>
                </div>
              </div>

              <div className="thg-hud-arrows">
                <button
                  type="button"
                  className="thg-circle-arrow"
                  onClick={() => sceneControlRef.current?.stepWalk(-1)}
                  aria-label="Lùi hoặc qua khung trước"
                >
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="thg-circle-arrow"
                  onClick={() => sceneControlRef.current?.stepWalk(1)}
                  aria-label="Tiến hoặc qua khung tiếp theo"
                >
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
              </div>

              {hoveredPill && !focusedExhibit && (
                <button
                  type="button"
                  className="thg-inspect-pill"
                  style={{ left: hoveredPill.x, top: hoveredPill.y }}
                  onClick={() => {
                    const ex = HONOR_EXHIBITS[hoveredPill.exhibitIndex];
                    if (ex) openExhibitSheet(ex.id);
                  }}
                >
                  <Eye size={13} aria-hidden="true" />
                  <span>XEM HỒ SƠ</span>
                </button>
              )}

              <div className="thg-hud-bottom">
                <div className="thg-hud-title-block">
                  <p className="thg-hud-kicker">
                    {focusedExhibit
                      ? `${focusedExhibit.kicker} · ${focusedExhibit.milestone}`
                      : 'CỘNG ĐỒNG F-FORUM · SỔ TAY TRI ÂN'}
                  </p>
                  <h1 className="thg-hud-headline">
                    {focusedExhibit ? focusedExhibit.title : 'ĐỘI NGŨ F-FORUM'}
                  </h1>
                  <p className="thg-hud-sub">
                    {focusedExhibit
                      ? focusedExhibit.subtitle
                      : '9 bản ghi kiến tạo nền tảng học tập web mở, minh bạch và chống AI Slop.'}
                  </p>
                </div>

                <div className="thg-hud-bottom-actions">
                  {focusedExhibit && (
                    <>
                      <button
                        type="button"
                        className="thg-ghost-btn"
                        onClick={() => sceneControlRef.current?.exitFocus()}
                      >
                        <ArrowLeft size={16} aria-hidden="true" />
                        <span>Lùi lại hành lang</span>
                      </button>
                      <button
                        type="button"
                        className="thg-primary-btn"
                        onClick={() =>
                          openExhibitSheet(
                            focusedExhibit.id,
                            sceneControlRef.current?.projectFocusedRect()
                          )
                        }
                      >
                        <Eye size={16} aria-hidden="true" />
                        <span>XEM HỒ SƠ</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={focusedExhibit ? 'thg-ghost-btn' : 'thg-primary-btn'}
                    onClick={() => setDrawerOpen(true)}
                  >
                    <span>MỞ BỘ SƯU TẬP</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <section className="thg-list-view" aria-label="Danh sách 9 bản ghi đội ngũ F-Forum">
          <div className="thg-list-head">
            <div>
              <p className="thg-hud-kicker">PHÒNG VINH DANH ĐỘI NGŨ PHÁT TRIỂN · CỘNG ĐỒNG F-FORUM</p>
              <h1 className="thg-list-title">Sổ Tay Đóng Góp F-Forum</h1>
            </div>
            <p className="thg-list-lede">
              Chín phân khu ghi nhận tập thể tác giả, thầy cô cố vấn, khảo sát thực chứng 195 học sinh và kiến trúc mở phía sau F-Forum.
            </p>
          </div>

          <div className="thg-grid">
            {filteredExhibits.map((ex) => {
              const src = plateUrls.get(ex.id) || '';
              return (
                <article key={ex.id} className="thg-card">
                  <button
                    type="button"
                    className="thg-card-plate-btn"
                    onClick={(ev) => {
                      const img = ev.currentTarget.querySelector('img');
                      const r = img?.getBoundingClientRect();
                      openExhibitSheet(
                        ex.id,
                        r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null
                      );
                    }}
                  >
                    {src && (
                      <img
                        src={src}
                        alt={`Bản ghi ${ex.code}: ${ex.title}`}
                        className="thg-card-plate"
                        loading="lazy"
                      />
                    )}
                  </button>
                  <div className="thg-card-body">
                    <div className="thg-card-meta">
                      <span>{ex.kicker}</span>
                      <span>{ex.milestone}</span>
                    </div>
                    <h2 className="thg-card-title">{ex.title}</h2>
                    <p className="thg-card-sub">{ex.subtitle}</p>
                    <div className="thg-card-actions">
                      <button
                        type="button"
                        className="thg-primary-btn"
                        style={{ flex: 1 }}
                        onClick={(ev) => {
                          const card = ev.currentTarget.closest('.thg-card');
                          const img = card?.querySelector('img');
                          const r = img?.getBoundingClientRect();
                          openExhibitSheet(
                            ex.id,
                            r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null
                          );
                        }}
                      >
                        <Eye size={15} aria-hidden="true" />
                        <span>Xem hồ sơ</span>
                      </button>
                      <button
                        type="button"
                        className="thg-icon-btn"
                        onClick={() => {
                          setViewMode('3d');
                          setTimeout(() => sceneControlRef.current?.focusExhibitId(ex.id), 60);
                        }}
                        aria-label={`Soi ${ex.title} trong Hành lang 3D`}
                        title="Soi trong Hành lang 3D"
                      >
                        <Compass size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeExhibit && activeDraft && (
        <section
          id="honor-sheet"
          className="thg-sheet-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="thg-sheet-heading"
        >
          <div className="thg-sheet-inner">
            <div className="thg-sheet-topbar">
              <button
                type="button"
                className="thg-ghost-btn"
                onClick={() => setActiveSheetExhibitId(null)}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span>{viewMode === '3d' ? 'Quay lại Hành lang 3D' : 'Quay lại Danh sách'}</span>
              </button>

              <button
                type="button"
                className="thg-icon-btn"
                onClick={() => setActiveSheetExhibitId(null)}
                aria-label="Đóng hồ sơ chi tiết"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="thg-sheet-layout">
              <div className="thg-sheet-mat">
                <img
                  ref={sheetMatImgRef}
                  src={plateUrls.get(activeExhibit.id) || getHonorPlateDataUrl(activeExhibit)}
                  alt={`Bản vẽ vinh danh ${activeExhibit.title}`}
                  className="thg-sheet-img"
                />
              </div>

              <div className="thg-sheet-content">
                <p className="thg-sheet-kicker">
                  {activeExhibit.kicker} · {activeExhibit.track}
                </p>
                <h2 id="thg-sheet-heading" className="thg-sheet-title">
                  {activeExhibit.title}
                </h2>
                <p className="thg-sheet-subtitle">{activeExhibit.subtitle}</p>

                <div className="thg-sheet-metrics">
                  {activeExhibit.metrics.map((m) => (
                    <div key={m.label} className="thg-metric-box">
                      <span className="thg-metric-val">{m.value}</span>
                      <span className="thg-metric-lbl">{m.label}</span>
                    </div>
                  ))}
                </div>

                <div className="thg-chips-section">
                  <div className="thg-chip-group">
                    <span className="thg-chip-label">Vai trò ghi nhận</span>
                    <div className="thg-chip-row">
                      {activeExhibit.options.roles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          className={`thg-chip ${activeDraft.role === role ? 'is-selected' : ''}`}
                          onClick={() => updateDraftChoice(activeExhibit.id, 'role', role)}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="thg-chip-group">
                    <span className="thg-chip-label">Hạng mục</span>
                    <div className="thg-chip-row">
                      {activeExhibit.options.categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`thg-chip ${activeDraft.category === cat ? 'is-selected' : ''}`}
                          onClick={() => updateDraftChoice(activeExhibit.id, 'category', cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="thg-chip-group">
                    <span className="thg-chip-label">Giai đoạn</span>
                    <div className="thg-chip-row">
                      {activeExhibit.options.phases.map((ph) => (
                        <button
                          key={ph}
                          type="button"
                          className={`thg-chip ${activeDraft.phase === ph ? 'is-selected' : ''}`}
                          onClick={() => updateDraftChoice(activeExhibit.id, 'phase', ph)}
                        >
                          {ph}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="thg-sheet-cta-row">
                  <button
                    type="button"
                    className="thg-primary-btn"
                    onClick={() => toggleSaveExhibit(activeExhibit)}
                  >
                    {isActiveSaved ? (
                      <>
                        <BookmarkCheck size={17} aria-hidden="true" />
                        <span>Đã lưu trong hồ sơ</span>
                      </>
                    ) : (
                      <>
                        <Bookmark size={17} aria-hidden="true" />
                        <span>Lưu vào hồ sơ</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="thg-ghost-btn"
                    onClick={() => setDrawerOpen(true)}
                  >
                    <span>Mở Hồ sơ đã lưu ({savedEntries.length})</span>
                  </button>
                </div>

                <div className="thg-accordions">
                  <div className="thg-accordion-item">
                    <button
                      type="button"
                      className="thg-accordion-trigger"
                      aria-expanded={openAccordions.coreContribution}
                      onClick={() =>
                        setOpenAccordions((s) => ({
                          ...s,
                          coreContribution: !s.coreContribution,
                        }))
                      }
                    >
                      <span>Đóng góp cốt lõi</span>
                      <ChevronDown
                        size={17}
                        style={{
                          transform: openAccordions.coreContribution
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                        }}
                        aria-hidden="true"
                      />
                    </button>
                    {openAccordions.coreContribution && (
                      <div className="thg-accordion-body">
                        {activeExhibit.accordions.coreContribution}
                      </div>
                    )}
                  </div>

                  <div className="thg-accordion-item">
                    <button
                      type="button"
                      className="thg-accordion-trigger"
                      aria-expanded={openAccordions.architectureResults}
                      onClick={() =>
                        setOpenAccordions((s) => ({
                          ...s,
                          architectureResults: !s.architectureResults,
                        }))
                      }
                    >
                      <span>Kiến trúc &amp; Kết quả</span>
                      <ChevronDown
                        size={17}
                        style={{
                          transform: openAccordions.architectureResults
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                        }}
                        aria-hidden="true"
                      />
                    </button>
                    {openAccordions.architectureResults && (
                      <div className="thg-accordion-body">
                        {activeExhibit.accordions.architectureResults}
                      </div>
                    )}
                  </div>

                  <div className="thg-accordion-item">
                    <button
                      type="button"
                      className="thg-accordion-trigger"
                      aria-expanded={openAccordions.gratitude}
                      onClick={() =>
                        setOpenAccordions((s) => ({
                          ...s,
                          gratitude: !s.gratitude,
                        }))
                      }
                    >
                      <span>Tri ân</span>
                      <ChevronDown
                        size={17}
                        style={{
                          transform: openAccordions.gratitude ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                        aria-hidden="true"
                      />
                    </button>
                    {openAccordions.gratitude && (
                      <div className="thg-accordion-body">{activeExhibit.accordions.gratitude}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="thg-related">
              <p className="thg-related-head">KHÁM PHÁ TIẾP</p>
              <div className="thg-related-grid">
                {activeExhibit.relatedIds.map((relId) => {
                  const rel = exhibitById.get(relId);
                  if (!rel) return null;
                  const relSrc = plateUrls.get(rel.id) || '';
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      className="thg-related-card"
                      onClick={() => openExhibitSheet(rel.id)}
                    >
                      {relSrc && (
                        <img src={relSrc} alt="" className="thg-related-thumb" aria-hidden="true" />
                      )}
                      <div>
                        <span className="thg-search-item-code">{rel.kicker}</span>
                        <h3 className="thg-related-title">{rel.title}</h3>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {drawerOpen && (
        <div
          className="thg-drawer-backdrop"
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            className="thg-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Hồ sơ đã lưu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="thg-drawer-head">
              <h2 className="thg-drawer-title">HỒ SƠ ĐÃ LƯU ({savedEntries.length})</h2>
              <button
                type="button"
                className="thg-icon-btn"
                onClick={() => setDrawerOpen(false)}
                aria-label="Đóng ngăn kéo hồ sơ đã lưu"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div className="thg-drawer-list">
              {savedEntries.length === 0 ? (
                <div className="thg-drawer-empty">
                  Chưa có bản ghi nào được đánh dấu. Nhấp vào khung tranh trong hành lang 3D hoặc mở thẻ hồ sơ để lưu lại những đóng góp bạn quan tâm.
                </div>
              ) : (
                savedEntries.map((entry) => {
                  const ex = exhibitById.get(entry.exhibitId);
                  if (!ex) return null;
                  const thumb = plateUrls.get(ex.id) || '';
                  return (
                    <div key={entry.exhibitId} className="thg-drawer-item">
                      {thumb && <img src={thumb} alt="" className="thg-drawer-thumb" />}
                      <div className="thg-drawer-meta">
                        <span className="thg-search-item-code">{ex.kicker}</span>
                        <h3 className="thg-drawer-item-title">{ex.title}</h3>
                        <span className="thg-drawer-item-tags">
                          {entry.role} · {entry.category} · {entry.phase}
                        </span>
                        <div className="thg-drawer-item-actions">
                          <button
                            type="button"
                            className="thg-chip"
                            onClick={() => {
                              setDrawerOpen(false);
                              openExhibitSheet(ex.id);
                            }}
                          >
                            Mở hồ sơ
                          </button>
                          <button
                            type="button"
                            className="thg-icon-btn"
                            style={{ width: 32, height: 32 }}
                            onClick={() =>
                              setSavedEntries((prev) =>
                                prev.filter((item) => item.exhibitId !== entry.exhibitId)
                              )
                            }
                            aria-label={`Bỏ lưu ${ex.title}`}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="thg-drawer-foot">
              <button
                type="button"
                className="thg-ghost-btn"
                onClick={() => setSavedEntries([])}
                disabled={savedEntries.length === 0}
              >
                Xóa danh sách
              </button>
              <button
                type="button"
                className="thg-primary-btn"
                onClick={() => {
                  setDrawerOpen(false);
                  handleGoBack();
                }}
              >
                Quay lại F-Forum
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default TeamHonorGallery;
