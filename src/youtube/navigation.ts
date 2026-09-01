export type NavigationCallback = (videoId: string, url: string) => void;

/**
 * Наблюдатель за Single Page Application (SPA) навигацией YouTube.
 * Отслеживает смену видео через yt-navigate-finish и мутации URL.
 */
export class YouTubeNavigationObserver {
  private lastVideoId: string | null = null;
  private callbacks: NavigationCallback[] = [];
  private observer: MutationObserver | null = null;

  constructor() {
    this.initListeners();
  }

  public onVideoChange(callback: NavigationCallback): void {
    this.callbacks.push(callback);
    // Запустить сразу, если видео уже открыто, и немедленно зафиксировать lastVideoId
    const currentId = this.getVideoIdFromUrl(window.location.href);
    if (currentId) {
      this.lastVideoId = currentId;
      try {
        callback(currentId, window.location.href);
      } catch (err) {
        console.error('[YouTube Autopilot] Initial navigation callback error:', err);
      }
    }
  }

  public getVideoIdFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      } else if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/shorts/')[1]?.split('?')[0]?.split('/')[0] || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private initListeners(): void {
    // 1. YouTube SPA Event Listener
    window.addEventListener('yt-navigate-finish', () => {
      this.checkUrlChange();
    });

    // 2. Fallback URL Mutation Observer
    let lastHref = window.location.href;
    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => {
        if (window.location.href !== lastHref) {
          lastHref = window.location.href;
          this.checkUrlChange();
        }
      });

      this.observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  private checkUrlChange(): void {
    const videoId = this.getVideoIdFromUrl(window.location.href);
    if (videoId && videoId !== this.lastVideoId) {
      this.lastVideoId = videoId;
      this.callbacks.forEach((cb) => {
        try {
          cb(videoId, window.location.href);
        } catch (err) {
          console.error('[YouTube Autopilot] SPA navigation callback error:', err);
        }
      });
    }
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.callbacks = [];
  }
}
