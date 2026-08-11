export type NavigationCallback = (videoId: string, url: string) => void;

export class YouTubeNavigationObserver {
  private lastVideoId: string | null = null;
  private callbacks: NavigationCallback[] = [];
  private observer: MutationObserver | null = null;

  constructor() {
    this.initListeners();
  }

  public onVideoChange(callback: NavigationCallback): void {
    this.callbacks.push(callback);
    // Запустить сразу, если видео уже загружено
    const currentId = this.getVideoIdFromUrl(window.location.href);
    if (currentId) {
      callback(currentId, window.location.href);
    }
  }

  public getVideoIdFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      } else if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/shorts/')[1]?.split('?')[0] || null;
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
    this.observer = new MutationObserver(() => {
      if (window.location.href !== lastHref) {
        lastHref = window.location.href;
        this.checkUrlChange();
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  private checkUrlChange(): void {
    const videoId = this.getVideoIdFromUrl(window.location.href);
    if (videoId && videoId !== this.lastVideoId) {
      this.lastVideoId = videoId;
      this.callbacks.forEach((cb) => cb(videoId, window.location.href));
    }
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.callbacks = [];
  }
}
