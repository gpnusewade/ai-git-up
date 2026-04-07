'use client';

import { useI18n, Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  theme: 'light' | 'dark';
}

export default function LanguageSwitcher({ theme }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const isDark = theme === 'dark';
  const locales: Locale[] = ['zh-CN', 'zh-TW', 'en'];

  return (
    <select
      className={`select select-bordered select-sm ${
        isDark
          ? 'bg-[#252540] border-[#3d3d5c] text-[#e0e0ff]'
          : 'bg-gray-50 border-gray-300 text-gray-900'
      } focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]`}
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label="Language"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {t(`languages.${loc}`)}
        </option>
      ))}
    </select>
  );
}
