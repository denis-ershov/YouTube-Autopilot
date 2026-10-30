import { AutomationMode, Settings, WatchTrackingMode } from '../types/settings';
import { PERCENT_CONDITION_TYPES, Rule } from '../types/rules';
import { getRules, markOnboardingCompleted, PRESET_IDS, saveRules, saveSettings } from './storage/storage';

export type OnboardingAutomation = 'like';

export interface OnboardingConfig {
  threshold: number;
  automationMode: AutomationMode;
  watchMode: WatchTrackingMode;
  automations: OnboardingAutomation[];
}

const LIKE_PRESETS: ReadonlySet<string> = new Set([PRESET_IDS.LIKE_REAL, PRESET_IDS.LIKE_TIMELINE]);

/**
 * Применяет выбор мастера к пресетам автолайка: включает/выключает их и переносит порог завершения
 * в их условия. Пользовательские правила не затрагиваются.
 */
export function applyOnboardingToRules(rules: Rule[], config: OnboardingConfig): Rule[] {
  return rules.map((rule) => {
    if (LIKE_PRESETS.has(rule.id)) {
      return {
        ...rule,
        enabled: config.automations.includes('like'),
        conditions: rule.conditions.map((c) =>
          PERCENT_CONDITION_TYPES.has(c.type) ? { ...c, value: config.threshold } : c
        ),
      };
    }
    return rule;
  });
}

export async function completeOnboarding(settings: Settings, config: OnboardingConfig): Promise<Settings> {
  const updated: Settings = {
    ...settings,
    defaultThreshold: config.threshold,
    automationMode: config.automationMode,
    watchMode: config.watchMode,
  };
  const rules = applyOnboardingToRules(await getRules(), config);
  await Promise.all([saveSettings(updated), saveRules(rules), markOnboardingCompleted()]);
  return updated;
}
