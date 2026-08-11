import { YOUTUBE_SELECTORS } from './selectors';
import { formatSeconds } from '../i18n';

export class YouTubePlayerOverlay {
  private container: HTMLElement | null = null;
  private cardPopover: HTMLElement | null = null;

  public renderOrUpdate(watchedPercent: number, watchedSeconds: number, nextActionText: string = 'Like at 90%'): void {
    if (!this.container || !document.contains(this.container)) {
      this.initContainer();
    }

    if (!this.container) return;

    // 1. Компактное содержимое капсулы в строке плеера
    const buttonHtml = `
      <div class="yt-ap-pill-content" style="display: inline-flex; align-items: center; gap: 6px; height: 100%; white-space: nowrap; font-family: 'YouTube Noto', Roboto, Arial, sans-serif; font-size: 12px; font-weight: 500; color: #ffffff; user-select: none;">
        <!-- Robot SVG Icon -->
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3ea6ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; display: block;">
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="15" x2="8" y2="15.01" />
          <line x1="16" y1="15" x2="16" y2="15.01" />
        </svg>

        <!-- Percent -->
        <span style="color: #ffffff; font-weight: 600; line-height: 1;">${watchedPercent}%</span>

        <!-- Separator -->
        <span style="color: rgba(255, 255, 255, 0.3); font-size: 10px;">•</span>

        <!-- Watched Time -->
        <span style="color: rgba(255, 255, 255, 0.8); font-weight: 400; font-size: 11px; line-height: 1;">${formatSeconds(watchedSeconds)}</span>

        <!-- Next Action Pill -->
        ${
          nextActionText
            ? `
          <span style="display: inline-flex; align-items: center; gap: 3px; background: rgba(255, 78, 69, 0.18); color: #ff4e45; border: 1px solid rgba(255, 78, 69, 0.35); padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 600; line-height: 1; margin-left: 2px;">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#ff4e45" stroke="#ff4e45" stroke-width="2" style="display: block;">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span>90%</span>
          </span>
        `
            : ''
        }
      </div>
    `;

    this.container.innerHTML = buttonHtml;

    // 2. Обновление карточки-поповера над капсулой
    if (this.cardPopover) {
      this.cardPopover.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 600; color: #f4f4f5; font-size: 12px;">
            <span style="color: #3ea6ff;">🤖</span>
            <span>YouTube Autopilot</span>
          </div>
          <span style="font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 1px 7px; border-radius: 9999px; font-weight: 500;">Active</span>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #a1a1aa; margin-bottom: 4px;">
            <span>Real Watch Progress</span>
            <span style="color: #3ea6ff; font-weight: 600;">${watchedPercent}%</span>
          </div>
          <div style="width: 100%; background: #27272a; height: 5px; border-radius: 9999px; overflow: hidden;">
            <div style="width: ${watchedPercent}%; background: linear-gradient(90deg, #2563eb, #3ea6ff); height: 100%; border-radius: 9999px; transition: width 0.3s ease;"></div>
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #a1a1aa; border-top: 1px solid rgba(255, 255, 255, 0.1); pt: 6px; padding-top: 8px;">
          <span>Watched: <b style="color: #f4f4f5;">${formatSeconds(watchedSeconds)}</b></span>
          <span style="color: #ff4e45; font-weight: 600;">Next: ${nextActionText}</span>
        </div>
      `;
    }
  }

  private initContainer(): void {
    // Находим место встраивания
    const timeDisplay = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.TIME_DISPLAY);
    const leftControls = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.LEFT_CONTROLS);
    const rightControls = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.PLAYER_CONTROLS);

    const targetParent = leftControls || rightControls;
    if (!targetParent) return;

    // Создаем свой изолированный контейнер без класса ytp-button (чтобы YouTube CSS width: 36px не ломал верстку!)
    this.container = document.createElement('div');
    this.container.id = 'yt-autopilot-player-overlay';
    this.container.className = 'yt-autopilot-control-widget';
    this.container.style.cssText = `
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
      height: 36px !important;
      width: auto !important;
      max-width: none !important;
      min-width: 0 !important;
      padding: 0 12px !important;
      margin-left: 8px !important;
      margin-right: 4px !important;
      margin-top: auto !important;
      margin-bottom: auto !important;
      border-radius: 18px !important;
      cursor: pointer !important;
      opacity: 0.95 !important;
      background: rgba(255, 255, 255, 0.12) !important;
      backdrop-filter: blur(8px) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
      white-space: nowrap !important;
      overflow: visible !important;
      box-sizing: border-box !important;
      z-index: 9999 !important;
    `;

    // Создание Popover карточки над кнопкой
    this.cardPopover = document.createElement('div');
    this.cardPopover.className = 'yt-ap-popover';
    this.cardPopover.style.cssText = `
      position: absolute !important;
      bottom: 46px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 230px !important;
      background: rgba(18, 18, 20, 0.96) !important;
      backdrop-filter: blur(16px) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-radius: 12px !important;
      padding: 12px !important;
      box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.7) !important;
      pointer-events: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s !important;
      z-index: 99999 !important;
      white-space: normal !important;
    `;

    this.container.appendChild(this.cardPopover);

    // Hover эффекты
    this.container.addEventListener('mouseenter', () => {
      if (this.container) {
        this.container.style.opacity = '1.0';
        this.container.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
        this.container.style.borderColor = 'rgba(255, 255, 255, 0.25)';
      }
      if (this.cardPopover) {
        this.cardPopover.style.opacity = '1';
        this.cardPopover.style.visibility = 'visible';
        this.cardPopover.style.transform = 'translateX(-50%) translateY(-4px)';
      }
    });

    this.container.addEventListener('mouseleave', () => {
      if (this.container) {
        this.container.style.opacity = '0.95';
        this.container.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
        this.container.style.borderColor = 'rgba(255, 255, 255, 0.12)';
      }
      if (this.cardPopover) {
        this.cardPopover.style.opacity = '0';
        this.cardPopover.style.visibility = 'hidden';
        this.cardPopover.style.transform = 'translateX(-50%) translateY(0px)';
      }
    });

    // Вставка в DOM
    if (timeDisplay && timeDisplay.parentNode === targetParent) {
      targetParent.insertBefore(this.container, timeDisplay.nextSibling);
    } else {
      targetParent.appendChild(this.container);
    }
  }

  public remove(): void {
    if (this.cardPopover) {
      this.cardPopover.remove();
      this.cardPopover = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
