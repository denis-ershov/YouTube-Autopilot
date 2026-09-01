/**
 * Селекторы элементов YouTube DOM
 * Изолированы в одном месте для устойчивости к изменениям верстки YouTube
 */
export const YOUTUBE_SELECTORS = {
  // HTML5 Видео плеер (поддержка обычных видео и Shorts)
  VIDEO_PLAYER:
    '#movie_player video.html5-main-video, #movie_player video, video.video-stream.html5-main-video, video.html5-main-video',
  SHORTS_VIDEO_PLAYER:
    'ytd-reel-video-renderer[is-active] video, #shorts-player video, ytd-shorts video.video-stream',
  MOVIE_PLAYER: '#movie_player',
  PLAYER_CONTAINER:
    '#movie_player, ytd-watch-flexy, ytd-reel-video-renderer[is-active], #shorts-player',

  // Метаданные видео
  VIDEO_TITLE:
    'h1.ytd-watch-metadata yt-formatted-string, #title h1, h2.ytd-reel-player-header-renderer',
  CHANNEL_NAME:
    '#owner #channel-name a, #upload-info #channel-name a, ytd-channel-name a, #channel-name a',
  CHANNEL_LINK:
    '#owner #channel-name a, ytd-channel-name a',
  SUBSCRIBE_BUTTON:
    '#subscribe-button button, ytd-subscribe-button-renderer button',

  // Кнопки действий
  LIKE_BUTTON:
    'like-button-view-model button, #top-level-buttons-computed ytd-toggle-button-renderer:first-child button, #like-button button',
  UNLIKE_BUTTON:
    'dislike-button-view-model button, #dislike-button button',
  SAVE_BUTTON:
    'ytd-menu-renderer button[aria-label*="Save"], #top-level-buttons-computed button[aria-label*="Save"], button[aria-label*="Сохранить"]',

  // Контейнеры для подмешивания инлайн элементов
  ABOVE_THE_FOLD: '#above-the-fold',
  PLAYER_CONTROLS: '.ytp-right-controls',
  LEFT_CONTROLS: '.ytp-left-controls',
  TIME_DISPLAY: '.ytp-time-display',
};
