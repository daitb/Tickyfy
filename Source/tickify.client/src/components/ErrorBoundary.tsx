import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component để catch và xử lý lỗi React
 * Hiển thị fallback UI thân thiện thay vì crash toàn bộ app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error để tracking (có thể gửi lên Sentry, etc.)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Gửi error lên error tracking service (Sentry, etc.)
    // errorTrackingService.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI nếu có
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-red-600" size={40} />
                </div>
                <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                  Đã xảy ra lỗi
                </h1>
                <p className="text-neutral-600 mb-4">
                  Xin lỗi, có vấn đề xảy ra khi tải trang này. Vui lòng thử lại.
                </p>
              </div>

              {/* Error details (chỉ hiển thị trong development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-800 break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-sm text-red-700 cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw size={16} className="mr-2" />
                  Thử lại
                </Button>
                <Button onClick={this.handleReload}>
                  <Home size={16} className="mr-2" />
                  Tải lại trang
                </Button>
              </div>

              <p className="text-xs text-neutral-500 mt-6">
                Nếu vấn đề vẫn tiếp tục, vui lòng{' '}
                <a href="/contact" className="text-teal-600 hover:underline">
                  liên hệ hỗ trợ
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

