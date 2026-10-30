import { t } from '../i18n';
import { BRAND_ACCENT, createBrandMarkSvg } from './icons';

export interface ApprovalRequest {
  ruleName: string;
  actionLabel: string;
  onApprove: () => void;
  /** Отказ пользователя, Escape или закрытие по таймауту. */
  onDismiss: () => void;
}

const BANNER_ID = 'yt-autopilot-approval-banner';
const AUTO_DISMISS_MS = 10000;

function styledEl<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.style.cssText = css;
  if (text !== undefined) el.textContent = text;
  return el;
}

function buildMessage(ruleName: string, actionLabel: string): HTMLDivElement {
  const message = styledEl('div', 'font-size: 12px; color: #e4e4e7; line-height: 1.45;');
  message.appendChild(document.createTextNode(`${t('approval.rule')} `));
  message.appendChild(styledEl('b', 'color: #ffffff;', `"${ruleName}"`));
  message.appendChild(document.createTextNode(` ${t('approval.wantsTo')}: `));
  message.appendChild(styledEl('b', `color: ${BRAND_ACCENT};`, actionLabel));
  return message;
}

const BUTTON_BASE =
  'min-height: 32px; border-radius: 6px; padding: 6px 14px; font-size: 12px; cursor: pointer; transition: background 0.15s ease;';

/**
 * Карточка подтверждения действия в правом нижнем углу страницы YouTube.
 * Одновременно показывается одна карточка: очередь запросов держит Content Script.
 * Строится без innerHTML — пользовательские имена правил выводятся только через textContent.
 */
export function showApprovalBanner({ ruleName, actionLabel, onApprove, onDismiss }: ApprovalRequest): void {
  document.getElementById(BANNER_ID)?.remove();

  const banner = styledEl(
    'div',
    `position: fixed; bottom: 24px; right: 24px; z-index: 999999; max-width: min(340px, calc(100vw - 48px));
     display: flex; flex-direction: column; gap: 12px; padding: 16px 20px; border-radius: 12px;
     background: rgba(24, 24, 27, 0.96); backdrop-filter: blur(16px); color: #f4f4f5;
     border: 1px solid rgba(63, 63, 70, 0.85); box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.7);
     font-family: 'YouTube Noto', Roboto, Arial, sans-serif; font-size: 13px;`
  );
  banner.id = BANNER_ID;
  banner.setAttribute('role', 'alertdialog');
  banner.setAttribute('aria-label', t('app.title'));

  let settled = false;
  const close = (approved: boolean) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeoutId);
    banner.remove();
    if (approved) onApprove();
    else onDismiss();
  };
  const timeoutId = window.setTimeout(() => close(false), AUTO_DISMISS_MS);

  const header = styledEl(
    'div',
    `display: flex; align-items: center; gap: 8px; font-weight: 600; color: ${BRAND_ACCENT}; font-size: 13px;`
  );
  header.appendChild(createBrandMarkSvg(16));
  header.appendChild(styledEl('span', '', t('app.title')));

  const buttons = styledEl('div', 'display: flex; gap: 8px; justify-content: flex-end; margin-top: 2px;');
  const skipBtn = styledEl(
    'button',
    `${BUTTON_BASE} background: transparent; color: #a1a1aa; border: 1px solid #3f3f46; font-weight: 500;`,
    t('approval.skip')
  );
  const allowBtn = styledEl(
    'button',
    `${BUTTON_BASE} background: #2563eb; color: #ffffff; border: none; font-weight: 600;`,
    t('approval.allow')
  );
  skipBtn.type = 'button';
  allowBtn.type = 'button';
  skipBtn.addEventListener('click', () => close(false));
  allowBtn.addEventListener('click', () => close(true));
  banner.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close(false);
  });
  buttons.append(skipBtn, allowBtn);

  banner.append(header, buildMessage(ruleName, actionLabel), buttons);
  document.body.appendChild(banner);
}
