import React from 'react';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full animate-pulse space-y-3 p-4">
      <div className="h-10 bg-slate-100 rounded-lg w-full mb-4"></div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-6 bg-slate-100 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function TableEmptyState({ message = "Chưa có dữ liệu nào được ghi nhận." }: { message?: string }) {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center">
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-full mb-3 text-slate-400">
        <Inbox size={32} />
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}

export function TablePagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  totalItems: number; 
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-sm text-slate-600">
      <div>Tổng số: <span className="font-semibold text-slate-900">{totalItems}</span> bản ghi</div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-medium">Trang {currentPage} / {totalPages}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}