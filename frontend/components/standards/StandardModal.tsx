'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { standardService } from '../../services/standardService';
import { Standard } from '../../types/standard';
import { X, AlertCircle } from 'lucide-react';

const schema = z.object({
  code: z.string().min(1, 'Vui lòng nhập mã tiêu chuẩn'),
  name: z.string().min(1, 'Vui lòng nhập tên tiêu chuẩn'),
  description: z.string().optional().nullable(),
  issued_date: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem: Standard | null;
}

export default function StandardModal({ isOpen, onClose, onSuccess, editingItem }: StandardModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { 
      code: '', 
      name: '', 
      description: '', 
      issued_date: new Date().toISOString().split('T')[0], 
      is_active: true 
    }
  });

  useEffect(() => {
    setServerError(null);
    if (isOpen) {
      if (editingItem) {
        setValue('code', editingItem.code);
        setValue('name', editingItem.name);
        setValue('description', editingItem.description || '');
        setValue('issued_date', editingItem.issued_date ? editingItem.issued_date.substring(0, 10) : '');
        setValue('is_active', editingItem.is_active ?? true);
      } else {
        reset({
          code: '',
          name: '',
          description: '',
          issued_date: new Date().toISOString().split('T')[0],
          is_active: true
        });
      }
    }
  }, [isOpen, editingItem, setValue, reset]);

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const payload: Partial<Standard> = {
        code: data.code.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        issued_date: data.issued_date ? data.issued_date : null,
        is_active: data.is_active
      };

      if (editingItem) {
        await standardService.updateStandard(editingItem.id, payload);
      } else {
        await standardService.createStandard(payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail;
      setServerError(
        typeof detail === 'string' 
          ? detail 
          : 'Có lỗi xảy ra khi lưu tiêu chuẩn. Vui lòng kiểm tra lại thông tin!'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {editingItem ? 'Chỉnh sửa Bộ Tiêu Chuẩn' : 'Thêm mới Bộ Tiêu Chuẩn'}
        </h2>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mã tiêu chuẩn <span className="text-red-500">*</span>
            </label>
            <input 
              {...register('code')} 
              placeholder="Ví dụ: TT_12_2017"
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
            />
            {errors.code && <p className="text-red-600 text-xs mt-1">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tên tiêu chuẩn <span className="text-red-500">*</span>
            </label>
            <textarea 
              {...register('name')} 
              rows={2} 
              placeholder="Tên đầy đủ của bộ tiêu chuẩn..."
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ngày ban hành
            </label>
            <input 
              type="date"
              {...register('issued_date')} 
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mô tả chi tiết
            </label>
            <textarea 
              {...register('description')} 
              rows={3} 
              placeholder="Ghi chú hoặc căn cứ pháp lý ban hành..."
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input 
              type="checkbox" 
              id="is_active" 
              {...register('is_active')}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
              Áp dụng tiêu chuẩn này cho hệ thống
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Đang lưu...' : (editingItem ? 'Cập nhật' : 'Thêm tiêu chuẩn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
