'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/context/theme-context';
import { useI18n } from '@/lib/i18n';
import { LLMConfig, StyleFeaturesV2 } from '@/types';
import LanguageSwitcher from '@/components/language-switcher';
import FeedbackDialog from '@/components/feedback-dialog';
import DonateFab from '@/components/donate-fab';

const STORAGE_KEY = 'analyze-settings';

function loadFromStorage(): Partial<LLMConfig> | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveToStorage(config: Partial<LLMConfig>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { }
}

export default function AnalyzePage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const { t } = useI18n();

  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<StyleFeaturesV2 | null>(null);
  const [error, setError] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const [config, setConfig] = useState<LLMConfig>(() => {
    const stored = loadFromStorage();
    return {
      provider: stored?.provider || 'deepseek',
      apiKey: stored?.apiKey || '',
      baseUrl: stored?.baseUrl || '',
      model: stored?.model || '',
      temperature: stored?.temperature ?? 0.7,
      maxTokens: stored?.maxTokens ?? 2000,
    };
  });

  useEffect(() => {
    saveToStorage(config);
  }, [config]);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) {
      setError(t('errors.noSampleText'));
      return;
    }
    if (text.trim().length < 100) {
      setError(t('errors.textTooShort', { count: text.trim().length.toString() }));
      return;
    }
    if (!config.apiKey) {
      setError(t('errors.noApiKey'));
      return;
    }

    setAnalyzing(true);
    setError('');
    setShowResult(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, config, version: 'v2' }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setResult(data.style);
      setShowResult(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.analysisFailed'));
    } finally {
      setAnalyzing(false);
    }
  }, [text, config, t]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !analyzing) {
      e.preventDefault();
      handleAnalyze();
    }
  }, [handleAnalyze, analyzing]);

  const toneLabelsV2: Record<string, string> = {
    formal: '正式',
    informal: '随意',
    neutral: '中性',
    humorous: '幽默',
    serious: '严肃',
    poetic: '诗意',
    technical: '技术',
  };

  const jargonLabels: Record<string, string> = {
    none: '无',
    low: '低',
    medium: '中',
    high: '高',
  };

  const paragraphLengthLabels: Record<string, string> = {
    uniform: '均匀',
    varied: '变化',
    progressive: '渐进',
  };

  const logicFlowLabels: Record<string, string> = {
    linear: '线性',
    circular: '循环',
    spiral: '螺旋',
    fragmented: '碎片化',
  };

  const perspectiveLabelsV2: Record<string, string> = {
    first: '第一人称',
    second: '第二人称',
    third: '第三人称',
    omniscient: '全知视角',
    mixed: '混合视角',
  };

  const distanceLabels: Record<string, string> = {
    close: '近距离',
    medium: '中距离',
    distant: '远距离',
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0f0f1a] text-[#e0e0ff]' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`border-b ${isDark ? 'border-[#2d2d4a] bg-[#1a1a2e]' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className={`text-xl font-bold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>
              {t('app.title')}
            </Link>
            <span className={`text-sm ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>/</span>
            <span className={`text-sm font-medium ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`}>
              风格分析
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher theme={theme} />
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#252540]' : 'hover:bg-gray-100'}`}
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
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-[#1a1a2e] border-[#2d2d4a]' : 'bg-white border-gray-200'} border shadow-sm`}>
          <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>
            文字风格分析
          </h1>

          <div className={`rounded-xl p-4 mb-6 ${isDark ? 'bg-[#252540]/50' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className={`label-text text-sm ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>Provider</span>
                </label>
                <select
                  className={`select select-sm bg-transparent border ${isDark ? 'border-[#3d3d5c] text-[#e0e0ff]' : 'border-gray-200 text-gray-700'} focus:border-[#6366f1] rounded-lg`}
                  value={config.provider}
                  onChange={(e) => setConfig({ ...config, provider: e.target.value as 'claude' | 'deepseek' })}
                >
                  <option value="deepseek">DeepSeek</option>
                  <option value="claude">Claude</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className={`label-text text-sm ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>Model</span>
                </label>
                <input
                  type="text"
                  className={`input input-sm bg-transparent border ${isDark ? 'border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080]' : 'border-gray-200 text-gray-700 placeholder-gray-400'} focus:border-[#6366f1] rounded-lg`}
                  value={config.model || ''}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  placeholder={config.provider === 'claude' ? 'claude-3-haiku-20240307' : 'deepseek-chat'}
                />
              </div>
            </div>

            <div className="form-control mt-3">
              <label className="label py-1">
                <span className={`label-text text-sm ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>API Key</span>
              </label>
              <input
                type="password"
                className={`input input-sm bg-transparent border ${isDark ? 'border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080]' : 'border-gray-200 text-gray-700 placeholder-gray-400'} focus:border-[#6366f1] rounded-lg`}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Enter API Key"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className={`flex justify-between items-center mb-2 ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>
              <label className="font-medium">输入文本</label>
              <span className={`text-sm ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>Ctrl + Enter 分析</span>
            </div>
            <textarea
              className={`textarea textarea-bordered w-full h-48 resize-none ${isDark ? 'bg-[#252540] border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080]' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]`}
              placeholder="请输入需要分析风格的文本..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className={`btn w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white border-none transition-all duration-200 rounded-xl h-12 text-base ${analyzing ? 'loading' : ''}`}
          >
            {analyzing ? t('input.analyzing') : t('input.analyze')}
          </button>
        </div>

        {showResult && result && (
          <div className={`mt-6 rounded-2xl p-6 ${isDark ? 'bg-[#1a1a2e] border-[#2d2d4a]' : 'bg-white border-gray-200'} border shadow-sm animate-fade-in`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg className={`w-5 h-5 ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className={`text-xl font-bold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>
                  分析结果
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {t('feedback.rate')}
                </button>
                <button
                  onClick={() => { setResult(null); setShowResult(false); }}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#252540] text-[#606080]' : 'hover:bg-gray-100 text-gray-400'}`}
                  aria-label="清除结果"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 核心指标 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-[#252540]' : 'bg-gray-50'}`}>
                <div className={`text-sm mb-2 ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>语气</div>
                <div className={`text-lg font-semibold mb-2 ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`}>
                  {toneLabelsV2[result.tone.primary]}
                </div>
                <div className="space-y-1">
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>正式程度</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${result.tone.formality}%` }} />
                  </div>
                  <div className={`text-xs text-right ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>{result.tone.formality}%</div>
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-[#252540]' : 'bg-gray-50'}`}>
                <div className={`text-sm mb-2 ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>可读性</div>
                <div className={`text-lg font-semibold mb-2 ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`}>
                  {result.overall.readability}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${result.overall.readability}%` }} />
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-[#252540]' : 'bg-gray-50'}`}>
                <div className={`text-sm mb-2 ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>词汇丰富度</div>
                <div className={`text-lg font-semibold mb-2 ${isDark ? 'text-[#6366f1]' : 'text-indigo-600'}`}>
                  {result.vocabulary.richness}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${result.vocabulary.richness}%` }} />
                </div>
              </div>
            </div>

            {/* 词汇分析 */}
            <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-[#252540]/50' : 'bg-gray-50'}`}>
              <div className={`text-sm font-medium mb-3 ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>词汇分析</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>平均词长</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.vocabulary.avgWordLength}</div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>独特词汇比</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{(result.vocabulary.uniqueWordsRatio * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>专业术语</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{jargonLabels[result.vocabulary.jargonLevel]}</div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>分析置信度</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.metadata.confidence}%</div>
                </div>
              </div>
              {result.vocabulary.signatureWords.length > 0 && (
                <div>
                  <div className={`text-xs mb-1 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>标志性词汇</div>
                  <div className="flex flex-wrap gap-2">
                    {result.vocabulary.signatureWords.map((word: string, i: number) => (
                      <span key={i} className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-[#1a1a2e] text-[#e0e0ff]' : 'bg-white text-gray-700'}`}>
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 句式结构 */}
            <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-[#252540]/50' : 'bg-gray-50'}`}>
              <div className={`text-sm font-medium mb-3 ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>句式结构</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>平均句长</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.sentenceStructure.avgSentenceLength}</div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>句式复杂度</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.sentenceStructure.complexity}%</div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>句式多样性</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.sentenceStructure.variety}%</div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>从句密度</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.sentenceStructure.clauseDensity}</div>
                </div>
              </div>
              {result.sentenceStructure.patterns.length > 0 && (
                <div>
                  <div className={`text-xs mb-1 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>句式模式</div>
                  <div className="flex flex-wrap gap-2">
                    {result.sentenceStructure.patterns.map((pattern: string, i: number) => (
                      <span key={i} className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-[#1a1a2e] text-[#e0e0ff]' : 'bg-white text-gray-700'}`}>
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 段落与结构 */}
            <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-[#252540]/50' : 'bg-gray-50'}`}>
              <div className={`text-sm font-medium mb-3 ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>段落与结构</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {/* <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>平均段落长度</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.length.avgParagraphLength}</div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>段落变化</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{paragraphLengthLabels[result.length.paragraphLength]}</div>
                </div> */}
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>连贯性</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.structure.coherence}%</div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>逻辑推进</div>
                  <div className={`font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{logicFlowLabels[result.structure.logicFlow]}</div>
                </div>
              </div>
              {result.structure.transitionStyle.length > 0 && (
                <div>
                  <div className={`text-xs mb-1 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>过渡方式</div>
                  <div className="flex flex-wrap gap-2">
                    {result.structure.transitionStyle.map((style: string, i: number) => (
                      <span key={i} className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-[#1a1a2e] text-[#e0e0ff]' : 'bg-white text-gray-700'}`}>
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 标点与人称 */}
            <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-[#252540]/50' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={`text-sm font-medium mb-3 ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>标点符号</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>感叹号频率</span>
                      <span className={`text-xs ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.punctuation.exclamationFreq}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>问号频率</span>
                      <span className={`text-xs ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.punctuation.questionFreq}%</span>
                    </div>
                    {result.punctuation.characteristics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.punctuation.characteristics.map((c: string, i: number) => (
                          <span key={i} className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-[#1a1a2e] text-[#e0e0ff]' : 'bg-white text-gray-700'}`}>
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className={`text-sm font-medium mb-3 ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>人称视角</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>主要视角</span>
                      <span className={`text-xs ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{perspectiveLabelsV2[result.perspective.primary]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>叙事距离</span>
                      <span className={`text-xs ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{distanceLabels[result.perspective.distance]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 整体分析 */}
            <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-[#252540]/50' : 'bg-gray-50'}`}>
              <div className={`text-sm font-medium mb-3 ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>整体分析</div>

              {result.overall.styleTags.length > 0 && (
                <div className="mb-4">
                  <div className={`text-xs mb-2 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>风格标签</div>
                  <div className="flex flex-wrap gap-2">
                    {result.overall.styleTags.map((tag: string, i: number) => (
                      <span key={i} className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-[#6366f1]/20 text-[#6366f1]' : 'bg-indigo-50 text-indigo-600'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className={`text-xs mb-1 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>目标受众</div>
                <div className={`text-sm ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>{result.overall.targetAudience}</div>
              </div>

              <div>
                <div className={`text-xs mb-1 ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>整体总结</div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-[#1a1a2e]' : 'bg-white'}`}>
                  <p className={`text-sm ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>{result.overall.summary}</p>
                </div>
              </div>
            </div>

            {/* 元数据 */}
            <div className={`text-xs ${isDark ? 'text-[#606080]' : 'text-gray-400'}`}>
              <span>文本字数: {result.metadata.textLength}</span>
              {result.metadata.limitations && result.metadata.limitations.length > 0 && (
                <div className="mt-2">
                  <span>局限性: {result.metadata.limitations.join(', ')}</span>
                </div>
              )}
            </div>

            {/* 底部评分按钮 */}
            <div className="mt-6 pt-4 border-t border-dashed flex justify-center">
              <button
                onClick={() => setFeedbackOpen(true)}
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
            </div>
          </div>
        )}

        <FeedbackDialog
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          featureType="analyze"
          analyzeResult={result}
          rewriteResult={null}
          simulateResult={null}
          theme={theme}
        />
      </main>

      <DonateFab theme={theme} />
    </div>
  );
}