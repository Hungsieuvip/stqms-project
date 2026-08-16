import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, isLoading }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Hủy</button>
          <button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
            {isLoading ? 'Đang xử lý...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}