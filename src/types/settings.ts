export type WatchTrackingMode = 'position' | 'real' | 'hybrid';

/** 'disabled' оставлен для обратной совместимости сохранённых настроек; в UI не предлагается. */
export type AutomationMode = 'automatic' | 'approval' | 'disabled';

export type LanguageCode = 'ru' | 'en' | 'auto';

export interface Settings {
  enabled: boolean;
  watchMode: WatchTrackingMode;
  defaultThreshold: number; // Порог завершения в процентах (используется пресетами и подсказками UI)
  automationMode: AutomationMode;
  language: LanguageCode;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  watchMode: 'real',
  defaultThreshold: 90,
  automationMode: 'approval', // Сначала спрашивать пользователя
  language: 'auto',
};
