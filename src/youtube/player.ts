import { YOUTUBE_SELECTORS } from './selectors';

export interface PlayerState {
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  playbackRate: number;
}

export type PlayerEventCallback = (state: PlayerState, eventType: string) => void;

/** Нормализует число из <video>: NaN, Infinity (live) и отрицательные значения → 0. */
function safeSeconds(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function readPlayerState(el: HTMLVideoElement): PlayerState {
  return {
    currentTime: safeSeconds(el.currentTime),
    duration: safeSeconds(el.duration),
    paused: el.paused,
    ended: el.ended,
    playbackRate: el.playbackRate || 1,
  };
}

/**
 * Наблюдатель за HTML5 Video элементом YouTube.
 * Обеспечивает реактивное переподключение при SPA-переходах,
 * смене тега <video>, рекламе и динамической загрузке плеера.
 */
export class PlayerObserver {
  private videoElement: HTMLVideoElement | null = null;
  private callbacks: PlayerEventCallback[] = [];
  private boundHandler: (e: Event) => void;
  private mutationObserver: MutationObserver | null = null;
  private checkIntervalId: number | null = null;

  private static readonly LISTENED_EVENTS = [
    'play',
    'pause',
    'timeupdate',
    'seeking',
    'seeked',
    'ended',
    'ratechange',
    'durationchange',
    'loadedmetadata',
  ];

  constructor() {
    this.boundHandler = this.handleVideoEvent.bind(this);
    this.initObserver();
    this.findVideoElement();
  }

  public onPlayerEvent(callback: PlayerEventCallback): void {
    this.callbacks.push(callback);
    // Если плеер уже существует и проигрывается, отправить текущее состояние
    if (this.videoElement) {
      const state = this.getState();
      if (state) callback(state, 'initial');
    }
  }

  /**
   * Инициализация MutationObserver и периодической проверки для реактивного обнаружения видео
   */
  private initObserver(): void {
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => {
        // Проверяем актуальность видеоэлемента при любых мутациях DOM
        if (!this.videoElement || !document.contains(this.videoElement)) {
          this.findVideoElement();
        }
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // Регулярная проверка на случай, если видеоэлемент был заменен без явной мутации body
    if (typeof window !== 'undefined') {
      this.checkIntervalId = window.setInterval(() => {
        if (!this.videoElement || !document.contains(this.videoElement)) {
          this.findVideoElement();
        }
      }, 1000);
    }
  }

  /**
   * Поиск активного HTML5 видео элемента с учетом Shorts и основного плеера
   */
  public findVideoElement(): HTMLVideoElement | null {
    const isShorts = window.location.pathname.startsWith('/shorts/');
    let el: HTMLVideoElement | null = null;

    if (isShorts) {
      el = document.querySelector<HTMLVideoElement>(YOUTUBE_SELECTORS.SHORTS_VIDEO_PLAYER);
    }

    if (!el) {
      el = document.querySelector<HTMLVideoElement>(YOUTUBE_SELECTORS.VIDEO_PLAYER);
    }

    // Если элемент не найден или не изменился и все еще в DOM
    if (!el) {
      return this.videoElement;
    }

    if (this.videoElement !== el || !document.contains(this.videoElement)) {
      this.attachListeners(el);
    }

    return this.videoElement;
  }

  private attachListeners(el: HTMLVideoElement): void {
    if (this.videoElement) {
      this.detachListeners();
    }
    this.videoElement = el;

    PlayerObserver.LISTENED_EVENTS.forEach((evt) => {
      el.addEventListener(evt, this.boundHandler);
    });
  }

  private detachListeners(): void {
    if (this.videoElement) {
      PlayerObserver.LISTENED_EVENTS.forEach((evt) => {
        this.videoElement?.removeEventListener(evt, this.boundHandler);
      });
      this.videoElement = null;
    }
  }

  private handleVideoEvent(e: Event): void {
    if (!this.videoElement) return;
    const state = readPlayerState(this.videoElement);

    this.callbacks.forEach((cb) => {
      try {
        cb(state, e.type);
      } catch (err) {
        console.error('[YouTube Autopilot] Error in player callback:', err);
      }
    });
  }

  public getState(): PlayerState | null {
    const el = this.findVideoElement();
    return el ? readPlayerState(el) : null;
  }

  public destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.checkIntervalId !== null) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    this.detachListeners();
    this.callbacks = [];
  }
}
