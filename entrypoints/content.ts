import { defineContentScript } from 'wxt/sandbox';
import { YouTubeAdapter } from '../src/youtube/adapter';
import { RealWatchTracker } from '../src/core/watcher/RealWatchTracker';
import { RuleEngine } from '../src/core/rules/RuleEngine';
import { ActionEngine } from '../src/core/actions/ActionEngine';
import { getSettings, getRules } from '../src/core/storage/storage';
import { VideoRecord } from '../src/types/video';
import { t, setLanguage } from '../src/i18n';

export default defineContentScript({
  matches: ['https://*.youtube.com/*'],
  main() {
    console.log('[YouTube Autopilot] Content Script Mounted on YouTube');

    const adapter = new YouTubeAdapter();
    const actionEngine = new ActionEngine();
    let currentTracker: RealWatchTracker | null = null;
    let currentVideo: (VideoRecord & { isSubscribed?: boolean }) | null = null;

    // Инициализировать язык настроек
    getSettings().then((s) => {
      if (s?.language) {
        setLanguage(s.language);
      }
    });

    // Регистрация смены видео (SPA навигация)
    adapter.getNavigationObserver().onVideoChange(async (videoId, url) => {
      console.log(`[YouTube Autopilot] Navigated to video: ${videoId}`);

      setTimeout(async () => {
        const metadata = adapter.getCurrentMetadata();
        if (!metadata) return;

        const settings = await getSettings();
        if (settings?.language) {
          setLanguage(settings.language);
        }

        // Отправить уведомление на background
        chrome.runtime.sendMessage({
          type: 'VIDEO_STARTED',
          payload: {
            videoId: metadata.id,
            url: metadata.url,
            title: metadata.title,
            channelName: metadata.channelName,
            duration: metadata.duration,
          },
        });

        // Создать трекер
        currentTracker = new RealWatchTracker(metadata.duration, settings.watchMode);

        currentVideo = {
          id: metadata.id,
          url: metadata.url,
          title: metadata.title,
          channelName: metadata.channelName,
          duration: metadata.duration,
          watchedSeconds: 0,
          watchedPercent: 0,
          intervals: [],
          isSubscribed: metadata.isSubscribed,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }, 1000);
    });

    // Регистрация событий плеера
    adapter.getPlayerObserver().onPlayerEvent(async (state, eventType) => {
      if (!currentTracker || !currentVideo) return;

      if (state.duration > 0 && currentVideo.duration !== state.duration) {
        currentVideo.duration = state.duration;
        currentTracker.setDuration(state.duration);
      }

      const stats = currentTracker.updateTime(state.currentTime, state.paused);
      currentVideo.watchedSeconds = stats.watchedSeconds;
      currentVideo.watchedPercent = stats.watchedPercent;
      currentVideo.intervals = stats.intervals;

      // Обновить инлайн-индикатор плеера
      adapter.getOverlay().renderOrUpdate(stats.watchedPercent, stats.watchedSeconds, t('player.likeAt', { percent: 90 }));

      // Отправлять обновление прогресса на background каждые ~2 секунды
      if (eventType === 'timeupdate' || eventType === 'pause' || eventType === 'ended') {
        chrome.runtime.sendMessage({
          type: 'PROGRESS_UPDATE',
          payload: {
            videoId: currentVideo.id,
            watchedSeconds: stats.watchedSeconds,
            watchedPercent: stats.watchedPercent,
            intervals: stats.intervals,
          },
        });

        // Проверка и вычисление правил
        const settings = await getSettings();
        if (settings?.language) {
          setLanguage(settings.language);
        }
        const rules = await getRules();

        const plan = await actionEngine.filterExecutableActions(rules, currentVideo, settings);

        for (const item of plan) {
          const isConditionMet = RuleEngine.evaluateRule(item.rule, currentVideo);
          if (isConditionMet) {
            if (settings.automationMode === 'approval') {
              showApprovalBanner(item.rule.name, item.action.type, async () => {
                const res = await adapter.executeAction(item.action.type);
                if (res.success) {
                  await actionEngine.recordExecutionSuccess(item.rule.id, item.video.id, item.action.type);
                } else {
                  await actionEngine.recordExecutionFailure(
                    item.rule.id,
                    item.video.id,
                    item.action.type,
                    res.message || 'Action failed'
                  );
                }
              });
            } else if (settings.automationMode === 'automatic') {
              const delayMs = (item.rule.delay || 0) * 1000;
              setTimeout(async () => {
                const res = await adapter.executeAction(item.action.type);
                if (res.success) {
                  await actionEngine.recordExecutionSuccess(item.rule.id, item.video.id, item.action.type);
                } else {
                  await actionEngine.recordExecutionFailure(
                    item.rule.id,
                    item.video.id,
                    item.action.type,
                    res.message || 'Action failed'
                  );
                }
              }, delayMs);
            }
          }
        }
      }
    });
  },
});

function showApprovalBanner(ruleName: string, actionType: string, onApprove: () => void) {
  const existing = document.getElementById('yt-autopilot-approval-banner');
  if (existing) existing.remove();

  const actionName = t(`common.actions.${actionType}` as any) || actionType;

  const banner = document.createElement('div');
  banner.id = 'yt-autopilot-approval-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: rgba(24, 24, 27, 0.96);
    backdrop-filter: blur(12px);
    color: #f4f4f5;
    border: 1px solid rgba(63, 63, 70, 0.8);
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
    font-family: 'YouTube Noto', Roboto, Arial, sans-serif;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 340px;
  `;

  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #3ea6ff; font-size: 13px;">
      <span>🤖</span>
      <span>${t('app.title')}</span>
    </div>
    <div style="font-size: 12px; color: #e4e4e7; line-height: 1.4;">
      ${t('approval.rule')} <b>"${ruleName}"</b> ${t('approval.wantsTo')}: <b style="color: #3ea6ff;">${actionName}</b>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
      <button id="yt-ap-skip" style="background: transparent; color: #a1a1aa; border: 1px solid #3f3f46; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer;">${t('approval.skip')}</button>
      <button id="yt-ap-allow" style="background: #2563eb; color: #fff; border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer;">${t('approval.allow')}</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('yt-ap-allow')?.addEventListener('click', () => {
    onApprove();
    banner.remove();
  });

  document.getElementById('yt-ap-skip')?.addEventListener('click', () => {
    banner.remove();
  });

  setTimeout(() => {
    if (document.body.contains(banner)) {
      banner.remove();
    }
  }, 10000);
}
