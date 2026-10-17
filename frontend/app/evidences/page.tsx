'use client';

import React, { useState, useEffect } from 'react';
import { evidenceService } from '../../services/evidenceService';
import { useAuth } from '../../contexts/AuthContext';
import EvidenceModal from '../../components/evidences/EvidenceModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { 
  FileText, Plus, Search, Filter, Trash2, Eye, 
  CheckCircle, XCircle, Download, Layers, RefreshCw,
  Clock, AlertCircle, ArrowRight, Send, History
} from 'lucide-react';

interface EvidenceItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  file_name?: string;
  file_url?: string;
  file_size?: number;
  status: string;
  created_at: string;
  uploader_name?: string;
  rejection_reason?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  criteria?: Array<{
    criteria_id: string;
    criterion?: {
      code: string;
      name: string;
    };
  }>;
}

// Vietnamese status labels matching backend state_machine.py
const STATUS_LABELS: Record<string, string> = {
  'DRAFT': 'Bản nháp',
  'SUBMITTED': 'Đã nộp',
  'NEEDS_REVISION': 'Cần chỉnh sửa',
  'PASSED': 'Đã duyệt sơ bộ',
  'REJECTED': 'Bị từ chối',
  'APPROVED': 'Đã phê duyệt',
};

export default function EvidencesPage() {
  const { user } = useAuth();
  const canManageWorkflow = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'quản trị hệ thống';
  const canUpload = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff' || user?.role === 'quản trị hệ thống';

  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal từ chối / yêu cầu chỉnh sửa
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    id: string;
    code?: string;
    name?: string;
    reason: string;
    isSubmitting: boolean;
    action: 'REJECTED' | 'NEEDS_REVISION';
  }>({
    isOpen: false,
    id: '',
    code: '',
    name: '',
    reason: '',
    isSubmitting: false,
    action: 'REJECTED',
  });

  // Review history modal
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    id: string;
    code: string;
    items: any[];
    loading: boolean;
  }>({
    isOpen: false,
    id: '',
    code: '',
    items: [],
    loading: false,
  });

  const fetchEvidences = async () => {
    setLoading(true);
    try {
      const res = await evidenceService.getEvidences({ search, status: statusFilter });
      const items = res.items || [];
      setEvidences(items);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu minh chứng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidences();
  }, [search, statusFilter]);

  const handleDelete = async () => {
    const idToDelete = deleteData.id;
    setDeleteData({ isOpen: false, id: '' });
    setEvidences(prev => prev.filter(e => e.id !== idToDelete));
    try {
      await evidenceService.deleteEvidence(idToDelete);
      alert("Đã xóa minh chứng thành công!");
      fetchEvidences();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xóa minh chứng thất bại!");
      fetchEvidences();
    }
  };

  const handleApprove = async (item: EvidenceItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn phê duyệt minh chứng "${item.code} - ${item.name || item.file_name}"?`)) {
      return;
    }
    try {
      setEvidences(prev => prev.map(e => e.id === item.id ? { ...e, status: 'APPROVED' } : e));
      await evidenceService.approveEvidence(item.id);
      alert('Đã phê duyệt minh chứng thành công!');
      fetchEvidences();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Phê duyệt thất bại. Vui lòng thử lại!');
      fetchEvidences();
    }
  };

  const handlePass = async (item: EvidenceItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn duyệt sơ bộ minh chứng "${item.code}"?`)) return;
    try {
      setEvidences(prev => prev.map(e => e.id === item.id ? { ...e, status: 'PASSED' } : e));
      await evidenceService.passEvidence(item.id);
      alert('Đã duyệt sơ bộ minh chứng thành công!');
      fetchEvidences();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Duyệt sơ bộ thất bại!');
      fetchEvidences();
    }
  };

  const handleOpenReject = (item: EvidenceItem, action: 'REJECTED' | 'NEEDS_REVISION' = 'REJECTED') => {
    setRejectModal({
      isOpen: true,
      id: item.id,
      code: item.code,
      name: item.name || item.file_name || 'Minh chứng',
      reason: '',
      isSubmitting: false,
      action: action,
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.reason || !rejectModal.reason.trim()) {
      alert('Vui lòng nhập lý do để gửi thông báo cho người tải lên!');
      return;
    }
    setRejectModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const reason = rejectModal.reason.trim();
      const newStatus = rejectModal.action;
      setEvidences(prev => prev.map(e => e.id === rejectModal.id ? { ...e, status: newStatus, rejection_reason: reason } : e));
      
      if (newStatus === 'NEEDS_REVISION') {
        await evidenceService.requestRevision(rejectModal.id, reason);
        alert('Đã yêu cầu chỉnh sửa và gửi thông báo thành công!');
      } else {
        await evidenceService.rejectEvidence(rejectModal.id, reason);
        alert('Đã từ chối minh chứng và gửi thông báo thành công!');
      }
      
      setRejectModal({ isOpen: false, id: '', code: '', name: '', reason: '', isSubmitting: false, action: 'REJECTED' });
      fetchEvidences();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Thao tác thất bại!');
      setRejectModal(prev => ({ ...prev, isSubmitting: false }));
      fetchEvidences();
    }
  };

  const handleViewHistory = async (item: EvidenceItem) => {
    setHistoryModal({ isOpen: true, id: item.id, code: item.code, items: [], loading: true });
    try {
      const res = await evidenceService.getReviewHistory(item.id);
      setHistoryModal(prev => ({ ...prev, items: res.items || [], loading: false }));
    } catch (err) {
      setHistoryModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (status: string, rejectionReason?: string) => {
    switch (status) {
      case 'APPROVED': 
        return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold inline-flex items-center gap-1"><CheckCircle size={12} /> Đã phê duyệt</span>;
      case 'REJECTED': 
        return (
          <div className="flex flex-col gap-0.5">
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-xs font-semibold inline-flex items-center gap-1"><XCircle size={12} /> Bị từ chối</span>
            {rejectionReason && <span className="text-[11px] text-rose-600 italic line-clamp-1 max-w-[160px]" title={rejectionReason}>Lý do: {rejectionReason}</span>}
          </div>
        );
      case 'NEEDS_REVISION':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold inline-flex items-center gap-1"><AlertCircle size={12} /> Cần chỉnh sửa</span>
            {rejectionReason && <span className="text-[11px] text-orange-600 italic line-clamp-1 max-w-[160px]" title={rejectionReason}>Lý do: {rejectionReason}</span>}
          </div>
        );
      case 'PASSED':
        return <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold inline-flex items-center gap-1"><CheckCircle size={12} /> Đã duyệt sơ bộ</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold inline-flex items-center gap-1"><Send size={12} /> Đã nộp</span>;
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold inline-flex items-center gap-1"><Clock size={12} /> Bản nháp</span>;
      default: 
        return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">{STATUS_LABELS[status] || status}</span>;
    }
  };

  // Xác định các action button có thể làm theo trạng thái hiện tại
  const getActionButtons = (item: EvidenceItem) => {
    const buttons: React.ReactNode[] = [];
    const status = item.status;

    // Download button (luôn hiện nếu có file)
    if (item.file_url) {
      buttons.push(
        <a key="download" href={item.file_url} target="_blank" rel="noreferrer"
          title="Tải về tệp minh chứng" 
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
          <Download size={16} />
        </a>
      );
    }

    // Review history button
    buttons.push(
      <button key="history" onClick={() => handleViewHistory(item)}
        title="Xem lịch sử duyệt"
        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer">
        <History size={16} />
      </button>
    );

    if (canManageWorkflow) {
      // SUBMITTED -> PASSED (duyệt sơ bộ)
      if (status === 'SUBMITTED') {
        buttons.push(
          <button key="pass" onClick={() => handlePass(item)}
            title="Duyệt sơ bộ"
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer">
            <CheckCircle size={16} />
          </button>
        );
        buttons.push(
          <button key="revision" onClick={() => handleOpenReject(item, 'NEEDS_REVISION')}
            title="Yêu cầu chỉnh sửa"
            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer">
            <AlertCircle size={16} />
          </button>
        );
        buttons.push(
          <button key="reject" onClick={() => handleOpenReject(item, 'REJECTED')}
            title="Từ chối minh chứng"
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
            <XCircle size={16} />
          </button>
        );
      }

      // PASSED -> APPROVED (phê duyệt cuối)
      if (status === 'PASSED') {
        buttons.push(
          <button key="approve" onClick={() => handleApprove(item)}
            title="Phê duyệt cuối cùng"
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer">
            <CheckCircle size={16} />
          </button>
        );
        buttons.push(
          <button key="reject-final" onClick={() => handleOpenReject(item, 'REJECTED')}
            title="Từ chối minh chứng"
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
            <XCircle size={16} />
          </button>
        );
      }

      // DRAFT / REJECTED -> có thể nộp (admin auto-approve)
      if (status === 'DRAFT' || status === 'REJECTED') {
        buttons.push(
          <button key="auto-approve" onClick={() => handleApprove(item)}
            title="Phê duyệt nhanh (tự động chuyển qua các bước)"
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer">
            <CheckCircle size={16} />
          </button>
        );
      }

      // Chỉ cho xóa khi DRAFT hoặc REJECTED
      if (status === 'DRAFT' || status === 'REJECTED') {
        buttons.push(
          <button key="delete" onClick={() => setDeleteData({ isOpen: true, id: item.id })}
            title="Xóa minh chứng"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer">
            <Trash2 size={16} />
          </button>
        );
      }
    }

    return buttons;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quản lý Hồ sơ & Minh chứng</h1>
          <p className="text-xs text-slate-500 mt-1">
            Lưu trữ, đính kèm tiêu chí và phê duyệt minh chứng chất lượng giáo dục.
          </p>
        </div>
        {canUpload && (
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-xs text-sm font-semibold"
          >
            <Plus size={18} /> Tải lên minh chứng
          </button>
        )}
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc mã minh chứng..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="SUBMITTED">Đã nộp</option>
            <option value="NEEDS_REVISION">Cần chỉnh sửa</option>
            <option value="PASSED">Đã duyệt sơ bộ</option>
            <option value="APPROVED">Đã phê duyệt</option>
            <option value="REJECTED">Bị từ chối</option>
          </select>
        </div>
        <button 
          onClick={fetchEvidences}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm text-slate-600 flex items-center gap-1.5"
        >
          <RefreshCw size={16} /> Tải lại
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Minh chứng</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tiêu chí</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Người nộp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Đang tải dữ liệu...</td></tr>
              ) : evidences.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Chưa có minh chứng nào.</td></tr>
              ) : (
                evidences.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg text-blue-600">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{item.code}</p>
                          {item.file_name && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]" title={item.file_name}>
                              📎 {item.file_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {item.criteria && item.criteria.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {item.criteria.map((ec, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200"
                              title={ec.criterion?.name || ''}
                            >
                              <Layers size={11} />
                              {ec.criterion?.code || 'Tiêu chí'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa gắn tiêu chí</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600">
                      <p className="font-medium text-slate-800">{item.uploader_name || 'Hệ thống'}</p>
                      <p className="text-slate-400 mt-0.5">{item.created_at ? item.created_at.substring(0, 10) : ''}</p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status, item.rejection_reason)}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {getActionButtons(item)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <EvidenceModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={fetchEvidences} 
      />
      
      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={deleteData.isOpen} 
        title="Xóa minh chứng" 
        message="Bạn có chắc chắn muốn xóa minh chứng này? Tệp đính kèm và các liên kết tiêu chí sẽ bị xóa hoàn toàn."
        onConfirm={handleDelete}
        onCancel={() => setDeleteData({ isOpen: false, id: '' })}
      />

      {/* Modal Từ chối / Yêu cầu chỉnh sửa */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${rejectModal.action === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'}`}>
                {rejectModal.action === 'REJECTED' ? <XCircle size={26} /> : <AlertCircle size={26} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {rejectModal.action === 'REJECTED' ? 'Từ chối Minh chứng' : 'Yêu cầu Chỉnh sửa'}
                </h3>
                <p className="text-xs text-slate-500">Mã: <span className="font-mono font-bold text-slate-700">{rejectModal.code}</span> — {rejectModal.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Lý do {rejectModal.action === 'REJECTED' ? 'từ chối' : 'yêu cầu chỉnh sửa'} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={rejectModal.action === 'REJECTED' 
                    ? 'Nhập chi tiết lý do từ chối (Ví dụ: Thiếu chữ ký xác nhận, ảnh mờ, không đúng năm học...)'
                    : 'Nhập chi tiết những gì cần chỉnh sửa (Ví dụ: Bổ sung thêm biên bản họp, cập nhật ngày tháng...)'}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * Lý do này sẽ được lưu vào lịch sử duyệt và gửi thông báo tự động cho người tải lên.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={rejectModal.isSubmitting}
                  onClick={() => setRejectModal({ isOpen: false, id: '', code: '', name: '', reason: '', isSubmitting: false, action: 'REJECTED' })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={rejectModal.isSubmitting}
                  onClick={handleConfirmReject}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                    rejectModal.action === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {rejectModal.isSubmitting 
                    ? 'Đang xử lý...' 
                    : rejectModal.action === 'REJECTED' 
                      ? 'Xác nhận Từ chối' 
                      : 'Yêu cầu Chỉnh sửa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lịch sử duyệt */}
      {historyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative border border-slate-100 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <History size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Lịch sử duyệt minh chứng</h3>
                  <p className="text-xs text-slate-500">Mã: <span className="font-mono font-bold">{historyModal.code}</span></p>
                </div>
              </div>
              <button onClick={() => setHistoryModal(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle size={20} />
              </button>
            </div>

            {historyModal.loading ? (
              <p className="text-sm text-slate-400 text-center py-8">Đang tải lịch sử...</p>
            ) : historyModal.items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Chưa có lịch sử duyệt nào.</p>
            ) : (
              <div className="space-y-3">
                {historyModal.items.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-shrink-0 mt-0.5">
                      <ArrowRight size={16} className="text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-500">{log.from_label}</span>
                        <ArrowRight size={12} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-800">{log.to_label}</span>
                        <span className="text-[11px] text-slate-400">bởi {log.reviewer_name}</span>
                      </div>
                      {log.reason && (
                        <p className="text-xs text-slate-600 mt-1 italic">💬 {log.reason}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
