'use client';

import React, { useState, useEffect } from 'react';
import { evidenceService } from '../../services/evidenceService';
import { useAuth } from '../../contexts/AuthContext';
import EvidenceModal from '../../components/evidences/EvidenceModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { 
  FileText, Plus, Search, Filter, Trash2, Eye, 
  CheckCircle, XCircle, Download, Layers, RefreshCw 
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
  criteria?: Array<{
    criteria_id: string;
    criterion?: {
      code: string;
      name: string;
    };
  }>;
}

export default function EvidencesPage() {
  const { user } = useAuth();
  const canManageWorkflow = user?.role === 'admin' || user?.role === 'manager';
  const canUpload = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff';

  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
    try {
      await evidenceService.deleteEvidence(deleteData.id);
      setEvidences(evidences.filter(e => e.id !== deleteData.id));
      alert("Đã xóa minh chứng thành công!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xóa minh chứng thất bại!");
    } finally {
      setDeleteData({ isOpen: false, id: '' });
    }
  };

  const handleWorkflow = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await evidenceService.updateStatus(id, status);
      fetchEvidences();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Cập nhật trạng thái thất bại.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': 
        return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">Đã duyệt</span>;
      case 'REJECTED': 
        return <span className="px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Từ chối</span>;
      default: 
        return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">Chờ duyệt</span>;
    }
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
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
        <button 
          onClick={fetchEvidences}
          title="Làm mới danh sách"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition self-end sm:self-center"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left divide-y divide-slate-200">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Mã / Tên minh chứng</th>
                <th className="px-6 py-3.5">Tiêu chí liên kết</th>
                <th className="px-6 py-3.5">Người tải lên</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Đang tải danh sách minh chứng...
                  </td>
                </tr>
              ) : evidences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <FileText size={40} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-slate-600">Chưa có hồ sơ minh chứng nào.</p>
                    {canUpload && (
                      <button 
                        onClick={() => setIsUploadOpen(true)}
                        className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-semibold underline"
                      >
                        + Bấm vào đây để tải lên minh chứng đầu tiên
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                evidences.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.code}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                      {item.file_name && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <FileText size={13} className="text-blue-500" />
                          <span className="truncate max-w-xs">{item.file_name}</span>
                          {item.file_size && (
                            <span>({(item.file_size / 1024 / 1024).toFixed(2)} MB)</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Cột Tiêu chí liên kết */}
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
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.file_url && (
                          <a 
                            href={item.file_url} 
                            target="_blank" 
                            rel="noreferrer"
                            title="Tải về tệp minh chứng" 
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Download size={16} />
                          </a>
                        )}

                        {/* Duyệt minh chứng */}
                        {canManageWorkflow && (
                          <>
                            {item.status !== 'APPROVED' && (
                              <button 
                                onClick={() => handleWorkflow(item.id, 'APPROVED')} 
                                title="Phê duyệt minh chứng" 
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {item.status !== 'REJECTED' && (
                              <button 
                                onClick={() => handleWorkflow(item.id, 'REJECTED')} 
                                title="Từ chối minh chứng" 
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                          </>
                        )}

                        {canManageWorkflow && (
                          <button 
                            onClick={() => setDeleteData({ isOpen: true, id: item.id })} 
                            title="Xóa minh chứng"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
    </div>
  );
}
