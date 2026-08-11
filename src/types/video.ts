/**
  * Отражает 1 конкретный просмотренный интервал времени [startInSec, endInSec]
  */
export type WatchInterval = [number, number];

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

export enum VideoState {
  NEW = 'NEW',
  WATCHING = 'WATCHING',
  PAUSED = 'PAUSED',
  PROGRESS = 'PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface VideoRecord {
  id: string; // YouTube Video ID (v=XXXXX)
  url: string;
  title: string;

  channelId?: string;
  channelName?: string;

  duration: number; // Общая продолжительность в секундах

  watchedSeconds: number; // Решение на основе суммы просмотренных интервалов
  watchedPercent: number; // Фактический процент (0-100)

  intervals: WatchInterval[]; // Сохраненные непересекающиеся интервалы

  firstWatchedAt?: number;
  lastWatchedAt?: number;
  completedAt?: number;

  liked?: boolean;
  saved?: boolean;

  source?: VideoSource;
  state?: VideoState;

  createdAt: number;
  updatedAt: number;
}
