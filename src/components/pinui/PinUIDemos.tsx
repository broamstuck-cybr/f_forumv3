import { useState } from 'react';
import { Chips, type ChipItem } from './Chips';
import { DynamicDropZone, type DroppedFilePayload } from './DynamicDropZone';
import { FileBox } from './FileBox';
import { HaloSignIn } from './HaloSignIn';
import { LiquidTabsCard, type LiquidTabsCardItem } from './LiquidTabs';
import { PromptComposer } from './PromptComposer';
import { SearchCard } from './SearchCard';
import { SelectionList } from './SelectionList';
import { TaskCard } from './TaskCard';
import { ThemeSwitch } from './ThemeSwitch';

const CHIP_ITEMS: ChipItem[] = [
  { id: 'typo', label: 'Chữ và bố cục' },
  { id: 'motion', label: 'Chuyển động' },
  { id: 'a11y', label: 'Trợ năng' },
  { id: 'seo', label: 'SEO kỹ thuật' },
  { id: 'perf', label: 'Hiệu năng' },
  { id: 'brand', label: 'Nhận diện' },
];

export const ChipsDemo = ({ theme }: { theme: 'light' | 'dark' }) => {
  const [selected, setSelected] = useState<string[]>(['motion', 'a11y']);
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  return <Chips items={CHIP_ITEMS} selectedIds={selected} onToggle={toggle} multi theme={theme} />;
};

const SELECTION_ITEMS = [
  { id: 'paper', label: 'Giấy kem', swatch: '#f4f0e6' },
  { id: 'ink', label: 'Mực đen', swatch: '#121110' },
  { id: 'red', label: 'Đỏ son', swatch: '#c42a18' },
  { id: 'harbour', label: 'Xanh cảng', swatch: '#2c5b78' },
];

export const SelectionListDemo = () => {
  const [selected, setSelected] = useState('red');
  return (
    <div style={{ width: 'min(100%, 340px)' }}>
      <SelectionList items={SELECTION_ITEMS} selectedId={selected} onSelect={setSelected} ariaLabel="Chọn màu nền" />
    </div>
  );
};

const RECENT_SEARCHES = ['Trang đích câu lạc bộ', 'Lịch sự kiện tháng này', 'Mẫu poster tuyển thành viên', 'Bảng màu thương hiệu'];

export const SearchCardDemo = () => {
  const [value, setValue] = useState('');
  return (
    <div style={{ width: 'min(100%, 420px)', minHeight: 300 }}>
      <SearchCard
        value={value}
        onChange={setValue}
        placeholder="Tìm bài viết, hội nhóm, tài liệu"
        recentSearches={RECENT_SEARCHES}
        onSelectRecent={setValue}
      />
    </div>
  );
};

const TAB_LIST = [
  { id: 'all', label: 'Tất cả', count: 5 },
  { id: 'design', label: 'Thiết kế', count: 2 },
  { id: 'code', label: 'Lập trình', count: 2 },
  { id: 'event', label: 'Sự kiện', count: 1 },
];

const TAB_ITEMS: LiquidTabsCardItem[] = [
  { id: 'i1', tabId: 'design', initials: 'TK', title: 'Bộ biểu tượng nhóm thiết kế', meta: 'Cập nhật hôm nay' },
  { id: 'i2', tabId: 'code', initials: 'LT', title: 'Tài liệu API diễn đàn', meta: 'Cập nhật hôm qua' },
  { id: 'i3', tabId: 'event', initials: 'SK', title: 'Đêm giao lưu câu lạc bộ', meta: 'Thứ Sáu, 19:00' },
  { id: 'i4', tabId: 'design', initials: 'MB', title: 'Mẫu banner tuyển thành viên', meta: '3 ngày trước' },
  { id: 'i5', tabId: 'code', initials: 'TS', title: 'Kiểm thử giao diện tự động', meta: 'Tuần trước' },
];

export const LiquidTabsDemo = () => {
  const [active, setActive] = useState('all');
  const items = active === 'all' ? TAB_ITEMS : TAB_ITEMS.filter((item) => item.tabId === active);
  return (
    <div style={{ width: 'min(100%, 440px)' }}>
      <LiquidTabsCard tabs={TAB_LIST} items={items} activeId={active} onTabChange={setActive} />
    </div>
  );
};

export const PromptComposerDemo = ({ theme }: { theme: 'light' | 'dark' }) => {
  const [value, setValue] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div style={{ width: 'min(100%, 640px)', display: 'grid', gap: 12 }}>
      <PromptComposer
        value={value}
        onChange={setValue}
        theme={theme}
        placeholder="Mô tả trang bạn muốn dựng"
        onSend={(prompt) => {
          setSent(prompt);
          setValue('');
        }}
      />
      {sent && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-secondary)' }}>
          Đã gửi yêu cầu: {sent}
        </p>
      )}
    </div>
  );
};

export const ThemeSwitchDemo = ({ theme, onThemeChange }: { theme: 'light' | 'dark'; onThemeChange: (value: 'light' | 'dark') => void }) => (
  <ThemeSwitch theme={theme} onThemeChange={onThemeChange} variant="stage" />
);

export const TaskCardDemo = () => (
  <div style={{ width: 'min(100%, 420px)' }}>
    <TaskCard
      title="Phát hành bản 3.2"
      subtitle="Tiến độ của nhóm hạ tầng"
      progressLabel="3 trên 5 việc đã xong"
      tasks={[
        { id: 't1', label: 'Gộp nhánh tính năng', status: 'completed', detail: 'Đã hợp nhất lúc 09:12' },
        { id: 't2', label: 'Chạy bộ kiểm thử', status: 'completed', detail: '148 ca đạt' },
        { id: 't3', label: 'Dựng ảnh chụp ba khung hình', status: 'running', detail: 'Đang chụp màn hình' },
        { id: 't4', label: 'Duyệt bảo mật', status: 'approval', detail: 'Chờ chủ nhóm xác nhận' },
        { id: 't5', label: 'Đẩy lên máy chủ', status: 'waiting' },
      ]}
    />
  </div>
);

export const FileBoxDemo = () => {
  const [active, setActive] = useState('brief');
  return (
    <div style={{ width: 'min(100%, 420px)' }}>
      <FileBox
        title="Hồ sơ dự án"
        activeId={active}
        onSelect={setActive}
        tabs={[
          { id: 'brief', label: 'Bản mô tả', meta: '12 KB' },
          { id: 'assets', label: 'Tài nguyên', meta: '48 tệp' },
          { id: 'report', label: 'Báo cáo kiểm thử', meta: '3 trang' },
          { id: 'notes', label: 'Ghi chú họp', meta: 'Hôm nay' },
        ]}
      />
    </div>
  );
};

export const DropZoneDemo = () => {
  const [files, setFiles] = useState<DroppedFilePayload[]>([]);
  return (
    <div style={{ width: 'min(100%, 460px)', display: 'grid', gap: 12 }}>
      <DynamicDropZone
        label="Thả tệp vào đây hoặc bấm để chọn"
        onFilesAdded={(added) => setFiles((prev) => [...added, ...prev].slice(0, 5))}
      />
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-secondary)' }}>
        {files.length === 0 ? 'Chưa có tệp nào được thêm.' : `Đã nhận ${files.length} tệp gần nhất.`}
      </p>
    </div>
  );
};

export const HaloSignInDemo = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <HaloSignIn
      mode={mode}
      onModeChange={(next) => {
        setMode(next);
        setError(null);
      }}
      loading={loading}
      error={error}
      onSubmit={async (payload) => {
        setLoading(true);
        setError(null);
        await new Promise((resolve) => setTimeout(resolve, 900));
        setLoading(false);
        if (payload.password.length < 6) setError('Mật khẩu cần tối thiểu 6 ký tự.');
      }}
    />
  );
};
