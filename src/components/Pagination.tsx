import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  totalPages?: number;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages: explicitTotalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'records',
  className = '',
}) => {
  const totalPages = explicitTotalPages ?? Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0 || totalPages <= 1) {
    if (totalItems === 0) return null;
    return (
      <div className={`resq-pagination-bar ${className}`}>
        <div className="resq-pagination-info">
          Showing <strong>1</strong> to <strong>{totalItems}</strong> of <strong>{totalItems}</strong> {itemLabel}
        </div>
        <div className="resq-pagination-controls">
          <span className="pagination-single-page">Page 1 of 1</span>
        </div>
      </div>
    );
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`resq-pagination-bar ${className}`}>
      <div className="resq-pagination-info">
        Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalItems}</strong> {itemLabel}
      </div>

      <div className="resq-pagination-controls">
        <button
          type="button"
          className="btn-pagination-nav"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span className="pagination-nav-label">Previous</span>
        </button>

        <div className="pagination-numbers-group">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="pagination-ellipsis">
                  …
                </span>
              );
            }
            const pageNum = p as number;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                className={`pagination-number-btn ${isActive ? 'active' : ''}`}
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="btn-pagination-nav"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <span className="pagination-nav-label">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
