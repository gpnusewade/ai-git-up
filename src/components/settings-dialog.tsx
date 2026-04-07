'use client';

import { LLMConfig, RewriteParams } from '@/types';
import { useI18n } from '@/lib/i18n';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: LLMConfig;
  onConfigChange: (config: LLMConfig) => void;
  params?: RewriteParams;
  onParamsChange?: (params: RewriteParams) => void;
  theme: 'light' | 'dark';
}

const STORAGE_KEY = 'rewrite-settings';

function saveToStorage(config: LLMConfig, params?: RewriteParams) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, params }));
  } catch {}
}

export default function SettingsDialog({ open, onOpenChange, config, onConfigChange, params, onParamsChange, theme }: SettingsDialogProps) {
  const isDark = theme === 'dark';
  const { t } = useI18n();

  if (!open) return null;

  return (
    <dialog open={open} onClose={() => onOpenChange(false)} className="modal">
      <div className={`modal-box max-w-lg p-6 ${isDark ? 'bg-[#1a1a2e] border-[#2d2d4a]' : 'bg-white border-gray-200'} border shadow-2xl`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-[#6366f1]/20' : 'bg-indigo-50'}`}>
            <svg className={`w-5 h-5 ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className={`font-bold text-xl ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{t('settings.title')}</h3>
        </div>

        <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-[#252540]/50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-4">
            <svg className={`w-4 h-4 ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className={`font-semibold text-sm ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>API 配置</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label py-2">
                <span className={`label-text text-xs ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>{t('settings.provider')}</span>
              </label>
              <select
                className={`select select-sm bg-transparent border ${isDark ? 'border-[#3d3d5c] text-[#e0e0ff]' : 'border-gray-200 text-gray-700'} focus:border-[#6366f1] rounded-lg`}
                value={config.provider}
                onChange={(e) => onConfigChange({ ...config, provider: e.target.value as 'claude' | 'deepseek' })}
              >
                <option value="deepseek">DeepSeek</option>
                <option value="claude">Claude</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label py-2">
                <span className={`label-text text-xs ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>{t('settings.model')}</span>
              </label>
              <input
                type="text"
                className={`input input-sm bg-transparent border ${isDark ? 'border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080]' : 'border-gray-200 text-gray-700 placeholder-gray-400'} focus:border-[#6366f1] rounded-lg`}
                value={config.model || ''}
                onChange={(e) => onConfigChange({ ...config, model: e.target.value })}
                placeholder={config.provider === 'claude' ? 'claude-3-haiku-20240307' : 'deepseek-chat'}
              />
            </div>
          </div>

          <div className="form-control mt-2">
            <label className="label py-2">
              <span className={`label-text text-xs ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>{t('settings.apiKey')}</span>
            </label>
            <input
              type="password"
              className={`input input-sm bg-transparent border ${isDark ? 'border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080]' : 'border-gray-200 text-gray-700 placeholder-gray-400'} focus:border-[#6366f1] rounded-lg`}
              value={config.apiKey}
              onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
              placeholder={t('settings.apiKeyPlaceholder')}
            />
          </div>

          <div className="form-control mt-2">
            <label className="label py-2">
              <span className={`label-text text-xs ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>{t('settings.baseUrl')}</span>
            </label>
            <input
              type="text"
              className={`input input-sm bg-transparent border ${isDark ? 'border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080]' : 'border-gray-200 text-gray-700 placeholder-gray-400'} focus:border-[#6366f1] rounded-lg`}
              value={config.baseUrl || ''}
              onChange={(e) => onConfigChange({ ...config, baseUrl: e.target.value })}
              placeholder={t('settings.baseUrlPlaceholder')}
            />
          </div>
        </div>

        {params && onParamsChange && (
          <div className={`rounded-xl p-4 ${isDark ? 'bg-[#252540]/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-4">
              <svg className={`w-4 h-4 ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className={`font-semibold text-sm ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>{t('settings.rewriteParams')}</span>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <div className="flex justify-between items-center">
                  <label className="label py-1">
                    <span className={`label-text text-xs ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>{t('settings.temperature')}</span>
                  </label>
                  <span className={`text-xs font-mono ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`}>{params.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  className="range range-sm range-primary accent-[#6366f1]"
                  value={params.temperature}
                  onChange={(e) => onParamsChange({ ...params, temperature: parseFloat(e.target.value) })}
                />
                <div className={`flex justify-between text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'} mt-1`}>
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className={`label-text text-xs ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>{t('settings.maxTokens')}</span>
                </label>
                <input
                  type="number"
                  className={`input input-sm bg-transparent border ${isDark ? 'border-[#3d3d5c] text-[#e0e0ff]' : 'border-gray-200 text-gray-700'} focus:border-[#6366f1] rounded-lg font-mono`}
                  value={params.maxTokens}
                  onChange={(e) => onParamsChange({ ...params, maxTokens: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="modal-action mt-6">
          <button
            className="btn btn-sm bg-[#6366f1] hover:bg-[#4f46e5] text-white border-none transition-all duration-200 rounded-lg"
            onClick={() => {
              saveToStorage(config, params);
              onOpenChange(false);
            }}
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-black/40 backdrop-blur-sm">
        <button onClick={() => onOpenChange(false)}>{t('common.close')}</button>
      </form>
    </dialog>
  );
}