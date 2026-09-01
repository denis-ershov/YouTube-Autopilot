import React, { useEffect, useState } from 'react';
import { Play, ExternalLink, ShieldCheck, Heart, Globe } from 'lucide-react';
import { t, formatSeconds, setLanguage } from '../../src/i18n';
import { getSettings, saveSettings } from '../../src/core/storage/storage';
import { Settings as SettingsType, LanguageCode } from '../../src/types/settings';
import { VideoRecord } from '../../src/types/video';
import { Logo } from '../../src/components/Logo';
import { safeSendMessage } from '../../src/core/utils/runtime';

export default function App() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const s = await getSettings();
    setSettings(s);
    if (s?.language) {
      setLanguage(s.language);
    }

    // Запросить текущее видео у активной вкладки
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          try {
            const parsedUrl = new URL(tab.url);
            let videoId: string | null = null;
            if (parsedUrl.pathname === '/watch') {
              videoId = parsedUrl.searchParams.get('v');
            } else if (parsedUrl.pathname.startsWith('/shorts/')) {
              videoId = parsedUrl.pathname.split('/shorts/')[1]?.split('?')[0]?.split('/')[0] || null;
            }

            if (videoId) {
              const res = await safeSendMessage<{ success: boolean; video?: VideoRecord }>({
                type: 'GET_VIDEO_RECORD',
                payload: videoId,
              });
              if (res?.video) {
                setCurrentVideo(res.video);
              }
            }
          } catch {
            // URL parsing fallback
          }
        }
      }
    } catch (e) {
      console.warn('Chrome API unavailable in dev mode', e);
    }
    setLoading(false);
  };

  const toggleEnabled = async () => {
    if (!settings) return;
    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    await saveSettings(updated);
  };

  const toggleLanguage = async () => {
    if (!settings) return;
    const nextLang: LanguageCode = settings.language === 'ru' ? 'en' : 'ru';
    setLanguage(nextLang);
    const updated = { ...settings, language: nextLang };
    setSettings(updated);
    await saveSettings(updated);
  };

  const openDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    } else if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('../dashboard/index.html', '_blank');
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center h-[480px] space-y-3 bg-zinc-950 text-zinc-400">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">{t('popup.loading')}</p>
      </div>
    );
  }

  const modeBadgeText =
    t(`popup.watchModeBadge.${settings.watchMode}` as any) || settings.watchMode.toUpperCase();

  return (
    <div className="flex flex-col h-[480px] bg-zinc-950 text-zinc-100 p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center space-x-2.5">
          <Logo size={32} />
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-zinc-100">{t('app.title')}</h1>
            <p className="text-[10px] text-zinc-400">{t('app.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Language Toggle */}
          <button
            onClick={toggleLanguage}
            title={t('popup.switchLanguage')}
            aria-label={t('popup.switchLanguage')}
            className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
          >
            <Globe className="w-3 h-3 text-zinc-400" />
            <span>{settings.language === 'en' ? 'EN' : 'RU'}</span>
          </button>

          {/* Master Enable/Disable Toggle */}
          <button
            onClick={toggleEnabled}
            aria-label={settings.enabled ? t('app.statusActive') : t('app.statusPaused')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              settings.enabled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${settings.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
            <span>{settings.enabled ? t('common.on') : t('common.off')}</span>
          </button>
        </div>
      </div>

      {/* Current Video Section */}
      <div className="my-4 flex-1">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
          <span>{t('popup.currentVideo')}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-medium">
            {modeBadgeText}
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-3">
          {currentVideo ? (
            <>
              <div>
                <h2 className="text-xs font-semibold text-zinc-100 line-clamp-2">{currentVideo.title}</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">{currentVideo.channelName || t('dashboard.history.creatorDefault')}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>{t('popup.watched')}</span>
                  <span className="font-semibold text-brand-400">{currentVideo.watchedPercent}%</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-600 to-brand-400 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${currentVideo.watchedPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 pt-0.5">
                  <span>
                    {settings.watchMode === 'position' ? t('popup.positionWatchTime') : t('popup.realWatchTime')}:{' '}
                    {formatSeconds(currentVideo.watchedSeconds)}
                  </span>
                  <span>{t('popup.total')}: {formatSeconds(currentVideo.duration)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-500 space-y-2">
              <Play className="w-8 h-8 opacity-40" />
              <p className="text-xs">{t('popup.noVideo')}</p>
            </div>
          )}
        </div>

        {/* Next Action Indicator */}
        <div className="mt-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{t('popup.nextAction')}</p>
              <p className="text-xs font-medium text-zinc-200">
                {t('popup.likeAt', { percent: settings.defaultThreshold || 90 })}
              </p>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400 opacity-80" />
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
        <button
          onClick={openDashboard}
          className="flex-1 flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-brand-900/20"
        >
          <span>{t('popup.openDashboard')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
