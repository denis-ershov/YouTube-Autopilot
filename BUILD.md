# Инструкция по сборке — YouTube Autopilot

Этот документ содержит полные, воспроизводимые пошаговые инструкции по сборке браузерного расширения **YouTube Autopilot** из исходного кода. Инструкция составлена в соответствии с требованиями к отправке исходного кода Mozilla Add-ons (AMO) и стандартами Open Source.

---

## 1. Системные требования и окружение

- **Операционная система:** Linux (Ubuntu 20.04+, Debian, Fedora, Arch), macOS (12+) или Windows (10/11).
- **Node.js:** `>= 18.0.0` (рекомендуется Node.js 20 LTS или Node.js 22 LTS).
- **Менеджер пакетов:** `npm >= 9.0.0` (поставляется вместе с Node.js).
- **Git:** `>= 2.30.0` (опционально, для клонирования репозитория).

### Проверка установленных версий:
```bash
node -v   # Ожидается: v18.x.x, v20.x.x или новее
npm -v    # Ожидается: 9.x.x, 10.x.x или новее
```

---

## 2. Архитектура сборки и зависимости

В проекте используются современные стандартные инструменты разработки WebExtensions:
- **Фреймворк:** [WXT (Next-Gen Web Extension Framework)](https://wxt.dev)
- **Сборщик бандлов:** [Vite 6](https://vitejs.dev/) на базе Rollup
- **Язык программирования:** [TypeScript 5.7](https://www.typescriptlang.org/)
- **UI-библиотека:** [React 19](https://react.dev/)
- **Стилизация:** [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Клиент базы данных:** `idb` (асинхронная обертка над IndexedDB)

---

## 3. Пошаговое воспроизведение сборки

### Шаг 3.1: Распаковка архива или клонирование репозитория
Если вы используете архив с исходным кодом:
```bash
unzip youtube-autopilot-1.2.0-sources.zip -d youtube-autopilot
cd youtube-autopilot
```

Если вы клонируете репозиторий через Git:
```bash
git clone https://github.com/denis-ershov/YouTube-Autopilot.git
cd YouTube-Autopilot
```

### Шаг 3.2: Чистая установка зависимостей
Установите точные версии пакетов, зафиксированные в `package-lock.json`:
```bash
npm ci
```
*(Или `npm install`, если команда `npm ci` недоступна).*

### Шаг 3.3: Проверка типов TypeScript
Убедитесь, что исходный код проходит проверку типов без ошибок:
```bash
npm run compile
```
Ожидаемый результат: код возврата `0`, отсутствие ошибок.

### Шаг 3.4: Сборка для Mozilla Firefox (AMO)
```bash
npm run build:firefox
```
* **Директория сборки:** `.output/firefox-mv2/`
* Собирает бандл Manifest V2 с настройками Gecko и обязательной декларацией `data_collection_permissions: { required: ["none"] }`.

Для создания итогового `.zip` архива для загрузки на addons.mozilla.org:
```bash
npm run zip:firefox
```
* **Итоговый архив:** `.output/youtube-autopilot-1.2.0-firefox.zip`

### Шаг 3.5: Сборка для Google Chrome (Manifest V3)
```bash
npm run build:chrome
```
* **Директория сборки:** `.output/chrome-mv3/`

Для создания `.zip` архива для Chrome Web Store:
```bash
npm run zip:chrome
```
* **Итоговый архив:** `.output/youtube-autopilot-1.2.0-chrome.zip`

### Шаг 3.6: Сборка всех версий одной командой
```bash
npm run build:all
npm run zip:all
```

---

## 4. Локальный запуск в режиме разработки (HMR)

Для запуска расширения с автоматической перезагрузкой при изменении исходников:

```bash
# Для Google Chrome / Chromium
npm run dev

# Для Mozilla Firefox
npm run dev:firefox
```
WXT автоматически откроет изолированный тестовый профиль браузера с установленным расширением.

---

## 5. Примечания по безопасности и проверке AMO

- **Безопасный DOM без innerHTML:** Исходный код и скомпилированные бандлы не содержат небезопасных присвоений в `innerHTML`. Весь динамический UI формируется нативными вызовами DOM (`document.createElement`, `document.createTextNode`, `textContent`).
- **Конфиденциальность данных:** Расширение не собирает и не передает пользовательские данные на внешние серверы, декларирует `"required": ["none"]` в манифесте и сохраняет 100% автономию.
