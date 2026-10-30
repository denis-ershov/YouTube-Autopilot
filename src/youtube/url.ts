/**
 * Извлечение YouTube Video ID из URL обычного ролика (`/watch?v=ID`) или Shorts (`/shorts/ID`).
 * Используется Content Script и Popup — единая точка разбора URL.
 */
export function getVideoIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.pathname === '/watch') {
      return parsed.searchParams.get('v');
    }
    if (parsed.pathname.startsWith('/shorts/')) {
      return parsed.pathname.split('/')[2] || null;
    }
  } catch {
    // Невалидный URL (chrome://, about:blank и т.п.) — видео нет
  }
  return null;
}
