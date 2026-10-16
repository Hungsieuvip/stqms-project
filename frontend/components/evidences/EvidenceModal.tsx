'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, FileText, AlertCircle, Plus, FileCheck, Layers } from 'lucide-react';
import { evidenceService } from '../../services/evidenceService';
import { standardService } from '../../services/standardService';
import { Standard, Criterion } from '../../types/standard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AttachedCriterion {
  standardCode: string;
  criterionId: string;
  criterionCode: string;
  criterionName: string;
}

export default function EvidenceModal({ isOpen, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Danh mục tiêu chuẩn & tiêu chí
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedStandardId, setSelectedStandardId] = useState<string>('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>('');
  const [attachedCriteria, setAttachedCriteria] = useState<AttachedCriterion[]>([]);

  // Tải danh sách bộ tiêu chuẩn khi mở modal (Chỉ lấy tiêu chuẩn ACTIVE hợp lệ)
  useEffect(() => {
    if (isOpen) {
      setError('');
      setProgress(0);
      standardService.getStandards().then((res) => {
        const items: any[] = Array.isArray(res) ? res : ((res as any)?.items || (res as any)?.data || []);
        // Lọc nghiêm ngặt chỉ lấy các tiêu chuẩn ACTIVE (TC01 -> TC04), loại bỏ hoàn toàn TC- và tiêu chuẩn rác
        const activeItems = items.filter((s: any) => 
          (s.status === 'ACTIVE' || s.is_active !== false) && 
          !s.code?.startsWith('TC-') && 
          !s.code?.startsWith('TC_TEST') && 
          !s.code?.startsWith('TC9')
        );
        setStandards(activeItems);
        if (activeItems.length > 0) {
          setSelectedStandardId(activeItems[0].id);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  // Tải tiêu chí khi chọn tiêu chuẩn
  useEffect(() => {
    if (selectedStandardId) {
      standardService.getCriteria({ standard_id: selectedStandardId }).then((res) => {
        const items: any[] = Array.isArray(res) ? res : ((res as any)?.items || (res as any)?.data || []);
        setCriteria(items);
        if (items.length > 0) {
          setSelectedCriterionId(items[0].id);
        } else {
          setSelectedCriterionId('');
        }
      }).catch(console.error);
    } else {
      setCriteria([]);
      setSelectedCriterionId('');
    }
  }, [selectedStandardId]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError('');
    if (selected) {
      if (selected.size > 50 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 50MB.');
        return;
      }
      setFile(selected);
      if (!title.trim()) {
        const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleAddCriterion = () => {
    if (!selectedCriterionId) {
      alert('Vui lòng chọn tiêu chí để đính kèm.');
      return;
    }

    const currentStd = standards.find(s => s.id === selectedStandardId);
    const currentCrit = criteria.find(c => c.id === selectedCriterionId);

    if (!currentCrit) return;

    // Tránh trùng lặp
    if (attachedCriteria.some(item => item.criterionId === selectedCriterionId)) {
      alert('Tiêu chí này đã được gắn vào minh chứng.');
      return;
    }

    setAttachedCriteria([
      ...attachedCriteria,
      {
        standardCode: currentStd?.code || 'TC',
        criterionId: currentCrit.id,
        criterionCode: currentCrit.code,
        criterionName: currentCrit.name
      }
    ]);
  };

  const handleRemoveCriterion = (critId: string) => {
    setAttachedCriteria(attachedCriteria.filter(item => item.criterionId !== critId));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Vui lòng chọn tệp minh chứng cần tải lên.');
      return;
    }
    if (!title.trim()) {
      setError('Vui lòng nhập tên minh chứng.');
      return;
    }

    setIsUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('file', file);

    const criteriaIds = attachedCriteria.map(c => c.criterionId);
    if (criteriaIds.length > 0) {
      formData.append('criteria_ids', JSON.stringify(criteriaIds));
      formData.append('primary_criteria_id', criteriaIds[0]);
    }

    try {
      await evidenceService.uploadEvidence(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setProgress(percentCompleted);
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Có lỗi xảy ra khi tải lên minh chứng.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setProgress(0);
    setError('');
    setAttachedCriteria([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <UploadCloud size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tải lên Hồ sơ & Minh chứng mới</h3>
          </div>
          <button 
            onClick={handleClose} 
            disabled={isUploading} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpload} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Drag & Drop File Zone */}
          <div 
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
              file ? 'border-blue-500 bg-blue-50/40' : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
            }`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip" 
              disabled={isUploading} 
            />
            
            {!file ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                  <UploadCloud size={22} />
                </div>
                <p className="text-sm font-semibold text-slate-700">Chọn tệp minh chứng từ máy tính</p>
                <p className="text-xs text-slate-500 mt-1">
                  Hỗ trợ: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PPTX, JPG, PNG, ZIP (Tối đa 50MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-3 border border-blue-200 rounded-lg shadow-xs">
                <div className="flex items-center gap-3 overflow-hidden text-left">
                  <FileText className="text-blue-600 shrink-0" size={24} />
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                {!isUploading && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }} 
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tên minh chứng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tên minh chứng <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              required
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
              placeholder="VD: Quyết định ban hành sứ mạng và mục tiêu đào tạo K2024" 
            />
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mô tả chi tiết / Ghi chú
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              rows={2}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
              placeholder="Ghi chú thêm về nội dung, văn bản liên quan..." 
            />
          </div>

          {/* Gắn vào Tiêu chí & Yêu cầu (Đa tiêu chí) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={16} className="text-blue-600" />
              <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Gắn vào Tiêu chí & Yêu cầu (Đa tiêu chí)
              </label>
            </div>

            {/* Chọn Tiêu chuẩn & Tiêu chí cụ thể */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    1. Chọn Tiêu chuẩn:
                  </label>
                  <select
                    value={selectedStandardId}
                    onChange={(e) => setSelectedStandardId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 truncate"
                  >
                    {standards.map(std => (
                      <option key={std.id} value={std.id}>
                        {std.code} - {std.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    2. Chọn Tiêu chí:
                  </label>
                  <select
                    value={selectedCriterionId}
                    onChange={(e) => setSelectedCriterionId(e.target.value)}
                    disabled={criteria.length === 0}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 truncate"
                  >
                    {criteria.length === 0 ? (
                      <option value="">(Không có tiêu chí)</option>
                    ) : (
                      criteria.map(crit => (
                        <option key={crit.id} value={crit.id}>
                          {crit.code} - {crit.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  disabled={!selectedCriterionId}
                  className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-300 rounded-md text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                >
                  <Plus size={14} />
                  Thêm tiêu chí
                </button>
              </div>
            </div>

            {/* Danh sách tiêu chí đã gắn */}
            {attachedCriteria.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-[11px] font-medium text-slate-500">
                  Đã gắn vào {attachedCriteria.length} tiêu chí:
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {attachedCriteria.map(item => (
                    <div 
                      key={item.criterionId}
                      className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-xs"
                    >
                      <FileCheck size={14} className="shrink-0 text-blue-600" />
                      <span className="font-bold">{item.criterionCode}</span>: 
                      <span className="truncate max-w-[200px]" title={item.criterionName}>{item.criterionName}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCriterion(item.criterionId)}
                        className="text-blue-400 hover:text-red-500 ml-1 p-0.5 rounded"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-sm text-red-600 rounded-lg">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="pt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Đang tải lên máy chủ...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={handleClose} 
              disabled={isUploading} 
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isUploading || !file} 
              className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {isUploading ? 'Đang tải lên...' : 'Lưu & Tải lên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
