import { YOUTUBE_SELECTORS } from './selectors';
import { YouTubeNavigationObserver } from './navigation';
import { PlayerObserver } from './player';
import { executeYouTubeDOMAction, ActionResult } from './actions';
import { YouTubePlayerOverlay } from './overlay';
import { ActionType } from '../types/rules';
import { DEFAULT_VIDEO_TITLE } from '../types/video';
import { getVideoIdFromUrl } from './url';

export interface CurrentVideoMetadata {
  id: string;
  url: string;
  title: string;
  channelName?: string;
  duration: number;
  isSubscribed?: boolean;
  isShort: boolean;
}

export class YouTubeAdapter {
  private navObserver: YouTubeNavigationObserver;
  private playerObserver: PlayerObserver;
  private overlay: YouTubePlayerOverlay;

  constructor() {
    this.navObserver = new YouTubeNavigationObserver();
    this.playerObserver = new PlayerObserver();
    this.overlay = new YouTubePlayerOverlay();
  }

  public getNavigationObserver(): YouTubeNavigationObserver {
    return this.navObserver;
  }

  public getPlayerObserver(): PlayerObserver {
    return this.playerObserver;
  }

  public getOverlay(): YouTubePlayerOverlay {
    return this.overlay;
  }

  public getCurrentMetadata(): CurrentVideoMetadata | null {
    const videoId = getVideoIdFromUrl(window.location.href);
    if (!videoId) return null;

    const titleEl = document.querySelector(YOUTUBE_SELECTORS.VIDEO_TITLE);
    const title = titleEl?.textContent?.trim() || DEFAULT_VIDEO_TITLE;

    const channelEl = document.querySelector(YOUTUBE_SELECTORS.CHANNEL_NAME);
    const channelName = channelEl?.textContent?.trim();

    const subBtn = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.SUBSCRIBE_BUTTON);
    const subText = subBtn?.textContent ?? '';
    const isSubscribed = subBtn
      ? subBtn.hasAttribute('subscribed') || subText.includes('Subscribed') || subText.includes('Вы подписаны')
      : false;

    const playerState = this.playerObserver.getState();
    const duration = playerState?.duration || 0;

    return {
      id: videoId,
      url: window.location.href,
      title,
      channelName,
      duration,
      isSubscribed,
      isShort: window.location.pathname.startsWith('/shorts/'),
    };
  }

  public async executeAction(actionType: ActionType): Promise<ActionResult> {
    return executeYouTubeDOMAction(actionType);
  }

  public destroy(): void {
    this.navObserver.destroy();
    this.playerObserver.destroy();
    this.overlay.remove();
  }
}
