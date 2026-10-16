'use client';

import React, { useEffect, useState } from 'react';
import { evaluationService } from '../../services/evaluationService';
import { Search, Star, Edit, Trash2, Plus, CheckCircle2, Clock } from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [deleteData, setDeleteData] = useState({ isOpen: false, id: '' });

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
        // Dữ liệu mẫu chuẩn tiếng Việt theo Thông tư 57 cho Trường Tiểu học Hợp Minh
        setEvaluations([
          { 
            id: 'E1', 
            criterion_name: 'Tiêu chí 1.1: Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển', 
            score: 8, 
            comments: 'Đạt yêu cầu tốt theo Thông tư 57/2026/TT-BGDĐT', 
            evaluator_name: 'Quản trị viên', 
            status: 'FINALIZED' 
          },
          { 
            id: 'E2', 
            criterion_name: 'Tiêu chí 1.2: Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ', 
            score: 7, 
            comments: 'Cần hoàn thiện quyết định kiện toàn các tổ khối chuyên môn', 
            evaluator_name: 'Quản trị viên', 
            status: 'DRAFT' 
          },
          { 
            id: 'E3', 
            criterion_name: 'Tiêu chí 2.1: Kế hoạch và quy hoạch phát triển đội ngũ', 
            score: 9, 
            comments: 'Hồ sơ đầy đủ, đáp ứng tốt mức độ 2', 
            evaluator_name: 'Hội đồng đánh giá', 
            status: 'APPROVED' 
          }
        ]);
      }
    } catch (err) {
      console.warn('Could not fetch evaluations from API, using default list:', err);
      setEvaluations([
        { 
          id: 'E1', 
          criterion_name: 'Tiêu chí 1.1: Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển', 
          score: 8, 
          comments: 'Đạt yêu cầu tốt theo Thông tư 57/2026/TT-BGDĐT', 
          evaluator_name: 'Quản trị viên', 
          status: 'FINALIZED' 
        },
        { 
          id: 'E2', 
          criterion_name: 'Tiêu chí 1.2: Cơ cấu tổ chức, phân công nhiệm vụ và phối hợp nội bộ', 
          score: 7, 
          comments: 'Cần hoàn thiện quyết định kiện toàn các tổ khối chuyên môn', 
          evaluator_name: 'Quản trị viên', 
          status: 'DRAFT' 
        },
        { 
          id: 'E3', 
          criterion_name: 'Tiêu chí 2.1: Kế hoạch và quy hoạch phát triển đội ngũ', 
          score: 9, 
          comments: 'Hồ sơ đầy đủ, đáp ứng tốt mức độ 2', 
          evaluator_name: 'Hội đồng đánh giá', 
          status: 'APPROVED' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = (id: string) => {
    setEvaluations(prev => prev.filter(e => e.id !== id));
    setDeleteData({ isOpen: false, id: '' });
  };

  const filteredEvaluations = evaluations.filter(e => 
    (e.criterion_name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (e.comments || '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách Đánh giá & Chấm điểm</h1>
          <p className="text-xs text-slate-500 mt-1">
            Trường Tiểu học Hợp Minh — Theo dõi, chấm điểm và đánh giá mức độ đạt chuẩn từng tiêu chí theo Thông tư 57
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold shadow-xs cursor-pointer">
          <Plus size={18} /> Tạo đánh giá mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
            placeholder="Tìm kiếm theo tên tiêu chí hoặc nhận xét..." 
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="p-4">Tiêu chí đánh giá</th>
              <th className="p-4">Điểm số</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">Đang tải dữ liệu đánh giá...</td>
              </tr>
            ) : filteredEvaluations.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">Không tìm thấy kết quả đánh giá nào phù hợp.</td>
              </tr>
            ) : (
              filteredEvaluations.map(e => {
                const badge = getStatusBadge(e.status);
                return (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">{e.criterion_name}</p>
                      {e.comments && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{e.comments}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
                        <Star size={14} fill="currentColor" /> {e.score} / 10
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block ${badge.className}`}>

                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      <button title="Chỉnh sửa" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer">
                        <Edit size={16}/>
                      </button>
                      <button 
                        onClick={() => setDeleteData({ isOpen: true, id: e.id })} 
                        title="Xóa" 
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
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
        title="Xóa đánh giá" 
        message="Hành động này sẽ xóa bài đánh giá này khỏi danh sách."
        onConfirm={() => handleDelete(deleteData.id)}
        onCancel={() => setDeleteData({ isOpen: false, id: '' })}
      />
    </div>
  );
}
