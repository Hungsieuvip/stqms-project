'use client';

import React, { useState } from 'react';
import { standardService } from '../../services/standardService';
import { 
  Sparkles, X, UploadCloud, FileText, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronRight, Layers, RefreshCw, 
  FileCheck, BookOpen
} from 'lucide-react';

interface AIImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AIImportModal({ isOpen, onClose, onSuccess }: AIImportModalProps) {
  const [activeTab, setActiveTab] = useState<'sample_tt57' | 'upload_file' | 'raw_text'>('sample_tt57');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [expandedStandards, setExpandedStandards] = useState<Record<string, boolean>>({});
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSaving || isAnalyzing) return;
    setParsedData(null);
    setSelectedFile(null);
    setRawText('');
    setErrorMsg(null);
    setSaveResult(null);
    onClose();
  };

  const handleAnalyze = async () => {
    setErrorMsg(null);
    setParsedData(null);
    setSaveResult(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      if (activeTab === 'sample_tt57') {
        formData.append('use_sample_tt57', 'true');
      } else if (activeTab === 'upload_file') {
        if (!selectedFile) {
          setErrorMsg('Vui lòng chọn tệp văn bản hoặc PDF trước khi phân tích!');
          setIsAnalyzing(false);
          return;
        }
        formData.append('file', selectedFile);
      } else if (activeTab === 'raw_text') {
        if (!rawText.trim() || rawText.trim().length < 20) {
          setErrorMsg('Vui lòng dán nội dung văn bản thông tư (ít nhất 20 ký tự)!');
          setIsAnalyzing(false);
          return;
        }
        formData.append('raw_text', rawText);
      }

      const res = await standardService.aiParse(formData);
      if (!res || !res.standards || res.standards.length === 0) {
        setErrorMsg('Không thể trích xuất Tiêu chuẩn hoặc Tiêu chí nào từ tài liệu. Vui lòng kiểm tra lại cấu trúc văn bản!');
      } else {
        setParsedData(res);
        // Mở rộng tất cả tiêu chuẩn trong preview
        const expMap: Record<string, boolean> = {};
        res.standards.forEach((s: any) => { expMap[s.code] = true; });
        setExpandedStandards(expMap);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Lỗi khi phân tích dữ liệu bằng AI. Vui lòng thử lại!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!parsedData || !parsedData.standards) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const result = await standardService.aiImport(parsedData);
      setSaveResult(result);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Lỗi khi lưu dữ liệu tiêu chuẩn vào hệ thống!');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExpand = (code: string) => {
    setExpandedStandards(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const totalCriteria = parsedData?.standards?.reduce((acc: number, s: any) => acc + (s.criteria?.length || 0), 0) || 0;
  const totalRequirements = parsedData?.standards?.reduce((acc: number, s: any) => 
    acc + (s.criteria?.reduce((cAcc: number, c: any) => cAcc + (c.requirements?.length || 0), 0) || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shadow-md">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">
                  Thêm nhanh Tiêu chuẩn & Tiêu chí bằng AI
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                  Thông tư mới
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động đọc, phân tích và trích xuất cấu trúc văn bản quy phạm theo chuẩn Bộ GD&ĐT
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            disabled={isAnalyzing || isSaving}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3 shadow-xs">
              <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-emerald-900">Cập nhật cơ sở dữ liệu thành công!</p>
                <p>
                  Đã tạo mới <b>{saveResult.created_standards}</b> tiêu chuẩn, <b>{saveResult.created_criteria}</b> tiêu chí và <b>{saveResult.created_requirements}</b> yêu cầu.
                  {saveResult.updated_standards > 0 && ` (Cập nhật ${saveResult.updated_standards} tiêu chuẩn)`}
                </p>
                <p className="text-[11px] text-emerald-600">Đang đồng bộ lại danh mục hệ thống...</p>
              </div>
            </div>
          )}

          {!parsedData ? (
            /* STEP 1: CHỌN NGUỒN TÀI LIỆU */
            <div className="space-y-5">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('sample_tt57')}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                    activeTab === 'sample_tt57'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen size={16} />
                  <span>Tệp TT 57 (Mục Downloads)</span>
                </button>
                <button
                  onClick={() => setActiveTab('upload_file')}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                    activeTab === 'upload_file'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud size={16} />
                  <span>Tải lên tệp PDF / Văn bản</span>
                </button>
                <button
                  onClick={() => setActiveTab('raw_text')}
                  className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                    activeTab === 'raw_text'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText size={16} />
                  <span>Dán nội dung Thông tư</span>
                </button>
              </div>

              {/* Tab 1: TT 57 Downloads Sample */}
              {activeTab === 'sample_tt57' && (
                <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs mt-0.5">
                      <FileCheck size={24} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-sm">
                          Thông tư 57/2026/TT-BGDĐT
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Downloads/TT 57 BĐCL - CQG.pdf
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Quy định kiểm định chất lượng giáo dục và công nhận đạt chuẩn quốc gia đối với cơ sở giáo dục phổ thông.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-medium text-slate-700">
                          4 Tiêu chuẩn
                        </span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-medium text-slate-700">
                          15 Tiêu chí
                        </span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-medium text-slate-700">
                          30 Mức độ yêu cầu (Mức 1, Mức 2)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span>💡</span> Cơ sở tri thức AI đã được chuẩn hóa đầy đủ theo đúng bản gốc Bộ GD&ĐT
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Nhấn nút bên dưới để AI tự động nạp toàn bộ cấu trúc Tiêu chuẩn, Tiêu chí và phân rã các Mức độ để bạn xem xét trước khi lưu.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Upload File */}
              {activeTab === 'upload_file' && (
                <div className="space-y-3">
                  <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/60 text-center hover:bg-slate-50 transition cursor-pointer relative">
                    <input 
                      type="file" 
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 bg-white text-indigo-600 rounded-full shadow-xs border border-slate-200">
                        <UploadCloud size={28} />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        {selectedFile ? selectedFile.name : 'Kéo thả hoặc nhấp để chọn tệp thông tư'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Hỗ trợ định dạng PDF (bao gồm tệp TT 57 BĐCL - CQG.pdf), DOCX, TXT
                      </p>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-indigo-600" />
                        <span className="font-medium">{selectedFile.name}</span>
                        <span className="text-slate-500 text-[10px]">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button 
                        onClick={() => setSelectedFile(null)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Raw Text Input */}
              {activeTab === 'raw_text' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Dán văn bản thông tư quy định tiêu chuẩn / tiêu chí:
                  </label>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Ví dụ:\nTiêu chuẩn 1: Quản trị nhà trường...\nTiêu chí 1.1: Phương hướng, chiến lược phát triển...\nMức 1: Có phương hướng, chiến lược...\nMức 2: Định kỳ rà soát, đánh giá...`}
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 italic">
                    Mô hình AI sẽ tự động phân loại cấu trúc Tiêu chuẩn, Tiêu chí con và các Mức 1, Mức 2...
                  </p>
                </div>
              )}

              {/* Action Button: Trigger AI Parse */}
              <div className="pt-3 flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-indigo-200 transition disabled:opacity-60 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>AI đang đọc và phân tích văn bản...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Phân tích & Trích xuất Tiêu chuẩn bằng AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: PREVIEW & VERIFICATION */
            <div className="space-y-5">
              
              {/* Summary Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-600 text-white rounded-lg">
                      <FileCheck size={16} />
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {parsedData.bundle_name || 'Thông tư Tiêu chuẩn Chất lượng'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 pl-8">
                    Ngày ban hành: {parsedData.issued_date || 'Chưa xác định'} • Mã phân loại: <span className="font-mono font-semibold text-indigo-700">{parsedData.bundle_code || 'TT_DEFAULT'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pl-8 sm:pl-0">
                  <div className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 shadow-2xs text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Tiêu chuẩn</p>
                    <p className="text-sm font-bold text-indigo-600 font-mono">{parsedData.standards?.length || 0}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 shadow-2xs text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Tiêu chí</p>
                    <p className="text-sm font-bold text-purple-600 font-mono">{totalCriteria}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 shadow-2xs text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Yêu cầu</p>
                    <p className="text-sm font-bold text-pink-600 font-mono">{totalRequirements}</p>
                  </div>
                </div>
              </div>

              {/* Hierarchy Tree Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={14} className="text-indigo-600" />
                    <span>Cấu trúc Tiêu chuẩn & Tiêu chí trích xuất ({parsedData.standards?.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Nhấp vào từng tiêu chuẩn để xem danh sách tiêu chí con</span>
                </div>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {parsedData.standards?.map((std: any) => {
                    const isExp = expandedStandards[std.code];
                    return (
                      <div key={std.code} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                        {/* Standard Header Row */}
                        <div 
                          onClick={() => toggleExpand(std.code)}
                          className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between gap-3 transition"
                        >
                          <div className="flex items-center gap-3">
                            <button className="text-slate-400 hover:text-slate-600">
                              {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            <span className="px-2.5 py-1 rounded bg-indigo-600 text-white font-mono font-bold text-xs shadow-2xs">
                              {std.code}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{std.name}</p>
                              {std.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-1">{std.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                            {std.criteria?.length || 0} tiêu chí
                          </span>
                        </div>

                        {/* Expanded Criteria */}
                        {isExp && (
                          <div className="p-3 bg-white divide-y divide-slate-100">
                            {std.criteria?.map((crit: any) => (
                              <div key={crit.code} className="py-2.5 first:pt-1 last:pb-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-xs text-blue-700">
                                        {crit.code}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-800">
                                        {crit.name}
                                      </span>
                                    </div>
                                    {crit.description && (
                                      <p className="text-[11px] text-slate-500 pl-2 border-l-2 border-slate-200">
                                        {crit.description}
                                      </p>
                                    )}

                                    {/* Requirements Pills */}
                                    {crit.requirements && crit.requirements.length > 0 && (
                                      <div className="pt-1 flex flex-wrap gap-1.5">
                                        {crit.requirements.map((req: any) => (
                                          <span 
                                            key={req.code}
                                            className="px-2 py-0.5 rounded text-[10px] bg-slate-50 text-slate-700 border border-slate-200 font-sans"
                                            title={req.description}
                                          >
                                            <b className="text-indigo-600">{req.code}:</b> {req.description.length > 60 ? req.description.slice(0, 60) + '...' : req.description}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {parsedData ? (
            <>
              <button
                onClick={() => { setParsedData(null); setSaveResult(null); }}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                ← Chọn tài liệu khác
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleCommitImport}
                  disabled={isSaving || !!saveResult}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200 transition disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Đang lưu vào hệ thống...</span>
                    </>
                  ) : saveResult ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Đã cập nhật xong!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Xác nhận & Cập nhật vào hệ thống</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={handleClose}
                disabled={isAnalyzing}
                className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
