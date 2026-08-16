'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { standardService } from '../../services/standardService';
import { Standard } from '../../types/standard';
import { X } from 'lucide-react';

const schema = z.object({
  code: z.string().min(1, 'Vui lòng nhập mã tiêu chuẩn'),
  name: z.string().min(1, 'Vui lòng nhập tên tiêu chuẩn'),
  description: z.string().optional(),
  issued_date: z.string().optional(),
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
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { code: '', name: '', description: '', issued_date: '', is_active: true }
  });

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setValue('code', editingItem.code);
        setValue('name', editingItem.name);
        setValue('description', editingItem.description || '');
        setValue('issued_date', editingItem.issued_date || '');
        setValue('is_active', editingItem.is_active);
      } else {
        reset();
      }
    }
  }, [isOpen, editingItem, setValue, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (editingItem) {
        await standardService.updateStandard(editingItem.id, data);
        alert('Cập nhật tiêu chuẩn thành công!');
      } else {
        await standardService.createStandard(data);
        alert('Tạo tiêu chuẩn mới thành công!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu tiêu chuẩn. Vui lòng thử lại!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"><X size={20} /></button>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{editingItem ? 'Chỉnh sửa' : 'Thêm Tiêu chuẩn'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Mã tiêu chuẩn *</label><input {...register('code')} className="w-full border p-2 rounded" /></div>
          <div><label className="block text-sm font-medium mb-1">Tên tiêu chuẩn *</label><textarea {...register('name')} rows={2} className="w-full border p-2 rounded" /></div>
          <div className="flex justify-end gap-3 mt-4"><button type="button" onClick={onClose} className="px-4 py-2 border rounded">Hủy</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Lưu</button></div>
        </form>
      </div>
    </div>
  );
}