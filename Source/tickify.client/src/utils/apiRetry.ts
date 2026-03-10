/**
 * Retry API call với exponential backoff
 * @param fn - Function cần retry
 * @param options - Retry options
 * @returns Promise với result hoặc throw error sau khi hết retries
 */
export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: any) => void;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>> = {
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Wrapper function để retry API calls với exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, retryDelay, onRetry, shouldRetry } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check nếu không nên retry (ví dụ: 400 Bad Request)
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      // Nếu đã hết retries, throw error
      if (attempt >= maxRetries) {
        break;
      }

      // Calculate delay với exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);

      // Call onRetry callback nếu có
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Wait trước khi retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check nếu error có thể retry được
 * Retry cho network errors (5xx, timeout) nhưng không retry cho client errors (4xx)
 */
export function shouldRetryOnError(error: any): boolean {
  // Không retry cho 4xx errors (client errors)
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return false;
  }

  // Retry cho network errors, timeouts, và 5xx errors
  return true;
}

