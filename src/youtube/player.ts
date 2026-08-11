import { YOUTUBE_SELECTORS } from './selectors';

export interface PlayerState {
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  playbackRate: number;
}

export type PlayerEventCallback = (state: PlayerState, eventType: string) => void;

export class PlayerObserver {
  private videoElement: HTMLVideoElement | null = null;
  private callbacks: PlayerEventCallback[] = [];
  private boundHandler: (e: Event) => void;

  constructor() {
    this.boundHandler = this.handleVideoEvent.bind(this);
    this.findVideoElement();
  }

  public onPlayerEvent(callback: PlayerEventCallback): void {
    this.callbacks.push(callback);
  }

  public findVideoElement(): HTMLVideoElement | null {
    if (!this.videoElement || !document.contains(this.videoElement)) {
      const el = document.querySelector<HTMLVideoElement>(YOUTUBE_SELECTORS.VIDEO_PLAYER);
      if (el) {
        this.attachListeners(el);
      }
    }
    return this.videoElement;
  }

  private attachListeners(el: HTMLVideoElement): void {
    if (this.videoElement) {
      this.detachListeners();
    }
    this.videoElement = el;
    const events = ['play', 'pause', 'timeupdate', 'seeking', 'seeked', 'ended', 'ratechange'];
    events.forEach((evt) => {
      el.addEventListener(evt, this.boundHandler);
    });
  }

  private detachListeners(): void {
    if (this.videoElement) {
      const events = ['play', 'pause', 'timeupdate', 'seeking', 'seeked', 'ended', 'ratechange'];
      events.forEach((evt) => {
        this.videoElement?.removeEventListener(evt, this.boundHandler);
      });
      this.videoElement = null;
    }
  }

  private handleVideoEvent(e: Event): void {
    if (!this.videoElement) return;

    const state: PlayerState = {
      currentTime: this.videoElement.currentTime || 0,
      duration: this.videoElement.duration || 0,
      paused: this.videoElement.paused,
      ended: this.videoElement.ended,
      playbackRate: this.videoElement.playbackRate || 1,
    };

    this.callbacks.forEach((cb) => cb(state, e.type));
  }

  public getState(): PlayerState | null {
    const el = this.findVideoElement();
    if (!el) return null;
    return {
      currentTime: el.currentTime || 0,
      duration: el.duration || 0,
      paused: el.paused,
      ended: el.ended,
      playbackRate: el.playbackRate || 1,
    };
  }

  public destroy(): void {
    this.detachListeners();
    this.callbacks = [];
  }
}
