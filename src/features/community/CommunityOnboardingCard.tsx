import React, { useState } from 'react';
import { IconCheck, IconX } from '../../ui/icons';
import type { CommunityChannel } from '../../types/index';

export interface OnboardingSpaceOption {
  id: string;
  label: string;
  channel: CommunityChannel;
  members: string;
  authorHandle: string;
  authorName: string;
  desc: string;
}

const INTEREST_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'react', label: 'React & UI' },
  { id: 'css-tokens', label: 'CSS Tokens' },
  { id: 'motion', label: 'Motion & Glass' },
  { id: 'performance', label: 'Hiệu năng' },
  { id: 'agent-rules', label: 'Agent Rules' },
  { id: 'clubs', label: 'CLB & Dự án' },
];

const SUGGESTED_SPACES: OnboardingSpaceOption[] = [
  {
    id: 'react',
    label: '#trưng-bày · React & UI',
    channel: 'showcase',
    members: '420 thành viên',
    authorHandle: 'minh_dev',
    authorName: 'Minh Nguyễn',
    desc: 'Chia sẻ component chạy thử và phân tích kiến trúc giao diện.',
  },
  {
    id: 'css-tokens',
    label: '#hỏi-đáp · CSS Tokens & Hệ thống thiết kế',
    channel: 'qa',
    members: '310 thành viên',
    authorHandle: 'linh_ux',
    authorName: 'Linh Trần',
    desc: 'Thảo luận tương phản sáng/tối, typography tiếng Việt và lưới đáp ứng.',
  },
  {
    id: 'agent-rules',
    label: '#rules-prompt · Agent & Prompt kỹ thuật',
    channel: 'drops',
    members: '285 thành viên',
    authorHandle: 'khoa_ai',
    authorName: 'Khoa Phạm',
    desc: 'Lưu trữ bộ quy tắc kiểm định và mẫu prompt dựng trang.',
  },
  {
    id: 'clubs',
    label: '#clb-dự-án · Bàn giao CLB & Sinh viên',
    channel: 'clubs',
    members: '190 thành viên',
    authorHandle: 'thao_clb',
    authorName: 'Thảo Lê',
    desc: 'Ghi chép cột mốc dự án, bàn giao tài liệu giữa các khóa.',
  },
];

export interface CommunityOnboardingCardProps {
  followingHandles: string[];
  onToggleFollow: (handle: string) => void;
  onSelectInterestTopic: (topicId: string) => void;
  onSelectChannel: (channel: CommunityChannel) => void;
  onPublishGreeting: (payload: { title: string; body: string; tags: string[] }) => void;
  onDismiss: () => void;
}

export const CommunityOnboardingCard: React.FC<CommunityOnboardingCardProps> = ({
  followingHandles,
  onToggleFollow,
  onSelectInterestTopic,
  onSelectChannel,
  onPublishGreeting,
  onDismiss,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['react', 'css-tokens']);
  const [joinedChannels, setJoinedChannels] = useState<CommunityChannel[]>(['showcase']);
  const [greetingBody, setGreetingBody] = useState(
    'Chào cộng đồng F-Forum, mình đang tìm hiểu xây dựng giao diện web gọn nhẹ và muốn học hỏi thêm về CSS Tokens.'
  );

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleJoinSpace = (space: OnboardingSpaceOption) => {
    setJoinedChannels((prev) =>
      prev.includes(space.channel)
        ? prev.filter((ch) => ch !== space.channel)
        : [...prev, space.channel]
    );
    const alreadyFollowing = followingHandles.some(
      (h) => h.toLowerCase() === space.authorHandle.toLowerCase()
    );
    if (!alreadyFollowing) {
      onToggleFollow(space.authorHandle);
    }
  };

  const matchedSpaces = SUGGESTED_SPACES.filter(
    (sp) => selectedInterests.length === 0 || selectedInterests.includes(sp.id)
  );
  const displaySpaces = matchedSpaces.length > 0 ? matchedSpaces : SUGGESTED_SPACES;

  const handleCompleteGreeting = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = greetingBody.trim();
    if (clean) {
      onPublishGreeting({
        title: 'Chào cộng đồng F-Forum',
        body: clean,
        tags: selectedInterests.length > 0 ? selectedInterests.slice(0, 4) : ['react', 'ui'],
      });
    }
    if (selectedInterests[0]) {
      onSelectInterestTopic(selectedInterests[0]);
    }
    if (joinedChannels[0]) {
      onSelectChannel(joinedChannels[0]);
    }
    onDismiss();
  };

  return (
    <section className="cm-onboard" aria-label="Bắt đầu nhanh trong 3 bước">
      <div className="cm-onboard-head">
        <div className="cm-onboard-steps" role="list" aria-label="Tiến độ 3 bước">
          {[
            { n: 1 as const, label: '1. Sở thích' },
            { n: 2 as const, label: '2. Cộng đồng' },
            { n: 3 as const, label: '3. Chào hỏi' },
          ].map((item) => (
            <button
              key={item.n}
              type="button"
              role="listitem"
              className="cm-onboard-step-pill"
              data-active={step === item.n ? 'true' : undefined}
              data-done={step > item.n ? 'true' : undefined}
              onClick={() => setStep(item.n)}
            >
              {step > item.n && <IconCheck size={12} aria-hidden="true" />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="cm-icon-btn cm-icon-btn--sm"
          aria-label="Đóng hướng dẫn bắt đầu"
          title="Đóng"
          onClick={onDismiss}
        >
          <IconX size={14} aria-hidden="true" />
        </button>
      </div>

      {step === 1 && (
        <div className="cm-onboard-body">
          <h2 className="cm-onboard-title">Chọn chủ đề bạn quan tâm</h2>
          <p className="cm-onboard-sub">
            Bảng tin sẽ ưu tiên bài viết và mẫu mã nguồn khớp chủ đề bạn chọn.
          </p>
          <div className="cm-onboard-chips" role="group" aria-label="Chủ đề quan tâm">
            {INTEREST_OPTIONS.map((opt) => {
              const active = selectedInterests.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className="cm-onboard-chip"
                  aria-pressed={active}
                  onClick={() => toggleInterest(opt.id)}
                >
                  {active && <IconCheck size={13} aria-hidden="true" />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div className="cm-onboard-foot">
            <button type="button" className="cm-clear-btn" onClick={onDismiss}>
              Bỏ qua
            </button>
            <button
              type="button"
              className="btn btn-red btn-sm"
              onClick={() => setStep(2)}
            >
              <span>Tiếp tục</span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="cm-onboard-body">
          <h2 className="cm-onboard-title">Gợi ý cộng đồng phù hợp</h2>
          <p className="cm-onboard-sub">
            Tham gia kênh và theo dõi người đóng góp theo chủ đề vừa chọn.
          </p>
          <ul className="cm-onboard-spaces">
            {displaySpaces.map((sp) => {
              const joined = joinedChannels.includes(sp.channel);
              return (
                <li key={sp.id} className="cm-onboard-space">
                  <div className="cm-onboard-space-copy">
                    <strong>{sp.label}</strong>
                    <span className="t-label">
                      {sp.members} · @{sp.authorHandle}
                    </span>
                    <p>{sp.desc}</p>
                  </div>
                  <button
                    type="button"
                    className={joined ? 'btn btn-line btn-sm' : 'btn btn-red btn-sm'}
                    aria-pressed={joined}
                    onClick={() => toggleJoinSpace(sp)}
                  >
                    {joined ? 'Đã tham gia' : 'Tham gia'}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="cm-onboard-foot">
            <button type="button" className="cm-clear-btn" onClick={() => setStep(1)}>
              Quay lại
            </button>
            <button
              type="button"
              className="btn btn-red btn-sm"
              onClick={() => setStep(3)}
            >
              <span>Bước cuối</span>
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form className="cm-onboard-body" onSubmit={handleCompleteGreeting}>
          <h2 className="cm-onboard-title">Đăng bài chào hỏi đầu tiên</h2>
          <p className="cm-onboard-sub">
            Giới thiệu ngắn về chủ đề bạn đang làm để thành viên khác kết nối.
          </p>
          <label htmlFor="cm-onboard-hello" className="sr-only">
            Nội dung bài chào hỏi
          </label>
          <textarea
            id="cm-onboard-hello"
            rows={2}
            className="field cm-textarea"
            value={greetingBody}
            onChange={(e) => setGreetingBody(e.target.value)}
            placeholder="Mình mới tham gia, đang làm dự án web..."
          />
          <div className="cm-onboard-foot">
            <button type="button" className="cm-clear-btn" onClick={onDismiss}>
              Để sau
            </button>
            <button
              type="submit"
              className="btn btn-red btn-sm"
              disabled={!greetingBody.trim()}
            >
              Đăng lời chào
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default CommunityOnboardingCard;
