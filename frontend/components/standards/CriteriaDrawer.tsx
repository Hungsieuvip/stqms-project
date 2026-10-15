'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { standardService } from '../../services/standardService';
import { Standard, Criterion } from '../../types/standard';
import { useAuth } from '../../contexts/AuthContext';
import { 
  X, Plus, Edit, Trash2, Search, CheckCircle2, 
  XCircle, AlertCircle, RefreshCw 
} from 'lucide-react';

const criterionSchema = z.object({
  code: z.string().min(1, 'Vui lòng nhập mã tiêu chí'),
  name: z.string().min(1, 'Vui lòng nhập tên tiêu chí'),
  description: z.string().optional().nullable(),
  sequence_num: z.coerce.number().min(1, 'Thứ tự phải lớn hơn 0'),
  is_active: z.boolean().default(true),
});

type CriterionFormData = z.infer<typeof criterionSchema>;

interface CriteriaDrawerProps {
  standard: Standard;
  isOpen: boolean;
  onClose: () => void;
  initialAdd?: boolean;
}

export default function CriteriaDrawer({ standard, isOpen, onClose, initialAdd }: CriteriaDrawerProps) {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Form state (Thêm mới hoặc Chỉnh sửa)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CriterionFormData>({
    resolver: zodResolver(criterionSchema) as any,
    defaultValues: {
      code: '',
      name: '',
      description: '',
      sequence_num: 1,
      is_active: true
    }
  });

  const fetchCriteria = async () => {
    if (!standard?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await standardService.getCriteria({ standard_id: standard.id });
      const items = Array.isArray(res) ? res : (res.items || res.data || []);
      setCriteria(items);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách tiêu chí. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && standard?.id) {
      fetchCriteria();
      setEditingCriterion(null);
      setSearch('');
      if (initialAdd) {
        setFormError(null);
        reset({
          code: '',
          name: '',
          description: '',
          sequence_num: (standard.criteria?.length || 0) + 1,
          is_active: true
        });
        setIsFormOpen(true);
      } else {
        setIsFormOpen(false);
      }
    }
  }, [isOpen, standard?.id, initialAdd]);

  const handleOpenAddForm = () => {
    setEditingCriterion(null);
    setFormError(null);
    reset({
      code: '',
      name: '',
      description: '',
      sequence_num: criteria.length + 1,
      is_active: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: Criterion) => {
    setEditingCriterion(item);
    setFormError(null);
    setValue('code', item.code);
    setValue('name', item.name);
    setValue('description', item.description || '');
    setValue('sequence_num', item.sequence_num);
    setValue('is_active', item.is_active);
    setIsFormOpen(true);
  };

  const onSaveCriterion = async (data: CriterionFormData) => {
    setFormError(null);
    try {
      if (editingCriterion) {
        await standardService.updateCriterion(editingCriterion.id, {
          code: data.code.trim(),
          name: data.name.trim(),
          description: data.description?.trim() || null,
          sequence_num: Number(data.sequence_num),
          is_active: data.is_active
        });
      } else {
        await standardService.createCriterion({
          standard_id: standard.id,
          code: data.code.trim(),
          name: data.name.trim(),
          description: data.description?.trim() || null,
          sequence_num: Number(data.sequence_num),
          is_active: data.is_active
        });
      }
      setIsFormOpen(false);
      setEditingCriterion(null);
      fetchCriteria();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setFormError(typeof detail === 'string' ? detail : 'Lỗi khi lưu tiêu chí.');
    }
  };

  const handleDeleteCriterion = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tiêu chí "${name}"?`)) return;
    try {
      await standardService.deleteCriterion(id);
      fetchCriteria();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Xóa tiêu chí thất bại.');
    }
  };

  const handleToggleStatus = async (item: Criterion) => {
    try {
      await standardService.updateCriterion(item.id, {
        is_active: !item.is_active
      });
      fetchCriteria();
    } catch (err: any) {
      alert('Không thể đổi trạng thái tiêu chí.');
    }
  };

  const filteredCriteria = criteria.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity" 
          onClick={onClose} 
        />
      )}
      
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-start border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-600 text-white">
                {standard?.code}
              </span>
              <h2 className="text-base font-bold text-white tracking-wide">
                Quản lý Danh sách Tiêu chí
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1" title={standard?.name}>
              {standard?.name}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm theo mã hoặc tên tiêu chí..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          {canManage && !isFormOpen && (
            <button 
              onClick={handleOpenAddForm}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus size={16} />
              Thêm Tiêu chí
            </button>
          )}
        </div>

        {/* Form Container (When Open) */}
        {isFormOpen && (
          <div className="p-5 bg-blue-50/50 border-b border-blue-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {editingCriterion ? 'Chỉnh sửa Tiêu chí' : `Thêm mới Tiêu chí vào ${standard?.code}`}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Hủy form
              </button>
            </div>

            {formError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSaveCriterion)} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Thứ tự *
                  </label>
                  <input 
                    type="number"
                    {...register('sequence_num')}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  />
                  {errors.sequence_num && <p className="text-red-600 text-[11px] mt-0.5">{errors.sequence_num.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Mã tiêu chí *
                  </label>
                  <input 
                    {...register('code')}
                    placeholder="VD: 1.1 hoặc TC01.1"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                  />
                  {errors.code && <p className="text-red-600 text-[11px] mt-0.5">{errors.code.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Tên tiêu chí *
                </label>
                <input 
                  {...register('name')}
                  placeholder="Tên đầy đủ tiêu chí đánh giá..."
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                />
                {errors.name && <p className="text-red-600 text-[11px] mt-0.5">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Mô tả / Hướng dẫn
                </label>
                <textarea 
                  {...register('description')}
                  rows={2}
                  placeholder="Mô tả nội dung tiêu chí..."
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="crit_is_active" 
                    {...register('is_active')}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="crit_is_active" className="text-xs text-slate-700 cursor-pointer">
                    Đang áp dụng
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-white"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : (editingCriterion ? 'Lưu thay đổi' : 'Tạo tiêu chí')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Content Body: List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex justify-between items-center">
              <span>{error}</span>
              <button onClick={fetchCriteria} className="underline font-semibold flex items-center gap-1">
                <RefreshCw size={12} /> Thử lại
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              Đang tải danh sách tiêu chí...
            </div>
          ) : filteredCriteria.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <p className="font-medium text-slate-600">Không tìm thấy tiêu chí nào.</p>
              {canManage && (
                <button 
                  onClick={handleOpenAddForm}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-semibold underline"
                >
                  + Bấm vào đây để thêm tiêu chí đầu tiên
                </button>
              )}
            </div>
          ) : (
            filteredCriteria.map((item) => (
              <div 
                key={item.id} 
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        #{item.sequence_num}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 font-mono">
                        {item.code}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {item.is_active ? 'Áp dụng' : 'Tạm ngưng'}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-800 leading-snug">
                      {item.name}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Danh sách Yêu cầu / Mức độ */}
                    {item.requirements && item.requirements.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mức độ đạt chuẩn:</p>
                        {item.requirements.map(req => (
                          <div key={req.id} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="font-semibold text-blue-700 mr-1.5">{req.code}:</span>
                            {req.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button 
                        onClick={() => handleToggleStatus(item)}
                        title={item.is_active ? 'Ngưng áp dụng' : 'Kích hoạt tiêu chí'}
                        className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded text-xs font-medium border border-slate-200 transition"
                      >
                        {item.is_active ? 'Tắt' : 'Bật'}
                      </button>
                      <button 
                        onClick={() => handleOpenEditForm(item)}
                        title="Chỉnh sửa tiêu chí"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCriterion(item.id, item.name)}
                        title="Xóa tiêu chí"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số: <strong>{criteria.length}</strong> tiêu chí</span>
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}
