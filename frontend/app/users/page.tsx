'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Shield, UserCheck, UserX, Users } from 'lucide-react';
import { User } from '../../types/user';
import { userService } from '../../services/userService';
import UserModal from '../../components/users/UserModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal & Toast states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteData, setDeleteData] = useState({ isOpen: false, id: '' });
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const showToast = (msg: string, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // API call thật: const res = await userService.getUsers({ search, role: roleFilter });
      // setUsers(res.items);

      // Dữ liệu Mock chuẩn hiển thị
      setTimeout(() => {
        setUsers([
          { id: 'U1', email: 'admin@stqms.vn', full_name: 'Phan Mạnh Hùng', role: 'admin', is_active: true, created_at: '2026-01-10' },
          { id: 'U2', email: 'manager@stqms.vn', full_name: 'Nguyễn Văn Quản Lý', role: 'manager', is_active: true, created_at: '2026-02-15' },
          { id: 'U3', email: 'staff01@stqms.vn', full_name: 'Trần Thị Nhân Viên', role: 'staff', is_active: false, created_at: '2026-05-20' }
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Lỗi lấy danh sách user:", error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const handleDelete = async () => {
    try {
      // await userService.deleteUser(deleteData.id);
      setUsers(users.filter(u => u.id !== deleteData.id));
      showToast('Đã xóa tài khoản thành công!');
    } catch (err) {
      showToast('Xóa tài khoản thất bại!', 'error');
    } finally {
      setDeleteData({ isOpen: false, id: '' });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Admin</span>;
      case 'manager': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Manager</span>;
      case 'staff': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Staff</span>;
      default: return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Viewer</span>;
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Người dùng & Phân quyền</h1>
          <p className="text-gray-500 text-sm">Quản lý tài khoản hệ thống, thiết lập Role và kiểm soát quyền hạn truy cập.</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button onClick={() => { setSelectedUser(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus size={20} /> Thêm tài khoản
          </button>
        )}
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Tìm kiếm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500" />
        </div>
        <div className="relative w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 bg-white">
            <option value="">Tất cả Vai trò</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b text-sm text-gray-600">
            <tr>
              <th className="p-4">Người dùng</th>
              <th className="p-4">Vai trò (Role)</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Ngày tạo</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Đang tải danh sách người dùng...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400"><Users size={40} className="mx-auto mb-2 opacity-30"/><p>Không tìm thấy tài khoản nào.</p></td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50/50">
                  <td className="p-4">
                    <p className="font-semibold text-gray-900">{u.full_name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="p-4">{getRoleBadge(u.role)}</td>
                  <td className="p-4">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full"><UserCheck size={14}/> Hoạt động</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2.5 py-1 rounded-full"><UserX size={14}/> Đã khóa</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">{u.created_at}</td>
                  <td className="p-4 text-right space-x-1">
                    {currentUser?.role === 'admin' && (
                      <>
                        <button onClick={() => { setSelectedUser(u); setIsModalOpen(true); }} title="Chỉnh sửa & Phân quyền" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => setDeleteData({ isOpen: true, id: u.id })} title="Xóa tài khoản" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => { fetchUsers(); showToast('Thành công!'); }} userToEdit={selectedUser} />
      <ConfirmDialog isOpen={deleteData.isOpen} title="Xóa tài khoản" message="Tài khoản này sẽ bị xóa vĩnh viễn và không thể truy cập hệ thống nữa. Bạn có chắc chắn không?" onConfirm={handleDelete} onCancel={() => setDeleteData({ isOpen: false, id: '' })} />
    </div>
  );
}