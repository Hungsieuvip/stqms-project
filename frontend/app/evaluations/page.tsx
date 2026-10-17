'use client';

import React, { useEffect, useState } from 'react';
import { evaluationService } from '../../services/evaluationService';
import { dashboardService } from '../../services/dashboardService';
import { Search, Star, Edit, Trash2, Plus, CheckCircle2, Clock, FileDown, Printer, Award } from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [deleteData, setDeleteData] = useState({ isOpen: false, id: '', name: '' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'FINALIZED':
      case 'COMPLETED':
        return {
          label: 'Đã hoàn tất',
          className: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
        };
      case 'DRAFT':
        return {
          label: 'Bản nháp',
          className: 'bg-amber-100 text-amber-800 border border-amber-200'
        };
      case 'ONGOING':
      case 'IN_PROGRESS':
      case 'EVALUATING':
        return {
          label: 'Đang đánh giá',
          className: 'bg-blue-100 text-blue-800 border border-blue-200'
        };
      case 'APPROVED':
        return {
          label: 'Đã phê duyệt',
          className: 'bg-indigo-100 text-indigo-800 border border-indigo-200'
        };
      case 'REJECTED':
        return {
          label: 'Yêu cầu đánh giá lại',
          className: 'bg-rose-100 text-rose-800 border border-rose-200'
        };
      case 'PENDING':
        return {
          label: 'Chờ duyệt',
          className: 'bg-purple-100 text-purple-800 border border-purple-200'
        };
      default:
        return {
          label: status || 'Chưa xác định',
          className: 'bg-slate-100 text-slate-700 border border-slate-200'
        };
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await evaluationService.getEvaluations({});
      const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
      if (items.length > 0) {
        setEvaluations(items);
      } else {
        // Danh sách mẫu mặc định cho Trường Tiểu học Hợp Minh
        setEvaluations([
          { 
            id: 'E1', 
            name: 'Đánh giá nội bộ Tiêu chuẩn 1 - Năm học 2024-2025',
            standard_code: 'TC01',
            standard_name: 'Tổ chức và quản lý nhà trường',
            academic_year_name: 'Năm học 2024 - 2025',
            total_criteria: 3,
            passed_criteria: 1,
            completion_rate: 33.33,
            status: 'ONGOING' 
          },
          { 
            id: 'E2', 
            name: 'Đánh giá Tiêu chuẩn 2: Phát triển đội ngũ cán bộ, giáo viên',
            standard_code: 'TC02',
            standard_name: 'Cán bộ quản lý, giáo viên, nhân viên',
            academic_year_name: 'Năm học 2024 - 2025',
            total_criteria: 4,
            passed_criteria: 4,
            completion_rate: 100,
            status: 'COMPLETED' 
          }
        ]);
      }
    } catch (err) {
      console.warn('Could not fetch evaluations from API, using default list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await evaluationService.deleteEvaluation(id);
      setEvaluations(prev => prev.filter(e => e.id !== id));
      showToast('Đã xóa đợt đánh giá thành công.');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Không thể xóa đợt đánh giá này.');
    } finally {
      setDeleteData({ isOpen: false, id: '', name: '' });
    }
  };

  const filteredEvaluations = evaluations.filter(e => 
    (e.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (e.standard_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (e.standard_code || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (e.academic_year_name || '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-sm flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="text-blue-600" size={26} />
            Đánh giá & Chấm điểm Kiểm định
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Trường Tiểu học Hợp Minh — Theo dõi, chấm điểm và tự đánh giá chất lượng trường tiểu học theo Thông tư 17/2018/TT-BGDĐT
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => dashboardService.openReportHtml()}
            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
            title="Xem và in Báo cáo Tự đánh giá chuẩn Thông tư 17"
          >
            <Printer size={16} /> In Báo cáo TĐG
          </button>
          <button 
            onClick={() => dashboardService.downloadReportCsv()}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
            title="Tải bảng tổng hợp tiêu chuẩn & tiêu chí dạng Excel / CSV"
          >
            <FileDown size={16} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
            placeholder="Tìm kiếm theo tên đợt đánh giá, tiêu chuẩn hoặc năm học..." 
          />
        </div>
      </div>

      {/* Bảng Danh sách */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="p-4">Đợt / Tiêu chuẩn đánh giá</th>
              <th className="p-4">Năm học</th>
              <th className="p-4">Tiến độ tiêu chí</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">Đang tải danh sách đánh giá...</td>
              </tr>
            ) : filteredEvaluations.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">Không tìm thấy đợt đánh giá nào phù hợp.</td>
              </tr>
            ) : (
              filteredEvaluations.map(e => {
                const badge = getStatusBadge(e.status);
                const rate = e.completion_rate ?? (e.total_criteria ? Math.round((e.passed_criteria / e.total_criteria) * 100) : 0);
                return (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">{e.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {e.standard_code ? <strong className="text-blue-700">{e.standard_code}: </strong> : ''}
                        {e.standard_name || e.criterion_name || 'Đánh giá tiêu chuẩn kiểm định'}
                      </p>
                    </td>
                    <td className="p-4 text-slate-600 font-medium text-xs">
                      {e.academic_year_name || 'Năm học 2024 - 2025'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${rate >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                            style={{ width: `${Math.min(rate, 100)}%` }} 
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {e.passed_criteria ?? 0}/{e.total_criteria ?? 0} ({rate}%)
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      <button 
                        onClick={() => setDeleteData({ isOpen: true, id: e.id, name: e.name })} 
                        title="Xóa đợt đánh giá" 
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog 
        isOpen={deleteData.isOpen} 
        title="Xóa đợt đánh giá" 
        message={`Hành động này sẽ xóa đợt đánh giá '${deleteData.name}' và các kết quả chi tiết liên quan. Lưu ý: Không thể xóa đợt đánh giá đã được phê duyệt chính thức.`}
        onConfirm={() => handleDelete(deleteData.id)}
        onCancel={() => setDeleteData({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}
