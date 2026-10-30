import { useEffect, useState } from 'react';
import { Play, ExternalLink, ShieldCheck, Heart, Globe } from 'lucide-react';
import { t, formatSeconds, setLanguage, getCurrentLanguage } from '../../src/i18n';
import { getSettings, saveSettings } from '../../src/core/storage/storage';
import { Settings } from '../../src/types/settings';
import { VideoRecord } from '../../src/types/video';
import { Logo } from '../../src/components/Logo';
import { safeSendMessage } from '../../src/core/utils/runtime';
import { getVideoIdFromUrl } from '../../src/youtube/url';

async function loadActiveTabVideo(): Promise<VideoRecord | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const videoId = tab?.url ? getVideoIdFromUrl(tab.url) : null;
  if (!videoId) return null;

  const res = await safeSendMessage<{ success: boolean; video?: VideoRecord }>({
    type: 'GET_VIDEO_RECORD',
    payload: videoId,
  });
  return res?.video ?? null;
}

function VideoProgress({ video, watchMode }: { video: VideoRecord; watchMode: Settings['watchMode'] }) {
  return (
    <>
      <div className="min-w-0">
        <h2 className="text-xs font-semibold text-zinc-100 line-clamp-2">{video.title}</h2>
        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
          {video.channelName || t('dashboard.history.creatorDefault')}
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-zinc-400">
          <span>{t('popup.watched')}</span>
          <span className="font-semibold text-brand-400">{video.watchedPercent}%</span>
        </div>
        <div
          className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={video.watchedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('popup.watched')}
        >
          <div
            className="bg-gradient-to-r from-brand-600 to-brand-400 h-full transition-all duration-200 rounded-full"
            style={{ width: `${video.watchedPercent}%` }}
          />
        </div>
        <div className="flex justify-between gap-2 text-[10px] text-zinc-500 pt-0.5">
          <span>
            {watchMode === 'position' ? t('popup.positionWatchTime') : t('popup.realWatchTime')}:{' '}
            {formatSeconds(video.watchedSeconds)}
          </span>
          <span>
            {t('popup.total')}: {formatSeconds(video.duration)}
          </span>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoRecord | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
    loadActiveTabVideo()
      .then(setCurrentVideo)
      .catch((err: unknown) => console.warn('[YouTube Autopilot] Active tab video unavailable:', err));
  }, []);

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center h-[480px] gap-3 text-zinc-400" aria-busy="true">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">{t('popup.loading')}</p>
      </div>
    );
  }

  const updateSettings = async (patch: Partial<Settings>) => {
    const updated = { ...settings, ...patch };
    if (patch.language) setLanguage(patch.language);
    setSettings(updated);
    await saveSettings(updated);
  };

  // Переключатель показывает фактический язык интерфейса, в том числе при 'auto'
  const effectiveLanguage = getCurrentLanguage();
  const openDashboard = () => chrome.runtime.openOptionsPage();

  return (
    <div className="flex flex-col h-[480px] text-zinc-100 p-4 select-none">
      <header className="flex items-center justify-between gap-2 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <Logo size={32} />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-wide text-zinc-100 truncate">{t('app.title')}</h1>
            <p className="text-[10px] text-zinc-400 truncate">{t('app.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => updateSettings({ language: effectiveLanguage === 'ru' ? 'en' : 'ru' })}
            title={t('popup.switchLanguage')}
            aria-label={t('popup.switchLanguage')}
            className="focus-ring min-h-11 flex items-center gap-1 px-2 rounded-md text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors duration-200"
          >
            <Globe className="w-3 h-3 text-zinc-400" aria-hidden="true" />
            <span>{effectiveLanguage.toUpperCase()}</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            aria-pressed={settings.enabled}
            aria-label={settings.enabled ? t('app.statusActive') : t('app.statusPaused')}
            className={`focus-ring min-h-11 flex items-center gap-1.5 px-2.5 rounded-full text-xs font-medium transition-colors duration-200 ${
              settings.enabled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${settings.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}
              aria-hidden="true"
            />
            <span>{settings.enabled ? t('common.on') : t('common.off')}</span>
          </button>
        </div>
      </header>

      <main className="my-4 flex-1 min-h-0">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-2">
          <span>{t('popup.currentVideo')}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-medium">
            {t(`popup.watchModeBadge.${settings.watchMode}`)}
          </span>
        </div>

        <div className="card p-3 space-y-3">
          {currentVideo ? (
            <VideoProgress video={currentVideo} watchMode={settings.watchMode} />
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-500 gap-2">
              <Play className="w-8 h-8 opacity-40" aria-hidden="true" />
              <p className="text-xs">{t('popup.noVideo')}</p>
            </div>
          )}
        </div>

        <div className="mt-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Heart className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{t('popup.nextAction')}</p>
              <p className="text-xs font-medium text-zinc-200">
                {t('popup.likeAt', { percent: settings.defaultThreshold })}
              </p>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400 opacity-80" aria-hidden="true" />
        </div>
      </main>

      <footer className="pt-3 border-t border-zinc-800">
        <button type="button" onClick={openDashboard} className="btn-primary w-full">
          <span>{t('popup.openDashboard')}</span>
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </footer>
    </div>
  );
}
