export interface LandingChapter {
  id: string;
  code: string;
  label: string;
}

export const LANDING_CHAPTERS: LandingChapter[] = [
  { id: 'top', code: 'I', label: 'Khởi đầu' },
  { id: 'san-pham', code: 'II', label: 'Sản phẩm' },
  { id: 'tuyen-ngon', code: 'III', label: 'Tuyên ngôn' },
  { id: 'du-an', code: 'IV', label: 'Dự án' },
  { id: 'faq', code: 'V', label: 'Hỏi đáp' },
];

export const MANIFESTO_TEXT =
  'Một giao diện đáng giá không bắt đầu từ sự sao chép vội vã. Nó khởi nguồn từ câu hỏi đúng, chạy thật trong Live View cô lập, được chấm từng dòng bằng Diff & Check và đối chiếu cùng 6.770 mẫu có nguồn gốc minh bạch.';

export const MANIFESTO_PILLARS: Array<{ title: string; detail: string }> = [
  {
    title: 'Đặt câu hỏi trước khi sinh mã',
    detail: 'Dành cho học sinh, giảng viên và người thiết kế web coi trọng mạch lập luận và kiểm chứng thực tế.',
  },
  {
    title: 'Chạy thật trong Live View cô lập',
    detail: 'Mọi bản dựng đều thực thi trong sandbox không đồng nguồn để quan sát cấu trúc trên 390px, 768px và 1440px.',
  },
  {
    title: 'Chấm từng dòng với Diff & Check',
    detail: 'Đối chiếu thay đổi mã nguồn, kiểm tra 6 tiêu chí chất lượng và quét khóa bí mật trước khi tải về.',
  },
];

export const OPEN_ACCESS_FEATURES: string[] = [
  'Live View cô lập với khung nhìn 390px, 768px và 1440px không chia sẻ quyền đồng nguồn',
  'Kho 6.770 thành phần chuẩn hóa từ PinUI, ThreeUI, MotionSites, LucianLabs và CodeFronts',
  'Diff & Check tự động 6 lớp và quét khóa API bí mật trước khi đóng gói ZIP',
  '15 lượt tạo mã tiêu chuẩn miễn phí cùng tùy chọn kết nối khóa API riêng (BYOK) trong Cài đặt',
];

export const FAQ_ITEMS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'f1',
    question: 'F-Forum là gì và phù hợp với đối tượng nào?',
    answer:
      'F-Forum là không gian kiến tạo Web/UI và phản biện kỹ thuật dành cho học sinh, sinh viên, giảng viên, vibe coder và nhà thiết kế web. Mọi ý tưởng được dựng bằng AI rồi kiểm chứng trực tiếp qua Live View cô lập và Diff & Check trước khi xuất bản.',
  },
  {
    id: 'f2',
    question: 'Live View và Diff & Check kiểm định mã nguồn như thế nào?',
    answer:
      'Mọi bản dựng chạy trong iframe sandbox="allow-scripts" không bật allow-same-origin và kèm referrerPolicy="no-referrer". Bộ Diff & Check tự động rà 6 lớp: cấu trúc HTML, cú pháp JS, khung nhìn di động, liên kết nội bộ, quét bí mật và khả năng tiếp cận.',
  },
  {
    id: 'f3',
    question: '6.770 mẫu trong kho tham chiếu đến từ đâu?',
    answer:
      'Toàn bộ 6.770 thành phần được lập chỉ mục từ kho SOURCEOFKNOWLEDGFORAI gồm CodeFronts (5.047), ThreeUI (961), LucianLabs (400), MotionSites (321) và PinUI (41), giữ nguyên tên tác giả, đường dẫn gốc và giấy phép công khai.',
  },
  {
    id: 'f4',
    question: 'Chi phí sử dụng và giới hạn lượt AI được tính ra sao?',
    answer:
      'F-Forum mở miễn phí với 15 lượt tạo mã tiêu chuẩn cho mỗi phiên khách hoặc tài khoản thành viên. Khi cần dùng nhiều hơn, bạn có thể nhập khóa API riêng (OpenAI-compatible, Anthropic hoặc Gemini) trong khu Cài đặt; khóa chỉ lưu tại trình duyệt và không đi vào tệp sao lưu.',
  },
];
