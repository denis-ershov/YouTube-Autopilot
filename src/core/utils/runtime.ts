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
export async function safeSendMessage<T = any>(message: any): Promise<T | null> {
  if (!isExtensionContextValid()) {
    return null;
  }

  try {
    const runtime = chrome?.runtime;
    if (!runtime || typeof runtime.sendMessage !== 'function') {
      return null;
    }
    return await runtime.sendMessage(message);
  } catch (err: any) {
    const msg = err?.message || String(err);
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
