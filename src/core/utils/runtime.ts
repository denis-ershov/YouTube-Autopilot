import type { ExtensionMessage } from '../../types/messages';

/**
 * Безопасные утилиты для работы с Chrome Extension API.
 * Гарантируют надежную работу в условиях жизненного цикла MV3 Service Worker,
 * перезагрузки расширения пользователем в chrome://extensions и изоляции вкладок.
 */

/**
 * Проверка валидности и доступности контекста расширения
 */
export function isExtensionContextValid(): boolean {
  try {
    return (
      typeof chrome !== 'undefined' &&
      typeof chrome.runtime !== 'undefined' &&
      Boolean(chrome.runtime?.id) &&
      typeof chrome.runtime.sendMessage === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Безопасная отправка IPC-сообщения на Service Worker.
 * Предотвращает ошибки:
 * - "TypeError: Cannot read properties of undefined (reading 'sendMessage')"
 * - "Error: Extension context invalidated."
 * - "Error: Could not establish connection. Receiving end does not exist."
 */
export async function safeSendMessage<T>(message: ExtensionMessage): Promise<T | null> {
  if (!isExtensionContextValid()) {
    return null;
  }

  try {
    return (await chrome.runtime.sendMessage(message)) as T;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('Extension context invalidated') ||
      msg.includes('Receiving end does not exist') ||
      msg.includes('message channel closed')
    ) {
      console.debug('[YouTube Autopilot] Service worker or context inactive:', msg);
    } else {
      console.warn('[YouTube Autopilot] Message send failed:', msg);
    }
    return null;
  }
}

/** Версия из manifest.json (единый источник — package.json через WXT). */
export function getExtensionVersion(): string {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    return '';
  }
}
