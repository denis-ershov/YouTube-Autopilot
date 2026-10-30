/**
 * Отражает 1 конкретный просмотренный интервал времени [startInSec, endInSec]
 */
export type WatchInterval = [number, number];

/** Процент, после которого видео считается досмотренным (статистика и фильтр истории). */
export const COMPLETION_PERCENT = 90;

/** Заглушка заголовка до загрузки метаданных YouTube. */
export const DEFAULT_VIDEO_TITLE = 'YouTube Video';

export enum VideoSource {
  WATCH_PAGE = 'WATCH_PAGE',
  SHORTS = 'SHORTS',
  SEARCH = 'SEARCH',
  HOME = 'HOME',
  RECOMMENDATION = 'RECOMMENDATION',
  WATCH_LATER = 'WATCH_LATER',
  PLAYLIST = 'PLAYLIST',
  CHANNEL = 'CHANNEL',
}

export interface VideoRecord {
  id: string; // YouTube Video ID (v=XXXXX)
  url: string;
  title: string;

  channelId?: string;
  channelName?: string;

  duration: number; // Общая продолжительность в секундах

  watchedSeconds: number; // Рассчитанные секунды на основе активного режима
  watchedPercent: number; // Рассчитанный процент (0-100)

  realWatchedSeconds?: number; // Строго фактически просмотренное время без перемоток
  realWatchedPercent?: number; // Процент строго фактического просмотра

  maxPositionSeconds?: number; // Максимальная достигнутая позиция ползунка на таймлайне
  maxTimelinePercent?: number; // Максимальный процент по позиции ползунка (0-100)

  intervals: WatchInterval[]; // Сохраненные непересекающиеся интервалы

  firstWatchedAt?: number;
  lastWatchedAt?: number;
  completedAt?: number;

  liked?: boolean;
  saved?: boolean;

  source?: VideoSource;

  createdAt: number;
  updatedAt: number;
}
