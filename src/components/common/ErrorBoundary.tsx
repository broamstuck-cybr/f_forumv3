import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Đã xảy ra lỗi hiển thị ngoài ý muốn.',
    };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, message: '' });
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section
        role="alert"
        aria-live="assertive"
        style={{
          minHeight: '50vh',
          display: 'grid',
          placeItems: 'center',
          padding: '32px 20px',
        }}
      >
        <div
          className="plate scene-paper"
          style={{
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--line)',
            background: 'var(--bg-raised)',
            color: 'var(--fg)',
            display: 'grid',
            gap: '12px',
          }}
        >
          <p className="t-label" style={{ margin: 0, color: 'var(--danger)' }}>
            Khôi phục giao diện
          </p>
          <h2 className="t-h2" style={{ margin: 0 }}>
            Không thể hiển thị khu vực này
          </h2>
          <p className="t-body" style={{ margin: 0, color: 'var(--fg-muted)' }}>
            Ứng dụng đã chặn lỗi kịp thời để giữ an toàn phiên làm việc. Bạn có thể thử tải lại khung này.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={this.handleRetry}>
              Thử lại
            </button>
            <button type="button" className="btn btn-line btn-sm" onClick={this.handleGoHome}>
              Về trang chủ
            </button>
          </div>
        </div>
      </section>
    );
  }
}

export default ErrorBoundary;
