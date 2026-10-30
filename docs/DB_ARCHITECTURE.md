# Архитектура Хранилища Данных (Storage Architecture)

## 1. Обзор
Документ описывает организацию локального хранения данных в **YouTube Autopilot**.
В соответствии с концепцией Privacy-First все данные пользователя остаются исключительно в памяти его браузера.

Хранение данных разделено на 2 уровня:
1. `chrome.storage.local` — легкие и часто читаемые конфигурации (настройки, правила, пресеты, активный язык).
2. `IndexedDB` — объемные структурированные данные (история просмотров, детализированные интервалы, логи выполнения правил).

---

## 2. Структура `chrome.storage.local`

### Ключи хранилища (константы в `src/core/storage/storage.ts`):
- `yt_autopilot_settings` (`SETTINGS_KEY`):
  ```ts
  interface Settings {
    enabled: boolean;
    watchMode: "position" | "real" | "hybrid";
    defaultThreshold: number; // порог в % (по умолчанию 90): мастер переносит его в пресеты автолайка, UI показывает в подсказках
    automationMode: "automatic" | "approval" | "disabled"; // "disabled" — только для совместимости, в UI не предлагается
    language: "ru" | "en" | "auto";
  }
  ```
  При чтении сохранённые значения накладываются на `DEFAULT_SETTINGS`, поэтому новые поля появляются без миграции, а устаревшие (`defaultDelay`, `trackInactiveTab`, `shortsEnabled`, `autoLikeOnFastForward`, удалены в 1.2.0) игнорируются.
- `yt_autopilot_rules` (`RULES_KEY`): массив `Rule[]`. Пресеты засеваются **только если ключ отсутствует**; пустой массив — осознанное удаление всех правил пользователем и сохраняется.
- `onboardingCompleted` (`ONBOARDING_KEY`): флаг прохождения мастера первой настройки (`boolean`).

Доступ к хранилищу идёт через `readStorage` / `writeStorage` (Promise API `chrome.storage.local`) с перехватом ошибок; вне контекста расширения функции возвращают значения по умолчанию.

---

## 3. Структура `IndexedDB` (`youtube-autopilot-db`, Версия 1)

БД использует обертку `idb` с асинхронными транзакциями.

### Хранилища объектов (Object Stores):

#### 1. `videos` (Индекс по `id`, `updatedAt`, `channelId`):
```ts
interface VideoRecord {
  id: string;              // YouTube Video ID (v=XXXXX)
  url: string;
  title: string;
  channelId?: string;
  channelName?: string;
  duration: number;
  watchedSeconds: number;       // Секунды в соответствии с активным режимом
  watchedPercent: number;       // Процент в соответствии с активным режимом
  realWatchedSeconds?: number;  // Строго реальные секунды без перемоток
  realWatchedPercent?: number;  // Строго реальный процент без перемоток
  maxPositionSeconds?: number;  // Максимальная позиция ползунка в сек
  maxTimelinePercent?: number;  // Максимальный процент по позиции ползунка (0-100)
  intervals: WatchInterval[];   // Массив уникальных интервалов [start, end]
  firstWatchedAt?: number;
  lastWatchedAt?: number;
  completedAt?: number;
  liked?: boolean;              // выставляется Background после успешного LIKE_VIDEO
  saved?: boolean;              // выставляется Background после успешного SAVE_VIDEO
  source?: VideoSource;         // зарезервировано: определение источника ещё не реализовано
  createdAt: number;
  updatedAt: number;
}
```

#### 2. `rule_executions` (Индекс по `videoId`, `ruleId`, `executedAt`):
Обеспечивает идемпотентность выполнения действий и расчет точной аналитики.
```ts
interface RuleExecution {
  id: string;
  ruleId: string;
  videoId: string;
  action: ActionType;
  executedAt: number;
  status: "success" | "failed" | "skipped";
  errorMessage?: string;
}
```

Экспортируемые функции слоя данных (`src/database/indexeddb.ts`):
- `saveVideoRecord(video)`
- `getVideoRecord(id)`
- `getAllVideos()` — от последних просмотренных к старым (для истории Dashboard)
- `saveRuleExecution(exec)`
- `isActionExecuted(videoId, action)` — успешно ли выполнено действие для видео любым правилом
- `getAllRuleExecutions()` — все выполненные автоматизации для статистики Dashboard

**Владелец записи:** только Background Service Worker. Dashboard читает БД напрямую (та же origin расширения). Content Script работает в origin `youtube.com` и к этой БД доступа не имеет — только через сообщения.

---

## 4. Идемпотентность, ограничения и жизненный цикл данных

- **Идемпотентность:** перед выполнением действия `ActionEngine` запрашивает `CHECK_ACTION_EXECUTED` по ключу `(videoId + action)` и дополнительно держит в памяти вкладки множества ожидающих и обработанных действий (см. `API_ARCHITECTURE.md`).
- **Порог завершения:** `COMPLETION_PERCENT = 90` (`src/types/video.ts`) — единая константа для `completedAt`, статистики и фильтра «Завершённые».
- **Хранение:** автоматическая очистка старых записей не реализована — история растёт до ручной очистки данных расширения. Ротация логов `rule_executions` — кандидат в следующий релиз.
- **Миграции:** схема IndexedDB — версия 1 без изменений; изменения 1.2.0 касаются только формы объектов и обратно совместимы.
