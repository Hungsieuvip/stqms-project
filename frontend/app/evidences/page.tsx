'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Eye, CheckCircle, XCircle, Trash2, FileText } from 'lucide-react';
import { evidenceService } from '../../services/evidenceService';
import { Evidence } from '../../types/evidence';
import EvidenceModal from '../../components/evidences/EvidenceModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';

export default function EvidencesPage() {
  const { user } = useAuth(); // Để check quyền duyệt (Workflow)
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean, id: string }>({ isOpen: false, id: '' });

  const fetchEvidences = async () => {
    setLoading(true);
    try {
      // Mock API call - Thay bằng API thật khi Backend sẵn sàng
      // const res = await evidenceService.getEvidences({ search, status: statusFilter, page: 1, size: 10 });
      // setEvidences(res.items);
      
      // Dữ liệu Mock để bạn thấy giao diện ngay
      setTimeout(() => {
        setEvidences([
          { id: '1', title: 'Quyết định bổ nhiệm Ban giám đốc', file_name: 'QD_01.pdf', file_url: '#', file_size: 1024000, file_type: 'application/pdf', status: 'APPROVED', created_at: '2026-08-15', uploader_name: 'Phan Mạnh Hùng' },
          { id: '2', title: 'Danh sách sinh viên tốt nghiệp 2026', file_name: 'DS_2026.xlsx', file_url: '#', file_size: 500000, file_type: 'application/vnd.ms-excel', status: 'PENDING', created_at: '2026-08-14', uploader_name: 'Admin' }
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidences();
  }, [search, statusFilter]);

  // Xử lý Xóa
  const handleDelete = async () => {
    try {
      await evidenceService.deleteEvidence(deleteData.id);
      setEvidences(evidences.filter(e => e.id !== deleteData.id));
      alert("Đã xóa thành công!"); // Có thể thay bằng thư viện react-hot-toast
    } catch (err) {
      alert("Xóa thất bại!");
    } finally {
      setDeleteData({ isOpen: false, id: '' });
    }
  };

  // Workflow Action (Chỉ Admin/Manager được duyệt)
  const handleWorkflow = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await evidenceService.updateStatus(id, status);
      fetchEvidences(); // Reload data
    } catch (err) {
      alert("Cập nhật trạng thái thất bại.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Đã duyệt</span>;
      case 'REJECTED': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Từ chối</span>;
      default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Chờ duyệt</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Hồ sơ & Minh chứng</h1>
          <p className="text-gray-500 text-sm">Quản lý tài liệu, upload và phê duyệt luồng công việc.</p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} /> Tải lên minh chứng
        </button>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên minh chứng..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="relative w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 appearance-none bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <th className="p-4 font-semibold">Tên minh chứng / File</th>
              <th className="p-4 font-semibold">Người tải lên</th>
              <th className="p-4 font-semibold">Trạng thái (Workflow)</th>
              <th className="p-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
            ) : evidences.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Không tìm thấy minh chứng nào. Hãy tải lên!</p>
                </td>
              </tr>
            ) : (
              evidences.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                      <FileText size={14} /> {item.file_name} ({(item.file_size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <p>{item.uploader_name}</p>
                    <p className="text-xs text-gray-400">{item.created_at}</p>
                  </td>
                  <td className="p-4">{getStatusBadge(item.status)}</td>
                  <td className="p-4 flex items-center justify-end gap-2">
                    {/* Xem trước */}
                    <button title="Xem trước file" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye size={18} />
                    </button>
                    
                    {/* Nút duyệt Workflow (Chỉ hiện khi PENDING và user là admin) */}
                    {item.status === 'PENDING' && (user?.role === 'admin' || user?.role === 'manager') && (
                      <>
                        <button onClick={() => handleWorkflow(item.id, 'APPROVED')} title="Duyệt" className="p-2 text-green-500 hover:bg-green-50 rounded-lg"><CheckCircle size={18} /></button>
                        <button onClick={() => handleWorkflow(item.id, 'REJECTED')} title="Từ chối" className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg"><XCircle size={18} /></button>
                      </>
                    )}

                    <button onClick={() => setDeleteData({ isOpen: true, id: item.id })} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <EvidenceModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onSuccess={fetchEvidences} />
      
      <ConfirmDialog 
        isOpen={deleteData.isOpen} 
        title="Xóa minh chứng" 
        message="Bạn có chắc chắn muốn xóa minh chứng này? Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        onCancel={() => setDeleteData({ isOpen: false, id: '' })}
      />
    </div>
  );
}