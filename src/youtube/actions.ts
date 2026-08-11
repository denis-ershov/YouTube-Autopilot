import { YOUTUBE_SELECTORS } from './selectors';
import { ActionType } from '../types/rules';

export interface ActionResult {
  success: boolean;
  message?: string;
  attempts?: number;
}

const RETRY_DELAYS_MS = [2000, 5000, 10000];

/**
 * Выполнить DOM-действие с политикой повторов (Retry Policy)
 */
export async function executeYouTubeDOMAction(actionType: ActionType, maxRetries = 3): Promise<ActionResult> {
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const res = await attemptActionOnce(actionType);
    if (res.success) {
      return { ...res, attempts: attempt };
    }

    if (attempt < maxRetries) {
      const waitMs = RETRY_DELAYS_MS[attempt - 1] || 5000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  return {
    success: false,
    message: `Failed after ${maxRetries} attempts: Target element for ${actionType} not found in YouTube DOM`,
    attempts: maxRetries,
  };
}

async function attemptActionOnce(actionType: ActionType): Promise<ActionResult> {
  switch (actionType) {
    case 'LIKE_VIDEO':
      return clickLikeButton();
    case 'UNLIKE_VIDEO':
      return clickUnlikeButton();
    case 'SAVE_VIDEO':
      return clickSaveButton();
    case 'REMOVE_FROM_WATCH_LATER':
      return removeFromWatchLaterDOM();
    case 'HIDE_VIDEO':
      return hideVideoDOM();
    default:
      return { success: false, message: `Unsupported action type: ${actionType}` };
  }
}

async function clickLikeButton(): Promise<ActionResult> {
  const btn = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.LIKE_BUTTON);
  if (!btn) {
    return { success: false, message: 'Like button not found in DOM' };
  }

  const isAlreadyLiked = btn.getAttribute('aria-pressed') === 'true' || btn.classList.contains('style-default-active');
  if (isAlreadyLiked) {
    return { success: true, message: 'Video is already liked' };
  }

  btn.click();
  return { success: true, message: 'Clicked Like button' };
}

async function clickUnlikeButton(): Promise<ActionResult> {
  const btn = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.UNLIKE_BUTTON);
  if (!btn) {
    return { success: false, message: 'Unlike button not found in DOM' };
  }
  btn.click();
  return { success: true, message: 'Clicked Unlike button' };
}

async function clickSaveButton(): Promise<ActionResult> {
  const btn = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.SAVE_BUTTON);
  if (!btn) {
    return { success: false, message: 'Save button not found in DOM' };
  }
  btn.click();
  return { success: true, message: 'Clicked Save button' };
}

async function removeFromWatchLaterDOM(): Promise<ActionResult> {
  const saveBtn = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.SAVE_BUTTON);
  if (saveBtn) {
    saveBtn.click();
    return { success: true, message: 'Toggled Watch Later list' };
  }
  return { success: false, message: 'Save/Watch Later button not found' };
}

async function hideVideoDOM(): Promise<ActionResult> {
  const player = document.querySelector<HTMLElement>(YOUTUBE_SELECTORS.MOVIE_PLAYER);
  if (player) {
    player.style.opacity = '0.15';
    player.style.filter = 'blur(8px)';
    return { success: true, message: 'Video UI hidden locally' };
  }
  return { success: false, message: 'Movie player container not found' };
}
