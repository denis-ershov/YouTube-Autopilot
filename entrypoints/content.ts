import { defineContentScript } from 'wxt/sandbox';
import { YouTubeAdapter } from '../src/youtube/adapter';
import { RealWatchTracker } from '../src/core/watcher/RealWatchTracker';
import { RuleEngine } from '../src/core/rules/RuleEngine';
import { ActionEngine } from '../src/core/actions/ActionEngine';
import { getSettings, getRules } from '../src/core/storage/storage';
import { VideoRecord } from '../src/types/video';
import { Settings, DEFAULT_SETTINGS } from '../src/types/settings';
import { Rule } from '../src/types/rules';
import { t, setLanguage } from '../src/i18n';
import { safeSendMessage } from '../src/core/utils/runtime';

/**
 * Content Script расширения YouTube Autopilot.
 * Отвечает за интеграцию с DOM плеера YouTube, отслеживание реального прогресса,
 * отображение инлайн-виджета и выполнение настроенных правил автоматизации.
 */
export default defineContentScript({
  matches: ['https://*.youtube.com/*'],
  main() {
    console.log('[YouTube Autopilot] Content Script Mounted on YouTube');

    const adapter = new YouTubeAdapter();
    const actionEngine = new ActionEngine();
    let currentTracker: RealWatchTracker | null = null;
    let currentVideo: (VideoRecord & { isSubscribed?: boolean }) | null = null;
    let navTimeout: number | null = null;
    let lastProgressSentAt: number = 0;
    let lastRulesEvaluatedAt: number = 0;

    // Кэш настроек и правил для избежания избыточных запросов к хранилищу
    let cachedSettings: Settings = { ...DEFAULT_SETTINGS };
    let cachedRules: Rule[] = [];

    const refreshSettingsAndRules = async () => {
      try {
        const [s, r] = await Promise.all([getSettings(), getRules()]);
        if (s) {
          cachedSettings = s;
          if (s.language) setLanguage(s.language);
        }
        if (r) {
          cachedRules = r;
        }
      } catch (e) {
        console.warn('[YouTube Autopilot] Error refreshing settings/rules:', e);
      }
    };

    // Первичная загрузка настроек
    refreshSettingsAndRules();

    // Реактивное обновление кэша при изменении в хранилище
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === 'local') {
            if (changes.yt_autopilot_settings || changes.yt_autopilot_rules) {
              refreshSettingsAndRules();
            }
          }
        });
      }
    } catch (err) {
      console.debug('[YouTube Autopilot] storage.onChanged not available:', err);
    }

    /**
     * Немедленная безопасная отправка текущего прогресса на Background Service Worker
     */
    const flushProgress = () => {
      if (!currentVideo || !currentTracker) return;
      const stats = currentTracker.getStats();

      safeSendMessage({
        type: 'PROGRESS_UPDATE',
        payload: {
          videoId: currentVideo.id,
          watchedSeconds: stats.watchedSeconds,
          watchedPercent: stats.watchedPercent,
          realWatchedSeconds: stats.realWatchedSeconds,
          realWatchedPercent: stats.realWatchedPercent,
          maxPositionSeconds: stats.maxPositionSeconds,
          maxTimelinePercent: stats.maxTimelinePercent,
          intervals: stats.intervals,
        },
      });
    };

    // Отправка прогресса перед закрытием вкладки
    window.addEventListener('beforeunload', () => {
      flushProgress();
    });

    // Регистрация смены видео (SPA навигация)
    adapter.getNavigationObserver().onVideoChange(async (videoId, url) => {
      console.log(`[YouTube Autopilot] Navigated to video: ${videoId}`);

      // Очищаем предыдущий таймер навигации для исключения race conditions
      if (navTimeout !== null) {
        clearTimeout(navTimeout);
        navTimeout = null;
      }

      // Фиксируем прогресс предыдущего видео перед переключением
      flushProgress();

      navTimeout = window.setTimeout(async () => {
        const metadata = adapter.getCurrentMetadata();
        if (!metadata || metadata.id !== videoId) return;

        await refreshSettingsAndRules();

        try {
          // Уведомляем background и получаем сохраненный ранее прогресс (безопасная гидратация)
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

          const existingVideo = response?.video;
          const initialIntervals = existingVideo?.intervals || [];
          const initialSeconds = existingVideo?.watchedSeconds || 0;
          const initialPercent = existingVideo?.watchedPercent || 0;
          const initialMaxPos = existingVideo?.maxPositionSeconds || 0;

          // Инициализируем трекер с восстановленными интервалами и максимальной позицией
          currentTracker = new RealWatchTracker(
            metadata.duration,
            cachedSettings.watchMode,
            initialIntervals,
            initialMaxPos
          );

          currentVideo = {
            id: metadata.id,
            url: metadata.url,
            title: metadata.title,
            channelName: metadata.channelName,
            duration: metadata.duration,
            watchedSeconds: initialSeconds,
            watchedPercent: initialPercent,
            realWatchedSeconds: existingVideo?.realWatchedSeconds || initialSeconds,
            realWatchedPercent: existingVideo?.realWatchedPercent || initialPercent,
            maxPositionSeconds: initialMaxPos,
            maxTimelinePercent: existingVideo?.maxTimelinePercent || 0,
            intervals: initialIntervals,
            isSubscribed: metadata.isSubscribed,
            createdAt: existingVideo?.createdAt || Date.now(),
            updatedAt: Date.now(),
          };

          // Сразу обновляем индикатор в плеере восстановленным значением
          adapter
            .getOverlay()
            .renderOrUpdate(
              initialPercent,
              initialSeconds,
              t('player.likeAt', { percent: cachedSettings.defaultThreshold || 90 })
            );
        } catch (err) {
          console.warn('[YouTube Autopilot] VIDEO_STARTED fallback:', err);
          currentTracker = new RealWatchTracker(metadata.duration, cachedSettings.watchMode);
          currentVideo = {
            id: metadata.id,
            url: metadata.url,
            title: metadata.title,
            channelName: metadata.channelName,
            duration: metadata.duration,
            watchedSeconds: 0,
            watchedPercent: 0,
            realWatchedSeconds: 0,
            realWatchedPercent: 0,
            maxPositionSeconds: 0,
            maxTimelinePercent: 0,
            intervals: [],
            isSubscribed: metadata.isSubscribed,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        }
      }, 800);
    });

    // Регистрация событий плеера
    adapter.getPlayerObserver().onPlayerEvent(async (state, eventType) => {
      if (!currentTracker || !currentVideo) return;

      // Обработка явных событий перемотки плеера
      if (eventType === 'seeking') {
        currentTracker.onSeekStart();
        return;
      }

      if (eventType === 'seeked') {
        currentTracker.onSeekEnd(state.currentTime);
      }

      // Обновление длительности, когда видео загрузило метаданные
      if (state.duration > 0 && currentVideo.duration !== state.duration) {
        currentVideo.duration = state.duration;
        currentTracker.setDuration(state.duration);
      }

      // Основной расчет просмотра с учетом активного режима (real, position/перемотка, hybrid)
      const stats = currentTracker.updateTime(state.currentTime, state.paused, state.playbackRate);
      currentVideo.watchedSeconds = stats.watchedSeconds;
      currentVideo.watchedPercent = stats.watchedPercent;
      currentVideo.realWatchedSeconds = stats.realWatchedSeconds;
      currentVideo.realWatchedPercent = stats.realWatchedPercent;
      currentVideo.maxPositionSeconds = stats.maxPositionSeconds;
      currentVideo.maxTimelinePercent = stats.maxTimelinePercent;
      currentVideo.intervals = stats.intervals;

      // Обновить инлайн-индикатор плеера (Pixel Perfect, WCAG compliant)
      adapter
        .getOverlay()
        .renderOrUpdate(
          stats.watchedPercent,
          stats.watchedSeconds,
          t('player.likeAt', { percent: cachedSettings.defaultThreshold || 90 })
        );

      // Троттлинг отправки прогресса на background (не чаще 1 раза в 2 секунды)
      const now = Date.now();
      const isUrgent = eventType === 'pause' || eventType === 'ended';
      const shouldSendProgress = isUrgent || now - lastProgressSentAt >= 2000;

      if (shouldSendProgress) {
        lastProgressSentAt = now;

        safeSendMessage({
          type: 'PROGRESS_UPDATE',
          payload: {
            videoId: currentVideo.id,
            watchedSeconds: stats.watchedSeconds,
            watchedPercent: stats.watchedPercent,
            realWatchedSeconds: stats.realWatchedSeconds,
            realWatchedPercent: stats.realWatchedPercent,
            maxPositionSeconds: stats.maxPositionSeconds,
            maxTimelinePercent: stats.maxTimelinePercent,
            intervals: stats.intervals,
          },
        });
      }

      // Проверка и вычисление правил (не чаще 1 раза в 2 секунды для производительности)
      const shouldEvaluateRules = isUrgent || now - lastRulesEvaluatedAt >= 2000;
      if (shouldEvaluateRules && cachedRules.length > 0) {
        lastRulesEvaluatedAt = now;

        try {
          const plan = await actionEngine.filterExecutableActions(
            cachedRules,
            currentVideo,
            cachedSettings
          );

          for (const item of plan) {
            const isConditionMet = RuleEngine.evaluateRule(item.rule, currentVideo);
            if (isConditionMet) {
              if (cachedSettings.automationMode === 'approval') {
                showApprovalBanner(item.rule.name, item.action.type, async () => {
                  const res = await adapter.executeAction(item.action.type);
                  if (res.success) {
                    await actionEngine.recordExecutionSuccess(
                      item.rule.id,
                      item.video.id,
                      item.action.type
                    );
                  } else {
                    await actionEngine.recordExecutionFailure(
                      item.rule.id,
                      item.video.id,
                      item.action.type,
                      res.message || 'Action failed'
                    );
                  }
                });
              } else if (cachedSettings.automationMode === 'automatic') {
                const delayMs = (item.rule.delay || 0) * 1000;
                setTimeout(async () => {
                  const res = await adapter.executeAction(item.action.type);
                  if (res.success) {
                    await actionEngine.recordExecutionSuccess(
                      item.rule.id,
                      item.video.id,
                      item.action.type
                    );
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
        } catch (err) {
          console.warn('[YouTube Autopilot] Error evaluating automation rules:', err);
        }
      }
    });
  },
});

/**
 * Баннер подтверждения действия (UI/UX Pro Max, без эмодзи, векторная графика)
 */
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
    backdrop-filter: blur(16px);
    color: #f4f4f5;
    border: 1px solid rgba(63, 63, 70, 0.85);
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.7);
    font-family: 'YouTube Noto', Roboto, Arial, sans-serif;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 340px;
    transition: transform 0.2s ease, opacity 0.2s ease;
  `;

  // Шапка баннера
  const header = document.createElement('div');
  header.style.cssText = 'display: flex; align-items: center; gap: 8px; font-weight: 600; color: #3ea6ff; font-size: 13px;';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', '#3ea6ff');
  svg.setAttribute('stroke-width', '2.2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.style.cssText = 'flex-shrink: 0; display: block;';

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '3');
  rect.setAttribute('y', '11');
  rect.setAttribute('width', '18');
  rect.setAttribute('height', '10');
  rect.setAttribute('rx', '2');
  svg.appendChild(rect);

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '5');
  circle.setAttribute('r', '2');
  svg.appendChild(circle);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12 7v4');
  svg.appendChild(path);

  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', '8');
  line1.setAttribute('y1', '15');
  line1.setAttribute('x2', '8');
  line1.setAttribute('y2', '15.01');
  svg.appendChild(line1);

  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', '16');
  line2.setAttribute('y1', '15');
  line2.setAttribute('x2', '16');
  line2.setAttribute('y2', '15.01');
  svg.appendChild(line2);

  const titleSpan = document.createElement('span');
  titleSpan.textContent = t('app.title');
  header.appendChild(svg);
  header.appendChild(titleSpan);

  // Текст сообщения
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = 'font-size: 12px; color: #e4e4e7; line-height: 1.45;';
  messageDiv.appendChild(document.createTextNode(`${t('approval.rule')} `));

  const ruleB = document.createElement('b');
  ruleB.style.color = '#ffffff';
  ruleB.textContent = `"${ruleName}"`;
  messageDiv.appendChild(ruleB);

  messageDiv.appendChild(document.createTextNode(` ${t('approval.wantsTo')}: `));

  const actionB = document.createElement('b');
  actionB.style.color = '#3ea6ff';
  actionB.textContent = actionName;
  messageDiv.appendChild(actionB);

  // Кнопки управления
  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end; margin-top: 2px;';

  const skipBtn = document.createElement('button');
  skipBtn.id = 'yt-ap-skip';
  skipBtn.style.cssText =
    'background: transparent; color: #a1a1aa; border: 1px solid #3f3f46; border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 0.15s ease;';
  skipBtn.textContent = t('approval.skip');
  skipBtn.addEventListener('click', () => {
    banner.remove();
  });

  const allowBtn = document.createElement('button');
  allowBtn.id = 'yt-ap-allow';
  allowBtn.style.cssText =
    'background: #2563eb; color: #ffffff; border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s ease;';
  allowBtn.textContent = t('approval.allow');
  allowBtn.addEventListener('click', () => {
    onApprove();
    banner.remove();
  });

  btnContainer.appendChild(skipBtn);
  btnContainer.appendChild(allowBtn);

  banner.appendChild(header);
  banner.appendChild(messageDiv);
  banner.appendChild(btnContainer);

  document.body.appendChild(banner);

  setTimeout(() => {
    if (document.body.contains(banner)) {
      banner.remove();
    }
  }, 10000);
}
