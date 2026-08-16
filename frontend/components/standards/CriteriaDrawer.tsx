'use client';

import React, { useEffect, useState } from 'react';
import { standardService } from '../../services/standardService';
import { Standard, Criterion } from '../../types/standard';
import { X, Edit, Trash2, ChevronRight } from 'lucide-react';

interface CriteriaDrawerProps {
  standard: Standard;
  isOpen: boolean;
  onClose: () => void;
}

export default function CriteriaDrawer({ standard, isOpen, onClose }: CriteriaDrawerProps) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCriteria = async () => {
    if (!standard?.id) return;
    setLoading(true);
    try {
      const res = await standardService.getCriteria({ standard_id: standard.id });
      const items = Array.isArray(res) ? res : (res.items || res.data || []);
      setCriteria(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && standard?.id) fetchCriteria();
  }, [isOpen, standard?.id]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-gray-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 bg-white border-b flex justify-between items-center">
            <h2 className="text-lg font-bold">Quản lý Tiêu chí thuộc: {standard?.code}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? <p>Đang tải...</p> : criteria.length === 0 ? <p>Chưa có tiêu chí nào.</p> : criteria.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded border shadow-sm flex justify-between">{item.name}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}