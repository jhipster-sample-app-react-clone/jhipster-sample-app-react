import { beforeEach, describe, expect, it, vi } from 'vitest';

import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

import setupAxiosInterceptors, { describeRequest } from './axios-interceptor';
import { DEFAULT_RETRY_CONFIG } from './http-retry';

const buildError = (status: number, method = 'get', retryCount = 0): AxiosError => {
  const config = { url: '/api/accounts', method, headers: new AxiosHeaders(), retryCount } as InternalAxiosRequestConfig;
  return { isAxiosError: true, name: 'AxiosError', message: 'failed', toJSON: () => ({}), config, response: { status } } as AxiosError;
};

describe('Axios Interceptor', () => {
  describe('setupAxiosInterceptors', () => {
    const onUnauthenticated = vi.fn();
    setupAxiosInterceptors(onUnauthenticated);

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('onRequestSuccess is called on fulfilled request', () => {
      expect((axios.interceptors.request as any).handlers[0].fulfilled({ data: 'foo', url: '/test' })).toMatchObject({
        data: 'foo',
      });
    });
    it('onResponseSuccess is called on fulfilled response', () => {
      expect((axios.interceptors.response as any).handlers[0].fulfilled({ data: 'foo' })).toEqual({ data: 'foo' });
    });
    it('onResponseError is called on rejected response', async () => {
      const rejectError = {
        response: {
          statusText: 'NotFound',
          status: 401,
          data: { message: 'Page not found' },
        },
      };
      await expect((axios.interceptors.response as any).handlers[0].rejected(rejectError)).rejects.toEqual(rejectError);
      expect(onUnauthenticated).toHaveBeenCalledTimes(1);
    });
    it('does not retry once the retry budget is exhausted', async () => {
      await expect(
        (axios.interceptors.response as any).handlers[0].rejected(buildError(503, 'get', DEFAULT_RETRY_CONFIG.retries)),
      ).rejects.toBeDefined();
      expect(onUnauthenticated).not.toHaveBeenCalled();
    });
    it('does not retry a request that creates data', async () => {
      await expect((axios.interceptors.response as any).handlers[0].rejected(buildError(503, 'post'))).rejects.toBeDefined();
    });
    it('does not retry a status that will not change', async () => {
      await expect((axios.interceptors.response as any).handlers[0].rejected(buildError(400))).rejects.toBeDefined();
    });
  });

  describe('describeRequest', () => {
    it('should uppercase the method and keep the url', () => {
      expect(describeRequest({ method: 'get', url: '/api/accounts' })).toBe('GET /api/accounts');
    });

    it('should fall back to a default method', () => {
      expect(describeRequest({ url: '/api/accounts' })).toBe('GET /api/accounts');
    });

    it('should cope with an empty configuration', () => {
      expect(describeRequest()).toBe('GET');
    });
  });
});
