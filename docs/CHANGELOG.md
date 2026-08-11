# Changelog — YouTube Autopilot

Все значимые изменения проекта фиксируются в этом файле в соответствии с правилами разработки (`@[user_global]`).

---

## [1.0.0] - 2026-08-11

### Добавлено
- **100% покрытие ТЗ (MVP 1.0)** на базе WXT, React 19, TypeScript и Tailwind CSS.
- **Подсистема парсинга и взаимодействия с YouTube (`src/youtube/`)**:
  - `selectors.ts`: Изолированные DOM-селекторы плеера, названий, кнопок и статуса подписки.
  - `navigation.ts`: Детектор SPA-навигации YouTube (`yt-navigate-finish`, URL observer).
  - `player.ts`: `PlayerObserver` для асинхронной подписки на события HTML5 плеера.
  - `actions.ts`: Выполнитель действий с автоматической политикой повторов (**Retry Policy** 2s/5s/10s).
  - `overlay.ts`: Инлайн-индикатор просмотра плеера YouTube.
  - `adapter.ts`: Фасад адаптера YouTube.
- **Ядро движка (`src/core/`)**:
  - `RealWatchTracker.ts`: Алгоритм накопительных уникальных интервалов `Real Watch Tracking`.
  - `RuleEngine.ts`: Вычисление всех условий ТЗ (`WATCHED_PERCENT`, `VIDEO_DURATION`, `CHANNEL`, `SOURCE`, `IS_SHORT`, `IS_SUBSCRIBED`) со всеми операторами (`EQ`, `GT`, `LT`, `GTE`, `LTE`, `IN`, `NOT_IN`, `IS`, `IS_NOT`).
  - `ActionEngine.ts`: Идемпотентность, кулдауны, задержка (delay) и журналирование попыток.
- **Пользовательский интерфейс**:
  - `OnboardingModal`: Пошаговый мастер первого запуска для настройки порогов и режима автоматизации.
  - `WatchLaterView`: Раздел менеджера списков Смотреть позже с фильтрацией по проценту просмотра.
  - `HistoryView`: Детализированный лог активности с фильтрами по статусам (All, Watched, Liked, Saved, Removed, Failed).
  - `Popup` & `Dashboard`: Обновленные мультиязычные интерфейсы.
- **Сборка и дистрибутив**:
  - Проведена успешно производственная сборка в `.output/chrome-mv3` и запакован ZIP-архив `.output/youtube-autopilot-1.0.0-chrome.zip` (98.09 KB).
- **Исправления и UI/UX редизайн**:
  - **Устранение обрезки и переполнения виджета (`overlay.ts`)**: Выявлено, что глобальный CSS YouTube на классе `ytp-button` принудительно задавал `width: 36px` и `overflow: hidden`, что срезало текст инлайн-элементов. Класс `ytp-button` полностью удален из виджета.
  - **Нативная капсула 36px**: Элемент стилизован под нативные капсулы плеера YouTube 2026 (`height: 36px`, `border-radius: 18px`, `padding: 0 12px`, `white-space: nowrap !important`, `width: auto !important`). Виджет идеально интегрирован рядом со счетчиком времени `0:23 / 4:23`.
  - **Плавающая карточка-поповер (Popover Card)**: При наведении мыши над виджетом всплывает карточка в стиле Glassmorphism (`backdrop-filter: blur(16px)`), отображающая прогресс-бар реального просмотра, время и детали правила.
  - Добавлена декларация `options_ui` в `wxt.config.ts` и открытие вкладки Dashboard через `chrome.tabs.create`.
  - Отключен `modulePreload` во избежание предупреждений Chrome об использовании `modulepreload` ресурсов.

---
