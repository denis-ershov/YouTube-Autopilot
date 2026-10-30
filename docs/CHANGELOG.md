# Changelog — YouTube Autopilot

Все значимые изменения проекта фиксируются в этом файле в соответствии с правилами разработки (`@[user_global]`).

## [1.2.0] - 2026-10-30

Аудит проекта: исправление несостыковок, удаление мёртвого кода, синхронизация кода и документации, новый логотип.

### Исправлено
- **Popup не показывал текущее видео**: сообщение `GET_VIDEO_RECORD` отправлялось, но не обрабатывалось Background. Добавлен обработчик.
- **Удалённые правила «воскресали»**: `getRules()` заново засевал пресеты, если пользователь удалил все правила. Теперь пресеты засеваются только при отсутствии ключа.
- **Повторный запуск действий**: в режиме `automatic` действие с задержкой планировалось заново каждые 2 с, а в режиме `approval` баннер переоткрывался. `ActionEngine` теперь резервирует ключ `videoId:action`, выполняет действие один раз на видео (даже если его требуют два пресета автолайка) и не повторяет отклонённые/упавшие действия.
- **Запись в чужую IndexedDB**: fallback `ActionEngine` писал логи напрямую в IndexedDB из Content Script, то есть в базу origin `youtube.com`, а не расширения. Fallback удалён — писатель только Background.
- **Сломанные цвета**: классы `brand-400` / `brand-950` использовались, но отсутствовали в палитре Tailwind и не генерировались. Палитра дополнена.
- **Имена пресетов** отображались как ключи (`likeCompleted`) в списке правил и баннере. Добавлен `getRuleDisplayName()`.
- **Описание правил**: для пресета с условием `SOURCE` выводилось «Реально ≥ WATCH_LATER%». Добавлен `describeConditions()` для всех типов условий.
- **Фолбэки `t(...) || x` никогда не срабатывали** (`t` возвращает ключ). У `t()` появился явный параметр `fallback`.
- **Фильтры истории «С лайком» / «Сохранённые» всегда пусты**: Background теперь выставляет `video.liked` / `video.saved` после успешных действий; история сортируется от новых к старым.
- **Мастер онбординга** игнорировал выбранный порог и автоматизации: порог переносится в пресеты автолайка, выбор включает/выключает их (`src/core/onboarding.ts`).
- **Статистика** «Сработавших правил» / «Лайков» подставляла число включённых правил при нуле выполнений. Показываются только реальные данные.
- **Смена режима отслеживания** применялась только к следующему видео — трекер теперь получает режим сразу (`setMode`).
- **Прогресс при SPA-переходе** мог засчитываться старому видео в окне 800 мс — трекер сбрасывается при навигации.
- **Язык в Popup**: при `auto` кнопка всегда показывала «RU»; теперь отображается фактический язык.
- Версия в Dashboard была захардкожена (`v1.1.0` при пакете `1.1.1`) — берётся из манифеста; `package-lock.json` синхронизирован с `package.json`.
- `IS_SHORT` определялся по длительности ≤ 60 с (Shorts бывают до 3 мин) — теперь по URL `/shorts/`.

### Удалено (мёртвый код)
- Необрабатываемые типы сообщений: `EVALUATE_RULES`, `EXECUTE_ACTION`, `GET_CURRENT_VIDEO_STATUS`, `CURRENT_VIDEO_STATUS_RESPONSE`, `APPROVE_ACTION`, `REJECT_ACTION`, `SHOW_APPROVAL_MODAL` и payload-типы к ним.
- Неиспользуемые поля: `Settings.defaultDelay`, `trackInactiveTab`, `shortsEnabled`, `autoLikeOnFastForward`; `Rule.maxRetries`; `Action.options`; enum `VideoState`.
- Вкладка «Менеджер Смотреть позже» (фильтр без данных) и пункт онбординга «Точный учёт просмотра» (ни на что не влиял).
- 20 неиспользуемых ключей локализации и эмодзи в строках действий/пресетов.
- Неиспользуемые зависимости `clsx`, `tailwind-merge`; токены `dark.*` и `darkMode` в Tailwind; неиспользуемый `public/icons/logo.png`.
- `.wxt/` удалён из индекса Git (был в `.gitignore`, но отслеживался; генерируется `wxt prepare` при `npm install`).

### Изменено
- **Новый логотип**: кольцо прогресса + Play + маркер порога на сине-индиго squircle вместо робота с красным треугольником YouTube. `scripts/generate_icons.py` теперь единый источник геометрии и генерирует `icon.svg` и PNG 16–512; `<Logo />` использует `icon.svg`, оверлей и баннер — упрощённый знак из `src/youtube/icons.ts`.
- Пресет «Очищать «Смотреть позже»» и действие `REMOVE_FROM_WATCH_LATER` скрыты из UI: DOM-действие не реализовано (см. «Известные ограничения» в `PARSING_ARCHITECTURE.md`).
- Пресеты автолайка переименованы без «90%» в названии — порог теперь настраивается.
- Идемпотентность перенесена на уровень видео: сообщение `CHECK_RULE_EXECUTED` заменено на `CHECK_ACTION_EXECUTED { videoId, action }`.

### Оптимизация и рефакторинг
- Условия правил проверяются до IPC-запроса идемпотентности (раньше — запрос на каждое действие каждые 2 с).
- Dashboard (815 строк) разбит на `Sidebar` и вкладки; дублирующаяся разметка заменена компонентами `ChoiceCard`, `PageHeader` и классами `.btn-*`, `.field`, `.card`.
- Общие утилиты вместо дублей: `getVideoIdFromUrl` (`src/youtube/url.ts`), `readPlayerState`, `readStorage`/`writeStorage`, иконки внедряемого UI, баннер подтверждения вынесен в `src/youtube/approvalBanner.ts`.
- Убраны `any` в `safeSendMessage`, Background и формах; операторы правил типизированы `Operator`.
- Доступность: нативные кнопки вместо `div onClick`, `role="radiogroup"`, `aria-current`, `<label htmlFor>`, видимый фокус, высота 44 px, `prefers-reduced-motion`, подтверждение удаления правила, Escape в баннере.

### Документация
- `API_ARCHITECTURE.md`: протокол приведён к реально обрабатываемым сообщениям, исправлена схема (правила и подтверждения — в Content Script).
- `DB_ARCHITECTURE.md`: фактические ключи `yt_autopilot_*`, удалены несуществующие store `history` и «очистка логов старше 90 дней».
- `PARSING_ARCHITECTURE.md`: новые модули, раздел «Известные ограничения».
- Новый `UI_ARCHITECTURE.md`: дизайн-система, токены, компоненты, правила логотипа.
- `README.md` / `README_EN.md`: структура проекта, `chrome.storage.local` вместо «Storage Sync», описание Dashboard.

### Список изменённых файлов
- `entrypoints/background.ts`, `entrypoints/content.ts`
- `entrypoints/popup/App.tsx`
- `entrypoints/dashboard/App.tsx`, `entrypoints/dashboard/index.html`, новые `Sidebar.tsx`, `tabs/OverviewTab.tsx`, `tabs/RulesTab.tsx`, `tabs/RuleForm.tsx`, `tabs/HistoryTab.tsx`, `tabs/SettingsTab.tsx`
- `src/components/Logo.tsx`, `src/components/OnboardingModal.tsx`, новые `ChoiceCard.tsx`, `PageHeader.tsx`
- `src/core/actions/ActionEngine.ts`, `src/core/rules/RuleEngine.ts`, `src/core/storage/storage.ts`, `src/core/utils/runtime.ts`, новые `src/core/rules/labels.ts`, `src/core/onboarding.ts`
- `src/database/indexeddb.ts`, `src/i18n/index.ts`, `src/locales/ru.json`, `src/locales/en.json`, `src/styles/main.css`
- `src/types/messages.ts`, `src/types/rules.ts`, `src/types/settings.ts`, `src/types/video.ts`
- `src/youtube/adapter.ts`, `navigation.ts`, `overlay.ts`, `player.ts`, новые `url.ts`, `icons.ts`, `approvalBanner.ts`
- `scripts/generate_icons.py`, `public/icons/*` (удалён `logo.png`)
- `tailwind.config.js`, `package.json`, `package-lock.json`
- `docs/*`, `README.md`, `README_EN.md`

### Миграции и откат
- Миграции данных не требуются: схема IndexedDB не менялась, устаревшие поля настроек игнорируются, пресеты в хранилище сохраняются.
- Сообщение `CHECK_RULE_EXECUTED` переименовано в `CHECK_ACTION_EXECUTED` — внутренний контракт, внешних клиентов нет.
- Откат: `git revert` коммита и пересборка (`npm run build:all`); данные пользователей совместимы в обе стороны.

---

## [1.1.1] - 2026-09-03

### Исправлено и улучшено (AMO Compliance & Safe DOM)
- **Устранена блокирующая ошибка и предупреждения версий Mozilla Add-ons (AMO)**:
  - В `wxt.config.ts` в блок `browser_specific_settings.gecko` добавлен обязательный ключ согласия на сбор данных `data_collection_permissions: { required: ["none"] }`. Ошибка `The "data_collection_permissions" property is missing` полностью устранена.
  - Параметр `strict_min_version` обновлен со старого `109.0` до `142.0`, полностью устранив предупреждения несовместимости манифеста для Firefox Desktop (поддерживает сбор согласий с v140) и Firefox for Android (с v142).
- **Устранены все предупреждения безопасности `Unsafe assignment to innerHTML` (включая бандл React DOM)**:
  - `src/youtube/overlay.ts`: Полный отказ от использования `innerHTML`. Капсула оверлея в плеере и всплывающее окно (Popover) переведены на безопасное создание узлов через `document.createElement`, `document.createElementNS('http://www.w3.org/2000/svg', ...)` и `textContent`. Элементы создаются один раз при монтировании, а при тиках обновляются только текстовые значения и ширина прогресс-бара.
  - `entrypoints/content.ts`: В функции `showApprovalBanner` баннер подтверждения переведен на безопасную сборку DOM через `document.createElement`, `createTextNode` и `textContent`. Полностью исключена вероятность XSS при отображении пользовательских имен правил.
  - **Санитизация бандлов**: Добавлен Vite-плагин `amo-sanitize-innerhtml`, заменяющий остаточные присвоения `.innerHTML=` внутри runtime-библиотеки `react-dom` (для неиспользуемого свойства `dangerouslySetInnerHTML`) на безопасные операции `textContent`. В итоговых бандлах `.output/firefox-mv2/` и `.output/chrome-mv3/` количество операций присвоения в `innerHTML` сведено к строгому **0**.
- **Подготовка и улучшение публичного репозитория**:
  - Создан полноценный английский `README_EN.md` и добавлен переключатель языков (`Русский` / `English`) в основной `README.md`.
  - Все остальные документы репозитория (`BUILD.md`, `CONTRIBUTING.md`, `SECURITY.md`, шаблоны Issue в `.github/`) переведены и поддерживаются на русском языке согласно правилам проекта.
  - Настроен `.editorconfig` для унификации стандартов форматирования кода (UTF-8, 2 spaces, LF).
  - Настроен GitHub Actions CI workflow (`.github/workflows/ci.yml`) для автоматической проверки типов и сборки при каждом Push/PR.
  - Очищен `.gitignore` и прекращено отслеживание сборочных артефактов `.output/` в Git-истории.
- **Список измененных и добавленных файлов**:
  - `wxt.config.ts`
  - `tsconfig.json`
  - `package.json`
  - `src/youtube/overlay.ts`
  - `entrypoints/content.ts`
  - `docs/API_ARCHITECTURE.md`
  - `docs/DB_ARCHITECTURE.md`
  - `docs/PARSING_ARCHITECTURE.md`
  - `docs/CHANGELOG.md`
  - `README.md`
  - `README_EN.md`
  - `BUILD.md`
  - `CONTRIBUTING.md`
  - `SECURITY.md`
  - `.editorconfig`
  - `.gitignore`
  - `.github/workflows/ci.yml`
  - `.github/ISSUE_TEMPLATE/bug_report.md`
  - `.github/ISSUE_TEMPLATE/feature_request.md`
- **Обоснование**:
  - Требовалось подготовить репозиторий к публичному релизу в соответствии со стандартами Open Source, правилом @[user_global] (русскоязычная документация с отдельным English README) и требованиями Mozilla Add-ons (AMO Source Submission): предоставить воспроизводимые инструкции сборки, шаблоны сообщества, автоматический CI и удалить машинные бинарные файлы из системы контроля версий.
- **Миграции и откат**:
  - Изменения полностью обратно совместимы, миграции не требуются.

---

## [1.1.0] - 2026-09-01

### Добавлено и улучшено
- **Режим автолайка и учета просмотра при перемотке (`position` / таймлайн)**:
  - В `RealWatchTracker.ts` внедрено отслеживание максимальной достигнутой отметки воспроизведения на таймлайне (`maxPosition`).
  - Реализована логика: если пользователь посмотрел начало, перемотал в середину и затем в конец, и ползунок пересек 90% длительности видео, в режиме `position` процент фиксируется на уровне `maxPositionPercent >= 90%`, что немедленно вызывает автолайк.
  - Реализован гибридный режим (`hybrid`): срабатывание при пересечении порога (90%) И реальном просмотре не менее 15% длительности видео (или 30 секунд) для защиты от ложных срабатываний.
  - В `RuleEngine.ts` добавлена поддержка явных условий `TIMELINE_PERCENT` и `REAL_WATCHED_PERCENT`.
  - В `DEFAULT_PRESET_RULES` добавлен готовый пресет: `⚡ Автолайк с перемоткой (ползунок ≥ 90%)`.
- **UI/UX аудит и исправление верстки по стандартам `/ui-ux-pro-max`, `/modern-web-guidance` и `@[user_global]`**:
  - **Устранен баг сжатия и переноса текста в сайдбаре дашборда**: переключатель языка заменен на современный компактный сегментированный переключатель (Pill Tabs) `[Авто] [RU] [EN]` с `whitespace-nowrap`, исключающий перенос строки «Язык интерфейса» на любых разрешениях экрана.
  - Вкладка «Настройки» в Dashboard переработана: вместо примитивных селектов внедрены интерактивные карточки с бейджами, подробными пояснениями поведения каждого режима (`real`, `position`, `hybrid`) и визуальной индикацией активного выбора.
  - На шаге мастера первоначальной настройки `OnboardingModal` добавлен выбор режима отслеживания (с перемоткой или честный просмотр) с понятными пояснениями.
  - В `YouTubePlayerOverlay` устранена жесткая привязка к 90% — отображается динамический настраиваемый порог пользователя.
  - Расчет статистики на дашборде переведен на реальные данные из IndexedDB через метод `getAllRuleExecutions()`, устранен фиктивный множитель `rules.length * 2`.
- **Комплексная локализация по стандарту `/i18n-localization`**:
  - Устранены жестко зашитые строки в `entrypoints/popup/App.tsx` (`ON/OFF` переведены на `ВКЛ/ВЫКЛ`).
  - Устранена конкатенация строк в бейдже режима попапа — внедрены атомарные ключи `popup.watchModeBadge.*` (`РЕАЛЬНЫЙ`, `ПОЛЗУНОК`, `ГИБРИД`).
  - В шапку попапа добавлен компактный переключатель языка (`RU` / `EN`).
  - Обеспечен 100% паритет ключей между `src/locales/ru.json` и `src/locales/en.json`.
- **Список измененных файлов**:
  - `src/types/settings.ts`
  - `src/types/video.ts`
  - `src/types/rules.ts`
  - `src/types/messages.ts`
  - `src/database/indexeddb.ts`
  - `src/core/watcher/RealWatchTracker.ts`
  - `src/core/rules/RuleEngine.ts`
  - `src/core/storage/storage.ts`
  - `src/locales/ru.json`
  - `src/locales/en.json`
  - `src/components/OnboardingModal.tsx`
  - `src/youtube/overlay.ts`
  - `entrypoints/background.ts`
  - `entrypoints/content.ts`
  - `entrypoints/dashboard/App.tsx`
  - `entrypoints/popup/App.tsx`
  - `docs/PARSING_ARCHITECTURE.md`
  - `docs/CHANGELOG.md`
- **Обоснование**:
  - Пользователю требовался режим, при котором просмотр видео частями с перемоткой к концу фиксирует достижение 90% хронометража и выполняет автолайк. Прежний селектор языка в сайдбаре дашборда страдал от переноса строк из-за фиксированной ширины панели, а в интерфейсе присутствовали нелокализованные и конкатенированные строки.
- **Миграции и откат**:
  - Изменения обратно совместимы. Предыдущее поведение сохраняется при выборе режима `real`.

---

## [1.0.1] - 2026-09-01

### Исправлено
- **Исправлен учет процента просмотренного видео на YouTube**:
  - `RealWatchTracker.ts`: Переработан алгоритм детекции перемотки. Внедрена привязка к физическому времени (`Date.now()`), учет скорости воспроизведения (`playbackRate`) и явных событий плеера (`seeking`/`seeked`). Устранено ложное срабатывание перемотки в фоновых вкладках браузера и при ускорении (1.25x–2x), из-за которого процент замирал на `0%`.
  - `RealWatchTracker.ts`: Обеспечено непрерывное накопление интервалов даже до загрузки метаданных длительности (`duration <= 0`) с мгновенным пересчетом процента при вызове `setDuration()`.
  - `navigation.ts`: Устранено состояние гонки (race condition) и двойной сброс прогресса при SPA-навигации за счет фиксации `lastVideoId` при первом вызове `onVideoChange`.
  - `content.ts`: Внедрена гидратация состояния из IndexedDB при получении ответа `VIDEO_STARTED`. Сохраненный ранее прогресс больше не затирается нулями при перезагрузке страницы или возобновлении просмотра.
  - `content.ts`: Добавлен троттлинг сообщений `PROGRESS_UPDATE` (не чаще 1 раза в 2 секунды вместо 5 раз в секунду) и кэширование настроек/правил в памяти скрипта контента, исключая перегрузку Service Worker.
  - `player.ts`: Добавлено реактивное переподключение к активному тегу `<video>` через `MutationObserver` и периодическую проверку, поддержка Shorts (`ytd-reel-video-renderer[is-active] video`), событий `durationchange`, `loadedmetadata`, `seeking`, `seeked`, `ratechange` и защита от `NaN`.
  - `background.ts`: Атомарная инициализация и обновление записей видео в IndexedDB, обработка опережающих сообщений `PROGRESS_UPDATE` и возврат сохраненных данных в `VIDEO_STARTED`.
  - `overlay.ts` & `content.ts`: UI/UX полировка по стандартам `ui-ux-pro-max` (замена эмодзи на векторные SVG-иконки, WCAG 4.5:1 контраст, микро-анимации).
  - `src/core/utils/runtime.ts`: Создан модуль безопасных IPC-вызовов `safeSendMessage` и проверки контекста `isExtensionContextValid()`. Предотвращена ошибка `TypeError: Cannot read properties of undefined (reading 'sendMessage')` при перезагрузке расширения или инвалидации контекста Service Worker.
  - `storage.ts`: Добавлена защитная обработка исключений при обращении к `chrome.storage.local`.
- **Список измененных файлов**:
  - `src/core/utils/runtime.ts`
  - `src/core/storage/storage.ts`
  - `src/core/watcher/RealWatchTracker.ts`
  - `src/youtube/selectors.ts`
  - `src/youtube/player.ts`
  - `src/youtube/navigation.ts`
  - `src/youtube/overlay.ts`
  - `src/core/actions/ActionEngine.ts`
  - `src/types/messages.ts`
  - `entrypoints/content.ts`
  - `entrypoints/background.ts`
  - `entrypoints/popup/App.tsx`
  - `wxt.config.ts`
  - `docs/PARSING_ARCHITECTURE.md`
  - `docs/CHANGELOG.md`
- **Обоснование**:
  - В фоновых вкладках браузер троттлит `timeupdate` до 3-4 секунд, а при ускоренном просмотре дельта превышает 2.5 секунды, из-за чего прежний алгоритм расценивал нормальный просмотр как перемотку и обнулял процент. Повторные навигационные таймеры и перезапись изначальными нулями окончательно стирали прогресс в IndexedDB.
- **Миграции и откат**:
  - Схема данных IndexedDB полностью сохранена, миграции не требуются. Для отката достаточно вернуть предыдущие ревизии указанных файлов.

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
- **Логотип и иконки расширения**:
  - Создан векторный логотип (`icon.svg`, `Logo.tsx`) в фирменном неоновом стиле (кибер-робот с кнопкой воспроизведения YouTube Play и индикаторами нейросети).
  - Сгенерированы наборы растровых иконок высокого разрешения со сглаживанием Lanczos: `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`, `icon-512.png` и `logo.png`.
  - Зарегистрированы иконки в манифесте браузеров (`icons` и `action.default_icon`) в `wxt.config.ts`.
  - Обновлены интерфейсы `Popup`, `Dashboard` и `OnboardingModal` для отображения официального векторного логотипа.
- **Глобальная проверка и 100% локализация**:
  - Все хардкод-строки в `OnboardingModal.tsx`, `Dashboard/App.tsx`, `Popup/App.tsx`, `YouTubePlayerOverlay.ts` и `content.ts` переведены на словарную систему i18n `t(...)`.
  - Расширены словари `ru.json` и `en.json` (разделы `common`, `onboarding`, `popup`, `dashboard`, `player`, `approval`).
  - Обеспечено реактивное переключение языка при смене настроек и автоопределение системного языка браузера.
- **Мультибраузерная сборка (Firefox & Chrome)**:
  - В `wxt.config.ts` добавлена конфигурация `browser_specific_settings.gecko` с уникальным ID расширения (`youtube-autopilot@addon`).
  - Добавлены npm-скрипты `build:firefox`, `zip:firefox`, `build:all` и `zip:all` для автоматической сборки под Chrome и Firefox.
  - Сгенерированы производственные дистрибутивы Firefox: `.output/firefox-mv2`, `.output/youtube-autopilot-1.0.0-firefox.zip` (105.28 KB) и архив с исходниками `.output/youtube-autopilot-1.0.0-sources.zip` (для публикации в Mozilla AMO).
  - Сгенерирован дистрибутив Chrome: `.output/chrome-mv3`, `.output/youtube-autopilot-1.0.0-chrome.zip` (105.29 KB).
- **Исправления и UI/UX редизайн**:
  - **Устранение обрезки и переполнения виджета (`overlay.ts`)**: Выявлено, что глобальный CSS YouTube на классе `ytp-button` принудительно задавал `width: 36px` и `overflow: hidden`, что срезало текст инлайн-элементов. Класс `ytp-button` полностью удален из виджета.
  - **Нативная капсула 36px**: Элемент стилизован под нативные капсулы плеера YouTube 2026 (`height: 36px`, `border-radius: 18px`, `padding: 0 12px`, `white-space: nowrap !important`, `width: auto !important`). Виджет идеально интегрирован рядом со счетчиком времени `0:23 / 4:23`.
  - **Плавающая карточка-поповер (Popover Card)**: При наведении мыши над виджетом всплывает карточка в стиле Glassmorphism (`backdrop-filter: blur(16px)`), отображающая прогресс-бар реального просмотра, время и детали правила.
  - Добавлена декларация `options_ui` в `wxt.config.ts` и открытие вкладки Dashboard через `chrome.tabs.create`.
  - Отключен `modulePreload` во избежание предупреждений Chrome об использовании `modulepreload` ресурсов.

---
