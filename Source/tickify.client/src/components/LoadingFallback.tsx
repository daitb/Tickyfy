/**
 * Component hiển thị khi đang load lazy components
 * Sử dụng CSS spinner thuần để tránh import lucide-react
 */
export function LoadingFallback() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mb-4" />
        <p className="text-neutral-600">Đang tải...</p>
      </div>
    </div>
  );
}

