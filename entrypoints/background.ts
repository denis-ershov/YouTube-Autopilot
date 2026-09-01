import { defineBackground } from 'wxt/sandbox';
import { getSettings, saveSettings, getRules, saveRule, deleteRule } from '../src/core/storage/storage';
import {
  saveVideoRecord,
  getVideoRecord,
  saveRuleExecution,
  isRuleActionExecuted,
} from '../src/database/indexeddb';
import { ExtensionMessage, ProgressUpdatePayload, VideoStartedPayload } from '../src/types/messages';
import { VideoRecord } from '../src/types/video';

/**
 * Фоновый Service Worker расширения YouTube Autopilot.
 * Централизованный координатор данных, хранилища IndexedDB и событий.
 */
export default defineBackground(() => {
  console.log('[YouTube Autopilot] Background Service Worker Initialized');

  // Слушатель внутренних сообщений расширения
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    handleMessage(message, sender)
      .then((response) => sendResponse(response))
      .catch((err) => {
        console.error('[YouTube Autopilot] Error handling message:', err);
        sendResponse({ success: false, error: err?.message || 'Unknown error' });
      });
    return true; // Асинхронный ответ
  });
});

async function handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case 'GET_SETTINGS': {
      const settings = await getSettings();
      return { success: true, settings };
    }

    case 'UPDATE_SETTINGS': {
      await saveSettings(message.payload as any);
      return { success: true };
    }

    case 'GET_RULES': {
      const rules = await getRules();
      return { success: true, rules };
    }

    case 'SAVE_RULE': {
      await saveRule(message.payload as any);
      return { success: true };
    }

    case 'DELETE_RULE': {
      await deleteRule(message.payload as string);
      return { success: true };
    }

    case 'VIDEO_STARTED': {
      const payload = message.payload as VideoStartedPayload;
      let video = await getVideoRecord(payload.videoId);

      if (!video) {
        video = {
          id: payload.videoId,
          url: payload.url,
          title: payload.title,
          channelName: payload.channelName,
          duration: payload.duration || 0,
          watchedSeconds: 0,
          watchedPercent: 0,
          intervals: [],
          firstWatchedAt: Date.now(),
          lastWatchedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else {
        video.lastWatchedAt = Date.now();
        video.updatedAt = Date.now();
        if (payload.duration > 0) video.duration = payload.duration;
        if (payload.title && payload.title !== 'YouTube Video') video.title = payload.title;
        if (payload.channelName) video.channelName = payload.channelName;
        if (payload.url) video.url = payload.url;
      }

      await saveVideoRecord(video);
      return { success: true, video };
    }

    case 'PROGRESS_UPDATE': {
      const payload = message.payload as ProgressUpdatePayload;
      let video = await getVideoRecord(payload.videoId);

      if (!video) {
        video = {
          id: payload.videoId,
          url: `https://www.youtube.com/watch?v=${payload.videoId}`,
          title: 'YouTube Video',
          duration: 0,
          watchedSeconds: payload.watchedSeconds,
          watchedPercent: payload.watchedPercent,
          intervals: payload.intervals,
          firstWatchedAt: Date.now(),
          lastWatchedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else {
        video.watchedSeconds = payload.watchedSeconds;
        video.watchedPercent = payload.watchedPercent;
        if (typeof payload.realWatchedSeconds === 'number') video.realWatchedSeconds = payload.realWatchedSeconds;
        if (typeof payload.realWatchedPercent === 'number') video.realWatchedPercent = payload.realWatchedPercent;
        if (typeof payload.maxPositionSeconds === 'number') video.maxPositionSeconds = payload.maxPositionSeconds;
        if (typeof payload.maxTimelinePercent === 'number') video.maxTimelinePercent = payload.maxTimelinePercent;
        video.intervals = payload.intervals;
        video.lastWatchedAt = Date.now();
        video.updatedAt = Date.now();

        if (video.watchedPercent >= 90 && !video.completedAt) {
          video.completedAt = Date.now();
        }
      }

      await saveVideoRecord(video);
      return { success: true };
    }

    case 'CHECK_RULE_EXECUTED': {
      const { videoId, ruleId, action } = message.payload as any;
      const executed = await isRuleActionExecuted(videoId, ruleId, action);
      return { success: true, executed };
    }

    case 'ACTION_EXECUTED_LOG': {
      const { ruleId, videoId, action, status, error } = message.payload as any;
      await saveRuleExecution({
        id: `${videoId}_${ruleId}_${action}_${Date.now()}`,
        ruleId,
        videoId,
        action,
        executedAt: Date.now(),
        status: status || 'success',
        errorMessage: error,
      });
      return { success: true };
    }

    default:
      return { success: false, message: 'Unknown message type' };
  }
}
