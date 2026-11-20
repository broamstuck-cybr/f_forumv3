export type TitaniumFinishId = 'black';

export interface TitaniumFinishSpec {
  id: TitaniumFinishId;
  label: string;
  swatch: string;
  shellA: string;
  shellB: string;
  antenna: string;
}

export type DynamicIslandMode = 'idle' | 'faceid' | 'silent' | 'timer' | 'music' | 'fforum';

export type SimulatorAppId =
  | 'fforum'
  | 'explore'
  | 'workspace'
  | 'community'
  | 'weather'
  | 'calendar'
  | 'notes'
  | 'camera'
  | 'settings'
  | 'phone'
  | 'safari'
  | 'messages'
  | 'music';

export interface SimulatorAppDef {
  id: SimulatorAppId;
  label: string;
  bg: string;
  fg: string;
  page: 0 | 1;
}

export const TITANIUM_FINISHES: TitaniumFinishSpec[] = [
  {
    id: 'black',
    label: 'Titan Đen',
    swatch: '#1f1f22',
    shellA: '#2a2b30',
    shellB: '#121316',
    antenna: 'rgba(255, 255, 255, 0.14)',
  },
];

export const SIM_APPS: SimulatorAppDef[] = [
  {
    id: 'fforum',
    label: 'F-Forum',
    bg: 'linear-gradient(145deg, #161a24 0%, #090a0d 100%)',
    fg: '#e5c384',
    page: 0,
  },
  {
    id: 'explore',
    label: 'Explore',
    bg: 'linear-gradient(145deg, #0d3b38 0%, #091e1e 100%)',
    fg: '#5eead4',
    page: 0,
  },
  {
    id: 'workspace',
    label: 'Live View',
    bg: 'linear-gradient(145deg, #2b2113 0%, #140f08 100%)',
    fg: '#fcd34d',
    page: 0,
  },
  {
    id: 'community',
    label: 'Tri thức',
    bg: 'linear-gradient(145deg, #102a21 0%, #081510 100%)',
    fg: '#6ee7b7',
    page: 0,
  },
  {
    id: 'notes',
    label: 'Ghi chú',
    bg: 'linear-gradient(180deg, #f5c84c 0%, #f5c84c 28%, #fbfaf6 28%, #fbfaf6 100%)',
    fg: '#1f1d1a',
    page: 0,
  },
  {
    id: 'camera',
    label: 'Camera',
    bg: 'linear-gradient(145deg, #2d3038 0%, #16181d 100%)',
    fg: '#f4f1ea',
    page: 0,
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    bg: 'linear-gradient(145deg, #434752 0%, #24272e 100%)',
    fg: '#e5e7eb',
    page: 0,
  },
  {
    id: 'calendar',
    label: 'Lịch học',
    bg: 'linear-gradient(180deg, #b83232 0%, #b83232 28%, #ffffff 28%, #ffffff 100%)',
    fg: '#141413',
    page: 0,
  },
  {
    id: 'weather',
    label: 'Thời tiết',
    bg: 'linear-gradient(160deg, #1b3b6f 0%, #0e203d 100%)',
    fg: '#facc15',
    page: 1,
  },
  {
    id: 'safari',
    label: 'Trình duyệt',
    bg: 'linear-gradient(145deg, #eef6ff 0%, #dbeafe 100%)',
    fg: '#0369a1',
    page: 1,
  },
  {
    id: 'messages',
    label: 'Thảo luận',
    bg: 'linear-gradient(145deg, #22c55e 0%, #15803d 100%)',
    fg: '#ffffff',
    page: 1,
  },
  {
    id: 'music',
    label: 'Nhịp tập trung',
    bg: 'linear-gradient(145deg, #e11d48 0%, #9f1239 100%)',
    fg: '#ffffff',
    page: 1,
  },
];

export const DOCK_APP_IDS: SimulatorAppId[] = ['phone', 'safari', 'fforum', 'music'];
