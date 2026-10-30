# Архитектура Внутренних Коммуникаций и API

## 1. Обзор
Документ описывает протокол обмена сообщениями (Message Bus) между изолятами браузерного расширения **YouTube Autopilot**:
- `Content Script` (инжектируется в `https://*.youtube.com/*`)
- `Background Service Worker` (фоновый сервис-воркер Manifest V3)
- `Popup UI` (компактный интерфейс)
- `Dashboard / Options Page` (полноразмерная панель управления)

---

## 2. Схема Взаимодействия

```text
┌───────────────────────────────────┐        ┌──────────────────────────┐
│          Content Script           │        │   Popup / Dashboard UI   │
│  YouTubeAdapter → RealWatchTracker│        │       (React 19)         │
│  → RuleEngine → ActionEngine      │        └──────┬────────────┬──────┘
│  → DOM-действие / баннер          │               │            │
└───────┬───────────────────┬───────┘               │            │
        │ sendMessage       │ storage.local (R)     │ sendMessage│ storage.local (R/W)
        ▼                   ▼                       ▼            ▼  IndexedDB (R)
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Background Service Worker                            │
│   Message Router → handleVideoStarted / handleProgressUpdate /               │
│                    handleActionExecuted (единственный писатель IndexedDB)     │
└──────────────────────┬────────────────────────────────────┬──────────────────┘
                       ▼                                    ▼
          ┌──────────────────────────┐         ┌──────────────────────────┐
          │   chrome.storage.local   │         │  IndexedDB (extension)   │
          │  (Settings, Rules, флаг  │         │ videos, rule_executions  │
          │   онбординга)            │         │                          │
          └──────────────────────────┘         └──────────────────────────┘
```

**Ключевые решения:**
- Оценка правил и очередь подтверждений живут в Content Script: только он видит плеер и DOM YouTube.
- В IndexedDB пишет только Background. У Content Script собственная IndexedDB origin `youtube.com`, поэтому прямой доступ из него к БД запрещён (ранее существовавший fallback удалён в 1.2.0).
- Dashboard (страница расширения) читает IndexedDB напрямую — это та же origin расширения.

---

## 3. Протокол Сообщений (`src/types/messages.ts`)
Каждое сообщение передается в формате объекта `{ type, payload }`. Ответ всегда содержит `success: boolean`.
Каждый тип из `ExtensionMessageType` обязан иметь обработчик в `entrypoints/background.ts`.

### Безопасный транспорт (`src/core/utils/runtime.ts`):
Для исключения ошибок рантайма (`Extension context invalidated`, `Receiving end does not exist`) при перезагрузке расширения все вызовы обернуты в `safeSendMessage<T>()` с предварительной проверкой `isExtensionContextValid()`. При недоступности воркера возвращается `null`.

### От Content Script к Background:
| Тип | Payload | Ответ |
| :--- | :--- | :--- |
| `VIDEO_STARTED` | `VideoStartedPayload` (id, url, title, channelName, duration) | `{ video }` — сохранённая запись для гидратации трекера |
| `PROGRESS_UPDATE` | `ProgressUpdatePayload` (проценты, секунды, интервалы) | `{}` |
| `CHECK_ACTION_EXECUTED` | `{ videoId, action }` | `{ executed }` — выполнялось ли действие для видео любым правилом |
| `ACTION_EXECUTED_LOG` | `ActionExecutedLogPayload` (`ruleId`, `videoId`, `action`, `status`, `error?`) | `{}`; при успешных `LIKE_VIDEO` / `SAVE_VIDEO` выставляет `video.liked` / `video.saved` |

### От Popup к Background:
| Тип | Payload | Ответ |
| :--- | :--- | :--- |
| `GET_VIDEO_RECORD` | `videoId: string` | `{ video? }` — прогресс видео активной вкладки |

### Служебные (настройки и правила):
`GET_SETTINGS`, `UPDATE_SETTINGS`, `GET_RULES`, `SAVE_RULE`, `DELETE_RULE` — обёртки над `src/core/storage/storage.ts`.
UI расширения и Content Script сейчас обращаются к `chrome.storage.local` напрямую, а изменения доставляются через `chrome.storage.onChanged`; сообщения оставлены как стабильный контракт для внешних контекстов.

### Идемпотентность и защита от дублей (`ActionEngine`):
1. Сначала проверяются условия правила (без IPC), затем — `CHECK_ACTION_EXECUTED`.
2. Ключ `videoId:action` резервируется до `await`, поэтому параллельная оценка не планирует дубль.
3. Одно действие на видео выполняется один раз, даже если его требуют несколько правил (например, два пресета автолайка).
4. Отклонённые пользователем, закрытые по таймауту и окончательно упавшие (после 3 попыток) действия не повторяются до перезагрузки вкладки.
5. Между одинаковыми действиями выдерживается cooldown 5 секунд.

---

## 4. Безопасность Вывода (Safe DOM Injection)
В соответствии со стандартами безопасности Mozilla AMO и правилом 32 `@[user_global]`, запрещено использование `innerHTML`:
- Все динамические элементы инжектируемого UI (`YouTubePlayerOverlay` в `src/youtube/overlay.ts`, `showApprovalBanner` в `src/youtube/approvalBanner.ts`, иконки в `src/youtube/icons.ts`) строятся исключительно через `document.createElement(NS)`, `document.createTextNode`, `setAttribute` и `textContent`.
- Исключается внедрение несанированного пользовательского ввода (названия правил, действия).

---

## 5. Локализация (i18n) в API

Система поддерживается модулем `src/i18n/`:
- Настройка языка (`ru`, `en`, `auto`) хранится в `Settings.language`; каждый контекст применяет её через `setLanguage()` при чтении настроек.
- Все тексты берутся по ключам `src/locales/{ru,en}.json` (100% паритет ключей). При отсутствии ключа — fallback на английский, затем на переданное значение по умолчанию (`t(key, params, fallback)`), поэтому пользователь никогда не видит `undefined`.
- Имена пресетов хранятся как ключи (`likeCompleted`) и переводятся через `getRuleDisplayName()`; пользовательские правила хранят свободный текст.
- При смене языка в Popup/Dashboard настройки сохраняются реактивно, переключая интерфейс на лету.
