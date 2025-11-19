import { cn } from '@/utils/cn';
import React, { useMemo, useState, useRef, useEffect } from 'react';

export default function Table(
  {
    columns,
    data,
    rowKey = r => r.id,
    selectable = 'none',
    selectedKeys,
    onSelectionChange,
    sortable = true,
    sortBy: controlledSort,
    onSortChange,
    loading,
    emptyMessage = 'No rows',
    className = '',
    getFooter,
    pageSize: propPageSize // <-- added prop
  }) {
  /** @type {{key: string, direction: 'asc'|'desc'} | null} */
  const [localSort, setLocalSort] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(propPageSize || 10);
  const sort = controlledSort ?? localSort;
  // console.log("columns", columns);
  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find(c => c.key === sort.key);
    if (!col) return data;
    return [...data].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av === bv) return 0;
      return sort.direction === 'asc' ? (av > bv ? 1 : -1) : (av > bv ? -1 : 1);
    });
  }, [data, sort, columns]);

  const paginatedRows = useMemo(() => {
    if (!pageSize) return sorted;
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  // Column groups & visibility (for grouped/collapsible columns)
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const groups = useMemo(() => {
    const map = new Map();
    (columns || []).forEach(col => {
      if (!col.group) return;
      if (!map.has(col.group)) {
        map.set(col.group, {
          key: col.group,
          label: col.groupLabel || col.group,
        });
      }
    });
    return Array.from(map.values());
  }, [columns]);

  useEffect(() => {
    // Initialize collapsed state for any new groups based on groupCollapsed
    setCollapsedGroups(prev => {
      const next = { ...prev };
      groups.forEach(g => {
        if (next[g.key] === undefined) {
          const colForGroup = (columns || []).find(c => c.group === g.key);
          next[g.key] = !!colForGroup?.groupCollapsed;
        }
      });
      // Remove groups that no longer exist
      Object.keys(next).forEach(key => {
        if (!groups.find(g => g.key === key)) {
          delete next[key];
        }
      });
      return next;
    });
  }, [columns, groups]);

  const visibleColumns = useMemo(() => {
    return (columns || []).filter(col => {
      // Explicit hidden flag still wins
      if (col.hidden) return false;
      // If column belongs to a group, hide when group is collapsed
      if (col.group) {
        const isCollapsed = collapsedGroups[col.group];
        if (isCollapsed) return false;
      }
      return true;
    });
  }, [columns, collapsedGroups]);

  // Header checkbox refs & derived selection state (select-all for multiple selection)
  const headerCheckboxRef = useRef(null);
  const allRowKeys = useMemo(() => (sorted || []).map(r => rowKey(r)), [sorted, rowKey]);
  const selectedSet = useMemo(() => new Set(selectedKeys || []), [selectedKeys]);

  const allSelected = allRowKeys.length > 0 && allRowKeys.every(k => selectedSet.has(k));
  const someSelected = allRowKeys.some(k => selectedSet.has(k));

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = !allSelected && someSelected;
    }
  }, [allSelected, someSelected]);

  const toggleSort = (key) => {
    const next = sort?.key === key ? { key, direction: sort.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' };
    if (onSortChange) onSortChange(next); else setLocalSort(next);
  };

  const handleSelect = (k) => {
    if (!onSelectionChange) return;
    if (selectable === 'single') onSelectionChange([k]);
    else {
      const current = new Set(selectedKeys || []);
      if (current.has(k)) current.delete(k); else current.add(k);
      onSelectionChange(Array.from(current));
    }
  };

  if (loading) return <div className="p-4">Loading…</div>;
  // if (!sorted || sorted.length === 0) return <div className="p-4 text-sm text-muted">{emptyMessage}</div>;

  return (
    <div className={cn(`table-wrapper rounded-lg border border-white-100 overflow-x-auto overflow-y-hidden h-full ${className}`)}>
      <table className="min-w-full divide-y divide-white-100 h-full ">
        <thead className="bg-black-400 sticky top-0 backdrop-blur-xl z-9 rounded-lg overflow-hidden">
          <tr>
            {selectable === 'multiple' && (
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  ref={headerCheckboxRef}
                  checked={allSelected}
                  onChange={(e) => {
                    if (!onSelectionChange) return;
                    if (e.target.checked) onSelectionChange(Array.from(allRowKeys));
                    else onSelectionChange([]);
                  }}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {visibleColumns.map(col => {
              const align =
                col.align === 'right'
                  ? 'text-right justify-end'
                  : col.align === 'center'
                    ? 'text-center justify-center'
                    : 'text-left justify-start';

              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'px-3 py-2 text-sm font-medium text-secondary-text',
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : 'text-left',
                    col?.className || ''
                  )}
                >
                  <div className={cn('flex items-center gap-2 w-full', align.includes('justify-') ? align.split(' ').filter(c => c.startsWith('justify-')) : '')}>
                    <span
                      onClick={() => col.sortable && toggleSort(col.key)}
                      className={cn(col.sortable ? 'cursor-pointer select-none' : '')}
                    >
                      {col.header}
                    </span>
                    {sort?.key === col.key && <span>{sort.direction === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
              );
            })}
            {groups.length > 0 && (
              <th className="px-2 py-2 text-right align-middle w-8">
                <div className="flex items-center gap-2 w-full justify-end">
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={() => setShowGroupMenu(v => !v)}
                      className="text-xs h-5 w-5 rounded border bg-white-200 hover:bg-white-300 border-color-100 flex items-center justify-center flex-col gap-0.5"
                      aria-label="Toggle column groups "
                    >
                      {/* {showGroupMenu ?  */}
                      <div className={cn('origin-center w-full h-full relative flex items-center justify-center p-1 overflow-hidden transition-all duration-300', showGroupMenu ? 'rotate-45 ': 'flex-col gap-0.5')}>
                      <span className={cn('border-b-1 w-full transition-all duration-300 rounded-lg', showGroupMenu ? 'border-b-1 w-[85%] absolute origin-center rotate-0 ': '')}></span>
                      <span className={cn('border-b-1 w-full transition-all duration-300 rounded-lg', showGroupMenu ? 'opacity-0 ': '')}></span>
                      <span className={cn('border-b-1 w-full transition-all duration-300 rounded-lg', showGroupMenu ? 'border-b-1 w-[85%] absolute origin-center -rotate-90 ': '')}></span>
                      </div> 
                      {/* : <div className='origin-center rotate-45 w-full h-full relative flex items-center justify-center p-1 overflow-hidden'>
                        <span className='border-b-1 w-full absolute origin-center rotate-0'></span>
                        <span className='border-b-1 w-full absolute origin-center -rotate-90'></span>
                      </div>} */}
                    </button>
                    {showGroupMenu && (
                      <ul className="absolute right-0 mt-1 w-40 border border-white-200 bg-secondary rounded-sm z-20 overflow-hidden ">
                        {groups.map(group => {
                          const collapsed = collapsedGroups[group.key];
                          return (
                            <li
                              key={group.key}
                              type="button"
                              onClick={() =>
                                setCollapsedGroups(prev => ({
                                  ...prev,
                                  [group.key]: !collapsed,
                                }))
                              }
                              className="text-secondary-text w-full flex items-center gap-1 px-2.5 py-1.5 text-xs backdrop-blur-2xl cursor-pointer select-none border-l-4 border-transparent hover:border-action"
                            >
                              <span>{collapsed ? 'Show' : 'Hide'}</span>
                              <span>{group.label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, idx) => {
            const key = rowKey(row);
            return (
              <tr key={key || idx + '_key'} className={`h-fit hover:bg-white-200/90 ${idx % 2 ? '' : 'bg-white-100'}`}>
                {selectable !== 'none' && <td className="px-3 py-2 text-center"><input type="checkbox" checked={(selectedKeys || []).includes(key)} onChange={() => handleSelect(key)} /></td>}
                {visibleColumns.map(col => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2 text-sm h-fit',
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                          ? 'text-center'
                          : 'text-left',
                      col?.className || ''
                    )}
                  >
                    {col.render ? col.render(row, idx) : row[col.key]}
                  </td>
                ))}
                {groups.length > 0 && (
                  <td className="px-2 py-2 text-sm" />
                )}
              </tr>
            );
          })}
          {(!sorted || sorted.length === 0) &&
            <tr>
              <td
                className="p-4 text-sm text-muted text-center"
                colSpan={visibleColumns.length + (selectable !== 'none' ? 1 : 0) + (groups.length > 0 ? 1 : 0)}
              >
                {emptyMessage}
              </td>
            </tr>}
        </tbody>
        {getFooter && (
          <tfoot className="bg-white-200 font-semibold sticky top-0">
            <tr>
              {selectable === 'multiple' && <td></td>}
              {visibleColumns.map(col => (
                <td
                  key={col.key}
                  className={cn(
                    'px-3 py-2',
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : 'text-left',
                    col?.className || ''
                  )}
                >
                  {getFooter(sorted)[col.key] ?? ''}
                </td>
              ))}
              {groups.length > 0 && <td />}
            </tr>
          </tfoot>
        )}
      </table>
      <div className="flex items-center justify-between p-2 text-sm text-secondary-text bg-white-100 border-t border-white-100 sticky bottom-0 backdrop-blur-xl rounded-bl-lg overflow-hidden">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded px-1 py-0.5"
          >
            {[5, 10, 15, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Page info */}
        <div>
          Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} items
        </div>

        {/* Prev / Next buttons */}
        <div className="flex gap-2">
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Prev
          </button>
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            disabled={currentPage * pageSize >= sorted.length}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}