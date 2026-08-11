# ТЗ — YouTube Autopilot

**Рабочее название:** YouTube Autopilot
**Тип продукта:** браузерное расширение
**Основная платформа:** Google Chrome / Chromium
**Формат:** Chrome Extension Manifest V3
**Frontend:** React + TypeScript
**Framework:** WXT
**Хранилище MVP:** Chrome Storage + IndexedDB
**Backend:** отсутствует в MVP
**Основная идея:** автоматизация действий пользователя на YouTube на основе фактического просмотра видео и пользовательских правил.

---

# 1. Концепция продукта

YouTube Autopilot — браузерное расширение, которое анализирует просмотр пользователем YouTube-видео и автоматически выполняет заранее заданные действия.

Основной принцип:

> **IF → WHEN → THEN**

Например:

```text
IF
Видео просмотрено ≥ 90%

AND
Реально просмотрено ≥ 80%

THEN
❤️ Поставить Like
```

Другой пример:

```text
IF
Видео из Watch Later
AND
Реально просмотрено ≥ 80%

THEN
🗑 Удалить из Watch Later
```

Или:

```text
IF
Видео принадлежит определённому playlist

THEN
📚 Обновить прогресс курса
```

Таким образом, **Auto Like является только одной функцией**, а не сутью продукта.

---

# 2. Основные задачи

Продукт должен позволять пользователю:

1. Отслеживать реальный просмотр YouTube-видео.
2. Определять процент фактически просмотренного контента.
3. Создавать автоматические правила.
4. Автоматически выполнять действия на YouTube.
5. Управлять Watch Later.
6. Отслеживать прогресс по playlists.
7. Скрывать уже просмотренные видео.
8. Получать статистику просмотра.
9. В дальнейшем использовать AI для работы с просмотренными видео.
10. Хранить историю локально и не отправлять её на сервер в MVP.

---

# 3. Целевая аудитория

### Основная

Люди, которые много используют YouTube:

* разработчики;
* студенты;
* специалисты;
* создатели контента;
* люди, проходящие YouTube-курсы;
* пользователи с большим Watch Later;
* пользователи, которые регулярно смотрят одни и те же каналы.

### Вторичная

Пользователи, которым нужны:

* автоматические лайки;
* автоматическое управление playlists;
* статистика;
* персональная история просмотра;
* AI-summary.

---

# 4. Главная продуктовая фишка

## Real Watch Tracking

Обычный подход:

```text
currentTime / duration
```

не подходит как единственный источник истины.

Например:

```text
Видео: 30 минут

Просмотр:
00:00 → 10:00

Перемотка

25:00 → 30:00
```

Позиция:

```text
100%
```

Но фактически пользователь посмотрел:

```text
15 / 30 = 50%
```

YouTube Autopilot должен учитывать **уникальные реально просмотренные интервалы**.

---

# 5. Алгоритм Real Watch Tracking

Для каждого видео создаётся набор просмотренных интервалов:

```text
[
  [0, 120],
  [120, 340],
  [500, 700]
]
```

Интервалы объединяются.

Например:

```text
[0, 100]
[90, 200]
```

становятся:

```text
[0, 200]
```

После объединения:

```text
watchedSeconds =
sum(end - start)
```

Процент:

```text
watchedPercent =
watchedSeconds / duration * 100
```

---

# 6. Условия определения просмотра

Система должна учитывать:

### Видео действительно проигрывается

Не считать время, когда:

* видео стоит на паузе;
* вкладка неактивна — опционально;
* браузер заморожен;
* видео закончилось;
* пользователь перематывает.

### Перемотка

При скачке:

```text
currentTime = 300
previousTime = 100
```

не считать:

```text
100 → 300
```

просмотренными секундами.

Система должна зарегистрировать только фактическое проигрывание.

---

# 7. Режимы отслеживания

Настройка:

```text
Watch tracking mode

○ Position based
● Real watched time
○ Hybrid
```

### Position based

Просто:

```text
currentTime / duration
```

Быстрее и дешевле.

### Real watched time

Используются интервалы.

Основной режим.

### Hybrid

Для повышения производительности:

* сначала position;
* при достижении threshold включается точный анализ.

---

# 8. Состояния просмотра

Каждое видео имеет состояние:

```text
NEW
WATCHING
PAUSED
PROGRESS
COMPLETED
ABANDONED
```

### NEW

Видео ещё не смотрели.

### WATCHING

Видео сейчас проигрывается.

### PROGRESS

Есть накопленный прогресс.

### COMPLETED

Достигнут пользовательский threshold.

Например:

```text
watchedPercent >= 90
```

### ABANDONED

Видео было начато, но пользователь ушёл.

---

# 9. Объект Video

Внутренняя модель:

```ts
interface VideoRecord {
  id: string;
  url: string;
  title: string;

  channelId?: string;
  channelName?: string;

  duration: number;

  watchedSeconds: number;
  watchedPercent: number;

  intervals: WatchInterval[];

  firstWatchedAt?: number;
  lastWatchedAt?: number;
  completedAt?: number;

  liked?: boolean;
  saved?: boolean;

  source?: VideoSource;

  createdAt: number;
  updatedAt: number;
}
```

---

# 10. Источник видео

```ts
enum VideoSource {
  WATCH_PAGE,
  SHORTS,
  SEARCH,
  HOME,
  RECOMMENDATION,
  WATCH_LATER,
  PLAYLIST,
  CHANNEL
}
```

Это понадобится для правил.

---

# 11. Rules Engine

Это **ядро продукта**.

Пользователь создаёт:

```text
WHEN [condition]
AND [condition]
THEN [action]
```

---

# 12. Conditions

В MVP:

### Watch conditions

```text
Watched percentage
Watched seconds
Video duration
```

Примеры:

```text
Watched ≥ 90%
Watched ≥ 10 minutes
Duration ≥ 5 minutes
```

---

### Channel

```text
Channel is ...
Channel is not ...
Channel in whitelist
Channel in blacklist
```

---

### Video

```text
Short
Long video
Live
Premiere
```

---

### Source

```text
Watch Later
Playlist
Search
Home
Channel
```

---

### Subscription

```text
Subscribed
Not subscribed
```

---

# 13. Operators

Для числовых значений:

```text
=
>
<
>=
<=
```

Для списков:

```text
IN
NOT IN
```

Для boolean:

```text
IS
IS NOT
```

---

# 14. Actions

## MVP

### Like

```text
LIKE_VIDEO
```

### Unlike

```text
UNLIKE_VIDEO
```

### Save

```text
SAVE_VIDEO
```

### Remove from Watch Later

```text
REMOVE_FROM_WATCH_LATER
```

### Hide completed

Локальное скрытие UI:

```text
HIDE_VIDEO
```

---

# 15. Будущие Actions

```text
SUBSCRIBE_CHANNEL
ADD_TO_PLAYLIST
REMOVE_FROM_PLAYLIST
MARK_AS_WATCHED
ADD_NOTE
GENERATE_SUMMARY
GENERATE_FLASHCARDS
GENERATE_QUIZ
```

Некоторые действия должны быть реализованы только после отдельной проверки UX, технической реализуемости и политики Chrome Web Store/YouTube.

---

# 16. Пример правила

```text
Rule: Support creators

WHEN

Watched percentage >= 90%

AND

Video duration >= 60 sec

AND

Video is not Short

THEN

Like video
```

---

# 17. Второй пример

```text
Rule: Clean Watch Later

WHEN

Source = Watch Later

AND

Watched percentage >= 80%

THEN

Remove from Watch Later
```

---

# 18. Третий пример

```text
Rule: Favorite channels

WHEN

Channel IN Favorite Channels

AND

Watched percentage >= 70%

THEN

Like video
```

---

# 19. Четвёртый пример

```text
Rule: Long videos

WHEN

Duration >= 20 min

AND

Watched >= 90%

THEN

Like
AND
Mark completed
```

---

# 20. Rule Builder

Главный интерфейс:

```text
Create automation

WHEN

[ Watched percentage ]
[ >= ]
[ 90 ]

AND

[ Video duration ]
[ >= ]
[ 5 min ]

THEN

[ ❤️ Like video ]

[ Save Rule ]
```

Пользователь не должен писать код.

---

# 21. Presets

Сразу добавить готовые сценарии.

### ❤️ Like completed videos

```text
Watched ≥ 90%
→ Like
```

### 🧹 Clean Watch Later

```text
Watch Later
+
Watched ≥ 80%
→ Remove
```

### 🎯 Real Watch

```text
Track actual watch time
```

### 📚 Course Mode

```text
Track playlist progress
```

### 👤 Favorite creators

```text
Favorite channel
+
Watched ≥ 70%
→ Like
```

---

# 22. Safety Layer

Очень важная часть.

Нельзя просто выполнять действия бесконтрольно.

Перед каждым действием:

```text
Action Engine
      ↓
Permission
      ↓
Rule enabled?
      ↓
Conditions satisfied?
      ↓
Already executed?
      ↓
Cooldown?
      ↓
Execute
```

---

# 23. Idempotency

Одна и та же автоматизация не должна выполняться несколько раз.

Например:

```text
Video A
watched = 95%

Rule:
Like >= 90%
```

Система поставила Like.

После обновления страницы она **не должна снова пытаться поставить Like**.

Создаётся:

```text
RuleExecution
```

```ts
interface RuleExecution {
  ruleId: string;
  videoId: string;
  action: string;

  executedAt: number;

  status:
    | "success"
    | "failed"
    | "skipped";
}
```

---

# 24. Delay

Для действий можно задать:

```text
Delay:
0–60 seconds
```

Например:

```text
Threshold reached
      ↓
wait 5 sec
      ↓
execute Like
```

Это также позволяет избежать выполнения действия непосредственно в момент достижения порога.

---

# 25. Cooldown

Например:

```text
Minimum delay between actions:
10 seconds
```

Чтобы система не выполняла десятки операций подряд.

---

# 26. Manual Approval

Очень полезная функция.

Режим:

```text
Automation mode

● Automatic
○ Ask before action
○ Disabled
```

В режиме Ask:

```text
┌───────────────────────────┐
│ Video completed           │
│                           │
│ "PostgreSQL Internals"    │
│                           │
│ Rule wants to:            │
│ ❤️ Like video             │
│                           │
│ [Allow] [Skip]            │
└───────────────────────────┘
```

---

# 27. Extension Popup

Popup должен быть максимально простым.

```text
┌──────────────────────────────┐
│  YouTube Autopilot           │
│                              │
│  ● Automation ON             │
│                              │
│  Current video               │
│  ─────────────────────────   │
│  PostgreSQL WAL explained    │
│                              │
│  Watched                     │
│  ███████████████░░ 87%       │
│                              │
│  Real watch time             │
│  18:24 / 21:10               │
│                              │
│  Next action                 │
│  ❤️ Like at 90%              │
│                              │
│  [Rules] [History]           │
│                              │
└──────────────────────────────┘
```

---

# 28. Current Video Status

Popup должен показывать:

* название;
* канал;
* duration;
* watched %;
* real watched %;
* active rules;
* pending actions;
* выполненные actions.

---

# 29. Inline UI на YouTube

Опционально добавить небольшой индикатор возле плеера:

```text
Autopilot

████████████████░░░ 87%

Real watch: 18:24

Next:
❤️ Like at 90%
```

Не перекрывать стандартные элементы YouTube.

---

# 30. History

Раздел:

```text
History

Today

14 videos
4h 21m watched

Likes
9

Saved
6

Removed
14
```

Для каждого видео:

```text
Video
Channel
Watched
Actions
Date
```

Фильтры:

```text
All
Watched
Liked
Saved
Removed
Failed
```

---

# 31. Activity Log

Каждое действие:

```text
14:32:05
❤️ Like

Video:
PostgreSQL WAL Explained

Rule:
Like completed videos

Watched:
93%

Status:
Success
```

При ошибке:

```text
Status:
Failed

Reason:
Like button not found
```

---

# 32. Error handling

Система не должна бесконечно пытаться выполнить действие.

Например:

```text
Attempt 1
↓
Failed

Wait 2 sec

Attempt 2
↓
Failed

Wait 5 sec

Attempt 3
↓
Failed

STOP
```

Статус:

```text
FAILED
```

---

# 33. Retry policy

Настройки:

```text
Max retries: 3

Retry delays:
2s
5s
10s
```

---

# 34. Watch Later Manager

Отдельный модуль.

Показывает:

```text
Watch Later

Total: 842

Watched:
213

Unwatched:
629
```

Фильтр:

```text
< 25%
25–50%
50–75%
75–90%
90–100%
```

---

# 35. Автоочистка

Правило:

```text
When watched >= 80%
→ Remove from Watch Later
```

Перед включением показать:

> This automation will remove videos from your Watch Later list after reaching the selected watch threshold.

---

# 36. Completed Videos

Локальная история:

```text
Completed

✓ PostgreSQL WAL
✓ React Server Components
✓ Docker Networking
✓ Redis Internals
```

Для каждого:

```text
Watched:
96%

Real:
42m 11s

Completed:
11 Aug 2026
```

---

# 37. Hide Watched Videos

Настройка:

```text
Hide completed videos

Threshold:
[ 80% ]

☑ Home
☑ Search
☑ Recommendations
☐ Channel pages
☐ Playlists
```

Вместо удаления видео:

```text
✓ Watched
```

или визуально скрывать.

---

# 38. Playlist / Course Mode

Пользователь выбирает playlist:

```text
React Advanced Course
```

Система показывает:

```text
Progress

██████████████░░░░ 72%

18 / 25 completed

Watched time:
14h 42m

Remaining:
5h 18m
```

---

# 39. Course dashboard

```text
React Advanced

01 Fundamentals       ✓
02 Components         ✓
03 State              ✓
04 Server Components  ✓
05 Suspense           62%
06 Performance
07 Deployment
```

---

# 40. Playlist rules

Например:

```text
WHEN
Playlist = React Course

THEN
Track progress
```

И:

```text
WHEN
Playlist = React Course
AND
Watched >= 90%

THEN
Mark lesson completed
```

---

# 41. Statistics

Dashboard:

```text
Overview

Today
────────────────────

Watch time       4h 21m
Videos           14
Completed        11

Average completion
87%

Actual watch ratio
82%

Likes
9
```

---

# 42. Statistics по дням

```text
Mon   2h 14m
Tue   3h 40m
Wed   1h 50m
Thu   4h 21m
```

---

# 43. Statistics по каналам

```text
Channels

Fireship          8h 21m
Theo              4h 12m
Primeagen         3h 42m
...
```

---

# 44. Privacy-first

MVP должен работать **локально**.

Не отправлять на сервер:

* URL видео;
* историю;
* названия видео;
* каналы;
* просмотр;
* cookies;
* YouTube account data.

Chrome Web Store отдельно требует прозрачно раскрывать работу с user data даже если данные остаются локально, а browsing activity допускается только когда она необходима для явно заявленной пользовательской функции. Поэтому privacy-модель и описание расширения должны быть частью продукта с самого начала. ([Chrome for Developers][1])

---

# 45. Хранилище

Разделить:

### chrome.storage.local

Для:

```text
settings
rules
presets
feature flags
```

### IndexedDB

Для:

```text
videos
watch intervals
history
rule executions
statistics
playlists
```

Не складывать большую историю в `chrome.storage`.

---

# 46. Структура данных

### Settings

```ts
interface Settings {
  enabled: boolean;

  watchMode:
    | "position"
    | "real"
    | "hybrid";

  defaultThreshold: number;

  defaultDelay: number;

  trackInactiveTab: boolean;

  shortsEnabled: boolean;

  automationMode:
    | "automatic"
    | "approval"
    | "disabled";
}
```

---

# 47. Rule

```ts
interface Rule {
  id: string;

  name: string;

  enabled: boolean;

  conditions: Condition[];

  actions: Action[];

  delay?: number;

  maxRetries?: number;

  createdAt: number;

  updatedAt: number;
}
```

---

# 48. Condition

```ts
interface Condition {
  type: ConditionType;

  operator?: Operator;

  value?: unknown;
}
```

Примеры:

```ts
{
  type: "WATCHED_PERCENT",
  operator: "GTE",
  value: 90
}
```

```ts
{
  type: "VIDEO_DURATION",
  operator: "GTE",
  value: 300
}
```

---

# 49. Action

```ts
interface Action {
  type: ActionType;

  options?: Record<string, unknown>;
}
```

---

# 50. Архитектура расширения

Я предлагаю:

```text
                    Chrome
                       │
               ┌───────┴────────┐
               │                │
         Popup UI          Content Script
               │                │
               ▼                ▼
          Settings        YouTube Adapter
               │                │
               └───────┬────────┘
                       ▼
                 Rules Engine
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       Watch Tracker        Action Engine
             │                   │
             └─────────┬─────────┘
                       ▼
                    Storage
```

---

# 51. Content Script

Основные задачи:

```text
YouTube page detection
Video detection
Player detection
SPA navigation detection
Watch tracking
UI integration
Action execution
```

Chrome MV3 позволяет использовать статические content scripts для подходящих URL и `chrome.scripting` для программной инъекции; поэтому для основного YouTube-контента логичнее использовать content script, а не строить продукт вокруг ручного запуска JS. ([Chrome for Developers][2])

---

# 52. YouTube Adapter

Не размазывать YouTube DOM-селекторы по всему проекту.

Создать отдельный слой:

```text
youtube/
├── player.ts
├── navigation.ts
├── video.ts
├── actions.ts
├── selectors.ts
└── adapter.ts
```

Например:

```ts
interface YouTubeAdapter {
  getCurrentVideo(): VideoInfo | null;

  getPlayer(): HTMLVideoElement | null;

  getLikeState(): LikeState;

  likeVideo(): Promise<ActionResult>;

  unlikeVideo(): Promise<ActionResult>;

  saveVideo(): Promise<ActionResult>;

  removeFromWatchLater(): Promise<ActionResult>;
}
```

Это очень важно для будущих изменений интерфейса YouTube.

---

# 53. SPA Navigation

YouTube активно использует SPA-навигацию.

Нельзя рассчитывать только на:

```text
window.onload
```

Нужно отслеживать изменение страницы/URL и появление нового videoId.

При:

```text
/watch?v=AAA
```

→

```text
/watch?v=BBB
```

старый tracker уничтожается и создаётся новый.

---

# 54. Player Observer

Модуль:

```text
PlayerObserver
```

Отслеживает:

```text
play
pause
timeupdate
seeking
seeked
ended
ratechange
loadedmetadata
durationchange
```

Основная логика:

```text
PLAY
 ↓
start tracking

PAUSE
 ↓
stop tracking

SEEK
 ↓
close current interval
 ↓
ignore jump

PLAY
 ↓
start new interval
```

---

# 55. Производительность

Не использовать постоянный тяжёлый polling.

Плохо:

```js
setInterval(..., 10)
```

Лучше использовать события player + редкое состояние.

Цель:

```text
CPU impact < 1%
```

в нормальном режиме.

---

# 56. Background Service Worker

Используется для:

* сообщений между частями extension;
* storage operations;
* analytics локальной статистики;
* context coordination;
* notifications — если понадобятся;
* будущей синхронизации.

Manifest V3 использует service worker вместо постоянной background page. ([Chrome for Developers][3])

---

# 57. Popup

React:

```text
popup/
├── App.tsx
├── Dashboard.tsx
├── CurrentVideo.tsx
├── QuickRules.tsx
└── components/
```

---

# 58. Options / Dashboard

Отдельная страница:

```text
/dashboard.html
```

Разделы:

```text
Overview
Rules
History
Watch Later
Playlists
Statistics
Settings
Privacy
```

---

# 59. Дизайн

Я бы делал продукт **не похожим на техническое расширение**.

Стиль:

* минимализм;
* premium;
* много whitespace;
* небольшие карточки;
* progress bars;
* аккуратные icons;
* тёмная тема + светлая тема.

Главная идея UI:

> **Automation, not configuration.**

Пользователь должен чувствовать:

> «Я включил Autopilot — дальше он сам».

---

# 60. Onboarding

После установки:

### Шаг 1

```text
Welcome to YouTube Autopilot
```

### Шаг 2

```text
What do you want to automate?

☑ Auto Like
☑ Watch Later cleanup
☑ Track real watch time
☑ Track playlists
```

### Шаг 3

```text
Choose default completion threshold

[ 90% ]
```

### Шаг 4

```text
Choose automation mode

● Ask before actions
○ Automatic
```

По умолчанию я бы поставил **Ask before action**, чтобы пользователь сначала увидел поведение системы.

---

# 61. First-run preset

Автоматически создать:

```text
❤️ Like completed videos

Watched ≥ 90%
→ Like
```

Но включить его только после явного подтверждения пользователя.

---

# 62. Permissions

MVP должен запрашивать минимально необходимые permissions.

Предварительно:

```text
storage
```

и host permission только для YouTube.

Если используется `chrome.scripting`, нужны соответствующие permission/host permissions. Chrome прямо рекомендует минимально необходимый набор разрешений. ([Chrome for Developers][4])

---

# 63. Не использовать remote code

Весь исполняемый код должен находиться внутри extension package.

Manifest V3 ограничивает remotely hosted code и требует, чтобы функциональность была понятна из submitted code. ([Chrome for Developers][5])

Это особенно важно для Rule Engine: **правила пользователя должны быть данными, а не удалённым исполняемым JavaScript**.

---

# 64. AI — не MVP

AI вынести в отдельный модуль.

Будущий pipeline:

```text
Video
 ↓
Transcript
 ↓
AI
 ↓
Summary
 ↓
Notes
 ↓
Knowledge Base
```

Функции:

### Summary

```text
TL;DR
Key points
Detailed summary
```

### Notes

```text
Personal notes
```

### Quiz

```text
5 questions
```

### Flashcards

```text
Question → Answer
```

---

# 65. AI Rule

В будущем:

```text
WHEN

Watched >= 90%

AND

Playlist = "Programming"

THEN

Generate summary
AND
Save to knowledge base
```

Вот здесь продукт начинает становиться **YouTube Learning OS**.

---

# 66. Cloud Sync — V2

В MVP:

```text
Local only
```

V2:

```text
Chrome
   ↕
Cloud
   ↕
Laptop
```

Синхронизировать:

```text
settings
rules
completed videos
playlists
notes
statistics
```

---

# 67. Backend V2

Если потребуется:

```text
Frontend:
React

Backend:
Node.js / TypeScript

API:
REST

DB:
PostgreSQL

Auth:
Google OAuth

Cache:
Redis
```

Но это **не должно быть частью MVP**.

---

# 68. Возможная архитектура V2

```text
Chrome Extension
       │
       │ HTTPS
       ▼
   API Gateway
       │
       ├── Auth
       ├── Rules
       ├── Videos
       ├── Notes
       ├── AI
       └── Sync
              │
        ┌─────┴─────┐
        ▼           ▼
   PostgreSQL     Redis
```

---

# 69. Security

Не хранить:

* YouTube cookies;
* passwords;
* OAuth tokens в обычном localStorage;
* authentication data без необходимости.

Не отправлять серверу browsing history без явного user-facing основания и прозрачного disclosure. Chrome Web Store отдельно рассматривает browsing activity как user data. ([Chrome for Developers][1])

---

# 70. Chrome Web Store

Это важно заложить **до разработки**, а не после.

В описании нужно явно объяснить:

> Extension tracks YouTube videos you watch to provide automation features requested by the user.

И:

> Watch data is stored locally unless cloud sync/AI is explicitly enabled.

Chrome Web Store требует, чтобы использование browsing activity было необходимо для заявленной пользовательской функции и было прозрачно описано. ([Chrome for Developers][6])

Также у расширения должен быть **один понятный основной purpose**. Поэтому в Store Listing я бы позиционировал продукт не как «лайкер + AI + статистика + менеджер + ...», а как:

> **YouTube workflow automation**

А остальные возможности являются частями этого workflow. Это важно, поскольку Chrome Web Store прямо требует narrow/easy-to-understand single purpose. ([Chrome for Developers][7])

---

# 71. MVP Scope

Я бы жёстко ограничил первую версию.

## MVP 1.0

### Core

* [x] YouTube detection
* [x] Video detection
* [x] SPA navigation
* [x] Real Watch Tracking
* [x] Watch percentage
* [x] Position mode
* [x] Rule Engine
* [x] Conditions
* [x] Actions
* [x] Delay
* [x] Retry
* [x] Idempotency

### Actions

* [x] Like
* [x] Save / Watch Later
* [x] Remove from Watch Later
* [x] Local hide

### UI

* [x] Popup
* [x] Current video
* [x] Rules
* [x] History
* [x] Settings
* [x] Onboarding

### Storage

* [x] chrome.storage
* [x] IndexedDB

### Privacy

* [x] Local-first
* [x] No backend
* [x] No analytics by default

---

# 72. V1.1

Добавить:

* Playlist tracking
* Course Mode
* Watch Later Manager
* Statistics
* Channel whitelist
* Channel blacklist
* Shorts settings
* Advanced conditions
* Rule presets
* Activity log
* Hide completed videos

---

# 73. V1.5

Добавить:

* Dashboard
* advanced statistics;
* export JSON/CSV;
* import settings;
* backup;
* multiple rule groups;
* rule templates.

---

# 74. V2

AI:

* Summary;
* notes;
* transcript;
* quiz;
* flashcards;
* knowledge base.

---

# 75. V3

Cloud:

* account;
* sync;
* multiple devices;
* backup;
* cross-browser;
* shared settings.

---

# 76. Что НЕ делать

В MVP не делать:

❌ мобильное приложение
❌ отдельный backend
❌ собственную авторизацию
❌ AI
❌ Telegram bot
❌ сложную аналитику
❌ социальную сеть
❌ recommendation engine
❌ парсинг всего YouTube
❌ массовые действия по тысячам видео

Главное:

> **Надёжно отслеживать просмотр → правильно определять condition → безопасно выполнить action.**

---

# 77. Ключевой технический риск

Самая сложная часть — **не React и не Rule Builder**.

Самая сложная часть:

> **стабильно взаимодействовать с динамическим UI YouTube.**

Поэтому нужно сразу изолировать YouTube-specific code:

```text
core/
    watcher
    rules
    actions
    storage

youtube/
    player
    navigation
    selectors
    actions
```

Если YouTube завтра изменит DOM, мы меняем только adapter layer.

---

# 78. Тестирование

Нужен отдельный набор сценариев.

### Playback

* Play
* Pause
* Resume
* Seek forward
* Seek backward
* Playback speed 0.5x
* 1x
* 1.5x
* 2x
* Video ended

### Navigation

```text
Video A → Video B
Video A → Shorts
Shorts → Video
Video → Search
```

### Rules

```text
50%
80%
90%
100%
```

### Actions

```text
Like
Save
Remove
Hide
```

### Errors

```text
Button missing
Video unavailable
Ad playing
Network error
YouTube UI changed
```

---

# 79. Acceptance Criteria MVP

Продукт считается готовым, если:

### AC-01

После открытия YouTube-видео extension определяет:

* videoId;
* title;
* duration;
* channel;
* current position.

### AC-02

При реальном просмотре 30 секунд система добавляет примерно 30 секунд в watched intervals.

### AC-03

При перемотке:

```text
00:30 → 10:00
```

интервал:

```text
00:30 → 10:00
```

не считается просмотренным.

### AC-04

При достижении:

```text
watchedPercent >= 90%
```

срабатывает соответствующее правило.

### AC-05

Action выполняется не более одного раза на:

```text
videoId + ruleId + action
```

### AC-06

После обновления страницы история не теряется.

### AC-07

При переходе на другое видео tracker переключается на новый videoId.

### AC-08

Отключение Autopilot полностью прекращает автоматические действия.

### AC-09

При включённом Approval Mode ни одно действие не выполняется без подтверждения пользователя.

### AC-10

Все данные MVP остаются локальными.

---

# 80. Структура проекта

Я бы сразу закладывал примерно такую:

```text
youtube-autopilot/
│
├── entrypoints/
│   ├── content.ts
│   ├── background.ts
│   │
│   ├── popup/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   └── dashboard/
│       ├── App.tsx
│       └── main.tsx
│
├── src/
│   │
│   ├── core/
│   │   ├── watcher/
│   │   ├── rules/
│   │   ├── actions/
│   │   ├── storage/
│   │   └── events/
│   │
│   ├── youtube/
│   │   ├── adapter/
│   │   ├── player/
│   │   ├── navigation/
│   │   ├── selectors/
│   │   └── actions/
│   │
│   ├── database/
│   │   ├── indexeddb.ts
│   │   ├── videos.ts
│   │   ├── history.ts
│   │   └── rules.ts
│   │
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
│
├── public/
│   └── icons/
│
├── wxt.config.ts
├── package.json
└── tsconfig.json
```

---

# 81. Технологический стек

### Extension

**WXT**

### Frontend

**React 19 + TypeScript**

### Styling

**Tailwind CSS**

### Storage

**chrome.storage.local**

**IndexedDB**

### Browser API

**Manifest V3**

### Build

**Vite через WXT**

### Backend

**None в MVP**

---

# 82. Главное продуктовое отличие

Я бы зафиксировал это в ТЗ как основную USP:

> **YouTube Autopilot does not simply react to the player's position. It understands how much of the video you actually watched and uses that information to automate your YouTube workflow.**

По-русски:

> **Autopilot понимает, сколько видео вы действительно посмотрели, и на основе этого автоматически управляет вашими действиями на YouTube.**

Это гораздо сильнее, чем:

> «Поставим лайк после 90%».

---

## 83. Итоговая модель продукта

В конечном итоге получается:

```text
                    YOUTUBE
                       │
                       ▼
              ┌─────────────────┐
              │  WATCH TRACKER   │
              └────────┬────────┘
                       │
              REAL WATCH DATA
                       │
                       ▼
              ┌─────────────────┐
              │  RULES ENGINE   │
              └────────┬────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
        LIKE         SAVE        CLEAN
          │            │            │
          └────────────┼────────────┘
                       ▼
                  COMPLETED
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          HISTORY            PLAYLIST
             │                PROGRESS
             │
             ▼
             AI
             │
      ┌──────┼──────┐
      ▼      ▼      ▼
   SUMMARY  NOTES  QUIZ
```

И ещё один важный момент: поскольку Chrome Web Store в 2026 году ужесточает требования к privacy, single-purpose и прозрачности использования browsing activity, **privacy-first/local-first архитектуру лучше считать частью ТЗ, а не маркетинговой опцией**. ([Chrome for Developers][8])

[1]: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq?utm_source=chatgpt.com "Updated Privacy Policy & Secure Handling Requirements  |  Chrome Web Store - Program Policies  |  Chrome for Developers"
[2]: https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts?authuser=117&utm_source=chatgpt.com "Manifest - content scripts  |  Chrome Extensions  |  Chrome for Developers"
[3]: https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3?utm_source=chatgpt.com "Extensions / Manifest V3  |  Chrome for Developers"
[4]: https://developer.chrome.com/docs/extensions/reference/api/scripting?authuser=2&utm_source=chatgpt.com "chrome.scripting  |  API  |  Chrome for Developers"
[5]: https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements?utm_source=chatgpt.com "Additional Requirements for Manifest V3  |  Chrome Web Store - Program Policies  |  Chrome for Developers"
[6]: https://developer.chrome.com/docs/webstore/troubleshooting/?utm_source=chatgpt.com "Troubleshooting Chrome Web Store violations  |  Chrome Extensions  |  Chrome for Developers"
[7]: https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines/?utm_source=chatgpt.com "Quality guidelines  |  Chrome Web Store - Program Policies  |  Chrome for Developers"
[8]: https://developer.chrome.com/blog/cws-policy-updates-2026?hl=en&utm_source=chatgpt.com "Chrome Web Store policy updates: Enhancing user privacy and platform integrity  |  Blog  |  Chrome for Developers"
