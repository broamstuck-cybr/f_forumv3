import type { AppRoute } from '../../types';
import { useAppStore } from '../../store/appStore';

export function Skybridge404({ onNavigate }: { onNavigate?: (route: AppRoute) => void }) {
  const { navigate } = useAppStore();
  const go = onNavigate ?? navigate;
  return (
    <main className="press press-missing">
      <div className="press-wrap">
        <p className="press-meta press-label">F–FORUM / NGOÀI CHỈ MỤC</p>
        <h1>404</h1>
        <p className="press-lead">Không tìm thấy trang này. Quay về trang giới thiệu hoặc mở bàn làm việc.</p>
        <div className="press-actions">
          <button className="press-button press-primary" onClick={() => go('home')}>Vào xưởng</button>
          <button className="press-button" onClick={() => go('landing')}>Giới thiệu</button>
        </div>
      </div>
    </main>
  );
}
