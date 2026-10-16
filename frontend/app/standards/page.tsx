'use client';

import React, { useEffect, useState } from 'react';
import { standardService } from '../../services/standardService';
import { Standard, Criterion } from '../../types/standard';
import { useAuth } from '../../contexts/AuthContext';
import StandardModal from '../../components/standards/StandardModal';
import CriteriaDrawer from '../../components/standards/CriteriaDrawer';
import AIImportModal from '../../components/standards/AIImportModal';
import { 
  Search, Plus, Edit, Trash2, Layers, ChevronDown, ChevronRight, 
  CheckCircle2, XCircle, RefreshCw, Calendar, FileText, Info, Sparkles
} from 'lucide-react';

export default function StandardsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [data, setData] = useState<Standard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Quản lý trạng thái mở rộng từng tiêu chuẩn (Accordion)
  const [expandedStandardIds, setExpandedStandardIds] = useState<Record<string, boolean>>({});

  // Toast alert
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ 
    show: false, 
    msg: '', 
    type: 'success' 
  });
  
  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Standard | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [isInitialAddCriteria, setIsInitialAddCriteria] = useState<boolean>(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await standardService.getStandards();
      const items = Array.isArray(res) ? res : (res.items || res.data || []);
      setData(items);
      // Mặc định mở rộng tất cả các tiêu chuẩn để dễ theo dõi
      const expMap: Record<string, boolean> = {};
      items.forEach((item: Standard) => {
        expMap[item.id] = true;
      });
      setExpandedStandardIds(expMap);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải dữ liệu tiêu chuẩn. Vui lòng kiểm tra kết nối!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedStandardIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleEditStandard = (item: Standard) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteStandard = async (item: Standard) => {
    if (!canManage) {
      alert('Bạn không có quyền xóa tiêu chuẩn!');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ tiêu chuẩn "${item.code} - ${item.name}"? Hệ thống sẽ xóa toàn bộ Tiêu chí con liên quan.`)) {
      try {
        await standardService.deleteStandard(item.id);
        showToast('Đã xóa bộ tiêu chuẩn thành công!');
        fetchData();
      } catch (err: any) {
        showToast(err.response?.data?.detail || 'Xóa thất bại. Vui lòng thử lại sau.', 'error');
      }
    }
  };

  const handleDeleteCriterion = async (crit: Criterion) => {
    if (!canManage) {
      alert('Bạn không có quyền xóa tiêu chí!');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa tiêu chí "${crit.code} - ${crit.name}"?`)) {
      try {
        await standardService.deleteCriterion(crit.id);
        showToast('Đã xóa tiêu chí thành công!');
        fetchData();
      } catch (err: any) {
        showToast(err.response?.data?.detail || 'Xóa tiêu chí thất bại. Vui lòng thử lại sau.', 'error');
      }
    }
  };

  const handleOpenAddCriteria = (standard: Standard) => {
    setSelectedStandard(standard);
    setIsInitialAddCriteria(true);
  };

  const handleOpenViewCriteria = (standard: Standard) => {
    setSelectedStandard(standard);
    setIsInitialAddCriteria(false);
  };

  // Lọc dữ liệu client-side (Ẩn các tiêu chuẩn INACTIVE)
  const filteredData = data.filter(item => {
    if ((item as any).status === 'INACTIVE' || item.is_active === false) return false;

    const matchStd = item.name?.toLowerCase().includes(searchText.toLowerCase()) || 
                     item.code?.toLowerCase().includes(searchText.toLowerCase());
    const matchCrit = item.criteria?.some(c => 
      c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchText.toLowerCase())
    );
    return matchStd || matchCrit;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-xl z-50 text-white text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800">
                Danh mục Tiêu chuẩn & Tiêu chí Đảm bảo Chất lượng
              </h1>
              {!canManage ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Chế độ xem (Chỉ đọc)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  Quyền Quản trị viên
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Trường Tiểu học Hợp Minh — Hệ thống tiêu chuẩn kiểm định chất lượng theo Thông tư 57/2026/TT-BGDĐT. Quản lý, chuẩn hóa tiêu chuẩn và gắn tiêu chí minh chứng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchData}
              title="Làm mới dữ liệu"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition border border-slate-200 cursor-pointer"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            {canManage && (
              <>
                <button 
                  onClick={() => setIsAIModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white rounded-lg transition shadow-xs text-sm font-semibold cursor-pointer"
                  title="Tự động phân tích và nhập Tiêu chuẩn từ Thông tư 57 hoặc văn bản quy phạm"
                >
                  <Sparkles size={17} className="animate-pulse" />
                  <span>Thêm nhanh bằng AI</span>
                </button>

                <button 
                  onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs text-sm font-semibold cursor-pointer"
                >
                  <Plus size={18} />
                  Thêm Tiêu chuẩn
                </button>
              </>
            )}
          </div>
        </div>

        {/* Toolbar: Search */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
              placeholder="Tìm kiếm theo mã, tên tiêu chuẩn hoặc tiêu chí con..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <b>{filteredData.length}</b> tiêu chuẩn
          </div>
        </div>

        {/* List of Standards with Accordion Criteria */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <RefreshCw className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-500" />
              Đang tải danh sách tiêu chuẩn...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <Layers className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              Không tìm thấy tiêu chuẩn nào phù hợp.
            </div>
          ) : (
            filteredData.map((std) => {
              const isExpanded = !!expandedStandardIds[std.id];
              const criteriaList = std.criteria || [];

              return (
                <div key={std.id} className="transition">
                  {/* Standard Header Row */}
                  <div className="p-4 bg-slate-50/40 hover:bg-slate-50/90 transition flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button 
                        onClick={() => toggleExpand(std.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-mono font-bold text-xs rounded-md">
                          {std.code}
                        </span>
                        <h3 
                          onClick={() => toggleExpand(std.id)}
                          className="font-bold text-slate-900 text-sm cursor-pointer hover:text-blue-600 transition truncate"
                        >
                          {std.name}
                        </h3>
                      </div>
                      {std.issued_date && (
                        <span className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar size={12} />
                          {std.issued_date}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 font-medium">
                        {criteriaList.length} tiêu chí
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleEditStandard(std)}
                            title="Sửa thông tin Tiêu chuẩn"
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteStandard(std)}
                            title="Xóa Tiêu chuẩn"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded Nested Criteria Table */}
                  {isExpanded && (
                    <div className="p-4 bg-white space-y-3">
                      {criteriaList.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                          <p>Tiêu chuẩn này chưa có tiêu chí nào.</p>
                          {canManage && (
                            <button
                              onClick={() => handleOpenAddCriteria(std)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold underline cursor-pointer"
                            >
                              + Thêm tiêu chí đầu tiên vào {std.code}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-100 rounded-lg">
                          <table className="w-full text-left divide-y divide-slate-100 text-xs">
                            <thead className="bg-slate-50/60 font-semibold text-slate-500 uppercase tracking-wider">
                              <tr>
                                <th className="px-4 py-2.5 w-16">STT</th>
                                <th className="px-4 py-2.5 w-24">Mã TC</th>
                                <th className="px-4 py-2.5">Tên tiêu chí & Nội dung yêu cầu</th>
                                <th className="px-4 py-2.5 w-28">Trạng thái</th>
                                <th className="px-4 py-2.5 w-32 text-right">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {criteriaList.map((crit, idx) => (
                                <tr key={crit.id} className="hover:bg-slate-50/70 transition">
                                  <td className="px-4 py-3 text-slate-400 font-medium font-mono">
                                    #{crit.sequence_num || (idx + 1)}
                                  </td>
                                  <td className="px-4 py-3 font-mono font-bold text-blue-700">
                                    {crit.code}
                                  </td>
                                  <td className="px-4 py-3 text-slate-800">
                                    <p className="font-semibold text-slate-900 text-[13px]">{crit.name}</p>
                                    {crit.description && (
                                      <p className="text-slate-500 text-xs mt-0.5">{crit.description}</p>
                                    )}
                                    {crit.requirements && crit.requirements.length > 0 && (
                                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {crit.requirements.map(req => (
                                          <span 
                                            key={req.id} 
                                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] border border-slate-200"
                                            title={req.description}
                                          >
                                            {req.code}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      crit.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {crit.is_active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                                      {crit.is_active ? 'Áp dụng' : 'Tạm ngưng'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    {canManage ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => handleOpenViewCriteria(std)}
                                          title="Chỉnh sửa chi tiết tiêu chí"
                                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                        >
                                          <Edit size={15} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCriterion(crit)}
                                          title="Xóa tiêu chí này"
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">Chỉ xem</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Quick Add Criterion Button inside standard */}
                      {canManage && (
                        <div className="pt-1 flex justify-start">
                          <button
                            onClick={() => handleOpenAddCriteria(std)}
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 hover:bg-blue-50 rounded transition cursor-pointer"
                          >
                            <Plus size={14} />
                            Thêm tiêu chí mới vào {std.code}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals & Drawers */}
      <StandardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          fetchData();
          showToast(editingItem ? 'Cập nhật tiêu chuẩn thành công!' : 'Tạo mới tiêu chuẩn thành công!');
        }} 
        editingItem={editingItem} 
      />
      
      {selectedStandard && (
        <CriteriaDrawer 
          standard={selectedStandard} 
          isOpen={!!selectedStandard} 
          initialAdd={isInitialAddCriteria}
          onClose={() => {
            setSelectedStandard(null);
            setIsInitialAddCriteria(false);
            fetchData();
          }} 
        />
      )}

      {/* AI Rapid Import Modal */}
      <AIImportModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={() => {
          fetchData();
          showToast('Đã nạp và cập nhật danh mục Tiêu chuẩn & Tiêu chí thành công!');
        }}
      />
    </div>
  );
}
