import { YOUTUBE_SELECTORS } from './selectors';
import { formatSeconds, t } from '../i18n';
import { createBrandMarkSvg, createHeartSvg } from './icons';

/**
 * Инлайн-виджет расширения YouTube Autopilot в панели управления плеера.
 * Разработан по стандартам UI/UX Pro Max и Pixel Perfect:
 * Безопасное DOM-построение без innerHTML (100% совместимость с Mozilla AMO и CSP),
 * векторные SVG-иконки, WCAG 4.5:1 контраст, легкие 150–200ms микро-анимации.
 */
export class YouTubePlayerOverlay {
  private container: HTMLElement | null = null;
  private cardPopover: HTMLElement | null = null;

  // Динамические элементы капсулы
  private pillPercentSpan: HTMLSpanElement | null = null;
  private pillTimeSpan: HTMLSpanElement | null = null;
  private pillActionPill: HTMLSpanElement | null = null;
  private pillActionSpan: HTMLSpanElement | null = null;

  // Динамические элементы поповера
  private popoverPercentSpan: HTMLSpanElement | null = null;
  private popoverProgressBar: HTMLDivElement | null = null;
  private popoverWatchedTimeB: HTMLElement | null = null;
  private popoverNextActionSpan: HTMLSpanElement | null = null;

  public renderOrUpdate(
    rawWatchedPercent: number,
    rawWatchedSeconds: number,
    nextActionText?: string
  ): void {
    const watchedPercent = Math.max(0, Math.min(100, Math.round(rawWatchedPercent || 0)));
    const watchedSeconds = Math.max(0, Math.round(rawWatchedSeconds || 0));

    if (!this.container || !document.contains(this.container)) {
      this.initContainer();
    }

    if (!this.container) return;

    const actionText = nextActionText || t('player.likeAt', { percent: 90 });

    // 1. Обновление капсулы в строке плеера
    if (this.pillPercentSpan) {
      this.pillPercentSpan.textContent = `${watchedPercent}%`;
    }
    if (this.pillTimeSpan) {
      this.pillTimeSpan.textContent = formatSeconds(watchedSeconds);
    }
    if (this.pillActionSpan && this.pillActionPill) {
      if (actionText) {
        this.pillActionSpan.textContent = actionText;
        this.pillActionPill.style.display = 'inline-flex';
      } else {
        this.pillActionPill.style.display = 'none';
      }
    }

    // 2. Обновление карточки-поповера
    if (this.popoverPercentSpan) {
      this.popoverPercentSpan.textContent = `${watchedPercent}%`;
    }
    if (this.popoverProgressBar) {
      this.popoverProgressBar.style.width = `${watchedPercent}%`;
    }
    if (this.popoverWatchedTimeB) {
      this.popoverWatchedTimeB.textContent = formatSeconds(watchedSeconds);
    }
    if (this.popoverNextActionSpan) {
      this.popoverNextActionSpan.textContent = `${t('player.next')}: ${actionText}`;
    }
  }

  private initContainer(): void {
    const timeDisplay = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.TIME_DISPLAY);
    const leftControls = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.LEFT_CONTROLS);
    const rightControls = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.PLAYER_CONTROLS);

    const targetParent = leftControls || rightControls;
    if (!targetParent) return;

    this.container = document.createElement('div');
    this.container.id = 'yt-autopilot-player-overlay';
    this.container.className = 'yt-autopilot-control-widget';
    this.container.style.cssText = `
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
      height: 34px !important;
      width: auto !important;
      max-width: none !important;
      min-width: 0 !important;
      padding: 0 10px !important;
      margin-left: 6px !important;
      margin-right: 4px !important;
      margin-top: auto !important;
      margin-bottom: auto !important;
      border-radius: 17px !important;
      cursor: pointer !important;
      opacity: 0.95 !important;
      background: rgba(255, 255, 255, 0.14) !important;
      backdrop-filter: blur(8px) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      transition: background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
      white-space: nowrap !important;
      overflow: visible !important;
      box-sizing: border-box !important;
      z-index: 9999 !important;
    `;

    // Построение содержимого капсулы безопасными методами DOM
    const pillContent = document.createElement('div');
    pillContent.className = 'yt-ap-pill-content';
    pillContent.style.cssText =
      "display: inline-flex; align-items: center; gap: 6px; height: 100%; white-space: nowrap; font-family: 'YouTube Noto', Roboto, Arial, sans-serif; font-size: 12px; font-weight: 500; color: #ffffff; user-select: none;";

    // Знак бренда
    pillContent.appendChild(createBrandMarkSvg(15));

    // Percent span
    this.pillPercentSpan = document.createElement('span');
    this.pillPercentSpan.style.cssText = 'color: #ffffff; font-weight: 600; line-height: 1;';
    this.pillPercentSpan.textContent = '0%';
    pillContent.appendChild(this.pillPercentSpan);

    // Separator
    const separator = document.createElement('span');
    separator.style.cssText = 'color: rgba(255, 255, 255, 0.4); font-size: 10px;';
    separator.textContent = '•';
    pillContent.appendChild(separator);

    // Watched time span
    this.pillTimeSpan = document.createElement('span');
    this.pillTimeSpan.style.cssText =
      'color: rgba(255, 255, 255, 0.9); font-weight: 400; font-size: 11px; line-height: 1;';
    this.pillTimeSpan.textContent = '0:00';
    pillContent.appendChild(this.pillTimeSpan);

    // Next action pill
    this.pillActionPill = document.createElement('span');
    this.pillActionPill.style.cssText =
      'display: inline-flex; align-items: center; gap: 3px; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 600; line-height: 1; margin-left: 2px;';

    this.pillActionPill.appendChild(createHeartSvg(9));

    this.pillActionSpan = document.createElement('span');
    this.pillActionSpan.textContent = '90%';
    this.pillActionPill.appendChild(this.pillActionSpan);

    pillContent.appendChild(this.pillActionPill);
    this.container.appendChild(pillContent);

    // Создание Popover карточки над кнопкой
    this.cardPopover = document.createElement('div');
    this.cardPopover.className = 'yt-ap-popover';
    this.cardPopover.style.cssText = `
      position: absolute !important;
      bottom: 44px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 230px !important;
      background: rgba(18, 18, 20, 0.96) !important;
      backdrop-filter: blur(16px) !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      border-radius: 12px !important;
      padding: 12px !important;
      box-shadow: 0 16px 32px -4px rgba(0, 0, 0, 0.7) !important;
      pointer-events: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s !important;
      z-index: 99999 !important;
      white-space: normal !important;
    `;

    // Popover Header
    const popoverHeader = document.createElement('div');
    popoverHeader.style.cssText =
      'display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;';

    const titleGroup = document.createElement('div');
    titleGroup.style.cssText =
      'display: flex; align-items: center; gap: 6px; font-weight: 600; color: #f4f4f5; font-size: 12px;';
    titleGroup.appendChild(createBrandMarkSvg(14));

    const popoverTitle = document.createElement('span');
    popoverTitle.textContent = t('app.title');
    titleGroup.appendChild(popoverTitle);

    const activeBadge = document.createElement('span');
    activeBadge.style.cssText =
      'font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 1px 7px; border-radius: 9999px; font-weight: 500;';
    activeBadge.textContent = t('player.active');

    popoverHeader.appendChild(titleGroup);
    popoverHeader.appendChild(activeBadge);
    this.cardPopover.appendChild(popoverHeader);

    // Progress bar block
    const progressBlock = document.createElement('div');
    progressBlock.style.marginBottom = '10px';

    const progressLabelRow = document.createElement('div');
    progressLabelRow.style.cssText =
      'display: flex; justify-content: space-between; font-size: 11px; color: #a1a1aa; margin-bottom: 4px;';

    const progressLabel = document.createElement('span');
    progressLabel.textContent = t('player.progress');

    this.popoverPercentSpan = document.createElement('span');
    this.popoverPercentSpan.style.cssText = 'color: #3ea6ff; font-weight: 600;';
    this.popoverPercentSpan.textContent = '0%';

    progressLabelRow.appendChild(progressLabel);
    progressLabelRow.appendChild(this.popoverPercentSpan);
    progressBlock.appendChild(progressLabelRow);

    const barContainer = document.createElement('div');
    barContainer.style.cssText =
      'width: 100%; background: #27272a; height: 5px; border-radius: 9999px; overflow: hidden;';

    this.popoverProgressBar = document.createElement('div');
    this.popoverProgressBar.style.cssText =
      'width: 0%; background: linear-gradient(90deg, #2563eb, #3ea6ff); height: 100%; border-radius: 9999px; transition: width 0.25s ease;';

    barContainer.appendChild(this.popoverProgressBar);
    progressBlock.appendChild(barContainer);
    this.cardPopover.appendChild(progressBlock);

    // Popover Footer
    const popoverFooter = document.createElement('div');
    popoverFooter.style.cssText =
      'display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #a1a1aa; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 8px;';

    const watchedSpan = document.createElement('span');
    watchedSpan.textContent = `${t('player.watched')}: `;

    this.popoverWatchedTimeB = document.createElement('b');
    this.popoverWatchedTimeB.style.color = '#f4f4f5';
    this.popoverWatchedTimeB.textContent = '0:00';
    watchedSpan.appendChild(this.popoverWatchedTimeB);

    this.popoverNextActionSpan = document.createElement('span');
    this.popoverNextActionSpan.style.cssText = 'color: #f87171; font-weight: 600;';
    this.popoverNextActionSpan.textContent = `${t('player.next')}: 90%`;

    popoverFooter.appendChild(watchedSpan);
    popoverFooter.appendChild(this.popoverNextActionSpan);
    this.cardPopover.appendChild(popoverFooter);

    this.container.appendChild(this.cardPopover);

    // Hover эффекты
    this.container.addEventListener('mouseenter', () => {
      if (this.container) {
        this.container.style.opacity = '1.0';
        this.container.style.backgroundColor = 'rgba(255, 255, 255, 0.24)';
        this.container.style.borderColor = 'rgba(255, 255, 255, 0.3)';
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
        this.container.style.backgroundColor = 'rgba(255, 255, 255, 0.14)';
        this.container.style.borderColor = 'rgba(255, 255, 255, 0.15)';
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
    this.pillPercentSpan = null;
    this.pillTimeSpan = null;
    this.pillActionPill = null;
    this.pillActionSpan = null;
    this.popoverPercentSpan = null;
    this.popoverProgressBar = null;
    this.popoverWatchedTimeB = null;
    this.popoverNextActionSpan = null;
  }
}
