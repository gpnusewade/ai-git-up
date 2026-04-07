'use client';

import { useState, useEffect, useRef } from 'react';

interface ImitationEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onSave: (newContent: string) => void;
  theme: 'light' | 'dark';
}

export default function ImitationEditorDialog({ open, onOpenChange, content, onSave, theme }: ImitationEditorDialogProps) {
  const isDark = theme === 'dark';
  const [editedContent, setEditedContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setEditedContent(content);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, content]);

  const handleSave = () => {
    onSave(editedContent);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <dialog open={open} onClose={() => onOpenChange(false)} className="modal">
      <div className={`modal-box max-w-3xl p-0 overflow-hidden ${isDark ? 'bg-[#1a1a2e] border-[#2d2d4a]' : 'bg-white border-gray-200'} border shadow-2xl`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-[#2d2d4a]' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#6366f1]/20' : 'bg-indigo-50'}`}>
              <svg className={`w-4 h-4 ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>编辑仿写内容</h3>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#252540] text-[#606080]' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <textarea
            ref={textareaRef}
            className={`w-full h-80 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#6366f1]/20 focus:outline-none transition-all duration-200 resize-none font-mono text-sm leading-relaxed ${
              isDark
                ? 'bg-[#252540] border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080] focus:border-[#6366f1]'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#6366f1]'
            }`}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="编辑仿写内容..."
          />
          <p className={`mt-2 text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>
            按 Ctrl+Enter 保存，Esc 取消
          </p>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-[#2d2d4a] bg-[#12121f]/50' : 'border-gray-200 bg-gray-50'} flex justify-end gap-3`}>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-[#252540] hover:bg-[#2d2d4a] text-[#a0a0c0] border border-[#3d3d5c]'
                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-300'
            }`}
            onClick={() => onOpenChange(false)}
          >
            取消
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] text-white transition-all duration-200 shadow-lg shadow-[#6366f1]/20"
            onClick={handleSave}
          >
            保存
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-black/40 backdrop-blur-sm">
        <button onClick={() => onOpenChange(false)}>close</button>
      </form>
    </dialog>
  );
}
