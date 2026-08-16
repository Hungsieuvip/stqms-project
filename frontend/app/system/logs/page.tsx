'use client';

import React, { useEffect, useState } from 'react';
import { systemService } from '../../../services/systemService';
import { Search, Filter, Shield, Server } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    systemService.getLogs({}).then(data => {
        // Mock data
        setLogs([
            { id: 1, user_name: 'Admin', action: 'Xóa tài khoản', module: 'User', timestamp: '2026-08-15 10:00:00', ip_address: '127.0.0.1' },
            { id: 2, user_name: 'Phan Mạnh Hùng', action: 'Upload minh chứng', module: 'Evidence', timestamp: '2026-08-15 11:30:00', ip_address: '192.168.1.5' }
        ]);
        setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Server /> Nhật ký hệ thống (Audit Log)</h1>
      
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">Thời gian</th>
              <th className="p-4 text-left">Người dùng</th>
              <th className="p-4 text-left">Hành động</th>
              <th className="p-4 text-left">Module</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b">
                <td className="p-4 text-gray-500">{log.timestamp}</td>
                <td className="p-4 font-medium">{log.user_name}</td>
                <td className="p-4">{log.action}</td>
                <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{log.module}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}