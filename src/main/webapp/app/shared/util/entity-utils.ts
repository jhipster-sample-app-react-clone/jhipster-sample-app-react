import { IPaginationBaseState, ISortBaseState } from 'react-jhipster';

import { parseListQuery } from 'app/shared/util/list-query';

/**
 * Removes fields with an 'id' field that equals ''.
 * This function was created to prevent entities to be sent to
 * the server with an empty id and thus resulting in a 500.
 *
 * @param entity Object to clean.
 */
export const cleanEntity = entity => {
  const keysToKeep = Object.keys(entity).filter(k => !(entity[k] instanceof Object) || (entity[k].id !== '' && entity[k].id !== -1));

  return Object.fromEntries(keysToKeep.map(key => [key, entity[key]]));
};

/**
 * Simply map a list of elements to a list of objects with the element as id.
 *
 * @param idList Elements to map.
 * @returns The list of objects with mapped ids.
 */
export const mapIdList = (idList: readonly any[]) => idList?.filter(id => id !== '').map(id => ({ id }));

export const overrideSortStateWithQueryParams = (paginationBaseState: ISortBaseState, locationSearch: string) => {
  const { sort, order } = parseListQuery(locationSearch);
  return { ...paginationBaseState, sort, order };
};

export const overridePaginationStateWithQueryParams = (paginationBaseState: IPaginationBaseState, locationSearch: string) => {
  const { activePage, itemsPerPage, sort, order } = parseListQuery(locationSearch);
  return { ...paginationBaseState, activePage, itemsPerPage, sort, order } as IPaginationBaseState;
};
