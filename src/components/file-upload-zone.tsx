'use client';

import { useState, useCallback, useRef } from 'react';
import mammoth from 'mammoth';
import { useI18n } from '@/lib/i18n';

interface UploadedFile {
  name: string;
  text: string;
}

interface FileUploadZoneProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  theme: 'light' | 'dark';
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['.txt', '.md', '.docx'];

async function readFileText(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(file.name));
    reader.readAsText(file);
  });
}

export default function FileUploadZone({ files, onFilesChange, theme }: FileUploadZoneProps) {
  const { t } = useI18n();
  const isDark = theme === 'dark';
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    setError('');
    const validFiles = Array.from(fileList).filter(file => {
      const ext = '.' + file.name.toLowerCase().split('.').pop();
      if (!ACCEPTED_TYPES.includes(ext)) {
        setError(t('errors.unsupportedFileType', { name: file.name }));
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t('errors.fileTooLarge', { name: file.name }));
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsReading(true);
    try {
      const newFiles: UploadedFile[] = [];
      for (const file of validFiles) {
        const text = await readFileText(file);
        if (text.trim()) {
          newFiles.push({ name: file.name, text: text.trim() });
        }
      }
      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(t('errors.readFileFailed', { name: err.message }));
      } else {
        setError(t('errors.readFileFailedGeneric'));
      }
    } finally {
      setIsReading(false);
    }
  }, [files, onFilesChange, t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  }, [files, onFilesChange]);

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isDragging
            ? isDark
              ? 'border-[#6366f1] bg-[#6366f1]/10'
              : 'border-[#6366f1] bg-indigo-50'
            : isDark
              ? 'border-[#3d3d5c] bg-[#252540]/50 hover:border-[#6366f1]/50 hover:bg-[#252540]'
              : 'border-gray-300 bg-gray-50 hover:border-[#6366f1]/50 hover:bg-gray-100'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.docx"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span className={`text-sm ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>
          {isReading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              {t('upload.reading')}
            </span>
          ) : (
            <>{t('upload.dragText')} <span className="text-[#6366f1]">{t('common.clickToSelect')}</span></>
          )}
        </span>
      </div>

      {error && (
        <div className={`p-3 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                isDark ? 'bg-[#252540] border border-[#3d3d5c]' : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 shrink-0 ${isDark ? 'text-[#6366f1]' : 'text-indigo-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className={`text-sm truncate ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>
                  {file.name}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className={`p-1 rounded-md transition-colors ${
                  isDark ? 'hover:bg-[#3d3d5c] text-[#606080] hover:text-red-400' : 'hover:bg-gray-200 text-gray-400 hover:text-red-500'
                }`}
                aria-label={t('common.delete', { name: file.name })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
