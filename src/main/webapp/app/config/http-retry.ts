import { AxiosError, InternalAxiosRequestConfig } from 'axios';

export type RetryConfig = {
  /** Maximum number of retries for a retryable request. */
  retries: number;
  /** Base delay in milliseconds, used as the starting point of the backoff. */
  retryDelay: number;
  /** Upper bound in milliseconds for a single delay. */
  maxRetryDelay: number;
  /** Multiplier applied on the delay for every additional attempt. */
  factor: number;
  /** Response status codes that are worth another attempt. */
  retryableStatusCodes: number[];
  /** Request methods that are safe to replay. */
  retryableMethods: string[];
};

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 2,
  retryDelay: 300,
  maxRetryDelay: 5000,
  factor: 2,
  retryableStatusCodes: [408, 425, 429, 500, 502, 503, 504],
  retryableMethods: ['get', 'head', 'options', 'put', 'delete'],
};

/** Failures that will not get any better by replaying the exact same request. */
const NON_RETRYABLE_ERROR_CODES = ['ERR_CANCELED', 'ECONNABORTED', 'ERR_BAD_OPTION', 'ERR_BAD_OPTION_VALUE', 'ERR_INVALID_URL'];

export const isRetryableMethod = (method?: string, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean =>
  config.retryableMethods.includes((method ?? 'get').toLowerCase());

export const isRetryableStatus = (status?: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean =>
  status !== undefined && config.retryableStatusCodes.includes(status);

export const shouldRetryRequest = (error: AxiosError, attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean => {
  if (attempt >= config.retries) {
    return false;
  }
  if (error.code && NON_RETRYABLE_ERROR_CODES.includes(error.code)) {
    return false;
  }
  if (!isRetryableMethod(error.config?.method, config)) {
    return false;
  }
  if (error.response) {
    return isRetryableStatus(error.response.status, config);
  }
  return true;
};

const parseRetryAfter = (header?: string): number | undefined => {
  if (!header) {
    return undefined;
  }
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : undefined;
};

/**
 * Spreads the retries of concurrent clients over a fraction of the computed delay,
 * so that a recovering server is not hit by every client at the exact same time.
 */
export const applyJitter = (delay: number): number => Math.round(delay * Math.random());

export const getRetryDelay = (attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG, retryAfter?: string): number => {
  const backoff = config.retryDelay * config.factor ** attempt;
  const capped = Math.min(backoff, config.maxRetryDelay);
  const serverDelay = parseRetryAfter(retryAfter);
  if (serverDelay !== undefined) {
    return Math.min(capped + serverDelay, config.maxRetryDelay);
  }
  return applyJitter(capped);
};

export const wait = (delay: number): Promise<void> => new Promise(resolve => setTimeout(resolve, delay));

export type RetriableRequestConfig = InternalAxiosRequestConfig & { retryCount?: number };

export const retryCountOf = (config?: InternalAxiosRequestConfig): number => (config as RetriableRequestConfig)?.retryCount ?? 0;

/**
 * Extracts the parameters that make a request user specific, so that they can be
 * taken into account when deciding whether two requests are interchangeable.
 */
export const scopedParamsOf = (config?: InternalAxiosRequestConfig): string => {
  const params = config?.params;
  if (!params) {
    return '';
  }
  return Object.entries(params as Record<string, unknown>)
    .filter(([key]) => key !== 'page' && key !== 'size' && key !== 'sort')
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
};
