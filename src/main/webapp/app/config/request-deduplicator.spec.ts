import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

import { RequestDeduplicator, buildDeduplicationKey } from './request-deduplicator';

const buildConfig = (url: string, method = 'get'): InternalAxiosRequestConfig => ({ url, method, headers: new AxiosHeaders() });

describe('Request deduplicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('buildDeduplicationKey', () => {
    it('should build the same key for the same method and url', () => {
      expect(buildDeduplicationKey(buildConfig('/api/accounts'))).toBe(buildDeduplicationKey(buildConfig('/api/accounts')));
    });

    it('should distinguish the methods', () => {
      expect(buildDeduplicationKey(buildConfig('/api/accounts'))).not.toBe(buildDeduplicationKey(buildConfig('/api/accounts', 'delete')));
    });

    it('should distinguish the urls', () => {
      expect(buildDeduplicationKey(buildConfig('/api/accounts'))).not.toBe(buildDeduplicationKey(buildConfig('/api/labels')));
    });

    it('should normalise the method case', () => {
      expect(buildDeduplicationKey(buildConfig('/api/accounts', 'GET'))).toBe(buildDeduplicationKey(buildConfig('/api/accounts')));
    });
  });

  describe('RequestDeduplicator', () => {
    it('should return the tracked promise', async () => {
      const deduplicator = new RequestDeduplicator();
      const promise = Promise.resolve('value');
      deduplicator.track('key', promise);

      expect(deduplicator.has('key')).toBe(true);
      await expect(deduplicator.get('key')).resolves.toBe('value');
    });

    it('should return undefined for an unknown key', () => {
      const deduplicator = new RequestDeduplicator();
      expect(deduplicator.get('missing')).toBeUndefined();
    });

    it('should forget an entry once it is released', () => {
      const deduplicator = new RequestDeduplicator();
      deduplicator.track('key', Promise.resolve('value'));
      deduplicator.delete('key');

      expect(deduplicator.has('key')).toBe(false);
    });

    it('should forget everything on clear', () => {
      const deduplicator = new RequestDeduplicator();
      deduplicator.track('a', Promise.resolve(1));
      deduplicator.track('b', Promise.resolve(2));
      deduplicator.clear();

      expect(deduplicator.size).toBe(0);
    });

    it('should expire an entry after the ttl', () => {
      const deduplicator = new RequestDeduplicator(10, 1000);
      deduplicator.track('key', Promise.resolve('value'));
      vi.advanceTimersByTime(1001);

      expect(deduplicator.get('key')).toBeUndefined();
      expect(deduplicator.size).toBe(0);
    });

    it('should keep an entry within the ttl', () => {
      const deduplicator = new RequestDeduplicator(10, 1000);
      deduplicator.track('key', Promise.resolve('value'));
      vi.advanceTimersByTime(999);

      expect(deduplicator.get('key')).toBeDefined();
    });

    it('should never exceed the configured capacity', () => {
      const deduplicator = new RequestDeduplicator(3);
      ['a', 'b', 'c', 'd', 'e'].forEach(key => deduplicator.track(key, Promise.resolve(key)));

      expect(deduplicator.size).toBeLessThanOrEqual(3);
    });
  });
});
