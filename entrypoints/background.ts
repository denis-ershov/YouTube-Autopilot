import { defineBackground } from 'wxt/sandbox';
import { getSettings, saveSettings, getRules, saveRule, deleteRule } from '../src/core/storage/storage';
import {
  saveVideoRecord,
  getVideoRecord,
  saveRuleExecution,
  isActionExecuted,
} from '../src/database/indexeddb';
import {
  ActionExecutedLogPayload,
  CheckActionExecutedPayload,
  ExtensionMessage,
  ProgressUpdatePayload,
  VideoStartedPayload,
} from '../src/types/messages';
import { Settings } from '../src/types/settings';
import { Rule } from '../src/types/rules';
import { COMPLETION_PERCENT, DEFAULT_VIDEO_TITLE, VideoRecord } from '../src/types/video';

/**
 * Фоновый Service Worker расширения YouTube Autopilot.
 * Единственный писатель IndexedDB: принимает прогресс и логи действий от Content Script
 * и отдаёт данные Popup.
 */
export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message)
      .then((response) => sendResponse(response))
      .catch((err: unknown) => {
        console.error('[YouTube Autopilot] Error handling message:', err);
        sendResponse({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
      });
    return true; // Асинхронный ответ
  });
});

function createVideoRecord(videoId: string, partial: Partial<VideoRecord>): VideoRecord {
  const now = Date.now();
  return {
    id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: DEFAULT_VIDEO_TITLE,
    duration: 0,
    watchedSeconds: 0,
    watchedPercent: 0,
    intervals: [],
    firstWatchedAt: now,
    lastWatchedAt: now,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

async function handleVideoStarted(payload: VideoStartedPayload): Promise<VideoRecord> {
  const existing = await getVideoRecord(payload.videoId);
  const video =
    existing ??
    createVideoRecord(payload.videoId, {
      url: payload.url,
      title: payload.title,
      channelName: payload.channelName,
      duration: payload.duration || 0,
    });

  if (existing) {
    const now = Date.now();
    video.lastWatchedAt = now;
    video.updatedAt = now;
    if (payload.duration > 0) video.duration = payload.duration;
    if (payload.title && payload.title !== DEFAULT_VIDEO_TITLE) video.title = payload.title;
    if (payload.channelName) video.channelName = payload.channelName;
    if (payload.url) video.url = payload.url;
  }

  await saveVideoRecord(video);
  return video;
}

async function handleProgressUpdate(payload: ProgressUpdatePayload): Promise<void> {
  const video = (await getVideoRecord(payload.videoId)) ?? createVideoRecord(payload.videoId, {});
  const now = Date.now();

  video.watchedSeconds = payload.watchedSeconds;
  video.watchedPercent = payload.watchedPercent;
  if (typeof payload.realWatchedSeconds === 'number') video.realWatchedSeconds = payload.realWatchedSeconds;
  if (typeof payload.realWatchedPercent === 'number') video.realWatchedPercent = payload.realWatchedPercent;
  if (typeof payload.maxPositionSeconds === 'number') video.maxPositionSeconds = payload.maxPositionSeconds;
  if (typeof payload.maxTimelinePercent === 'number') video.maxTimelinePercent = payload.maxTimelinePercent;
  video.intervals = payload.intervals;
  video.lastWatchedAt = now;
  video.updatedAt = now;

  if (video.watchedPercent >= COMPLETION_PERCENT && !video.completedAt) {
    video.completedAt = now;
  }

  await saveVideoRecord(video);
}

async function handleActionExecuted(payload: ActionExecutedLogPayload): Promise<void> {
  const { ruleId, videoId, action, status, error } = payload;
  const executedAt = Date.now();

  await saveRuleExecution({
    id: `${videoId}_${ruleId}_${action}_${executedAt}`,
    ruleId,
    videoId,
    action,
    executedAt,
    status,
    errorMessage: error,
  });

  // Синхронизация флагов видео для фильтров истории Dashboard
  if (status !== 'success' || (action !== 'LIKE_VIDEO' && action !== 'SAVE_VIDEO')) return;
  const video = await getVideoRecord(videoId);
  if (!video) return;
  if (action === 'LIKE_VIDEO') video.liked = true;
  if (action === 'SAVE_VIDEO') video.saved = true;
  video.updatedAt = executedAt;
  await saveVideoRecord(video);
}

async function handleMessage(message: ExtensionMessage) {
  switch (message.type) {
    case 'GET_SETTINGS':
      return { success: true, settings: await getSettings() };

    case 'UPDATE_SETTINGS':
      await saveSettings(message.payload as Settings);
      return { success: true };

    case 'GET_RULES':
      return { success: true, rules: await getRules() };

    case 'SAVE_RULE':
      await saveRule(message.payload as Rule);
      return { success: true };

    case 'DELETE_RULE':
      await deleteRule(message.payload as string);
      return { success: true };

    case 'GET_VIDEO_RECORD':
      return { success: true, video: await getVideoRecord(message.payload as string) };

    case 'VIDEO_STARTED':
      return { success: true, video: await handleVideoStarted(message.payload as VideoStartedPayload) };

    case 'PROGRESS_UPDATE':
      await handleProgressUpdate(message.payload as ProgressUpdatePayload);
      return { success: true };

    case 'CHECK_ACTION_EXECUTED': {
      const { videoId, action } = message.payload as CheckActionExecutedPayload;
      return { success: true, executed: await isActionExecuted(videoId, action) };
    }

    case 'ACTION_EXECUTED_LOG':
      await handleActionExecuted(message.payload as ActionExecutedLogPayload);
      return { success: true };

    default:
      return { success: false, error: 'Unknown message type' };
  }
}
