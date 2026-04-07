'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '@/lib/context/theme-context';
import { useI18n } from '@/lib/i18n';
import { LLMConfig, StyleFeatures, RewriteParams } from '@/types';
import FileUploadZone from '@/components/file-upload-zone';
import LanguageSwitcher from '@/components/language-switcher';
import SettingsDialog from '@/components/settings-dialog';
import FeedbackDialog from '@/components/feedback-dialog';
import DonateFab from '@/components/donate-fab';

interface UploadedFile {
  name: string;
  text: string;
}

const STORAGE_KEY = 'rewrite-settings';

function loadFromStorage(): { config: Partial<LLMConfig>; params: Partial<RewriteParams> } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function ThemeToggle({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const { t } = useI18n();

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2 ${
        theme === 'dark' ? 'bg-[#6366f1]' : 'bg-gray-300'
      }`}
      aria-label={t('common.toggleTheme')}
    >
      <span
        className={`absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-0' : 'translate-x-0'
        }`}
      >
        {theme === 'dark' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#6366f1]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </button>
  );
}

export default function StyleTransferPage() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === 'dark';

  const [sampleText, setSampleText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [targetText, setTargetText] = useState('');
  const [analyzedStyle, setAnalyzedStyle] = useState<StyleFeatures | null>(null);
  const [rewrittenText, setRewrittenText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackFeature, setFeedbackFeature] = useState<'analyze' | 'rewrite'>('analyze');

  const stored = loadFromStorage();

  const [config, setConfig] = useState<LLMConfig>(() => ({
    provider: stored?.config?.provider || 'deepseek',
    apiKey: stored?.config?.apiKey || '',
    baseUrl: stored?.config?.baseUrl || '',
    temperature: stored?.config?.temperature ?? 0.7,
    maxTokens: stored?.config?.maxTokens ?? 2000,
  }));

  const [params, setParams] = useState<RewriteParams>(() => ({
    temperature: stored?.params?.temperature ?? 0.7,
    maxTokens: stored?.params?.maxTokens ?? 2000,
    styleStrength: 1,
  }));

  const analyzeStyle = useCallback(async () => {
    const mergedSampleText = [sampleText, ...uploadedFiles.map(f => f.text)]
      .filter(Boolean)
      .join('\n\n');
    if (!mergedSampleText.trim()) {
      setError(t('errors.noSampleText'));
      return;
    }
    if (mergedSampleText.trim().length < 100) {
      setError(t('errors.textTooShort', { count: mergedSampleText.trim().length.toString() }));
      return;
    }
    if (!config.apiKey) {
      setError(t('errors.noApiKey'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: mergedSampleText, config }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setAnalyzedStyle(data.style);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.analysisFailed'));
    } finally {
      setLoading(false);
    }
  }, [sampleText, uploadedFiles, config, t]);

  const rewrite = useCallback(async () => {
    const mergedSampleText = [sampleText, ...uploadedFiles.map(f => f.text)]
      .filter(Boolean)
      .join('\n\n');
    if (!mergedSampleText.trim() || !targetText.trim()) {
      setError(t('errors.noTargetText'));
      return;
    }
    if (mergedSampleText.trim().length < 100) {
      setError(t('errors.textTooShort', { count: mergedSampleText.trim().length.toString() }));
      return;
    }
    if (targetText.trim().length < 100) {
      setError(t('errors.targetTextTooShort', { count: targetText.trim().length.toString() }));
      return;
    }
    if (!config.apiKey) {
      setError(t('errors.noApiKey'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleText: mergedSampleText, targetText, config, params }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setAnalyzedStyle(data.style);
      setRewrittenText(data.rewrittenText);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.rewriteFailed'));
    } finally {
      setLoading(false);
    }
  }, [sampleText, uploadedFiles, targetText, config, params, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading) {
        e.preventDefault();
        rewrite();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rewrite, loading]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f1a] text-[#e0e0ff]' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-[#2d2d4a] bg-[#12121f]/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md sticky top-0 z-40`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold font-[family-name:var(--font-display)] tracking-tight text-gray-900 dark:text-[#e0e0ff]">
                {t('app.title')}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher theme={theme} />
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              {/* <Link
                href="/simulate"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-[#252540] hover:bg-[#2d2d4a] text-[#a0a0c0]' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              >
                风格分析
              </Link> */}
              <button
                className={`p-2 rounded-lg ${isDark ? 'bg-[#252540] hover:bg-[#2d2d4a]' : 'bg-gray-100 hover:bg-gray-200'} transition-colors duration-200 group`}
                onClick={() => setSettingsOpen(true)}
                aria-label={t('common.settings')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDark ? 'text-[#a0a0c0] group-hover:text-[#6366f1]' : 'text-gray-500 group-hover:text-[#6366f1]'} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
        onConfigChange={setConfig}
        params={params}
        onParamsChange={setParams}
        theme={theme}
      />

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`${isDark ? 'bg-[#1a1a2e] border-[#2d2d4a]' : 'bg-white border-gray-200'} rounded-2xl border overflow-hidden shadow-sm`}>
              <div className={`p-6 border-b ${isDark ? 'border-[#2d2d4a]' : 'border-gray-200'}`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'} flex items-center gap-2`}>
                  <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
                  {t('input.section')}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-[#a0a0c0]' : 'text-gray-600'}`}>
                    {t('input.sampleText')} <span className="text-[#6366f1]">{t('input.sampleTextNote')}</span>
                  </label>
                  <FileUploadZone
                    files={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                    theme={theme}
                  />
                  <textarea
                    className={`w-full h-36 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#6366f1]/20 focus:outline-none transition-all duration-200 resize-none ${
                      isDark
                        ? 'bg-[#252540] border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080] focus:border-[#6366f1]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#6366f1]'
                    }`}
                    placeholder={t('input.samplePlaceholder')}
                    value={sampleText}
                    onChange={(e) => setSampleText(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-[#a0a0c0]' : 'text-gray-600'}`}>
                    {t('input.targetText')} <span className="text-[#6366f1]">{t('input.targetTextNote')}</span>
                  </label>
                  <textarea
                    className={`w-full h-36 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#6366f1]/20 focus:outline-none transition-all duration-200 resize-none ${
                      isDark
                        ? 'bg-[#252540] border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080] focus:border-[#6366f1]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#6366f1]'
                    }`}
                    placeholder={t('input.targetPlaceholder')}
                    value={targetText}
                    onChange={(e) => setTargetText(e.target.value)}
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? 'bg-[#252540] hover:bg-[#2d2d4a] border border-[#3d3d5c] hover:border-[#6366f1] text-[#e0e0ff]'
                        : 'bg-gray-200 hover:bg-gray-300 border border-gray-300 hover:border-[#6366f1] text-gray-800'
                    }`}
                    onClick={analyzeStyle}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        {t('input.analyzing')}
                      </span>
                    ) : t('input.analyze')}
                  </button>
                  <button
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] rounded-xl text-white font-medium transition-all duration-200 shadow-lg shadow-[#6366f1]/20 hover:shadow-[#6366f1]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={rewrite}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        {t('input.processing')}
                      </span>
                    ) : t('input.rewrite')}
                  </button>
                </div>

                {error && (
                  <div role="alert" aria-live="polite" className={`p-4 rounded-xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className={`${isDark ? 'bg-[#1a1a2e] border-[#2d2d4a]' : 'bg-white border-gray-200'} rounded-2xl border overflow-hidden shadow-sm h-full`}>
              <div className={`p-6 border-b ${isDark ? 'border-[#2d2d4a]' : 'border-gray-200'}`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'} flex items-center gap-2`}>
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  {t('results.section')}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {analyzedStyle && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'} uppercase tracking-wider`}>{t('results.styleAnalysis')}</h3>
                      <button
                        onClick={() => { setFeedbackFeature('analyze'); setFeedbackOpen(true); }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {t('feedback.rate')}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#252540] border-[#3d3d5c]' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>{t('results.tone')}</p>
                        <p className={`font-medium ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{analyzedStyle.tone}</p>
                      </div>
                      <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#252540] border-[#3d3d5c]' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>{t('results.length')}</p>
                        <p className={`font-medium ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{analyzedStyle.length}</p>
                      </div>
                      <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#252540] border-[#3d3d5c]' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>{t('results.perspective')}</p>
                        <p className={`font-medium ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{analyzedStyle.perspective}</p>
                      </div>
                      <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#252540] border-[#3d3d5c]' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>{t('results.vocabulary')}</p>
                        <p className={`font-medium text-sm truncate ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{analyzedStyle.vocabulary.slice(0, 3).join(', ')}</p>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#252540] border-[#3d3d5c]' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>{t('results.sentencePatterns')}</p>
                      <div className="flex flex-wrap gap-2">
                        {analyzedStyle.sentencePatterns.slice(0, 3).map((pattern, i) => (
                          <span key={i} className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'bg-indigo-50 text-indigo-600'}`}>
                            {pattern}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#252540] border-[#3d3d5c]' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>{t('results.characteristics')}</p>
                      <p className={`text-sm ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>{analyzedStyle.characteristics}</p>
                    </div>
                  </div>
                )}

                {rewrittenText && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'} uppercase tracking-wider`}>{t('results.rewriteResult')}</h3>
                      <button
                        onClick={() => { setFeedbackFeature('rewrite'); setFeedbackOpen(true); }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {t('feedback.rate')}
                      </button>
                    </div>
                    <div className={`p-5 rounded-xl border ${isDark ? 'bg-[#252540] border-[#3d3d5c]' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`whitespace-pre-wrap leading-relaxed ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>{rewrittenText}</p>
                    </div>
                  </div>
                )}

                {!analyzedStyle && !rewrittenText && (
                  <div className="py-12 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#252540] border-[#3d3d5c]' : 'bg-gray-100 border-gray-200'} border`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className={isDark ? 'text-[#606080]' : 'text-gray-400'}>{t('results.emptyState')}</p>
                  </div>
                )}

                {(analyzedStyle || rewrittenText) && (
                  <div className="pt-4 border-t border-dashed flex justify-center gap-3" style={{ borderColor: isDark ? '#3d3d5c' : '#e5e7eb' }}>
                    {analyzedStyle && (
                      <button
                        onClick={() => { setFeedbackFeature('analyze'); setFeedbackOpen(true); }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isDark
                            ? 'bg-[#252540] border border-[#3d3d5c] text-[#a0a0c0] hover:border-[#6366f1] hover:text-[#6366f1]'
                            : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        为分析结果评分
                      </button>
                    )}
                    {rewrittenText && (
                      <button
                        onClick={() => { setFeedbackFeature('rewrite'); setFeedbackOpen(true); }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isDark
                            ? 'bg-[#252540] border border-[#3d3d5c] text-[#a0a0c0] hover:border-[#6366f1] hover:text-[#6366f1]'
                            : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        为改写结果评分
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        featureType={feedbackFeature}
        analyzeResult={analyzedStyle}
        rewriteResult={rewrittenText || null}
        simulateResult={null}
        onSubmit={() => {}}
        theme={theme}
      />

      <DonateFab theme={theme} />
    </div>
  );
}
