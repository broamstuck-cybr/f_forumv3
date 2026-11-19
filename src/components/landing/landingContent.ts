export interface LandingChapter {
  id: string;
  code: string;
  label: string;
}

export const LANDING_CHAPTERS: LandingChapter[] = [
  { id: 'top', code: '01', label: 'Khởi đầu' },
  { id: 'san-pham', code: '02', label: 'Sản phẩm' },
  { id: 'tuyen-ngon', code: '03', label: 'Tuyên ngôn' },
  { id: 'du-an', code: '04', label: 'Dự án' },
  { id: 'faq', code: '05', label: 'Mở rộng' },
];

export const MANIFESTO_TEXT =
  'Mỗi giao diện đáng giá không bắt đầu từ sự sao chép vội vã. Nó khởi nguồn từ câu hỏi đúng, qua kiểm chứng Live View cô lập, đối chiếu từng dòng với Diff & Check, và chắt lọc từ tri thức thật của PinUI, ThreeUI, MotionSites, LucianLabs cùng SOURCEOFKNOWLEDGFORAI.';

export const MANIFESTO_PILLARS: Array<{ title: string; detail: string }> = [
  {
    title: 'Đặt câu hỏi trước khi sinh mã',
    detail: 'Giữ mạch lập luận rõ ràng cho sinh viên, giảng viên và người thiết kế giao diện.',
  },
  {
    title: 'Kiểm chứng trên Live View cô lập',
    detail: 'Mọi bản dựng đều chạy trong sandbox tách biệt để quan sát thực chất trước khi tin.',
  },
  {
    title: 'Soi từng dòng bằng Diff & Check',
    detail: 'Không chấp nhận thay đổi mù mờ. Mọi chỉnh sửa đều đối chiếu và quét rò rỉ.',
  },
];

export const OPEN_ACCESS_FEATURES: string[] = [
  'Live View cô lập với kiểm định 390px, 768px và 1440px',
  'Kho 6.770 thành phần chuẩn hóa từ PinUI, ThreeUI, MotionSites, LucianLabs và CodeFronts',
  'Diff & Check từng dòng trước khi đóng gói mã nguồn sạch bí mật',
  '15 lượt tạo mã tiêu chuẩn miễn phí cùng cấu hình khóa API cá nhân (BYOK)',
];

export const FAQ_ITEMS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'f1',
    question: 'F-Forum phù hợp với ai và có mở miễn phí không?',
    answer:
      'F-Forum dành cho học sinh, sinh viên, giảng viên và những người xây dựng web coi trọng tư duy phản biện. Các tính năng cốt lõi đều mở miễn phí với 15 lượt AI tiêu chuẩn và tùy chọn khóa API cá nhân trong Cài đặt.',
  },
  {
    id: 'f2',
    question: 'Live View và Diff & Check đảm bảo an toàn ra sao?',
    answer:
      'Mọi giao diện được dựng trong iframe sandbox tách biệt không dùng quyền đồng nguồn, đồng thời đi qua bộ kiểm định cú pháp, bố cục 390px và quét khóa bí mật trước khi xuất tệp.',
  },
  {
    id: 'f3',
    question: 'Nguồn mẫu từ PinUI, ThreeUI, MotionSites và LucianLabs được ghi nhận thế nào?',
    answer:
      'Toàn bộ 6.770 thành phần trong SOURCEOFKNOWLEDGFORAI đều giữ nguyên tên tác giả, đường dẫn gốc và giấy phép MIT hoặc tài liệu công khai tương ứng.',
  },
  {
    id: 'f4',
    question: 'Làm sao để biến ý tưởng trong khung chat thành dự án hoàn chỉnh?',
    answer:
      'Từ khung PinUI Prompt ngay trên trang này hoặc tại Trang chủ, yêu cầu của bạn được chuyển thẳng sang Workspace 3 cột để tinh chỉnh, xem Live View và kiểm định Diff & Check.',
  },
];
