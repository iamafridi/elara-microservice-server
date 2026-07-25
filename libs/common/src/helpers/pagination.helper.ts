import { CONSTANTS } from '../constants';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || CONSTANTS.PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, params.limit || CONSTANTS.PAGINATION.DEFAULT_LIMIT),
    CONSTANTS.PAGINATION.MAX_LIMIT,
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginationResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
