import React, { useMemo, useState, useRef, useEffect } from 'react';

export default function Table(
    { 
        columns, 
        data, 
        rowKey = r=>r.id, 
        selectable='none', 
        selectedKeys, 
        onSelectionChange, 
        sortable=true, 
        sortBy: controlledSort, 
        onSortChange, 
        loading, 
        emptyMessage='No rows', 
        className='', 
        getFooter,
        pageSize: propPageSize // <-- added prop
    }) {
  /** @type {{key: string, direction: 'asc'|'desc'} | null} */
  const [localSort, setLocalSort] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(propPageSize || 10);
  const sort = controlledSort ?? localSort;

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find(c=>c.key===sort.key);
    if (!col) return data;
    return [...data].sort((a,b)=>{
      const av = a[sort.key], bv = b[sort.key];
      if (av==null) return 1;
      if (bv==null) return -1;
      if (av === bv) return 0;
      return sort.direction === 'asc' ? (av > bv ? 1 : -1) : (av > bv ? -1 : 1);
    });
  }, [data, sort, columns]);

  const paginatedRows = useMemo(() => {
    if (!pageSize) return sorted;
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

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
  if (!sorted || sorted.length === 0) return <div className="p-4 text-sm text-muted">{emptyMessage}</div>;

  return (
    <div className={`table-wrapper rounded-lg border border-white-100 overflow-x-auto overflow-y-hidden ${className}`}>
      <table className="min-w-full divide-y divide-white-100">
        <thead className="bg-black-300 sticky top-0">
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
            {columns.map(col => (
              <th key={col.key} style={{width: col.width}} className="px-3 py-2 text-left text-sm font-medium text-secondary-text">
                <div className="flex items-center gap-2">
                  <span onClick={()=>col.sortable && toggleSort(col.key)} className="cursor-pointer select-none">{col.header}</span>
                  {sort?.key === col.key && <span>{sort.direction==='asc'?'↑':'↓'}</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, idx) => {
            const key = rowKey(row);
            return (
              <tr key={key} className={`hover:bg-white-100 ${idx%2? '': 'bg-white-100/30'}`}>
                {selectable!=='none' && <td className="px-3 py-2 text-center"><input type="checkbox" checked={(selectedKeys||[]).includes(key)} onChange={()=>handleSelect(key)} /></td>}
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-2 text-sm">
                    {col.render ? col.render(row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        {getFooter && (
          <tfoot className="bg-white-200 font-semibold sticky bottom-0">
            <tr>
              {selectable === 'multiple' && <td></td>}
              {columns.map(col => (
                <td key={col.key} className="px-3 py-2">
                  {getFooter(sorted)[col.key] ?? ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
      <div className="flex items-center justify-between p-2 text-sm text-secondary-text bg-white-100 border-t border-white-100">
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
            {[5,10,15,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
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