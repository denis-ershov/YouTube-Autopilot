import { Settings, DEFAULT_SETTINGS } from '../../types/settings';
import { Rule } from '../../types/rules';
import { setLanguage } from '../../i18n';

const SETTINGS_KEY = 'yt_autopilot_settings';
const RULES_KEY = 'yt_autopilot_rules';

export const DEFAULT_PRESET_RULES: Rule[] = [
  {
    id: 'preset-auto-like',
    name: '❤️ Auto Like Completed Videos',
    enabled: true,
    conditions: [
      {
        type: 'WATCHED_PERCENT',
        operator: 'GTE',
        value: 90,
      },
    ],
    actions: [
      {
        type: 'LIKE_VIDEO',
      },
    ],
    delay: 3,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-clean-watch-later',
    name: '🧹 Clean Watch Later List',
    enabled: true,
    conditions: [
      {
        type: 'SOURCE',
        operator: 'EQ',
        value: 'WATCH_LATER',
      },
      {
        type: 'WATCHED_PERCENT',
        operator: 'GTE',
        value: 80,
      },
    ],
    actions: [
      {
        type: 'REMOVE_FROM_WATCH_LATER',
      },
    ],
    delay: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(DEFAULT_SETTINGS);
      return;
    }

    chrome.storage.local.get([SETTINGS_KEY], (result) => {
      const saved = result[SETTINGS_KEY] as Settings | undefined;
      const settings = { ...DEFAULT_SETTINGS, ...saved };
      setLanguage(settings.language);
      resolve(settings);
    });
  });
}

export async function saveSettings(settings: Settings): Promise<void> {
  setLanguage(settings.language);
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve();
      return;
    }
    chrome.storage.local.set({ [SETTINGS_KEY]: settings }, () => {
      resolve();
    });
  });
}

export async function getRules(): Promise<Rule[]> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve(DEFAULT_PRESET_RULES);
      return;
    }

    chrome.storage.local.get([RULES_KEY], (result) => {
      const saved = result[RULES_KEY] as Rule[] | undefined;
      if (!saved || saved.length === 0) {
        // Загрузить пресеты по умолчанию
        chrome.storage.local.set({ [RULES_KEY]: DEFAULT_PRESET_RULES });
        resolve(DEFAULT_PRESET_RULES);
      } else {
        resolve(saved);
      }
    });
  });
}

export async function saveRule(rule: Rule): Promise<void> {
  const rules = await getRules();
  const index = rules.findIndex((r) => r.id === rule.id);
  if (index >= 0) {
    rules[index] = { ...rule, updatedAt: Date.now() };
  } else {
    rules.push({ ...rule, createdAt: Date.now(), updatedAt: Date.now() });
  }

  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve();
      return;
    }
    chrome.storage.local.set({ [RULES_KEY]: rules }, () => {
      resolve();
    });
  });
}

export async function deleteRule(ruleId: string): Promise<void> {
  const rules = await getRules();
  const updated = rules.filter((r) => r.id !== ruleId);
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve();
      return;
    }
    chrome.storage.local.set({ [RULES_KEY]: updated }, () => {
      resolve();
    });
  });
}
