import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Code2, Sparkles, SquarePen } from 'lucide-react';

export interface PreviewWaitingProps {
  generating: boolean;
  projectName: string;
  onInsertPrompt?: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  'Một trang giới thiệu quán cà phê nhỏ, ấm, có thực đơn và giờ mở cửa.',
  'Trang hồ sơ cá nhân tối giản: ảnh, ba dòng giới thiệu và danh sách dự án.',
  'Một bảng theo dõi thói quen hằng ngày, có ô đánh dấu và thanh tiến độ.',
];

/**
 * Trạng thái chờ của khung xem trước.
 *
 * Không dựng iframe khi chưa có mã thật: một khung trống hoặc khung báo lỗi
 * còn tệ hơn không có khung nào. Ở đây chỉ nói rõ đang chờ gì và đưa vài câu
 * mẫu bấm là chạy, để người dùng không phải nghĩ câu lệnh đầu tiên.
 */
export const PreviewWaiting: React.FC<PreviewWaitingProps> = ({ generating, projectName, onInsertPrompt }) => {
  const reduced = Boolean(useReducedMotion());

  return (
    <div className="ws-wait" role="status" aria-live="polite">
      <motion.div
        className="ws-wait-mark"
        animate={reduced ? undefined : generating ? { rotate: 360 } : { y: [0, -4, 0] }}
        transition={
          reduced
            ? undefined
            : generating
              ? { duration: 2.4, ease: 'linear', repeat: Infinity }
              : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {generating ? <Sparkles size={22} aria-hidden="true" /> : <Code2 size={22} aria-hidden="true" />}
      </motion.div>

      <h3 className="ws-wait-title">
        {generating ? 'Đang dựng bản xem trước…' : 'Bản xem trước sẽ xuất hiện khi có mã thật'}
      </h3>
      <p className="ws-wait-note">
        {generating
          ? `${projectName} đang nhận mã từ trợ lý. Khung sẽ mở ngay khi tệp HTML đầu tiên hoàn tất.`
          : 'Khung này không chạy bản nháp rỗng. Hãy mô tả điều bạn muốn dựng, hoặc chọn một câu mẫu bên dưới.'}
      </p>

      {!generating && onInsertPrompt ? (
        <ul className="ws-wait-examples">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <li key={prompt}>
              <button type="button" className="ws-wait-example" onClick={() => onInsertPrompt(prompt)}>
                <SquarePen size={13} aria-hidden="true" />
                <span>{prompt}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <span className="ws-wait-foot">
        {generating ? 'Bạn có thể xem tiến trình ở cột trò chuyện bên cạnh.' : 'Mẹo: đính kèm một mẫu từ Bàn soi để bắt đầu nhanh hơn.'}
      </span>
    </div>
  );
};

export default PreviewWaiting;
