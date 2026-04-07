import Image from 'next/image';

import { useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';

interface DonateFabProps {
  theme: 'light' | 'dark';
}

export default function DonateFab({ theme }: DonateFabProps) {
  const { t } = useI18n();
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3">

        {/* Donate Button */}
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-[#6366f1]/30 hover:shadow-[#6366f1]/50 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2"
          aria-label={t('donate.title')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{t('donate.title')}</span>
        </button>

        {/* Friend Link */}
        <a
          href="//safeclaw.top"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium shadow-lg transition-all duration-200 hover:scale-105 ${
            isDark
              ? 'bg-[#1a1a2e]/90 border border-[#3d3d5c] text-[#a0a0c0] hover:border-[#6366f1] hover:text-[#6366f1]'
              : 'bg-white/90 border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
          } backdrop-blur-sm`}
          aria-label="safeclaw.top"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          safeclaw
        </a>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div
            className={`relative w-full max-w-sm mx-4 rounded-2xl p-6 shadow-2xl animate-fade-in ${
              isDark ? 'bg-[#1a1a2e] border border-[#2d2d4a]' : 'bg-white border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-[#e0e0ff]' : 'text-gray-900'}`}>
                {t('donate.title')}
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

            <p className={`text-sm mb-4 ${isDark ? 'text-[#a0a0c0]' : 'text-gray-500'}`}>
              {t('donate.message')}
            </p>

            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-white' : 'bg-white border border-gray-200'}`}>
                <Image
                  src={'/author_qr.png'}
                  alt="WeChat QR Code"
                  width={224}
                  height={224}
                  className="object-contain"
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-[#07c160]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.42 6.42 0 01-.248-1.753c0-3.694 3.387-6.69 7.57-6.69.259 0 .51.022.764.042C16.833 4.904 13.14 2.188 8.691 2.188zm-2.6 4.408c.56 0 1.015.46 1.015 1.028 0 .566-.455 1.027-1.015 1.027-.56 0-1.016-.46-1.016-1.027 0-.567.456-1.028 1.016-1.028zm5.22 0c.56 0 1.015.46 1.015 1.028 0 .566-.455 1.027-1.015 1.027-.56 0-1.016-.46-1.016-1.027 0-.567.456-1.028 1.016-1.028zm4.516 3.832c-3.575 0-6.475 2.584-6.475 5.77 0 3.187 2.9 5.77 6.475 5.77a7.85 7.85 0 002.222-.318.67.67 0 01.558.076l1.48.867a.25.25 0 00.13.042.227.227 0 00.224-.228c0-.056-.022-.11-.037-.166l-.304-1.152a.458.458 0 01.165-.517C22.913 19.6 24 17.788 24 15.798c0-3.186-2.9-5.77-6.473-5.77zm-2.18 3.376c.435 0 .788.357.788.798a.794.794 0 01-.788.798.794.794 0 01-.787-.798c0-.44.352-.798.787-.798zm4.36 0c.435 0 .787.357.787.798a.794.794 0 01-.787.798.794.794 0 01-.788-.798c0-.44.353-.798.788-.798z" />
              </svg>
              <span className={`text-sm font-medium ${isDark ? 'text-[#e0e0ff]' : 'text-gray-700'}`}>
                {t('donate.wechat')}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
