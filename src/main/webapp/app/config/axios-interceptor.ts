import { Storage } from 'react-jhipster';

import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { AUTHENTICATION_TOKEN_KEY } from 'app/shared/jhipster/constants';

import { DEFAULT_RETRY_CONFIG, RetriableRequestConfig, getRetryDelay, shouldRetryRequest, wait } from './http-retry';
import { RequestDeduplicator, buildDeduplicationKey } from './request-deduplicator';

const TIMEOUT = 1 * 60 * 1000;
axios.defaults.timeout = TIMEOUT;
axios.defaults.baseURL = SERVER_API_URL;

const DEDUPLICATED_METHODS = ['get', 'head'];

const deduplicator = new RequestDeduplicator();

/**
 * Builds a short, human readable description of a request, used for the retry traces.
 */
export const describeRequest = (config?: AxiosRequestConfig): string =>
  config?.url ? `${config.method?.toUpperCase() ?? 'GET'} ${config.url}` : `${config?.method?.toUpperCase() ?? 'GET'}`;

const readBearerToken = (): string | undefined =>
  Storage.local.get(AUTHENTICATION_TOKEN_KEY) || Storage.session.get(AUTHENTICATION_TOKEN_KEY);

const isDeduplicable = (config: InternalAxiosRequestConfig): boolean =>
  DEDUPLICATED_METHODS.includes((config.method ?? 'get').toLowerCase()) && !config.headers?.['X-Request-Idempotency-Key'];

const setupAxiosInterceptors = onUnauthenticated => {
  const onRequestSuccess = config => {
    const token = readBearerToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  };
  const onResponseSuccess = response => response;
  const onResponseError = async (err: AxiosError) => {
    const status = err.status ?? err.response?.status ?? 0;
    if (status === 401) {
      onUnauthenticated();
    }

    const config = err.config as RetriableRequestConfig | undefined;
    const attempt = (config?.retryCount ?? 0) + 1;
    if (config && shouldRetryRequest(err, attempt, DEFAULT_RETRY_CONFIG)) {
      config.retryCount = attempt;
      const retryAfter = err.response?.headers?.['retry-after'] as string | undefined;
      const delay = getRetryDelay(attempt, DEFAULT_RETRY_CONFIG, retryAfter);
      if (DEVELOPMENT) {
        // eslint-disable-next-line no-console
        console.warn(`Retrying ${describeRequest(config)} in ${delay}ms (attempt ${attempt}/${DEFAULT_RETRY_CONFIG.retries})`);
      }
      await wait(delay);
      return axios.request(config);
    }
    return Promise.reject(err);
  };
  axios.interceptors.request.use(onRequestSuccess);
  axios.interceptors.response.use(onResponseSuccess, onResponseError);

  const baseAdapter = axios.getAdapter(axios.defaults.adapter);
  axios.defaults.adapter = (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    const internalConfig = config as InternalAxiosRequestConfig;
    if (!isDeduplicable(internalConfig)) {
      return baseAdapter(config);
    }
    const key = buildDeduplicationKey(internalConfig);
    const inFlight = deduplicator.get(key);
    if (inFlight) {
      return inFlight;
    }
    return deduplicator.track(key, baseAdapter(config));
  };
};

export default setupAxiosInterceptors;
