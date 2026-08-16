'use client';

import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface WorkflowModalProps {
  isOpen: boolean;
  evidenceTitle: string;
  actionType: 'APPROVED' | 'REJECTED';
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}

export default function WorkflowModal({
  isOpen,
  evidenceTitle,
  actionType,
  onClose,
  onConfirm,
}: WorkflowModalProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isApprove = actionType === 'APPROVED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApprove && !note.trim()) {
      setError('Vui lòng nhập lý do từ chối / yêu cầu bổ sung.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm(note);
      setNote('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Thao tác thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle className="text-emerald-600" size={20} />
            ) : (
              <XCircle className="text-rose-600" size={20} />
            )}
            <h3 className="text-base font-bold text-slate-900">
              {isApprove ? 'Phê duyệt minh chứng' : 'Yêu cầu chỉnh sửa / Từ chối'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Minh chứng:</p>
            <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {evidenceTitle}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {isApprove ? 'Ghi chú phê duyệt (Không bắt buộc)' : 'Lý do yêu cầu sửa đổi *'}
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isApprove ? 'Nhận xét thêm...' : 'Chỉ rõ tài liệu cần bổ sung hoặc điều chỉnh...'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${
                isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? 'Đang xử lý...' : isApprove ? 'Xác nhận duyệt' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}