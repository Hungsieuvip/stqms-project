'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Trash2, CheckCircle, Clock, PlayCircle, AlertCircle, Paperclip } from 'lucide-react';
import { Task, Plan } from '../../types/task';
import TaskModal from '../../components/tasks/TaskModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState({ isOpen: false, id: '' });
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const showToast = (msg: string, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // API call thật sẽ nằm ở đây
      setTimeout(() => {
        setPlans([
          { id: 'PLAN-1', title: 'Đánh giá chất lượng định kỳ năm 2026', progress: 45 },
          { id: 'PLAN-2', title: 'Bổ sung hồ sơ kiểm định ISO', progress: 10 }
        ]);
        setTasks([
          { id: 'T1', title: 'Thu thập minh chứng Tiêu chuẩn 1', plan_id: 'PLAN-1', plan_title: 'Đánh giá chất lượng 2026', assignee_id: 'U1', assignee_name: 'Phan Mạnh Hùng', status: 'IN_PROGRESS', deadline: '2026-08-20', attachment_name: 'HD_ThuThap.pdf' },
          { id: 'T2', title: 'Soạn thảo báo cáo tự đánh giá', plan_id: 'PLAN-1', plan_title: 'Đánh giá chất lượng 2026', assignee_id: 'U2', assignee_name: 'Nguyễn Văn A', status: 'TODO', deadline: '2026-08-25' },
          { id: 'T3', title: 'Rà soát tiêu chuẩn an toàn', plan_id: 'PLAN-2', plan_title: 'Bổ sung hồ sơ kiểm định', assignee_id: 'U1', assignee_name: 'Phan Mạnh Hùng', status: 'DONE', deadline: '2026-08-10' }
        ]);
        setLoading(false);
      }, 600);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, statusFilter]);

  const handleDelete = async () => {
    try {
      // await taskService.deleteTask(deleteData.id);
      setTasks(tasks.filter(t => t.id !== deleteData.id));
      showToast('Đã xóa nhiệm vụ thành công!');
    } catch (err) {
      showToast('Xóa thất bại!', 'error');
    } finally {
      setDeleteData({ isOpen: false, id: '' });
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: any) => {
    // await taskService.updateTaskStatus(id, newStatus);
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    showToast('Đã cập nhật tiến độ!');
  };

  const getStatusUI = (status: string) => {
    switch (status) {
      case 'TODO': return { icon: <Clock size={16}/>, text: 'Chưa bắt đầu', color: 'bg-gray-100 text-gray-700' };
      case 'IN_PROGRESS': return { icon: <PlayCircle size={16}/>, text: 'Đang làm', color: 'bg-blue-100 text-blue-700' };
      case 'REVIEW': return { icon: <AlertCircle size={16}/>, text: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700' };
      case 'DONE': return { icon: <CheckCircle size={16}/>, text: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700' };
      default: return { icon: <Clock size={16}/>, text: 'N/A', color: 'bg-gray-100' };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 text-white transition-opacity ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tiến độ & Phân công nhiệm vụ</h1>
          <p className="text-gray-500 text-sm">Theo dõi kế hoạch, giao việc và cập nhật trạng thái tiến độ.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus size={20} /> Giao việc mới
          </button>
        )}
      </div>

      {/* Progress Overview (Tiến độ Kế hoạch) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-800 truncate">{plan.title}</h4>
              <span className="text-sm font-bold text-blue-600">{plan.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{width: `${plan.progress}%`}}></div></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Tìm tên công việc hoặc người phụ trách..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500" />
        </div>
        <div className="relative w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 bg-white">
            <option value="">Tất cả tiến độ</option>
            <option value="TODO">Chưa bắt đầu</option>
            <option value="IN_PROGRESS">Đang làm</option>
            <option value="REVIEW">Chờ duyệt</option>
            <option value="DONE">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b text-sm text-gray-600">
            <tr>
              <th className="p-4">Tên công việc / Kế hoạch</th>
              <th className="p-4">Người phụ trách</th>
              <th className="p-4">Hạn chót</th>
              <th className="p-4">Tiến độ</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải nhiệm vụ...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Không tìm thấy công việc nào.</td></tr>
            ) : (
              tasks.map(task => {
                const ui = getStatusUI(task.status);
                return (
                  <tr key={task.id} className="border-b hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{task.plan_title}</p>
                      {task.attachment_name && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          <Paperclip size={12}/> {task.attachment_name}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium text-blue-600">{task.assignee_name}</td>
                    <td className="p-4 text-sm text-gray-600">{task.deadline}</td>
                    <td className="p-4">
                      {/* Dropdown Update Trạng Thái Cấp Tốc */}
                      <select 
                        value={task.status} 
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full outline-none cursor-pointer border ${ui.color}`}
                      >
                        <option value="TODO">Chưa bắt đầu</option>
                        <option value="IN_PROGRESS">Đang làm</option>
                        <option value="REVIEW">Chờ duyệt</option>
                        <option value="DONE">Hoàn thành</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      {(user?.role === 'admin' || user?.role === 'manager' || user?.full_name === task.assignee_name) && (
                        <button onClick={() => setDeleteData({ isOpen: true, id: task.id })} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => { fetchData(); showToast('Đã giao nhiệm vụ mới!'); }} />
      <ConfirmDialog isOpen={deleteData.isOpen} title="Xóa nhiệm vụ" message="Nhiệm vụ này sẽ bị xóa vĩnh viễn khỏi kế hoạch. Bạn có chắc chắn không?" onConfirm={handleDelete} onCancel={() => setDeleteData({ isOpen: false, id: '' })} />
    </div>
  );
}