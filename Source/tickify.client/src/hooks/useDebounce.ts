import { useState, useEffect } from 'react';

/**
 * Custom hook để debounce giá trị
 * @param value - Giá trị cần debounce
 * @param delay - Delay time (ms), mặc định 300ms
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout để update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout nếu value thay đổi trước khi delay kết thúc
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

