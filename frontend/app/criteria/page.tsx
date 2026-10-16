'use client';

import React, { useEffect, useState } from 'react';
import { standardService, sortStandards, sortCriteria } from '../../services/standardService';
import { Standard, Criterion } from '../../types/standard';
import { useAuth } from '../../contexts/AuthContext';
import CriteriaDrawer from '../../components/standards/CriteriaDrawer';
import AIImportModal from '../../components/standards/AIImportModal';
import { 
  Search, Plus, Edit, Trash2, Layers, CheckCircle2, 
  XCircle, RefreshCw, Filter, BookOpen, AlertCircle, Sparkles
} from 'lucide-react';

export default function CriteriaPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedStandardId, setSelectedStandardId] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Modal & Drawer state
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [drawerStandard, setDrawerStandard] = useState<Standard | null>(null);
  const [initialAdd, setInitialAdd] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await standardService.getStandards();
      const items = Array.isArray(res) ? res : (res.items || res.data || []);
      setStandards(items);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách tiêu chuẩn và tiêu chí.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddCriteria = (std: Standard) => {
    setDrawerStandard(std);
    setInitialAdd(true);
  };

  const handleOpenViewCriteria = (std: Standard) => {
    setDrawerStandard(std);
    setInitialAdd(false);
  };

  const handleDeleteCriterion = async (crit: Criterion) => {
    if (!canManage) {
      alert('Bạn không có quyền xóa tiêu chí!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa tiêu chí "${crit.code} - ${crit.name}"?`)) {
      try {
        // Cập nhật giao diện ngay lập tức
        setStandards(prev => prev.map(std => ({
          ...std,
          criteria: (std.criteria || []).filter(c => c.id !== crit.id)
        })));
        await standardService.deleteCriterion(crit.id);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Xóa tiêu chí thất bại.');
        fetchData();
      }
    }
  };

  // Lọc bỏ tiêu chuẩn cũ thừa và sắp xếp theo đúng thứ tự TC01 -> TC04
  const activeStandards = sortStandards(
    standards.filter(std => {
      if (std.code?.startsWith('TC-')) return false;
      if (std.status === 'INACTIVE' || std.is_active === false) return false;
      return true;
    })
  ).map(std => ({
    ...std,
    criteria: sortCriteria(std.criteria || [])
  }));

  // Lọc tiêu chuẩn theo tab
  const displayedStandards = activeStandards.filter(std => {
    if (selectedStandardId !== 'ALL' && std.id !== selectedStandardId) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs">
              <Layers size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Danh mục Tiêu chí & Yêu cầu Đảm bảo Chất lượng
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Trường Tiểu học Hợp Minh — Theo dõi chỉ số phủ minh chứng và mức độ đạt chuẩn theo Thông tư 57/2026/TT-BGDĐT
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-64 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm theo mã hoặc tên tiêu chí..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button 
            onClick={fetchData} 
            title="Làm mới" 
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {canManage && (
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white rounded-lg transition shadow-xs text-xs font-semibold cursor-pointer whitespace-nowrap"
              title="Tự động phân tích và nạp Tiêu chí từ Thông tư 57 hoặc văn bản quy phạm"
            >
              <Sparkles size={15} className="animate-pulse" />
              <span>Thêm nhanh bằng AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Standard Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        <button
          onClick={() => setSelectedStandardId('ALL')}
          className={`px-3.5 py-2 font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
            selectedStandardId === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Tất cả Tiêu chuẩn ({activeStandards.length})
        </button>
        {activeStandards.map(std => (
          <button
            key={std.id}
            onClick={() => setSelectedStandardId(std.id)}
            className={`px-3 py-2 font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              selectedStandardId === std.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {std.code}: {std.name.length > 28 ? std.name.slice(0, 28) + '...' : std.name} ({(std.criteria || []).length})
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="underline font-semibold cursor-pointer">Thử lại</button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
          <RefreshCw className="animate-spin mx-auto mb-2 text-blue-600" size={28} />
          Đang tải danh mục tiêu chí & yêu cầu...
        </div>
      ) : displayedStandards.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-200">
          <Layers size={36} className="mx-auto mb-2 opacity-30" />
          <p className="font-semibold text-slate-700">Không tìm thấy tiêu chí nào phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedStandards.map(std => {
            const filteredCriteria = (std.criteria || []).filter(c => 
              c.name.toLowerCase().includes(searchText.toLowerCase()) ||
              c.code.toLowerCase().includes(searchText.toLowerCase()) ||
              (c.description && c.description.toLowerCase().includes(searchText.toLowerCase()))
            );

            if (searchText && filteredCriteria.length === 0) return null;

            return (
              <div 
                key={std.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Standard Header */}
                <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-xs border border-blue-200">
                        {std.code}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">
                        {std.name}
                      </h2>
                    </div>
                    {std.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{std.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canManage && (
                      <button
                        onClick={() => handleOpenAddCriteria(std)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <Plus size={15} />
                        Thêm Tiêu chí
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenViewCriteria(std)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Quản lý chi tiết
                    </button>
                  </div>
                </div>

                {/* Criteria Grid / Table */}
                <div className="p-4 space-y-3">
                  {filteredCriteria.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                      Không có tiêu chí nào trong tiêu chuẩn này.
                    </div>
                  ) : (
                    filteredCriteria.map(crit => (
                      <div 
                        key={crit.id}
                        className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                                #{crit.sequence_num}
                              </span>
                              <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 font-mono">
                                {crit.code}
                              </span>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                crit.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {crit.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                {crit.is_active ? 'Đang áp dụng' : 'Tạm ngưng'}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900">
                              {crit.name}
                            </h4>

                            {crit.description && (
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {crit.description}
                              </p>
                            )}

                            {/* Requirements (Mức 1, Mức 2) */}
                            {crit.requirements && crit.requirements.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Nội dung và mức độ đáp ứng:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {crit.requirements.map(req => (
                                    <div 
                                      key={req.id} 
                                      className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700"
                                    >
                                      <span className="font-bold text-blue-700 mr-1.5">
                                        {req.code}:
                                      </span>
                                      <span>{req.description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {canManage && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenViewCriteria(std)}
                                title="Sửa tiêu chí"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCriterion(crit)}
                                title="Xóa tiêu chí"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
              </div>
            );
          })}
        </div>
      )}

      {/* Criteria Drawer */}
      {drawerStandard && (
        <CriteriaDrawer 
          standard={drawerStandard}
          isOpen={!!drawerStandard}
          initialAdd={initialAdd}
          onClose={() => {
            setDrawerStandard(null);
            setInitialAdd(false);
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
        }}
      />
    </div>
  );
}
