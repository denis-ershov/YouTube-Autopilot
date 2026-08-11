/**
 * Селекторы элементов YouTube DOM
 * Изолированы в одном месте для устойчивости к изменениям верстки YouTube
 */
export const YOUTUBE_SELECTORS = {
  // HTML5 Видео плеер
  VIDEO_PLAYER: 'video.html5-main-video',
  MOVIE_PLAYER: '#movie_player',

  // Метаданные видео
  VIDEO_TITLE: 'h1.ytd-watch-metadata yt-formatted-string, #title h1',
  CHANNEL_NAME: '#owner #channel-name a, #upload-info #channel-name a',
  CHANNEL_LINK: '#owner #channel-name a',
  SUBSCRIBE_BUTTON: '#subscribe-button button, ytd-subscribe-button-renderer button',

  // Кнопки действий
  LIKE_BUTTON: 'like-button-view-model button, #top-level-buttons-computed ytd-toggle-button-renderer:first-child button',
  UNLIKE_BUTTON: 'dislike-button-view-model button',
  SAVE_BUTTON: 'ytd-menu-renderer button[aria-label*="Save"], #top-level-buttons-computed button[aria-label*="Save"]',

  // Контейнеры для подмешивания инлайн элементов
  ABOVE_THE_FOLD: '#above-the-fold',
  PLAYER_CONTROLS: '.ytp-right-controls',
  LEFT_CONTROLS: '.ytp-left-controls',
  TIME_DISPLAY: '.ytp-time-display',
};
