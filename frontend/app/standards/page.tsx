'use client';

import React, { useEffect, useState } from 'react';
import { standardService } from '../../services/standardService';
import { Standard } from '../../types/standard';
import StandardModal from '../../components/standards/StandardModal';
import CriteriaDrawer from '../../components/standards/CriteriaDrawer';
import { Search, Plus, Edit, Trash2, Layers } from 'lucide-react';

export default function StandardsPage() {
  const [data, setData] = useState<Standard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Standard | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await standardService.getStandards();
      const items = Array.isArray(res) ? res : (res.items || res.data || []);
      setData(items);
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu tiêu chuẩn. Vui lòng kiểm tra kết nối!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tiêu chuẩn này? Hệ thống sẽ xóa luôn các Tiêu chí con.')) {
      try {
        await standardService.deleteStandard(id);
        alert('Đã xóa tiêu chuẩn thành công');
        fetchData();
      } catch (err) {
        alert('Xóa thất bại. Vui lòng thử lại sau.');
      }
    }
  };

  // Filter & Sorting (Client-side)
  const filteredData = data
    .filter(item => 
      item.name?.toLowerCase().includes(searchText.toLowerCase()) || 
      item.code?.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-800">Quản lý Bộ Tiêu Chuẩn</h1>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Thêm Tiêu chuẩn
          </button>
        </div>

        {/* Toolbar: Search */}
        <div className="p-5 bg-gray-50 border-b border-gray-100">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hoặc tên..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">
            {error} <button onClick={fetchData} className="underline font-medium">Thử lại</button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã TC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên tiêu chuẩn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Không có dữ liệu</td></tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={item.name}>{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_active ? 'Đang áp dụng' : 'Ngưng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button title="Quản lý Tiêu chí" onClick={() => setSelectedStandard(item)} className="text-indigo-600 hover:text-indigo-900">
                          <Layers size={18} />
                        </button>
                        <button title="Chỉnh sửa" onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-amber-500 hover:text-amber-700">
                          <Edit size={18} />
                        </button>
                        <button title="Xóa" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Drawers */}
      <StandardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} editingItem={editingItem} />
      {selectedStandard && (
        <CriteriaDrawer standard={selectedStandard} isOpen={!!selectedStandard} onClose={() => setSelectedStandard(null)} />
      )}
    </div>
  );
}