# Архитектура Хранилища Данных (Storage Architecture)

## 1. Обзор
Документ описывает организацию локального хранения данных в **YouTube Autopilot**.
В соответствии с концепцией Privacy-First все данные пользователя остаются исключительно в памяти его браузера.

Хранение данных разделено на 2 уровня:
1. `chrome.storage.local` — легкие и часто читаемые конфигурации (настройки, правила, пресеты, активный язык).
2. `IndexedDB` — объемные структурированные данные (история просмотров, детализированные интервалы, логи выполнения правил).

---

## 2. Структура `chrome.storage.local`

### Ключи хранилища:
- `settings`:
  ```ts
  interface Settings {
    enabled: boolean;
    watchMode: "position" | "real" | "hybrid";
    defaultThreshold: number;
    defaultDelay: number;
    trackInactiveTab: boolean;
    shortsEnabled: boolean;
    automationMode: "automatic" | "approval" | "disabled";
    language: "ru" | "en" | "auto";
  }
  ```
- `rules`: Массив объектных моделей `Rule[]`.
- `onboardingCompleted`: Флаг прохождения начального мастера настройки (`boolean`).

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
  watchedSeconds: number;
  watchedPercent: number;
  intervals: WatchInterval[]; // Массив [start, end]
  firstWatchedAt: number;
  lastWatchedAt: number;
  completedAt?: number;
  liked?: boolean;
  saved?: boolean;
  source?: VideoSource;
  createdAt: number;
  updatedAt: number;
}
```

#### 2. `rule_executions` (Индекс по `videoId`, `ruleId`, `executedAt`):
Обеспечивает идемпотентность выполнения действий.
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

#### 3. `history` (Индекс по `timestamp`):
Хранит лог ключевых событий системы для отображения в Dashboard.

---

## 4. Оптимизация и Идемпотентность

- **Стратегия очистки:** Логи выполнения старше 90 дней автоматически архивируются или удаляются для предотвращения разрастания базы.
- **Идемпотентность:** Перед выполнением любого действия `ActionEngine` производит поиск записи в `rule_executions` по составному ключу `(videoId + ruleId + action)`. Повторный запуск того же действия блокируется.
