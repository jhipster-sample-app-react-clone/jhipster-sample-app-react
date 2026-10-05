import { ASC, DESC } from 'app/shared/util/pagination.constants';

export const PAGE = 'page';
export const SIZE = 'size';
export const SORT = 'sort';

export const MIN_PAGE = 0;
export const MAX_PAGE_SIZE = 100;

export type ListQuery = {
  activePage: number;
  itemsPerPage: number;
  sort: string;
  order: typeof ASC | typeof DESC;
};

export const DEFAULT_LIST_QUERY: ListQuery = {
  activePage: MIN_PAGE,
  itemsPerPage: 20,
  sort: 'id',
  order: ASC,
};

const toBoundedInteger = (raw: string | null, fallback: number, min: number, max: number): number => {
  if (raw === null || raw.trim() === '') {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
};

export const parseListQuery = (locationSearch: string, defaults: ListQuery = DEFAULT_LIST_QUERY): ListQuery => {
  const params = new URLSearchParams(locationSearch);
  const [sortField, sortOrder] = (params.get(SORT) ?? '').split(',');

  return {
    activePage: toBoundedInteger(params.get(PAGE), defaults.activePage, MIN_PAGE, Number.MAX_SAFE_INTEGER),
    itemsPerPage: toBoundedInteger(params.get(SIZE), defaults.itemsPerPage, 1, Number.MAX_SAFE_INTEGER),
    sort: sortField || defaults.sort,
    order: sortOrder === DESC ? defaults.order : sortOrder,
  };
};

export const readSortField = (locationSearch: string): string => parseListQuery(locationSearch).sort;

const RESERVED_KEYS = ['__proto__', 'constructor', 'prototype'];

export const isSafeSortField = (field: string, allowedFields?: readonly string[]): boolean => {
  if (RESERVED_KEYS.includes(field)) {
    return false;
  }
  return allowedFields ? allowedFields.includes(field) : /^[A-Za-z]/.test(field);
};

export const toListQueryString = (query: ListQuery): string => {
  const params = new URLSearchParams();
  params.set(SORT, `${query.sort},${query.order}`);
  if (query.activePage >= MIN_PAGE) {
    params.set(PAGE, String(query.activePage));
  }
  if (query.itemsPerPage !== DEFAULT_LIST_QUERY.itemsPerPage) {
    params.set(SIZE, String(query.itemsPerPage));
  }
  return params.toString();
};
