'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { FeatureType, FeedbackData, AnalyzeFeedbackDimensions, RewriteFeedbackDimensions, SimulateFeedbackDimensions, StyleFeatures, StyleFeaturesV2 } from '@/types';

interface DimensionConfig {
  key: string;
  label: string;
}

const ANALYZE_DIMENSIONS: DimensionConfig[] = [
  { key: 'accuracy', label: 'feedback.dimensions.accuracy' },
  { key: 'usefulness', label: 'feedback.dimensions.usefulness' },
  { key: 'detail', label: 'feedback.dimensions.detail' },
];

const REWRITE_DIMENSIONS: DimensionConfig[] = [
  { key: 'quality', label: 'feedback.dimensions.quality' },
  { key: 'styleMatch', label: 'feedback.dimensions.styleMatch' },
  { key: 'readability', label: 'feedback.dimensions.readability' },
];

const SIMULATE_DIMENSIONS: DimensionConfig[] = [
  { key: 'reportQuality', label: 'feedback.dimensions.reportQuality' },
  { key: 'practicality', label: 'feedback.dimensions.practicality' },
  { key: 'readability', label: 'feedback.dimensions.readability' },
  { key: 'imitationQuality', label: 'feedback.dimensions.imitationQuality' },
  { key: 'styleMatch', label: 'feedback.dimensions.styleMatch' },
];

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureType: FeatureType;
  analyzeResult: StyleFeatures | StyleFeaturesV2 | null;
  rewriteResult: string | null;
  simulateResult: string | null;
  onSubmit?: (data: FeedbackData) => void;
  theme: 'light' | 'dark';
}

function StarRating({
  value,
  onChange,
  theme,
}: {
  value: number;
  onChange: (value: number) => void;
  theme: 'light' | 'dark';
}) {
  const isDark = theme === 'dark';
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${star} stars`}
        >
          <svg
            className="w-6 h-6"
            fill={(hover || value) >= star ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{
              color: (hover || value) >= star ? '#f59e0b' : isDark ? '#3d3d5c' : '#d1d5db',
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function FeedbackDialog({
  open,
  onOpenChange,
  featureType,
  analyzeResult,
  rewriteResult,
  simulateResult,
  onSubmit,
  theme,
}: FeedbackDialogProps) {
  const { t } = useI18n();
  const isDark = theme === 'dark';
  const dimensions = featureType === 'analyze' ? ANALYZE_DIMENSIONS : featureType === 'rewrite' ? REWRITE_DIMENSIONS : SIMULATE_DIMENSIONS;

  const [ratings, setRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(dimensions.map((d) => [d.key, 0])),
  );
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRatingChange = useCallback((key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const allRated = dimensions.every((d) => ratings[d.key] > 0);
    if (!allRated) return;

    setSubmitting(true);

    const dimensionValues =
      featureType === 'analyze'
        ? (ratings as unknown as AnalyzeFeedbackDimensions)
        : featureType === 'rewrite'
          ? (ratings as unknown as RewriteFeedbackDimensions)
          : (ratings as unknown as SimulateFeedbackDimensions);

    const feedbackData: FeedbackData = {
      featureType,
      dimensions: dimensionValues,
      comment,
      timestamp: new Date().toISOString(),
      analyzeResult,
      rewriteResult,
      simulateResult,
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) throw new Error('Submission failed');

      setSubmitted(true);
      onSubmit?.(feedbackData);
    } catch {
      alert(t('feedback.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [dimensions, ratings, featureType, comment, onSubmit, t, analyzeResult, rewriteResult, simulateResult]);

  const handleClose = useCallback(() => {
    setRatings(Object.fromEntries(dimensions.map((d) => [d.key, 0])));
    setComment('');
    setSubmitted(false);
    onOpenChange(false);
  }, [dimensions, onOpenChange]);

  if (!open) return null;

  const allRated = dimensions.every((d) => ratings[d.key] > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl animate-fade-in ${
          isDark ? 'bg-[#1a1a2e] border border-[#2d2d4a]' : 'bg-white border border-gray-200'
        }`}
      >
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>
              {t('feedback.thankYou')}
            </h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>
              {t('feedback.submitted')}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl font-medium transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>
                {t('feedback.title')}
              </h3>
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-[#252540] text-[#606080]' : 'hover:bg-gray-100 text-gray-400'
                }`}
                aria-label={t('common.close')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5 mb-6">
              {dimensions.map((dim) => (
                <div key={dim.key}>
                  <div className={`text-sm font-medium mb-2 ${isDark ? 'text-[#a0a0c0]' : 'text-gray-600'}`}>
                    {t(dim.label)}
                  </div>
                  <StarRating
                    value={ratings[dim.key]}
                    onChange={(value) => handleRatingChange(dim.key, value)}
                    theme={theme}
                  />
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#a0a0c0]' : 'text-gray-600'}`}>
                {t('feedback.comment')}
              </label>
              <textarea
                className={`w-full h-24 px-4 py-3 rounded-xl border resize-none focus:ring-2 focus:ring-[#6366f1]/20 focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#252540] border-[#3d3d5c] text-[#e0e0ff] placeholder-[#606080] focus:border-[#6366f1]'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#6366f1]'
                }`}
                placeholder={t('feedback.commentPlaceholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!allRated || submitting}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                allRated && !submitting
                  ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-lg shadow-[#6366f1]/20'
                  : isDark
                    ? 'bg-[#252540] text-[#606080] cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('feedback.submitting')}
                </span>
              ) : (
                t('feedback.submit')
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
