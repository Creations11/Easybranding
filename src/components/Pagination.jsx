// src/components/Pagination.jsx
// ─────────────────────────────────────────────────────────────
// Reusable pagination component
// No dependencies — pure component
// ─────────────────────────────────────────────────────────────
import { useMemo } from 'react';

// Design tokens — matches your existing dashboard
const c = {
  lime: '#B8F040',
  muted: '#8A9080',
  borderDim: 'rgba(255,255,255,0.06)',
  text: '#EEF0E8',
  surface: '#0D110C',
};

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  siblingCount = 1,
  showInfo = false,
  totalItems,
  itemsPerPage,
}) {
  // ── Calculate page numbers with ellipsis ──────────────────
  const pages = useMemo(() => {
    if (totalPages <= 1) return [];

    // If total pages fit without ellipsis
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      // Show first pages + dots + last
      const firstPages = Array.from(
        { length: 3 + 2 * siblingCount },
        (_, i) => i + 1
      );
      return [...firstPages, '...', totalPages];
    }

    if (showLeftDots && !showRightDots) {
      // Show first + dots + last pages
      const lastPages = [];
      const start = totalPages - (3 + 2 * siblingCount) + 1;
      for (let i = Math.max(start, 1); i <= totalPages; i++) {
        lastPages.push(i);
      }
      return [1, '...', ...lastPages];
    }

    // Show first + dots + middle + dots + last
    const middlePages = [];
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      middlePages.push(i);
    }
    return [1, '...', ...middlePages, '...', totalPages];
  }, [currentPage, totalPages, siblingCount]);

  // ── Don't render if nothing to paginate ────────────────────
  if (totalPages <= 1) return null;

  // ── Info text ──────────────────────────────────────────────
  const startItem = totalItems
    ? Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
    : null;
  const endItem = totalItems
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        marginTop: '24px',
      }}
    >
      {/* Info line */}
      {showInfo && totalItems && (
        <p
          style={{
            color: c.muted,
            fontSize: '12px',
            fontFamily: 'inherit',
          }}
        >
          Showing {startItem}–{endItem} of {totalItems}
        </p>
      )}

      {/* Page buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: `1px solid ${c.borderDim}`,
            borderRadius: '8px',
            color: currentPage === 1 ? c.muted : c.text,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily: 'inherit',
            opacity: currentPage === 1 ? 0.5 : 1,
            transition: 'all 0.15s ease',
          }}
          aria-label="Previous page"
        >
          ← Prev
        </button>

        {/* Page numbers */}
        {pages.map((page, index) => {
          const isEllipsis = page === '...';
          const isActive = page === currentPage;

          return (
            <button
              key={`${page}-${index}`}
              onClick={() => !isEllipsis && onPageChange(page)}
              disabled={isEllipsis}
              style={{
                padding: '8px 12px',
                background: isActive ? c.lime : 'transparent',
                border: `1px solid ${isActive ? c.lime : c.borderDim}`,
                borderRadius: '8px',
                color: isActive
                  ? '#080A06'
                  : isEllipsis
                  ? c.muted
                  : c.text,
                cursor: isEllipsis ? 'default' : 'pointer',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '400',
                fontFamily: 'inherit',
                minWidth: '38px',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                opacity: isEllipsis ? 0.6 : 1,
              }}
              aria-label={isEllipsis ? 'More pages' : `Page ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            border: `1px solid ${c.borderDim}`,
            borderRadius: '8px',
            color: currentPage === totalPages ? c.muted : c.text,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily: 'inherit',
            opacity: currentPage === totalPages ? 0.5 : 1,
            transition: 'all 0.15s ease',
          }}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
}