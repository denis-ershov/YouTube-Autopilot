import { defineContentScript } from 'wxt/sandbox';
import { YouTubeAdapter, CurrentVideoMetadata } from '../src/youtube/adapter';
import { showApprovalBanner } from '../src/youtube/approvalBanner';
import { getVideoIdFromUrl } from '../src/youtube/url';
import { RealWatchTracker, WatchTrackerStats } from '../src/core/watcher/RealWatchTracker';
import { ActionEngine, ActionPlanItem } from '../src/core/actions/ActionEngine';
import { RuleVideoContext } from '../src/core/rules/RuleEngine';
import { getActionLabel, getRuleDisplayName } from '../src/core/rules/labels';
import { getSettings, getRules, RULES_KEY, SETTINGS_KEY } from '../src/core/storage/storage';
import { VideoRecord } from '../src/types/video';
import { Settings, DEFAULT_SETTINGS } from '../src/types/settings';
import { Rule } from '../src/types/rules';
import { t } from '../src/i18n';
import { safeSendMessage } from '../src/core/utils/runtime';

const NAVIGATION_SETTLE_MS = 800;
const SYNC_INTERVAL_MS = 2000;

/**
 * Content Script расширения YouTube Autopilot.
 * Связывает адаптер YouTube DOM, трекер реального просмотра и движок правил:
 * считает прогресс, обновляет оверлей, синхронизирует прогресс с Background и запускает действия.
 */
export default defineContentScript({
  matches: ['https://*.youtube.com/*'],
  main() {
    const adapter = new YouTubeAdapter();
    const actionEngine = new ActionEngine();
    let currentTracker: RealWatchTracker | null = null;
    let currentVideo: RuleVideoContext | null = null;
    let navTimeout: number | null = null;
    let lastSyncAt = 0;

    // Кэш настроек и правил: исключает обращения к хранилищу на каждом timeupdate
    let cachedSettings: Settings = { ...DEFAULT_SETTINGS };
    let cachedRules: Rule[] = [];

    const refreshSettingsAndRules = async () => {
      try {
        [cachedSettings, cachedRules] = await Promise.all([getSettings(), getRules()]);
        currentTracker?.setMode(cachedSettings.watchMode);
      } catch (e) {
        console.warn('[YouTube Autopilot] Error refreshing settings/rules:', e);
      }
    };

    void refreshSettingsAndRules();

    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area === 'local' && (changes[SETTINGS_KEY] || changes[RULES_KEY])) {
        void refreshSettingsAndRules();
      }
    });

    const nextActionText = () => t('player.likeAt', { percent: cachedSettings.defaultThreshold });

    const sendProgress = (videoId: string, stats: WatchTrackerStats) => {
      void safeSendMessage({ type: 'PROGRESS_UPDATE', payload: { videoId, ...stats } });
    };

    const flushProgress = () => {
      if (currentVideo && currentTracker) sendProgress(currentVideo.id, currentTracker.getStats());
    };

    window.addEventListener('beforeunload', flushProgress);

    // --- Выполнение действий -------------------------------------------------

    const approvalQueue: ActionPlanItem[] = [];
    let approvalVisible = false;

    const runAction = async (item: ActionPlanItem) => {
      // Пока ждали задержку или подтверждение, пользователь мог уйти на другое видео
      if (getVideoIdFromUrl(window.location.href) !== item.video.id) {
        actionEngine.dismiss(item);
        return;
      }
      const res = await adapter.executeAction(item.action.type);
      if (res.success) {
        await actionEngine.recordSuccess(item);
      } else {
        await actionEngine.recordFailure(item, res.message || 'Action failed');
      }
    };

    const showNextApproval = () => {
      const item = approvalQueue.shift();
      if (!item) {
        approvalVisible = false;
        return;
      }
      approvalVisible = true;
      showApprovalBanner({
        ruleName: getRuleDisplayName(item.rule),
        actionLabel: getActionLabel(item.action.type),
        onApprove: () => {
          void runAction(item);
          showNextApproval();
        },
        onDismiss: () => {
          actionEngine.dismiss(item);
          showNextApproval();
        },
      });
    };

    const dispatchPlan = (plan: ActionPlanItem[]) => {
      for (const item of plan) {
        if (cachedSettings.automationMode === 'approval') {
          approvalQueue.push(item);
        } else {
          window.setTimeout(() => void runAction(item), (item.rule.delay ?? 0) * 1000);
        }
      }
      if (!approvalVisible) showNextApproval();
    };

    // --- Смена видео (SPA-навигация) ----------------------------------------

    const startTracking = async (metadata: CurrentVideoMetadata) => {
      await refreshSettingsAndRules();

      // Гидратация: Background возвращает сохранённый ранее прогресс видео
      const response = await safeSendMessage<{ success: boolean; video?: VideoRecord }>({
        type: 'VIDEO_STARTED',
        payload: {
          videoId: metadata.id,
          url: metadata.url,
          title: metadata.title,
          channelName: metadata.channelName,
          duration: metadata.duration,
        },
      });
      const saved = response?.video;

      currentTracker = new RealWatchTracker(
        metadata.duration,
        cachedSettings.watchMode,
        saved?.intervals ?? [],
        saved?.maxPositionSeconds ?? 0
      );
      const stats = currentTracker.getStats();

      currentVideo = {
        id: metadata.id,
        url: metadata.url,
        title: metadata.title,
        channelName: metadata.channelName,
        duration: metadata.duration,
        ...stats,
        isSubscribed: metadata.isSubscribed,
        isShort: metadata.isShort,
        createdAt: saved?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };

      adapter.getOverlay().renderOrUpdate(stats.watchedPercent, stats.watchedSeconds, nextActionText());
    };

    adapter.getNavigationObserver().onVideoChange((videoId) => {
      if (navTimeout !== null) clearTimeout(navTimeout);

      // Фиксируем прогресс предыдущего видео и отвязываемся от него до загрузки нового
      flushProgress();
      currentTracker = null;
      currentVideo = null;

      // Даём YouTube дорисовать метаданные нового видео
      navTimeout = window.setTimeout(() => {
        navTimeout = null;
        const metadata = adapter.getCurrentMetadata();
        if (!metadata || metadata.id !== videoId) return;
        startTracking(metadata).catch((err) => console.warn('[YouTube Autopilot] Tracking start failed:', err));
      }, NAVIGATION_SETTLE_MS);
    });

    // --- События плеера -----------------------------------------------------

    adapter.getPlayerObserver().onPlayerEvent((state, eventType) => {
      if (!currentTracker || !currentVideo) return;

      if (eventType === 'seeking') {
        currentTracker.onSeekStart();
        return;
      }
      if (eventType === 'seeked') {
        currentTracker.onSeekEnd(state.currentTime);
      }

      if (state.duration > 0 && currentVideo.duration !== state.duration) {
        currentVideo.duration = state.duration;
        currentTracker.setDuration(state.duration);
      }

      const stats = currentTracker.updateTime(state.currentTime, state.paused, state.playbackRate);
      Object.assign(currentVideo, stats);
      adapter.getOverlay().renderOrUpdate(stats.watchedPercent, stats.watchedSeconds, nextActionText());

      // Синхронизация с Background и проверка правил — не чаще раза в 2 секунды (и сразу при паузе/конце)
      const now = Date.now();
      const isUrgent = eventType === 'pause' || eventType === 'ended';
      if (!isUrgent && now - lastSyncAt < SYNC_INTERVAL_MS) return;
      lastSyncAt = now;

      sendProgress(currentVideo.id, stats);
      if (cachedRules.length === 0) return;

      actionEngine
        .planActions(cachedRules, currentVideo, cachedSettings)
        .then(dispatchPlan)
        .catch((err) => console.warn('[YouTube Autopilot] Error evaluating automation rules:', err));
    });
  },
});
