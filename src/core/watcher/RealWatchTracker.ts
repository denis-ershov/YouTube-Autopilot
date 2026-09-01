import { WatchTrackingMode } from '../../types/settings';

export interface WatchTrackerStats {
  watchedSeconds: number; // Итоговые секунды согласно активному режиму
  watchedPercent: number; // Итоговый процент согласно активному режиму (0-100)
  realWatchedSeconds: number; // Строго фактически просмотренное время без перемоток
  realWatchedPercent: number; // Строго фактический процент просмотра
  maxPositionSeconds: number; // Максимальная достигнутая позиция ползунка на таймлайне
  maxTimelinePercent: number; // Максимальный процент по позиции ползунка (0-100)
  intervals: [number, number][]; // Уникальные объединенные интервалы
}

/**
 * Ядро расчета реального просмотра и отслеживания прогресса на таймлайне.
 * Поддерживает режимы:
 * 1. 'real' — учет строго реально просмотренных секунд (без перемоток).
 * 2. 'position' — учет с перемоткой: фиксация максимального положения ползунка на таймлайне.
 * 3. 'hybrid' — ползунок достиг порога (>=90%) И просмотрено не менее 15% видео (или 30 сек).
 */
export class RealWatchTracker {
  private intervals: [number, number][] = [];
  private currentInterval: [number, number] | null = null;
  private lastMediaTime: number | null = null;
  private lastWallTime: number | null = null;
  private isSeeking: boolean = false;
  private duration: number = 0;
  private mode: WatchTrackingMode = 'real';
  private maxPosition: number = 0; // Максимальная достигнутая позиция ползунка в секундах

  constructor(
    duration: number = 0,
    mode: WatchTrackingMode = 'real',
    initialIntervals: [number, number][] = [],
    initialMaxPosition: number = 0
  ) {
    this.duration = duration > 0 ? duration : 0;
    this.mode = mode;
    this.intervals = this.mergeIntervals(initialIntervals);

    // Восстанавливаем максимальную позицию ползунка
    let maxFromIntervals = 0;
    if (this.intervals.length > 0) {
      maxFromIntervals = Math.max(...this.intervals.map((i) => i[1]));
    }
    this.maxPosition = Math.max(initialMaxPosition, maxFromIntervals);
  }

  public setDuration(duration: number): void {
    if (duration > 0) {
      this.duration = duration;
    }
  }

  public setMode(mode: WatchTrackingMode): void {
    this.mode = mode;
  }

  /**
   * Вызывается при начале перемотки (событие 'seeking' плеера)
   */
  public onSeekStart(): void {
    this.isSeeking = true;
    this.closeCurrentInterval();
  }

  /**
   * Вызывается при окончании перемотки (событие 'seeked' плеера)
   */
  public onSeekEnd(newTime: number): void {
    this.isSeeking = false;
    if (newTime >= 0 && !Number.isNaN(newTime)) {
      this.maxPosition = Math.max(this.maxPosition, newTime);
      this.lastMediaTime = newTime;
      this.lastWallTime = Date.now();
      this.currentInterval = [newTime, newTime];
    }
  }

  /**
   * Основной метод обновления времени воспроизведения
   */
  public updateTime(
    currentTime: number,
    isPaused: boolean = false,
    playbackRate: number = 1
  ): WatchTrackerStats {
    if (currentTime < 0 || Number.isNaN(currentTime)) {
      return this.getStats();
    }

    // Фиксация максимальной достигнутой позиции ползунка на таймлайне
    this.maxPosition = Math.max(this.maxPosition, currentTime);

    if (isPaused) {
      this.closeCurrentInterval();
      return this.getStats();
    }

    if (this.isSeeking) {
      return this.getStats();
    }

    const now = Date.now();

    if (this.lastMediaTime === null || this.lastWallTime === null) {
      this.lastMediaTime = currentTime;
      this.lastWallTime = now;
      this.currentInterval = [currentTime, currentTime];
      return this.getStats();
    }

    const mediaDelta = currentTime - this.lastMediaTime;
    const wallDeltaSec = Math.max(0, (now - this.lastWallTime) / 1000);
    const effectiveRate = playbackRate > 0 ? playbackRate : 1;
    const expectedMediaDelta = wallDeltaSec * effectiveRate;

    // Детекция перемотки/скачка:
    // 1. Скачок назад более чем на 0.5 секунды
    // 2. Скачок вперед, существенно превышающий физически возможное время с учетом скорости
    const tolerance = Math.max(3.0, 2.5 * effectiveRate);
    const isForwardJump = mediaDelta - expectedMediaDelta > tolerance;
    const isBackwardJump = mediaDelta < -0.5;

    if (isForwardJump || isBackwardJump) {
      // Скачок/перемотка: фиксируем предыдущий интервал и начинаем новый
      this.closeCurrentInterval();
      this.currentInterval = [currentTime, currentTime];
    } else {
      // Обычный просмотр: расширяем текущий интервал
      if (!this.currentInterval) {
        this.currentInterval = [this.lastMediaTime, currentTime];
      } else {
        this.currentInterval[1] = Math.max(this.currentInterval[1], currentTime);
      }
    }

    this.lastMediaTime = currentTime;
    this.lastWallTime = now;
    return this.getStats();
  }

  /**
   * Зафиксировать текущий активный интервал и добавить его в общий список
   */
  public closeCurrentInterval(): void {
    if (this.currentInterval) {
      const start = this.currentInterval[0];
      const end = this.currentInterval[1];
      if (end - start >= 0.2) {
        this.intervals.push([
          Math.round(start * 10) / 10,
          Math.round(end * 10) / 10,
        ]);
        this.intervals = this.mergeIntervals(this.intervals);
      }
      this.currentInterval = null;
    }
    this.lastMediaTime = null;
    this.lastWallTime = null;
  }

  /**
   * Слияние пересекающихся или смежных интервалов просмотра
   */
  public mergeIntervals(rawIntervals: [number, number][]): [number, number][] {
    if (!rawIntervals || rawIntervals.length <= 1) {
      return rawIntervals ? [...rawIntervals] : [];
    }

    const sorted = [...rawIntervals].sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      // Если интервалы перекрываются или разрыв менее 0.3 секунды
      if (current[0] <= last[1] + 0.3) {
        last[1] = Math.max(last[1], current[1]);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Получение текущей статистики просмотра в соответствии с активным режимом
   */
  public getStats(): WatchTrackerStats {
    let allIntervals = [...this.intervals];
    if (this.currentInterval && this.currentInterval[1] - this.currentInterval[0] >= 0.2) {
      allIntervals.push(this.currentInterval);
    }
    allIntervals = this.mergeIntervals(allIntervals);

    // 1. Строго реальные секунды просмотра
    const rawRealSeconds = allIntervals.reduce((sum, int) => sum + Math.max(0, int[1] - int[0]), 0);
    const realWatchedSeconds = Math.round(rawRealSeconds);
    const realWatchedPercent =
      this.duration > 0
        ? Math.min(100, Math.round((rawRealSeconds / this.duration) * 100))
        : 0;

    // 2. Позиция ползунка на таймлайне
    const effectiveMaxPos = this.duration > 0 ? Math.min(this.duration, this.maxPosition) : this.maxPosition;
    const maxPositionSeconds = Math.round(effectiveMaxPos);
    const maxTimelinePercent =
      this.duration > 0
        ? Math.min(100, Math.round((effectiveMaxPos / this.duration) * 100))
        : 0;

    // 3. Вычисление итогового watchedSeconds и watchedPercent согласно режиму
    let watchedSeconds = realWatchedSeconds;
    let watchedPercent = realWatchedPercent;

    if (this.mode === 'position') {
      // Режим с учетом перемотки: прогресс определяется положением ползунка на таймлайне
      watchedSeconds = maxPositionSeconds;
      watchedPercent = maxTimelinePercent;
    } else if (this.mode === 'hybrid') {
      // Гибридный режим: ползунок достиг порога >= 90% И реально просмотрено хотя бы 15% (или 30 сек)
      const minRealSeconds = this.duration > 0 ? Math.min(30, this.duration * 0.15) : 0;
      if (realWatchedSeconds >= minRealSeconds && maxTimelinePercent >= 90) {
        watchedSeconds = maxPositionSeconds;
        watchedPercent = maxTimelinePercent;
      } else {
        watchedSeconds = realWatchedSeconds;
        watchedPercent = realWatchedPercent;
      }
    }

    return {
      watchedSeconds,
      watchedPercent,
      realWatchedSeconds,
      realWatchedPercent,
      maxPositionSeconds,
      maxTimelinePercent,
      intervals: allIntervals,
    };
  }
}
