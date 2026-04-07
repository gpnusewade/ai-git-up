'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '@/lib/context/theme-context';
import { useI18n } from '@/lib/i18n';
import { LLMConfig } from '@/types';
import LanguageSwitcher from '@/components/language-switcher';
import SettingsDialog from '@/components/settings-dialog';
import ImitationEditorDialog from '@/components/imitation-editor-dialog';
import DonateFab from '@/components/donate-fab';
import { RewriteParams } from '@/types';

const STORAGE_KEY = 'simulate-settings';

function loadFromStorage(): { config: Partial<LLMConfig>; params: Partial<RewriteParams> } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveToStorage(config: LLMConfig, params: RewriteParams) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, params }));
  } catch { }
}

interface Section {
  heading: string;
  content: string;
  isComplete: boolean;
  isVisible: boolean;
}

function splitIntoSections(fullText: string, isStreaming: boolean): Section[] {
  const headingRegex = /^(##\s+.+)$/gm;
  const matches = [...fullText.matchAll(headingRegex)];

  if (matches.length === 0) {
    if (fullText.trim()) {
      return [{ heading: '', content: fullText, isComplete: !isStreaming, isVisible: true }];
    }
    return [];
  }

  const sections: Section[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = match.index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : fullText.length;
    const sectionText = fullText.slice(start, end).trimEnd();
    const isLast = i === matches.length - 1;
    const isComplete = !isStreaming || (isLast && !isStreaming);

    sections.push({
      heading: match[1],
      content: sectionText,
      isComplete: isComplete && !isLast,
      isVisible: true,
    });
  }

  if (isStreaming && sections.length > 0) {
    sections[sections.length - 1].isComplete = false;
  }

  return sections;
}

export default function SimulatePage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const { t } = useI18n();

  const [styleSourceText, setStyleSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [fullText, setFullText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imitationCopied, setImitationCopied] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editedImitation, setEditedImitation] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const stored = loadFromStorage();

  const [config, setConfig] = useState<LLMConfig>(() => ({
    provider: stored?.config?.provider || 'deepseek',
    apiKey: /* stored?.config?.apiKey || */ '',
    baseUrl: stored?.config?.baseUrl || '',
    model: stored?.config?.model || '',
    temperature: stored?.config?.temperature ?? 0.3,
    maxTokens: stored?.config?.maxTokens ?? 4000,
  }));

  const [params] = useState<RewriteParams>(() => ({
    temperature: stored?.params?.temperature ?? 0.3,
    maxTokens: stored?.params?.maxTokens ?? 4000,
    styleStrength: 1,
  }));

  useEffect(() => {
    saveToStorage(config, params);
  }, [config, params]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [fullText]);

  const handleSimulate = useCallback(async () => {
    if (!styleSourceText.trim()) {
      setError(t('errors.noSampleText'));
      return;
    }
    if (styleSourceText.trim().length < 100) {
      setError(t('errors.textTooShort', { count: styleSourceText.trim().length.toString() }));
      return;
    }
    if (!config.apiKey) {
      setError(t('errors.noApiKey'));
      // return;
    }

    setIsStreaming(true);
    setError('');
    setFullText('');
    setEditedImitation(null);
    setImitationCopied(false);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleSourceText,
          targetText: targetText.trim() || undefined,
          config,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const chunk = JSON.parse(trimmed.slice(6));

              switch (chunk.type) {
                case 'text-delta':
                  if (chunk.delta) {
                    setFullText((prev) => prev + chunk.delta);
                  }
                  break;
                case 'error':
                  if (chunk.error) {
                    throw new Error(chunk.error);
                  }
                  break;
              }
            } catch (parseErr) {
              if (parseErr instanceof Error) {
                throw parseErr;
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : t('errors.analysisFailed'));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [styleSourceText, targetText, config, t]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isStreaming) {
      e.preventDefault();
      handleSimulate();
    }
  }, [handleSimulate, isStreaming]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [fullText]);

  const handleCopyImitation = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setImitationCopied(true);
      setTimeout(() => setImitationCopied(false), 2000);
    });
  }, []);

  const handleSaveImitation = useCallback((newContent: string) => {
    setEditedImitation(newContent);
  }, []);

  const sections = useMemo(() => splitIntoSections(fullText, isStreaming), [fullText, isStreaming]);
  const hasTargetText = targetText.trim().length > 0;
  const hasContent = sections.length > 0 || isStreaming;

  const imitationSection = useMemo(() => {
    if (sections.length === 0) return null;
    const first = sections[0];
    if (first.heading.includes('风格仿写')) {
      return first;
    }
    return null;
  }, [sections]);

  const imitationBodyText = useMemo(() => {
    if (!imitationSection) return '';
    if (editedImitation !== null) return editedImitation;
    let text = imitationSection.content;
    text = text.replace(/^##\s+.*\n?/, '');
    text = text.replace(/^>\s+\*\*仿写说明\*\*.*\n?/m, '');
    text = text.trim();
    return text;
  }, [imitationSection, editedImitation]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f1a] text-[#e0e0ff]' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-[#2d2d4a] bg-[#12121f]/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md sticky top-0 z-40`}>
        <div className="mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-display)] tracking-tight text-gray-900 dark:text-[#e0e0ff] truncate">
                {t('app.title')}
              </h1>
              <span className={`text-sm hidden sm:inline ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>/</span>
              <span className={`text-sm font-medium hidden sm:inline ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`}>
                {t('simulate.title')}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <LanguageSwitcher theme={theme} />
              <button
                onClick={toggleTheme}
                className={`p-2 sm:p-2.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#252540]' : 'hover:bg-gray-100'}`}
                aria-label={t('common.toggleTheme')}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                className={`p-2 sm:p-2.5 rounded-lg ${isDark ? 'bg-[#252540] hover:bg-[#2d2d4a]' : 'bg-gray-100 hover:bg-gray-200'} transition-colors duration-200 group`}
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
        onParamsChange={() => { }}
        theme={theme}
      />

      {/* Main Content */}
      <main className="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
          {/* Input Section */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div className={`${isDark ? 'bg-[#1a1a2e] border-[#2d2d4a]' : 'bg-white border-gray-200'} rounded-2xl border overflow-hidden shadow-sm`}>
              <div className={`p-4 sm:p-6 border-b ${isDark ? 'border-[#2d2d4a]' : 'border-gray-200'}`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'} flex items-center gap-2`}>
                  <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
                  {t('input.section')}
                </h2>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-[#a0a0c0]' : 'text-gray-600'}`}>
                    {t('simulate.styleSourceText')} <span className="text-[#6366f1]">{t('simulate.styleSourceNote')}</span>
                  </label>
                  <textarea
                    className={`w-full h-40 sm:h-48 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border focus:ring-2 focus:ring-[#6366f1]/20 focus:outline-none transition-all duration-200 resize-none ${
                      isDark
                        ? 'bg-[#252540] border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080] focus:border-[#6366f1]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#6366f1]'
                    }`}
                    placeholder={t('simulate.styleSourcePlaceholder')}
                    value={styleSourceText}
                    onChange={(e) => setStyleSourceText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-[#a0a0c0]' : 'text-gray-600'}`}>
                    {t('simulate.targetText')} <span className="text-[#6366f1]">{t('simulate.targetNote')}</span>
                  </label>
                  <textarea
                    className={`w-full h-32 sm:h-36 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border focus:ring-2 focus:ring-[#6366f1]/20 focus:outline-none transition-all duration-200 resize-none ${
                      isDark
                        ? 'bg-[#252540] border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080] focus:border-[#6366f1]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#6366f1]'
                    }`}
                    placeholder={t('simulate.targetPlaceholder')}
                    value={targetText}
                    onChange={(e) => setTargetText(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div className="flex gap-3 sm:gap-4 pt-1 sm:pt-2">
                  <button
                    className="w-full sm:flex-1 px-4 sm:px-6 py-3 sm:py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] rounded-xl text-white font-medium transition-all duration-200 shadow-lg shadow-[#6366f1]/20 hover:shadow-[#6366f1]/30 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    onClick={handleSimulate}
                    disabled={isStreaming}
                  >
                    {isStreaming ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        {t('simulate.analyzing')}
                      </span>
                    ) : hasTargetText ? t('simulate.analyzeAndSimulate') : t('simulate.analyzeOnly')}
                  </button>
                </div>

                {error && (
                  <div role="alert" aria-live="polite" className={`p-3 sm:p-4 rounded-xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
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

          {/* Results Section - Waterfall */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            <div className={`${isDark ? 'bg-[#1a1a2e] border-[#2d2d4a]' : 'bg-white border-gray-200'} rounded-2xl border overflow-hidden shadow-sm h-full flex flex-col`}>
              <div className={`p-4 sm:p-6 border-b ${isDark ? 'border-[#2d2d4a]' : 'border-gray-200'} flex items-center justify-between`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'} flex items-center gap-2`}>
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  {t('simulate.reportSection')}
                </h2>
                <div className="flex items-center gap-2">
                  {fullText && (
                    <button
                      onClick={handleCopy}
                      className={`p-2 sm:p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${isDark ? 'hover:bg-[#252540] text-[#a0a0c0]' : 'hover:bg-gray-100 text-gray-500'}`}
                      aria-label={t('simulate.copyReport')}
                    >
                      {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div
                ref={outputRef}
                className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4"
                style={{ maxHeight: 'calc(100vh - 140px)' }}
              >
                {!hasContent && (
                  <div className="py-8 sm:py-12 text-center">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#252540] border-[#3d3d5c]' : 'bg-gray-100 border-gray-200'} border`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 sm:h-8 sm:w-8 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className={isDark ? 'text-[#606080]' : 'text-gray-400'}>{t('simulate.emptyState')}</p>
                  </div>
                )}

                {sections.map((section, idx) => {
                  const isImitation = idx === 0 && section.heading.includes('风格仿写');

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border overflow-hidden transition-all duration-500 ${
                        isDark
                          ? 'bg-[#252540] border-[#3d3d5c]'
                          : 'bg-gray-50 border-gray-200'
                      } ${section.isComplete ? 'opacity-100 translate-y-0' : 'animate-fade-in-up'}`}
                    >
                      {section.heading && (
                        <div className={`px-3 sm:px-4 py-2.5 sm:py-3 border-b ${isDark ? 'border-[#3d3d5c] bg-[#1a1a2e]/50' : 'border-gray-200 bg-white/50'} flex items-center justify-between`}>
                          <h3 className={`text-sm font-semibold ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`}>
                            {section.heading.replace(/^##\s+/, '')}
                          </h3>
                          {isImitation && !isStreaming && imitationBodyText && (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleCopyImitation(imitationBodyText)}
                                className={`p-2 sm:p-1.5 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${isDark ? 'hover:bg-[#3d3d5c] text-[#a0a0c0]' : 'hover:bg-gray-200 text-gray-500'}`}
                                title="复制仿写内容"
                              >
                                {imitationCopied ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => setEditorOpen(true)}
                                className={`p-2 sm:p-1.5 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${isDark ? 'hover:bg-[#3d3d5c] text-[#a0a0c0]' : 'hover:bg-gray-200 text-gray-500'}`}
                                title="编辑仿写内容"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-3 sm:p-4">
                        {isImitation && editedImitation !== null ? (
                          <div className={`whitespace-pre-wrap leading-relaxed text-sm ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>
                            {editedImitation}
                          </div>
                        ) : (
                          <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''} prose-headings:mt-0 prose-p:mt-1 prose-p:mb-1 prose-ul:mt-1 prose-ul:mb-1 prose-ol:mt-1 prose-ol:mb-1 prose-li:mt-0.5 prose-li:mb-0.5 prose-table:my-2 prose-th:py-1 prose-td:py-1 prose-pre:bg-transparent prose-pre:p-0`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {section.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        {!section.isComplete && isStreaming && (
                          <div className={`mt-2 flex items-center gap-1.5 text-xs ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`}>
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            {t('simulate.streaming')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isStreaming && sections.length === 0 && (
                  <div className={`rounded-xl border p-4 sm:p-6 text-center ${isDark ? 'bg-[#252540] border-[#3d3d5c]' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-[#6366f1]" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className={`text-sm ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>{t('simulate.analyzing')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ImitationEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        content={imitationBodyText}
        onSave={handleSaveImitation}
        theme={theme}
      />

      <DonateFab theme={theme} />

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
