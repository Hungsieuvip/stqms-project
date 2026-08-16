import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Paperclip, AlertCircle } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { Plan } from '../../types/task';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TaskModal({ isOpen, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [planId, setPlanId] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Mock fetch plans - Thay bằng API thật
      setPlans([
        { id: 'PLAN-1', title: 'Đánh giá chất lượng định kỳ năm 2026', progress: 45 },
        { id: 'PLAN-2', title: 'Bổ sung hồ sơ kiểm định ISO', progress: 10 }
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !planId || !assigneeName || !deadline) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc (*)');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('plan_id', planId);
    formData.append('assignee_name', assigneeName);
    formData.append('deadline', deadline);
    formData.append('status', 'TODO');
    if (file) formData.append('attachment', file);

    try {
      // await taskService.createTask(formData);
      setTimeout(() => { // Mock delay
        onSuccess();
        handleClose();
      }, 800);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi khi tạo nhiệm vụ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle(''); setDescription(''); setPlanId(''); setAssigneeName(''); setDeadline(''); setFile(null); setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900">Phân công Nhiệm vụ mới</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhiệm vụ *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500" placeholder="Nhập tên nhiệm vụ..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thuộc Kế hoạch *</label>
              <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500">
                <option value="">-- Chọn Kế hoạch --</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hạn chót (Deadline) *</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Người thực hiện (Phân công) *</label>
              <input type="text" value={assigneeName} onChange={(e) => setAssigneeName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500" placeholder="Nhập tên hoặc email người phụ trách..." />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500" placeholder="Hướng dẫn chi tiết công việc..."></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Đính kèm tài liệu (Tùy chọn)</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <UploadCloud size={16} /> Chọn File
                </button>
                <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                {file && <span className="text-sm text-blue-600 flex items-center gap-1"><Paperclip size={14}/> {file.name}</span>}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t flex justify-end gap-3">
            <button type="button" onClick={handleClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-100 rounded-lg">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {isSubmitting ? 'Đang lưu...' : 'Tạo nhiệm vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}