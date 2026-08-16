import React, { useState, useEffect } from 'react';
import { X, Shield, User as UserIcon, Mail, Lock, AlertCircle } from 'lucide-react';
import { User } from '../../types/user';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: User | null;
}

export default function UserModal({ isOpen, onClose, onSuccess, userToEdit }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'staff' | 'viewer'>('staff');
  const [isActive, setIsActive] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.full_name || '');
      setEmail(userToEdit.email || '');
      setRole(userToEdit.role || 'staff');
      setIsActive(userToEdit.is_active ?? true);
      setPassword('');
    } else {
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      setIsActive(true);
    }
    setError('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || (!userToEdit && !password)) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Gọi API thực tế tương ứng Create / Update
      // const payload = { full_name: fullName, email, role, is_active: isActive, ...(password ? { password } : {}) };
      // if (userToEdit) { await userService.updateUser(userToEdit.id, payload); } 
      // else { await userService.createUser(payload); }

      setTimeout(() => { // Mock delay
        onSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900">
            {userToEdit ? 'Chỉnh sửa tài khoản & Phân quyền' : 'Thêm tài khoản mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500" placeholder="Nguyễn Văn A" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email / Tài khoản *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500" placeholder="admin@stqms.vn" />
            </div>
          </div>

          {!userToEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu khởi tạo *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500" placeholder="••••••••" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò (Role) *</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <select value={role} onChange={(e: any) => setRole(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 bg-white">
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="manager">Quản lý (Manager)</option>
                  <option value="staff">Nhân sự (Staff)</option>
                  <option value="viewer">Xem dữ liệu (Viewer)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái tài khoản</label>
              <div className="flex items-center h-10">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">{isActive ? 'Hoạt động' : 'Đã khóa'}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {isSubmitting ? 'Đang lưu...' : (userToEdit ? 'Lưu thay đổi' : 'Tạo tài khoản')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}