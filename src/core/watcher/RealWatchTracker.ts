import { WatchInterval } from '../../types/video';
import { WatchTrackingMode } from '../../types/settings';

export interface WatchTrackerStats {
  watchedSeconds: number;
  watchedPercent: number;
  intervals: WatchInterval[];
}

export class RealWatchTracker {
  private intervals: WatchInterval[] = [];
  private currentInterval: WatchInterval | null = null;
  private lastTime: number | null = null;
  private duration: number = 0;
  private mode: WatchTrackingMode = 'real';

  constructor(duration: number, mode: WatchTrackingMode = 'real', initialIntervals: WatchInterval[] = []) {
    this.duration = duration;
    this.mode = mode;
    this.intervals = this.mergeIntervals(initialIntervals);
  }

  public setDuration(duration: number): void {
    if (duration > 0) {
      this.duration = duration;
    }
  }

  public updateTime(currentTime: number, isPaused: boolean = false): WatchTrackerStats {
    if (this.duration <= 0) {
      return this.getStats();
    }

    if (isPaused) {
      this.closeCurrentInterval();
      return this.getStats();
    }

    if (this.mode === 'position') {
      // Простой расчет по текущей позиции плеера
      const posSec = Math.min(currentTime, this.duration);
      return {
        watchedSeconds: Math.round(posSec),
        watchedPercent: Math.min(100, Math.round((posSec / this.duration) * 100)),
        intervals: [[0, Math.round(posSec)]],
      };
    }

    // Режим 'real' или 'hybrid'
    if (this.lastTime === null) {
      this.lastTime = currentTime;
      this.currentInterval = [currentTime, currentTime];
      return this.getStats();
    }

    const timeDiff = currentTime - this.lastTime;

    // Детекция перемотки/скачка (более 2.5 секунд вперед или назад)
    if (timeDiff < 0 || timeDiff > 2.5) {
      // Закрыть старый интервал при скачке
      this.closeCurrentInterval();
      this.currentInterval = [currentTime, currentTime];
    } else {
      // Обычный просмотр: расширить текущий интервал
      if (!this.currentInterval) {
        this.currentInterval = [currentTime, currentTime];
      } else {
        this.currentInterval[1] = currentTime;
      }
    }

    this.lastTime = currentTime;
    return this.getStats();
  }

  public closeCurrentInterval(): void {
    if (this.currentInterval) {
      if (this.currentInterval[1] - this.currentInterval[0] > 0.5) {
        this.intervals.push([
          Math.round(this.currentInterval[0] * 10) / 10,
          Math.round(this.currentInterval[1] * 10) / 10,
        ]);
        this.intervals = this.mergeIntervals(this.intervals);
      }
      this.currentInterval = null;
    }
    this.lastTime = null;
  }

  public mergeIntervals(rawIntervals: WatchInterval[]): WatchInterval[] {
    if (rawIntervals.length <= 1) return [...rawIntervals];

    // Сортировка по времени начала
    const sorted = [...rawIntervals].sort((a, b) => a[0] - b[0]);
    const merged: WatchInterval[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = merged[merged.length - 1];

      if (current[0] <= prev[1]) {
        // Пересечение или наложение: объединить конец
        prev[1] = Math.max(prev[1], current[1]);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  public getStats(): WatchTrackerStats {
    // Слить сохраненные интервалы + текущий активный
    let allIntervals = [...this.intervals];
    if (this.currentInterval && this.currentInterval[1] - this.currentInterval[0] > 0.5) {
      allIntervals.push(this.currentInterval);
    }
    allIntervals = this.mergeIntervals(allIntervals);

    const watchedSeconds = allIntervals.reduce((sum, int) => sum + (int[1] - int[0]), 0);
    const roundedSeconds = Math.round(watchedSeconds);
    const watchedPercent = this.duration > 0 ? Math.min(100, Math.round((watchedSeconds / this.duration) * 100)) : 0;

    return {
      watchedSeconds: roundedSeconds,
      watchedPercent,
      intervals: allIntervals,
    };
  }
}
