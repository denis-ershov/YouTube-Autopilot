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
┌──────────────────────────┐               ┌──────────────────────────┐
│      Content Script      │               │         Popup UI         │
│  (YouTube Page Context)  │               │   (Action Popup Panel)   │
└────────────┬─────────────┘               └────────────┬─────────────┘
             │                                          │
             │ chrome.runtime.sendMessage               │ chrome.runtime.sendMessage
             ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Background Service Worker                      │
│                                                                     │
│  ├── State Manager & Storage Synchronizer                           │
│  ├── Rule Evaluation Coordination                                   │
│  └── Approval Queue Manager ("Ask before action")                   │
└────────────┬──────────────────────────────────────────┬─────────────┘
             │                                          │
             ▼                                          ▼
┌──────────────────────────┐               ┌──────────────────────────┐
│   chrome.storage.local   │               │        IndexedDB         │
│ (Settings, Rules, i18n)  │               │  (Videos, Logs, History) │
└──────────────────────────┘               └──────────────────────────┘
```

---

## 3. Протокол Сообщений (`src/types/messages.ts`)

Каждое сообщение передается в формате объекта `{ type, payload }`:

### От Content Script к Background:
- `VIDEO_STARTED`: Видео загружено и распознано (передается metadata).
- `PROGRESS_UPDATE`: Обновление прогресса реального просмотра (передаются интервалы и процент).
- `EVALUATE_RULES`: Запрос на вычисление правил для текущего состояния видео.
- `ACTION_EXECUTED_LOG`: Уведомление о фактическом выполнении DOM-действия.

### От Background к Content Script:
- `EXECUTE_ACTION`: Указание выполнить конкретное DOM-действие (`LIKE_VIDEO`, `REMOVE_FROM_WATCH_LATER` и т.д.).
- `SHOW_APPROVAL_MODAL`: Запрос на отображение всплывающей карточки ручного подтверждения действия.

### От Popup/Dashboard к Background:
- `GET_CURRENT_VIDEO_STATUS`: Запрос текущего состояния активного видео.
- `GET_SETTINGS` / `UPDATE_SETTINGS`: Получение и обновление настроек расширения.
- `GET_RULES` / `SAVE_RULE` / `DELETE_RULE`: Управление пользовательскими автоматизациями.
- `APPROVE_ACTION` / `REJECT_ACTION`: Ответ пользователя на запрос подтверждения.

---

## 4. Локализация (i18n) в API

Система поддерживается модулем `src/i18n/`:
- `Background` хранит настройку языка (`ru`, `en`, `auto`).
- Все текстовые уведомления, сообщения подгружаются динамически по ключам локализации.
- При смене языка в Popup/Dashboard генерируется событие `LANGUAGE_CHANGED`, приводящее к переинициализации UI словаря.
