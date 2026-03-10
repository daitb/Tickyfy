import { Loader2 } from 'lucide-react';

/**
 * Component hiển thị khi đang load lazy components
 */
export function LoadingFallback() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
        <p className="text-neutral-600">Đang tải...</p>
      </div>
    </div>
  );
}

