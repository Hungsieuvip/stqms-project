'use client';

import React, { useEffect, useState } from 'react';
import { evaluationService } from '../../services/evaluationService';
import { Search, Filter, Star, Edit, Trash2, Plus } from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteData, setDeleteData] = useState({ isOpen: false, id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gọi API thực tế
      // const data = await evaluationService.getEvaluations({});
      // setEvaluations(data);
      
      // Mock data
      setTimeout(() => {
        setEvaluations([
          { id: 'E1', criterion_name: 'Tiêu chí 1.1: Cơ sở vật chất', score: 8, comments: 'Đạt yêu cầu tốt', evaluator_name: 'Admin', status: 'FINALIZED' },
          { id: 'E2', criterion_name: 'Tiêu chí 1.2: Đội ngũ giảng viên', score: 7, comments: 'Cần bổ sung thêm bằng cấp', evaluator_name: 'Admin', status: 'DRAFT' }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Danh sách Đánh giá</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} /> Tạo đánh giá mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Tìm kiếm tiêu chí..." />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b text-sm text-gray-600">
            <tr>
              <th className="p-4">Tiêu chí</th>
              <th className="p-4">Điểm số</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map(e => (
              <tr key={e.id} className="border-b">
                <td className="p-4 font-medium">{e.criterion_name}</td>
                <td className="p-4 flex items-center gap-1 text-amber-600 font-bold"><Star size={16} fill="currentColor" /> {e.score}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${e.status === 'FINALIZED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18}/></button>
                  <button onClick={() => setDeleteData({ isOpen: true, id: e.id })} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog 
        isOpen={deleteData.isOpen} 
        title="Xóa đánh giá" 
        message="Hành động này sẽ xóa vĩnh viễn bài đánh giá này."
        onConfirm={() => { /* gọi service delete */ setDeleteData({ isOpen: false, id: '' }); }}
        onCancel={() => setDeleteData({ isOpen: false, id: '' })}
      />
    </div>
  );
}