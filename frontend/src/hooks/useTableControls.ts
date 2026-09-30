import { useCallback, useMemo, useState } from 'react';
import {
  filterTableRows,
  sortTableRows,
  type SortDirection,
} from '@/lib/tableControls';

export interface UseTableControlsOptions<T> {
  rows: readonly T[];
  getValue: (row: T, key: string) => unknown;
  getSearchText?: (row: T) => string;
  initialSortKey?: string | null;
  initialSortDir?: SortDirection;
  initialFilter?: string;
}

export interface TableControls<T> {
  rows: T[];
  sortKey: string | null;
  sortDir: SortDirection;
  toggleSort: (key: string) => void;
  filter: string;
  setFilter: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

/**
 * Client-side sort + text filter.
 * Do NOT nest setSortDir inside setSortKey — Strict Mode double-invokes nested updaters.
 */
export function useTableControls<T>({
  rows,
  getValue,
  getSearchText,
  initialSortKey = null,
  initialSortDir = 'asc',
  initialFilter = '',
}: UseTableControlsOptions<T>): TableControls<T> {
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortDir, setSortDir] = useState<SortDirection>(initialSortDir);
  const [filter, setFilter] = useState(initialFilter);

  const toggleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey, sortDir]
  );

  const processed = useMemo(() => {
    const filtered =
      filter.trim() && getSearchText
        ? filterTableRows(rows, filter, getSearchText)
        : [...rows];
    return sortTableRows(filtered, sortKey, sortDir, getValue);
  }, [rows, filter, getSearchText, sortKey, sortDir, getValue]);

  return {
    rows: processed,
    sortKey,
    sortDir,
    toggleSort,
    filter,
    setFilter,
    resultCount: processed.length,
    totalCount: rows.length,
  };
}
