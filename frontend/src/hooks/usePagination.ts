import { useState, useMemo } from 'react';

export interface PaginationOptions {
  initialPage?: number;
  initialPerPage?: number;
  totalItems?: number;
}

export function usePagination({ initialPage = 1, initialPerPage = 10, totalItems = 0 }: PaginationOptions = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / perPage)), [totalItems, perPage]);

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const setPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  return {
    currentPage,
    perPage,
    totalPages,
    setPerPage,
    setPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}
