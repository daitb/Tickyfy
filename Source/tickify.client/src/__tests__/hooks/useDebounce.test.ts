import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    // Arrange & Act
    const { result } = renderHook(() => useDebounce('initial', 300));

    // Assert
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    // Act - Change value immediately
    rerender({ value: 'updated', delay: 300 });

    // Assert - Value should still be initial (not debounced yet)
    expect(result.current).toBe('initial');

    // Fast-forward time by 300ms
    await vi.advanceTimersByTimeAsync(300);

    // Assert - Value should be updated after delay
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout when value changes quickly', async () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    // Act - Change value multiple times quickly
    rerender({ value: 'first', delay: 300 });
    await vi.advanceTimersByTimeAsync(100);

    rerender({ value: 'second', delay: 300 });
    await vi.advanceTimersByTimeAsync(100);

    rerender({ value: 'final', delay: 300 });
    await vi.advanceTimersByTimeAsync(300);

    // Assert - Should only have final value
    expect(result.current).toBe('final');
  });

  it('should respect custom delay', async () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Act
    rerender({ value: 'updated', delay: 500 });

    // Fast-forward by less than delay
    await vi.advanceTimersByTimeAsync(300);
    expect(result.current).toBe('initial');

    // Fast-forward by remaining time
    await vi.advanceTimersByTimeAsync(200);

    // Assert
    expect(result.current).toBe('updated');
  });

  it('should work with numbers', async () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 300 },
      }
    );

    // Act
    rerender({ value: 100, delay: 300 });
    await vi.advanceTimersByTimeAsync(300);

    // Assert
    expect(result.current).toBe(100);
  });

  it('should work with objects', async () => {
    // Arrange
    const initialObj = { name: 'initial' };
    const updatedObj = { name: 'updated' };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 300 },
      }
    );

    // Act
    rerender({ value: updatedObj, delay: 300 });
    await vi.advanceTimersByTimeAsync(300);

    // Assert
    expect(result.current).toBe(updatedObj);
  });
});

