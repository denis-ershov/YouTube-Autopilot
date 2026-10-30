# Архитектура UI и Дизайн-система

## 1. Обзор
Документ описывает визуальный язык и компонентную структуру интерфейсов **YouTube Autopilot**:
- страницы расширения на React 19 + Tailwind 3 (`entrypoints/popup`, `entrypoints/dashboard`);
- UI, внедряемый в страницу YouTube без React и без `innerHTML` (`src/youtube/overlay.ts`, `src/youtube/approvalBanner.ts`).

---

## 2. Бренд и логотип

**Концепция:** скруглённый «squircle» с градиентом `#3B82F6 → #4338CA`, белое кольцо прогресса (~83%) вокруг скруглённого треугольника Play и янтарная точка `#FBBF24` в разрыве кольца — порог, на котором срабатывает автодействие. Знак не использует фирменный красный треугольник YouTube, чтобы не смешиваться с товарным знаком платформы.

| Артефакт | Источник | Где используется |
| :--- | :--- | :--- |
| `public/icons/icon.svg` | `scripts/generate_icons.py` | компонент `<Logo />` (Popup, Dashboard, онбординг) |
| `public/icons/icon-{16,32,48,128,512}.png` | `scripts/generate_icons.py` | `manifest.json` (`icons`, `action`), README |
| Монохромный знак 24×24 | `src/youtube/icons.ts` (`createBrandMarkSvg`) | оверлей плеера, карточка подтверждения |

**Правило:** геометрия логотипа задаётся только константами в `scripts/generate_icons.py`. Чтобы изменить логотип, правьте константы и запускайте `python scripts/generate_icons.py` (требуется Pillow) — SVG и PNG обновятся синхронно. Упрощённый знак в `icons.ts` повторяет пропорции вручную и должен обновляться вместе с ним.

---

## 3. Токены

| Категория | Значение | Где задано |
| :--- | :--- | :--- |
| Бренд | `brand-50…950` = палитра Tailwind blue | `tailwind.config.js` |
| Нейтральные | Tailwind `zinc` (фон `zinc-950`, карточки `zinc-900`, границы `zinc-800`) | классы Tailwind |
| Семантика | `emerald` — активно/успех, `amber` — предупреждение, `rose` — лайк/удаление | классы Tailwind |
| Шрифт | Inter → системный стек | `tailwind.config.js` |
| Радиусы | `rounded-lg` — кнопки и поля, `rounded-xl` — карточки, `rounded-2xl` — модальные окна | компонентные классы |
| Высота интерактивных элементов | `min-h-11` (44 px) | `.btn`, `.field`, `ChoiceCard` |
| Анимации | `transition-colors duration-200`; `prefers-reduced-motion` отключает анимации | `src/styles/main.css` |

UI внутри плеера YouTube не может использовать Tailwind и повторяет те же значения инлайн-стилями (`#3ea6ff` — акцент в тёмном плеере, `#2563eb` = `brand-600`).

---

## 4. Компоненты

| Компонент / класс | Файл | Назначение |
| :--- | :--- | :--- |
| `.btn-primary`, `.btn-secondary`, `.btn-ghost` | `src/styles/main.css` | Единые кнопки: высота 44 px, фокус-кольцо, disabled-состояние |
| `.field` | `src/styles/main.css` | Поля ввода и select |
| `.card`, `.focus-ring` | `src/styles/main.css` | Карточка-контейнер, видимый фокус для клавиатуры |
| `Logo` | `src/components/Logo.tsx` | Логотип из `icon.svg` |
| `ChoiceCard` | `src/components/ChoiceCard.tsx` | Выбор варианта (`radio` / `checkbox`): режимы отслеживания и автоматизации, шаги онбординга |
| `PageHeader` | `src/components/PageHeader.tsx` | Заголовок вкладки + подзаголовок + действия |
| `OnboardingModal` | `src/components/OnboardingModal.tsx` | Мастер первой настройки (4 шага) |

### Dashboard (`entrypoints/dashboard/`)
- `App.tsx` — загрузка данных (состояния loading / error), обработчики, раскладка.
- `Sidebar.tsx` — навигация (сетка 2/4 колонки на мобильных, вертикальный список с `md`) и переключатель языка.
- `tabs/OverviewTab.tsx`, `tabs/RulesTab.tsx` (+ `RuleForm.tsx`), `tabs/HistoryTab.tsx`, `tabs/SettingsTab.tsx` — по одному файлу на вкладку.

Бизнес-логика вынесена из компонентов: применение мастера — `src/core/onboarding.ts`, подписи правил и условий — `src/core/rules/labels.ts`.

---

## 5. Доступность и локализация
- Все интерактивные элементы — нативные `<button>` / `<input>` / `<select>` с подписями (`<label htmlFor>`, `aria-label`).
- Группы выбора размечены `role="radiogroup"` + `role="radio"` / `aria-checked`, навигация — `aria-current="page"`.
- Удаление правила требует подтверждения (`window.confirm`) с именем правила.
- Тексты только через `t()`; логические CSS-свойства (`border-e`, `text-start`, `text-end`) для будущей поддержки RTL.
- Эмодзи не используются как иконки — только SVG (`lucide-react` в React, `icons.ts` на странице YouTube).
