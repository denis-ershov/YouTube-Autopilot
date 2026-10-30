import { Settings, DEFAULT_SETTINGS } from '../../types/settings';
import { Rule } from '../../types/rules';
import { setLanguage } from '../../i18n';

export const SETTINGS_KEY = 'yt_autopilot_settings';
export const RULES_KEY = 'yt_autopilot_rules';
export const ONBOARDING_KEY = 'onboardingCompleted';

export const PRESET_IDS = {
  LIKE_REAL: 'preset-auto-like',
  LIKE_TIMELINE: 'preset-auto-like-timeline',
  CLEAN_WATCH_LATER: 'preset-clean-watch-later',
} as const;

/** Пресеты: `name` — ключ локализации из `presets.*` (см. getRuleDisplayName). */
export const DEFAULT_PRESET_RULES: Rule[] = [
  {
    id: PRESET_IDS.LIKE_REAL,
    name: 'likeCompleted',
    enabled: true,
    conditions: [{ type: 'WATCHED_PERCENT', operator: 'GTE', value: 90 }],
    actions: [{ type: 'LIKE_VIDEO' }],
    delay: 2,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: PRESET_IDS.LIKE_TIMELINE,
    name: 'likeCompletedTimeline',
    enabled: true,
    conditions: [{ type: 'TIMELINE_PERCENT', operator: 'GTE', value: 90 }],
    actions: [{ type: 'LIKE_VIDEO' }],
    delay: 2,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: PRESET_IDS.CLEAN_WATCH_LATER,
    name: 'cleanWatchLater',
    enabled: true,
    conditions: [
      { type: 'SOURCE', operator: 'EQ', value: 'WATCH_LATER' },
      { type: 'WATCHED_PERCENT', operator: 'GTE', value: 80 },
    ],
    actions: [{ type: 'REMOVE_FROM_WATCH_LATER' }],
    delay: 3,
    createdAt: 0,
    updatedAt: 0,
  },
];

/**
 * Пресеты, которые можно добавить из Dashboard. «Очистка Смотреть позже» скрыта, пока
 * DOM-действие REMOVE_FROM_WATCH_LATER и определение источника видео не реализованы.
 */
export const AVAILABLE_PRESET_RULES: Rule[] = DEFAULT_PRESET_RULES.filter(
  (rule) => rule.id !== PRESET_IDS.CLEAN_WATCH_LATER
);

function hasStorage(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

/**
 * Чтение ключа chrome.storage.local. Возвращает undefined, если хранилище недоступно
 * (dev-режим вне расширения) или запись отсутствует.
 */
export async function readStorage<T>(key: string): Promise<T | undefined> {
  if (!hasStorage()) return undefined;
  try {
    const result = await chrome.storage.local.get(key);
    return result?.[key] as T | undefined;
  } catch (err) {
    console.warn(`[YouTube Autopilot] storage read failed for "${key}":`, err);
    return undefined;
  }
}

export async function writeStorage<T>(key: string, value: T): Promise<void> {
  if (!hasStorage()) return;
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (err) {
    console.warn(`[YouTube Autopilot] storage write failed for "${key}":`, err);
  }
}

export async function getSettings(): Promise<Settings> {
  const saved = await readStorage<Partial<Settings>>(SETTINGS_KEY);
  const settings: Settings = { ...DEFAULT_SETTINGS, ...saved };
  setLanguage(settings.language);
  return settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  setLanguage(settings.language);
  await writeStorage(SETTINGS_KEY, settings);
}

/**
 * Пресеты засеваются только при первом запуске (ключ отсутствует).
 * Пустой массив — осознанный выбор пользователя, удалившего все правила, и он сохраняется.
 */
export async function getRules(): Promise<Rule[]> {
  const saved = await readStorage<Rule[]>(RULES_KEY);
  if (Array.isArray(saved)) return saved;

  const now = Date.now();
  const seeded = DEFAULT_PRESET_RULES.map((rule) => ({ ...rule, createdAt: now, updatedAt: now }));
  await writeStorage(RULES_KEY, seeded);
  return seeded;
}

export async function saveRules(rules: Rule[]): Promise<void> {
  await writeStorage(RULES_KEY, rules);
}

export async function saveRule(rule: Rule): Promise<void> {
  const rules = await getRules();
  const now = Date.now();
  const index = rules.findIndex((r) => r.id === rule.id);
  if (index >= 0) {
    rules[index] = { ...rule, updatedAt: now };
  } else {
    rules.push({ ...rule, createdAt: now, updatedAt: now });
  }
  await saveRules(rules);
}

export async function deleteRule(ruleId: string): Promise<void> {
  const rules = await getRules();
  await saveRules(rules.filter((r) => r.id !== ruleId));
}

export async function isOnboardingCompleted(): Promise<boolean> {
  return Boolean(await readStorage<boolean>(ONBOARDING_KEY));
}

export async function markOnboardingCompleted(): Promise<void> {
  await writeStorage(ONBOARDING_KEY, true);
}
