import { InternalAxiosRequestConfig } from 'axios';

import { scopedParamsOf } from './http-retry';

type PendingEntry = {
  promise: Promise<any>;
  expiresAt: number;
};

const DEFAULT_MAX_ENTRIES = 50;
const DEFAULT_TTL = 10_000;

/**
 * Keeps the requests that are currently in flight so that identical calls issued
 * within the same window share a single network round trip.
 */
export class RequestDeduplicator {
  private readonly pending = new Map<string, PendingEntry>();
  private readonly maxEntries: number;
  private readonly ttl: number;

  constructor(maxEntries: number = DEFAULT_MAX_ENTRIES, ttl: number = DEFAULT_TTL) {
    this.maxEntries = maxEntries;
    this.ttl = ttl;
  }

  get size(): number {
    return this.pending.size;
  }

  has(key: string): boolean {
    return this.pending.has(key);
  }

  get(key: string): Promise<any> | undefined {
    const entry = this.pending.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.pending.delete(key);
      return undefined;
    }
    return entry.promise;
  }

  track(key: string, promise: Promise<any>): Promise<any> {
    this.pending.set(key, { promise, expiresAt: Date.now() + this.ttl });
    this.evictOverflow();
    return promise;
  }

  delete(key: string): void {
    this.pending.delete(key);
  }

  clear(): void {
    this.pending.clear();
  }

  private evictOverflow(): void {
    const overflow = this.pending.size - this.maxEntries;
    if (overflow < 0) {
      return;
    }
    let removed = 0;
    for (const key of this.pending.keys()) {
      this.pending.delete(key);
      removed += 1;
      if (removed >= overflow) {
        break;
      }
    }
  }
}

/**
 * Builds the key identifying an interchangeable request. Only requests that are
 * guaranteed to return the same payload for the same caller may share a key.
 */
export const buildDeduplicationKey = (config: InternalAxiosRequestConfig): string => {
  const method = (config.method ?? 'get').toLowerCase();
  const scoped = scopedParamsOf(config);
  return `${method} ${config.url ?? ''}${scoped ? `?${scoped}` : ''}`;
};
