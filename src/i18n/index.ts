import enDict from '../locales/en.json';
import ruDict from '../locales/ru.json';
import { LanguageCode } from '../types/settings';

type TranslationDict = typeof enDict;

const dictionaries: Record<string, TranslationDict> = {
  en: enDict,
  ru: ruDict,
};

let currentLanguage: 'ru' | 'en' = typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';

export function getBrowserLanguage(): 'ru' | 'en' {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('ru')) return 'ru';
  }
  return 'en';
}

export function getCurrentLanguage(): 'ru' | 'en' {
  return currentLanguage;
}

export function setLanguage(lang: LanguageCode) {
  if (lang === 'auto') {
    currentLanguage = getBrowserLanguage();
  } else {
    currentLanguage = lang;
  }
}

/**
 * Получить переведенное значение по вложенному ключу, напр. "popup.currentVideo"
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[currentLanguage] || dictionaries.en;
  const parts = key.split('.');
  
  let val: unknown = dict;
  for (const part of parts) {
    if (val && typeof val === 'object' && part in val) {
      val = (val as Record<string, unknown>)[part];
    } else {
      val = undefined;
      break;
    }
  }

  if (typeof val !== 'string') {
    // Fallback на английский
    let fallbackVal: unknown = dictionaries.en;
    for (const part of parts) {
      if (fallbackVal && typeof fallbackVal === 'object' && part in fallbackVal) {
        fallbackVal = (fallbackVal as Record<string, unknown>)[part];
      } else {
        fallbackVal = key;
        break;
      }
    }
    val = typeof fallbackVal === 'string' ? fallbackVal : key;
  }

  let result = val as string;
  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramVal));
    });
  }

  return result;
}

export function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hours > 0) {
    return `${hours}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
