import { lazy, Suspense, useState } from 'react';
import type { AppRoute } from '../../types';
import { routeToPathname } from '../../utils/routes';
import { useAppStore } from '../../store/appStore';
const HardwareShowcase = lazy(() => import('../HardwareShowcase').then((module) => ({ default: module.HardwareShowcase })));

const chapters = [
  { route: 'workspace', label: 'Work', detail: 'Viết mã, xem kết quả trong Live View và đối chiếu thay đổi với Diff & Check.' },
  { route: 'explore', label: 'Explore', detail: 'Tra cứu mẫu giao diện, công cụ và kho mã nguồn trước khi bắt tay vào dựng.' },
  { route: 'community', label: 'Source of Knowledge', detail: 'Đặt câu hỏi, chia sẻ bản dựng và lưu lại kinh nghiệm cho người tiếp nối.' },
] as const;

function routeLink(event: React.MouseEvent<HTMLAnchorElement>, route: AppRoute, navigate: (route: AppRoute) => void) {
  if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(route);
}

export function LandingPage({ onOpenNotice }: { onOpenNotice: () => void }) {
  const { navigate, currentUser, setAuthModalOpen } = useAppStore();
  const [showDemo, setShowDemo] = useState(false);
  function link(route: AppRoute, label: string, className?: string) {
    return <a className={className} href={routeToPathname(route)} onClick={(event) => routeLink(event, route, navigate)}>{label}</a>;
  }
  return (
    <div className="press">
      <a href="#ff-main" className="ff-skip-link">Đến nội dung</a>
      <header className="press-wrap press-nav">
        <a href="/" className="press-brand"><span className="press-mark" aria-hidden="true" /> F–FORUM</a>
        <nav aria-label="Điều hướng chính"><a href="/explore?library=pinui">Kho PinUI</a>{link('community', 'Tri thức')}</nav>
        {currentUser ? link('home', 'Vào xưởng', 'press-button') : <button className="press-button" onClick={() => setAuthModalOpen(true)}>Đăng nhập</button>}
      </header>
      <main id="ff-main" className="press-wrap" tabIndex={-1}>
        <div className="press-running press-meta"><span>XƯỞNG THỰC HÀNH WEB</span><span>F–FORUM / ẤN BẢN 03</span></div>
        <section className="press-hero" aria-labelledby="press-title">
          <div className="press-intro">
            <p className="press-meta press-label"><span aria-hidden="true" /> KHÔNG GIAN KIẾN TẠO</p>
            <h1 id="press-title">Từ ý tưởng<br /> đến <em>bản dựng.</em></h1>
            <p className="press-lead">Một xưởng làm web để thử ý tưởng, xem giao diện chạy thật và kiểm tra từng thay đổi trước khi mang mã nguồn đi.</p>
            <div className="press-actions">{link('home', 'Vào xưởng', 'press-button press-primary')}<a href="#muc-luc" className="press-button">Xem mục lục</a></div>
          </div>
          <figure className="press-figure">
            <img src="/press-hero.jpg" alt="Các tấm kim loại và giấy gấp đan vào nhau, với một cạnh đỏ son" fetchPriority="high" />
            <figcaption className="press-meta"><span>HÌNH 01</span><span>NGHIÊN CỨU VẬT LIỆU</span></figcaption>
          </figure>
        </section>
        <section id="muc-luc" className="press-index" aria-labelledby="press-index-title">
          <div><p className="press-meta press-label">CHỈ MỤC / 01–03</p><h2 id="press-index-title">Bên trong<br /> xưởng.</h2><a href="/explore?library=pinui" className="press-button mt-4">Kho PinUI</a></div>
          <ol>{chapters.map(({ route, label, detail }, index) => <li key={route}>
            <a href={routeToPathname(route)} onClick={(event) => routeLink(event, route, navigate)}>
              <span className="press-meta">0{index + 1}</span><div><h3>{label}</h3><p>{detail}</p></div><span aria-hidden="true">↗</span>
            </a>
          </li>)}</ol>
        </section>
        <section className="press-index press-bench" aria-labelledby="press-demo-title">
          <div><p className="press-meta press-label">BÀN THỬ / 04</p><h2 id="press-demo-title">Thử trên<br /> thiết bị.</h2></div>
          <div><p className="press-lead">Mở mô phỏng để khám phá giao diện F-Forum trên điện thoại.</p>
            <button className="press-button" aria-expanded={showDemo} aria-controls="press-device" onClick={() => setShowDemo((open) => !open)}>{showDemo ? 'Đóng mô phỏng' : 'Mở mô phỏng'}</button>
          </div>
        </section>
        <div id="press-device" hidden={!showDemo}>{showDemo && <Suspense fallback={<p role="status">Đang tải mô phỏng…</p>}><HardwareShowcase onNavigate={navigate} /></Suspense>}</div>
        <section className="press-index press-faq" aria-labelledby="press-faq-title">
          <div><p className="press-meta press-label">PHỤ LỤC / 05</p><h2 id="press-faq-title">Trước khi<br />bắt đầu.</h2></div>
          <div>
            <details><summary>Có cần tài khoản không?</summary><p>Không. Khách có thể mở Work, thử bản dựng và xuất ZIP. Đăng nhập để đăng bài và đồng bộ dự án với tài khoản.</p></details>
            <details><summary>Soạn đặc tả có tốn lượt AI không?</summary><p>Không. Bàn làm việc soạn đặc tả ngay trong trình duyệt. Gửi yêu cầu tạo mã qua AI trong Work mới sử dụng hạn mức của phiên.</p></details>
            <details><summary>Live View chạy ở đâu?</summary><p>Bản dựng chạy trong một khung xem trước cách ly. Dùng Diff &amp; Check để xem thay đổi và kết quả kiểm tra; kết quả không thay thế việc rà soát mã trước khi phát hành.</p></details>
          </div>
        </section>
      </main>
      <footer className="press-wrap press-footer"><span className="press-meta">F–FORUM / XƯỞNG WEB</span><button className="press-button" onClick={onOpenNotice}>Nguồn &amp; giấy phép</button></footer>
    </div>
  );
}
