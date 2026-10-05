import { describe, expect, it, vi } from 'vitest';

import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

import {
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
  applyJitter,
  getRetryDelay,
  isRetryableMethod,
  isRetryableStatus,
  retryCountOf,
  shouldRetryRequest,
  wait,
} from './http-retry';

const buildError = (overrides: Partial<AxiosError> & { config?: Partial<InternalAxiosRequestConfig> } = {}): AxiosError => {
  const { config, ...rest } = overrides;
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: 'failed',
    toJSON: () => ({}),
    config: { method: 'get', headers: new AxiosHeaders(), ...config },
    ...rest,
  } as AxiosError;
};

describe('HTTP retry', () => {
  describe('isRetryableMethod', () => {
    it('should accept the methods that can safely be replayed', () => {
      expect(isRetryableMethod('get')).toBe(true);
      expect(isRetryableMethod('HEAD')).toBe(true);
      expect(isRetryableMethod('put')).toBe(true);
      expect(isRetryableMethod('delete')).toBe(true);
    });

    it('should refuse the methods that create data', () => {
      expect(isRetryableMethod('post')).toBe(false);
      expect(isRetryableMethod('patch')).toBe(false);
    });

    it('should default to get when the method is not set', () => {
      expect(isRetryableMethod(undefined)).toBe(true);
    });
  });

  describe('isRetryableStatus', () => {
    it('should accept the configured transient statuses', () => {
      expect(isRetryableStatus(503)).toBe(true);
      expect(isRetryableStatus(429)).toBe(true);
    });

    it('should refuse the statuses that will not change', () => {
      expect(isRetryableStatus(400)).toBe(false);
      expect(isRetryableStatus(401)).toBe(false);
      expect(isRetryableStatus(undefined)).toBe(false);
    });
  });

  describe('shouldRetryRequest', () => {
    it('should retry a transient status on an idempotent method', () => {
      expect(shouldRetryRequest(buildError({ response: { status: 503 } as any }), 1)).toBe(true);
    });

    it('should not retry once the retry budget is exhausted', () => {
      expect(shouldRetryRequest(buildError({ response: { status: 503 } as any }), DEFAULT_RETRY_CONFIG.retries + 1)).toBe(false);
    });

    it('should not retry a request that creates data', () => {
      expect(shouldRetryRequest(buildError({ response: { status: 503 } as any, config: { method: 'post' } }), 1)).toBe(false);
    });

    it('should not retry a cancelled request', () => {
      expect(shouldRetryRequest(buildError({ code: 'ERR_CANCELED', config: { method: 'get' } }), 1)).toBe(false);
    });

    it('should retry a network failure without response', () => {
      expect(shouldRetryRequest(buildError({ code: 'ERR_NETWORK', config: { method: 'get' } }), 1)).toBe(true);
    });

    it('should honour a custom configuration', () => {
      const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, retryableStatusCodes: [418] };
      expect(shouldRetryRequest(buildError({ response: { status: 418 } as any }), 1, config)).toBe(true);
      expect(shouldRetryRequest(buildError({ response: { status: 503 } as any }), 1, config)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should grow exponentially and stay below the maximum delay', () => {
      const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, retryDelay: 100, factor: 2, maxRetryDelay: 1000 };
      expect(getRetryDelay(1, config)).toBeLessThanOrEqual(200);
      expect(getRetryDelay(2, config)).toBeLessThanOrEqual(400);
      expect(getRetryDelay(10, config)).toBeLessThanOrEqual(1000);
    });

    it('should take the retry-after header into account', () => {
      const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, retryDelay: 100, factor: 2, maxRetryDelay: 10_000 };
      expect(getRetryDelay(1, config, '3')).toBe(3200);
    });

    it('should ignore a non numeric retry-after header', () => {
      const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, retryDelay: 100, factor: 2, maxRetryDelay: 10_000 };
      expect(getRetryDelay(1, config, 'Wed, 21 Oct 2015 07:28:00 GMT')).toBeLessThanOrEqual(200);
    });
  });

  describe('applyJitter', () => {
    it('should keep the delay within the expected band', () => {
      const jittered = [applyJitter(1000), applyJitter(1000), applyJitter(1000)];
      expect(Math.min(...jittered)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...jittered)).toBeLessThanOrEqual(1000);
    });

    it('should vary the delay between calls', () => {
      const values = new Set([applyJitter(1000), applyJitter(1000), applyJitter(1000), applyJitter(1000), applyJitter(1000)]);
      expect(values.size).toBeGreaterThan(1);
    });
  });

  describe('retryCountOf', () => {
    it('should default to zero', () => {
      expect(retryCountOf(undefined)).toBe(0);
      expect(retryCountOf({ method: 'get', headers: new AxiosHeaders() } as InternalAxiosRequestConfig)).toBe(0);
    });

    it('should read the stored count', () => {
      expect(retryCountOf({ method: 'get', headers: new AxiosHeaders(), retryCount: 2 } as any)).toBe(2);
    });
  });

  describe('wait', () => {
    it('should resolve after the given delay', async () => {
      vi.useFakeTimers();
      const spy = vi.fn();
      const promise = wait(500).then(spy);
      await vi.advanceTimersByTimeAsync(499);
      expect(spy).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(spy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
