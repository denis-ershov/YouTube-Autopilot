import enDict from '../locales/en.json';
import ruDict from '../locales/ru.json';
import { LanguageCode } from '../types/settings';

type TranslationDict = typeof enDict;
type ResolvedLanguage = 'ru' | 'en';

const FALLBACK_LANGUAGE: ResolvedLanguage = 'en';

const dictionaries: Record<ResolvedLanguage, TranslationDict> = {
  en: enDict,
  ru: ruDict,
};

export function getBrowserLanguage(): ResolvedLanguage {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ru')) {
    return 'ru';
  }
  return FALLBACK_LANGUAGE;
}

let currentLanguage: ResolvedLanguage = getBrowserLanguage();

export function getCurrentLanguage(): ResolvedLanguage {
  return currentLanguage;
}

export function setLanguage(lang: LanguageCode): void {
  currentLanguage = lang === 'auto' ? getBrowserLanguage() : lang;
}

/**
 * Поиск строки по вложенному ключу, напр. "popup.currentVideo"
 */
function lookup(dict: TranslationDict, key: string): string | undefined {
  let val: unknown = dict;
  for (const part of key.split('.')) {
    if (!val || typeof val !== 'object' || !(part in val)) return undefined;
    val = (val as Record<string, unknown>)[part];
  }
  return typeof val === 'string' ? val : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (result, [paramKey, paramVal]) => result.split(`{{${paramKey}}}`).join(String(paramVal)),
    template
  );
}

/**
 * Перевод с fallback на английский. Если ключа нет ни в одном словаре — возвращает `fallback`
 * (по умолчанию сам ключ), чтобы интерфейс никогда не показывал undefined.
 */
export function t(key: string, params?: Record<string, string | number>, fallback: string = key): string {
  const value = lookup(dictionaries[currentLanguage], key) ?? lookup(dictionaries[FALLBACK_LANGUAGE], key);
  return interpolate(value ?? fallback, params);
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
