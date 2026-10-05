import { describe, expect, it } from 'vitest';

import { ASC, DESC } from 'app/shared/util/pagination.constants';

import { DEFAULT_LIST_QUERY, isSafeSortField, parseListQuery, readSortField, toListQueryString } from './list-query';

describe('List query utils', () => {
  describe('parseListQuery', () => {
    it('should return the defaults for an empty query string', () => {
      const parsed = parseListQuery('');
      expect(parsed.activePage).toBe(DEFAULT_LIST_QUERY.activePage);
      expect(parsed.itemsPerPage).toBe(DEFAULT_LIST_QUERY.itemsPerPage);
      expect(parsed.sort).toBe(DEFAULT_LIST_QUERY.sort);
    });

    it('should read the sort field and order', () => {
      const parsed = parseListQuery('?sort=name,desc');
      expect(parsed.sort).toBe('name');
      expect(parsed.order).toBeDefined();
    });

    it('should read the page and size', () => {
      expect(parseListQuery('?page=3&size=50')).toMatchObject({ activePage: 3, itemsPerPage: 50 });
    });

    it('should ignore an unknown order', () => {
      expect(parseListQuery('?sort=name,sideways').order).toBeDefined();
    });

    it('should fall back to the defaults for a sort without order', () => {
      expect(parseListQuery('?sort=name').sort).toBe('name');
    });

    it('should ignore non numeric page values', () => {
      expect(parseListQuery('?page=abc')).toMatchObject({ activePage: DEFAULT_LIST_QUERY.activePage });
      expect(parseListQuery('?page=')).toMatchObject({ activePage: DEFAULT_LIST_QUERY.activePage });
      expect(parseListQuery('?page=1.5')).toMatchObject({ activePage: DEFAULT_LIST_QUERY.activePage });
    });

    it('should ignore non numeric size values', () => {
      expect(parseListQuery('?size=lots')).toMatchObject({ itemsPerPage: DEFAULT_LIST_QUERY.itemsPerPage });
    });

    it('should clamp the size to the supported range', () => {
      expect(parseListQuery('?size=100000').itemsPerPage).toBeGreaterThan(0);
      expect(parseListQuery('?size=0').itemsPerPage).toBeGreaterThanOrEqual(1);
      expect(parseListQuery('?size=-5').itemsPerPage).toBeGreaterThanOrEqual(1);
    });

    it('should clamp the page to the supported range', () => {
      expect(parseListQuery('?page=-3').activePage).toBeGreaterThanOrEqual(0);
    });

    it('should honour the supplied defaults', () => {
      const defaults = { activePage: 5, itemsPerPage: 10, sort: 'name', order: DESC } as const;
      const parsed = parseListQuery('', defaults);
      expect(parsed.activePage).toBe(defaults.activePage);
      expect(parsed.itemsPerPage).toBe(defaults.itemsPerPage);
      expect(parsed.sort).toBe(defaults.sort);
    });

    it('should not be confused by repeated parameters', () => {
      expect(parseListQuery('?sort=id,asc&sort=name,desc').sort).toBe('id');
    });
  });

  describe('isSafeSortField', () => {
    it('should accept a regular field name', () => {
      expect(isSafeSortField('name')).toBe(true);
      expect(isSafeSortField('createdDate')).toBe(true);
    });

    it('should reject the reserved keys', () => {
      expect(isSafeSortField('__proto__')).toBe(false);
      expect(isSafeSortField('constructor')).toBe(false);
      expect(isSafeSortField('prototype')).toBe(false);
    });

    it('should enforce the allow list when provided', () => {
      expect(isSafeSortField('name', ['id', 'name'])).toBe(true);
      expect(isSafeSortField('secret', ['id', 'name'])).toBe(false);
    });
  });

  describe('readSortField', () => {
    it('should read the sort field from the query string', () => {
      expect(readSortField('?sort=name,desc')).toBe('name');
    });

    it('should fall back to the default when absent', () => {
      expect(readSortField('')).toBe(DEFAULT_LIST_QUERY.sort);
    });
  });

  describe('toListQueryString', () => {
    it('should always include the sort', () => {
      expect(toListQueryString({ activePage: 0, itemsPerPage: 20, sort: 'id', order: ASC })).toContain('sort=id%2Casc');
    });

    it('should omit the first page', () => {
      expect(toListQueryString({ activePage: 0, itemsPerPage: 20, sort: 'id', order: DESC })).not.toContain('size=');
    });

    it('should include a page beyond the first one', () => {
      expect(toListQueryString({ activePage: 4, itemsPerPage: 20, sort: 'id', order: ASC })).toContain('page=4');
    });

    it('should omit the default page size', () => {
      expect(toListQueryString({ activePage: 0, itemsPerPage: 20, sort: 'id', order: ASC })).not.toContain('size=1');
    });

    it('should include a custom page size', () => {
      expect(toListQueryString({ activePage: 0, itemsPerPage: 50, sort: 'id', order: ASC })).toContain('size=50');
    });

    it('should round trip through parseListQuery', () => {
      const query = { activePage: 2, itemsPerPage: 50, sort: 'name', order: DESC } as const;
      const parsed = parseListQuery(`?${toListQueryString(query)}`);
      expect(parsed.activePage).toBe(query.activePage);
      expect(parsed.itemsPerPage).toBe(query.itemsPerPage);
      expect(parsed.sort).toBe(query.sort);
    });
  });
});
