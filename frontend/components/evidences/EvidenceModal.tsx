import React, { useState, useRef } from 'react';
import { UploadCloud, X, File as FileIcon, AlertCircle } from 'lucide-react';
import { evidenceService } from '../../services/evidenceService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EvidenceModal({ isOpen, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError('');
    if (selected) {
      // Validation: Max 10MB, cho phép PDF/Image
      if (selected.size > 10 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 10MB.');
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('Vui lòng nhập tên minh chứng và chọn file.');
      return;
    }

    setIsUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    try {
      await evidenceService.uploadEvidence(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setProgress(percentCompleted);
      });
      onSuccess(); // Gọi callback để refresh danh sách
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra khi upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setProgress(0);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Upload Minh Chứng Mới</h3>
          <button onClick={handleClose} disabled={isUploading} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form onSubmit={handleUpload}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên minh chứng *</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" 
              placeholder="VD: Quyết định thành lập..." 
            />
          </div>

          {/* Drag & Drop Area */}
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" disabled={isUploading} />
            
            {!file ? (
              <div className="flex flex-col items-center cursor-pointer">
                <UploadCloud size={40} className="text-blue-500 mb-2" />
                <p className="text-sm font-medium text-gray-700">Click để chọn file tải lên</p>
                <p className="text-xs text-gray-500 mt-1">Hỗ trợ PDF, JPG, PNG (Max 10MB)</p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-3 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className="text-blue-600 flex-shrink-0" />
                  <div className="text-left truncate">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                {!isUploading && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                )}
              </div>
            )}
          </div>

          {/* Validation Error */}
          {error && <div className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertCircle size={16}/> {error}</div>}

          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Đang tải lên...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={handleClose} disabled={isUploading} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Hủy</button>
            <button type="submit" disabled={isUploading || !file} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
              {isUploading ? 'Đang Upload...' : 'Hoàn tất tải lên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}