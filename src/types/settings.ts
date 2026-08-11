export type WatchTrackingMode = 'position' | 'real' | 'hybrid';

export type AutomationMode = 'automatic' | 'approval' | 'disabled';

export type LanguageCode = 'ru' | 'en' | 'auto';

export interface Settings {
  enabled: boolean;
  watchMode: WatchTrackingMode;
  defaultThreshold: number; // Напр. 90 (процент)
  defaultDelay: number; // В секундах
  trackInactiveTab: boolean;
  shortsEnabled: boolean;
  automationMode: AutomationMode;
  language: LanguageCode;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  watchMode: 'real',
  defaultThreshold: 90,
  defaultDelay: 0,
  trackInactiveTab: false,
  shortsEnabled: true,
  automationMode: 'approval', // Сначала спрашивать пользователя
  language: 'auto',
};
